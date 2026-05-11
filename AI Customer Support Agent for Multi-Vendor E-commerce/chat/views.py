"""
REST API for customer ↔ AI chat (persistence + OpenAI loop).
"""

from __future__ import annotations

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Message
from .services.action_service import handle_intent
from .services.ai_service import get_ai_response
from .services.intent_service import detect_intent

# CRITICAL: This prompt prevents AI from generating fictional course data
SYSTEM_PROMPT = (
    'You are a customer support assistant for an e-learning platform.\n\n'
    'CRITICAL RULES:\n'
    '1. NEVER generate or invent fictional courses\n'
    '2. NEVER show demo or placeholder course data\n'
    '3. NEVER make up instructor names, prices, or details\n'
    '4. ONLY show data from API responses\n'
    '5. If no API data: say "I couldn\'t find courses matching that"\n'
    '6. Never invent alternatives without real data\n\n'
    'You CAN:\n'
    '- Display real courses from search results\n'
    '- Show real featured/popular courses\n'
    '- Provide platform feature information\n'
    '- Help with general questions\n\n'
    'You MUST NOT:\n'
    '- Make up course suggestions\n'
    '- Invent instructor information\n'
    '- Create fake course data\n'
    '- Generate fictional content\n\n'
    'Remember: Users trust you for real data. Never betray that with fictional information.'
)


class ChatApiView(APIView):
    """
    POST /api/chat/

    Body JSON: ``{"message": "<user text>"}``

    Persists the user line, loads recent history, calls OpenAI, persists the reply.
    """

    def post(self, request, *args, **kwargs):
        raw = request.data.get('message')
        if not isinstance(raw, str) or not raw.strip():
            return Response(
                {'detail': 'Field "message" is required and must be a non-empty string.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_text = raw.strip()
        user = request.user
        intent = detect_intent(user_text)

        # 1–2: Persist the inbound customer message.
        Message.objects.create(
            user=user,
            role=Message.Role.USER,
            content=user_text,
            intent=intent,
        )

        if intent != 'general':
            action_response = None
            try:
                action_response = handle_intent(intent, user_text, user)
            except Exception as e:
                if settings.DEBUG:
                    import logging
                    logging.getLogger(__name__).exception('Intent handling failed: %s', str(e))
                error_message = 'I encountered an issue processing your request. Please try again.'
                Message.objects.create(
                    user=user,
                    role=Message.Role.AI,
                    content=error_message,
                )
                return Response({'response': error_message}, status=status.HTTP_200_OK)

            if action_response:
                Message.objects.create(
                    user=user,
                    role=Message.Role.AI,
                    content=action_response,
                )
                return Response({'response': action_response}, status=status.HTTP_200_OK)
            
            # CRITICAL: For search/recommendation intents, never fall back to AI
            # These should ONLY show real API data, not generated content
            if intent in ['course_search', 'book_search', 'recommendation', 'category_help']:
                no_data_message = 'I couldn\'t find what you\'re looking for. Try different keywords or ask about other topics.'
                Message.objects.create(
                    user=user,
                    role=Message.Role.AI,
                    content=no_data_message,
                )
                return Response({'response': no_data_message}, status=status.HTTP_200_OK)

        # 3–5: Last ten rows for this user (newest first), then chronological for the model.
        recent_qs = Message.objects.filter(user=user).order_by('-timestamp')[:10]
        recent_chronological = list(reversed(list(recent_qs)))

        openai_messages: list[dict[str, str]] = [
            {'role': 'system', 'content': SYSTEM_PROMPT},
        ]
        for row in recent_chronological:
            # OpenAI uses "assistant" for model turns; our schema stores them as Role.AI ("ai").
            if row.role == Message.Role.AI:
                openai_messages.append({'role': 'assistant', 'content': row.content})
            else:
                openai_messages.append({'role': 'user', 'content': row.content})

        # 6–7: Model call with graceful degradation (no intent detection in this step).
        fallback = 'Sorry, I am having trouble responding right now.'
        try:
            reply_text = get_ai_response(openai_messages)
        except Exception:
            # Log server-side in DEBUG for developers; never leak internals to clients.
            if settings.DEBUG:
                import logging

                logging.getLogger(__name__).exception('OpenAI chat completion failed')
            return Response({'response': fallback}, status=status.HTTP_200_OK)

        Message.objects.create(
            user=user,
            role=Message.Role.AI,
            content=reply_text,
        )
        return Response({'response': reply_text}, status=status.HTTP_200_OK)
