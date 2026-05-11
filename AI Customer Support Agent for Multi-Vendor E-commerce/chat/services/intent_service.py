"""
Simple keyword-based intent detection.
"""

from __future__ import annotations


def _has_any(text: str, keywords: set[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _is_search_query(text: str) -> bool:
    return _has_any(
        text,
        {
            'find', 'search', 'show', 'list', 'browse', 'looking for', 'lookup',
            'recommend', 'suggest'
        },
    )


def detect_intent(message: str) -> str:
    text = (message or '').lower().strip()

    if not text:
        return 'general'

    if _has_any(text, {'how are you', 'how r u', 'hru'}):
        return 'general'

    if _has_any(text, {'recommend', 'recommendation', 'suggest'}):
        return 'recommendation'

    if _has_any(text, {'mentor', 'mentoring', 'mentorship', '1:1', 'one to one', 'one-on-one'}):
        return 'mentoring_help'

    if _has_any(
        text,
        {
            'teacher', 'instructor', 'become a teacher', 'teach on', 'sell course',
            'create course', 'upload course', 'publish course'
        },
    ):
        return 'teacher_help'

    if _has_any(text, {'buy', 'purchase', 'enroll', 'checkout', 'cart', 'payment', 'price'}):
        return 'purchase_help'

    if _has_any(text, {'book', 'books'}):
        return 'book_search' if _is_search_query(text) else 'book_info'

    if _has_any(text, {'course', 'courses', 'class', 'classes'}):
        return 'course_search' if _is_search_query(text) else 'course_info'

    if _has_any(
        text,
        {
            'login', 'log in', 'sign in', 'sign up', 'register', 'account',
            'profile', 'dashboard', 'platform', 'site', 'support', 'help'
        },
    ):
        return 'platform_help'

    if _has_any(text, {'progress', 'completion', 'completed', 'finished', 'done', 'how far', 'how much'}):
        return 'progress_help'

    if _has_any(text, {'cart', 'wishlist', 'saved'}):
        return 'cart_help'

    if _has_any(text, {'certificate', 'cert', 'badge', 'credential'}):
        return 'certificate_help'

    if _has_any(text, {'category', 'categories', 'level', 'beginner', 'intermediate', 'advanced'}):
        return 'category_help'

    if _has_any(text, {'issue', 'problem', 'bug', 'error', 'not working', 'broken', 'technical'}):
        return 'technical_help'

    if _has_any(text, {'payment', 'billing', 'invoice', 'receipt', 'refund', 'money back'}):
        return 'payment_help'

    # CRITICAL: If it's a search query for an unknown topic, treat as course_search
    # This prevents queries like "search for python" or "find data science" from going to AI
    if _is_search_query(text):
        return 'course_search'

    return 'general'
