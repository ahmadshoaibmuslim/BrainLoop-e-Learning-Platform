"""
Intent handling and action routing for chat.
"""

from __future__ import annotations

from typing import Any

from .ai_service import get_ai_response
from .elearning_service import (
    search_books,
    search_courses,
    get_featured_courses,
    get_popular_courses,
    get_course_recommendations,
    search_courses_by_category,
)
from ..models import Message


def _extract_query(message: str, stop_words: set[str]) -> str:
    words = [w.strip('.,!?') for w in (message or '').lower().split()]
    filtered = [w for w in words if w and w not in stop_words]
    return ' '.join(filtered).strip()


def _format_list(items: list[dict[str, Any]], key: str) -> str:
    lines: list[str] = []
    for idx, item in enumerate(items, start=1):
        name = (item.get(key) or '').strip()
        if not name:
            continue
        lines.append(f"{idx}. {name}")
    return '\n'.join(lines)


def _format_course_list(courses: list[dict[str, Any]], include_links: bool = True) -> str:
    """Format courses with rich metadata and optional links.
    
    Args:
        courses: List of course dictionaries from API
        include_links: Whether to include clickable course links
    
    Returns:
        Formatted string with course information
    """
    if not courses:
        return ""
    
    lines = []
    for course in courses[:5]:  # Limit to 5 courses
        title = course.get('title', 'Unknown Course')
        slug = course.get('slug', '')
        price = course.get('price', 'Free')
        level = course.get('level', 'All Levels')
        rating = course.get('average_rating')
        students = course.get('total_students', 0)
        instructor = course.get('teacher', {}).get('full_name', 'Unknown') if isinstance(course.get('teacher'), dict) else course.get('teacher', 'Unknown')
        
        # Build course link if slug available
        if include_links and slug:
            link = f"/course-detail/{slug}/"
            course_entry = f"[{title}]({link})"
        else:
            course_entry = title
        
        # Build metadata string with safe handling of None values
        metadata_parts = []
        
        if level:
            metadata_parts.append(level)
        
        # Handle rating - can be None
        if rating is not None:
            try:
                rating_float = float(rating)
                metadata_parts.append(f"⭐{rating_float:.1f}")
            except (TypeError, ValueError):
                pass
        
        # Handle students count
        try:
            students_int = int(students)
            metadata_parts.append(f"👥{students_int} students")
        except (TypeError, ValueError):
            pass
        
        # Handle price - convert to string if needed
        try:
            price_str = str(price)
            if price_str.lower() != 'free':
                try:
                    price_float = float(price_str)
                    metadata_parts.append(f"💰${price_float}")
                except ValueError:
                    metadata_parts.append(f"💰{price_str}")
            else:
                metadata_parts.append("💰Free")
        except:
            pass
        
        # Add instructor if available
        if instructor and instructor != 'Unknown':
            metadata_parts.append(f"👨‍🏫{instructor}")
        
        metadata = " | ".join(metadata_parts)
        lines.append(f"• {course_entry}\n  {metadata}")
    
    return '\n'.join(lines)


def _format_book_list(books: list[dict[str, Any]]) -> str:
    """Format books with metadata."""
    if not books:
        return ""
    
    lines = []
    for book in books[:5]:
        title = book.get('title', 'Unknown Book')
        author = book.get('author', 'Unknown Author')
        price = book.get('price', 'Free')
        book_id = book.get('id')

        if book_id:
            title_display = f"[{title}](/books/books-detail/{book_id}/)"
        else:
            title_display = title
        
        # Format price safely
        try:
            price_str = str(price)
            if price_str.lower() != 'free':
                try:
                    price_float = float(price_str)
                    price_display = f"💰${price_float}"
                except ValueError:
                    price_display = f"💰{price_str}"
            else:
                price_display = "💰Free"
        except:
            price_display = "💰Price TBD"
        
        lines.append(f"• {title_display} by {author} | {price_display}")
    
    return '\n'.join(lines)


def _get_recent_user_topics(user, limit: int = 10) -> str:
    stop_words = {
        'recommend', 'recommendation', 'course', 'courses', 'book', 'books',
        'show', 'find', 'search', 'for', 'me', 'please', 'a', 'an', 'the',
        'about', 'on', 'in', 'tell', 'more', 'me', 'of', 'to', 'learn',
    }
    recent = (
        Message.objects.filter(user=user, role=Message.Role.USER)
        .order_by('-timestamp')[:limit]
    )
    for row in recent:
        topic = _extract_query(row.content, stop_words)
        if topic:
            return topic
    return ''


def _build_context_messages(user, limit: int = 10) -> list[dict[str, str]]:
    recent = Message.objects.filter(user=user).order_by('-timestamp')[:limit]
    chronological = list(reversed(list(recent)))
    messages: list[dict[str, str]] = []
    for row in chronological:
        if row.role == Message.Role.AI:
            messages.append({'role': 'assistant', 'content': row.content})
        else:
            messages.append({'role': 'user', 'content': row.content})
    return messages


def handle_intent(intent: str, message: str, user) -> str | None:
    if intent == 'course_search':
        query = _extract_query(
            message,
            {
                'course', 'courses', 'show', 'find', 'search', 'for', 'me',
                'please', 'a', 'an', 'the', 'about', 'on', 'in', 'some', 'any',
                'several', 'various', 'all', 'different', 'more'
            },
        )
        query = query or message
        if not query or query.isspace():
            return 'Please tell me what type of courses you\'re looking for (e.g., Python, Web Development, Data Science).'
        
        results = search_courses(query)
        
        # If no results, try showing popular courses instead
        if not results:
            popular = get_popular_courses()
            if popular:
                formatted = _format_course_list(popular, include_links=True)
                return f"I couldn't find courses matching **{query}**, but here are some **popular courses** you might like:\n\n{formatted}"
            return f'I couldn\'t find courses matching "{query}". Try different keywords like Python, JavaScript, Web Development, Data Science, etc.'
        
        formatted = _format_course_list(results, include_links=True)
        return f"Here are the **{query.title()}** courses I found:\n\n{formatted}"

    if intent == 'book_search':
        query = _extract_query(
            message,
            {
                'book', 'books', 'show', 'find', 'search', 'for', 'me',
                'please', 'a', 'an', 'the', 'about', 'on', 'in', 'some', 'any',
                'several', 'various'
            },
        )
        query = query or message
        results = search_books(query)
        formatted = _format_book_list(results)
        if formatted:
            return f"Here are the **{query.title()}** books I found:\n\n{formatted}"
        return f'I couldn\'t find books matching "{query}". Try different keywords or browse our book collection.'

    if intent == 'recommendation':
        topic = _extract_query(
            message,
            {
                'recommend', 'recommendation', 'course', 'courses', 'book', 'books',
                'show', 'find', 'search', 'for', 'me', 'please', 'a', 'an', 'the',
                'about', 'on', 'in', 'tell', 'more', 'of', 'to', 'learn', 'some',
                'any', 'several', 'various', 'good', 'best'
            },
        )
        if not topic:
            topic = _get_recent_user_topics(user)
        
        # Multi-tier recommendation logic
        if topic and topic.strip():
            # First: Search for courses matching the topic
            results = search_courses(topic)
            if results:
                formatted = _format_course_list(results, include_links=True)
                return f"Based on your interest in **{topic.title()}**, here are recommended courses:\n\n{formatted}"
        
        # Second: Show featured courses
        featured = get_featured_courses()
        if featured:
            formatted = _format_course_list(featured, include_links=True)
            return f"Here are some **featured courses** I recommend:\n\n{formatted}"
        
        # Third: Show popular courses
        popular = get_popular_courses()
        if popular:
            formatted = _format_course_list(popular, include_links=True)
            return f"Here are some **popular courses** on our platform:\n\n{formatted}"
        
        # Final fallback: Return None to prevent AI from generating fictional data
        # Views.py will handle this and return a safe message
        return None

    if intent == 'platform_help':
        return (
            'This platform lets you discover and buy courses and books in one place. '
            'To enroll in a course, open the course page and click Enroll or Buy. '
            'To buy a book, open the book page and click Buy. '
            'To login or register, use the Sign In / Sign Up buttons on the top bar. '
            'Students can also book 1:1 mentoring sessions with their enrolled teachers '
            'from the dashboard.'
        )

    if intent == 'purchase_help':
        return (
            'To purchase a course or book, open the item page and click Buy. '
            'For courses, you can also use Enroll if it is available on that course.'
        )

    if intent == 'mentoring_help':
        return (
            'You can book 1:1 mentoring sessions from your dashboard. '
            'Mentoring is available with teachers for the courses you are enrolled in.'
        )

    if intent == 'teacher_help':
        return (
            'Teachers can upload and manage courses and books from their dashboard. '
            'Create an account and complete your instructor profile to get started. '
            'If you do not see the teacher dashboard, contact support for access.'
        )

    if intent == 'course_info':
        return (
            'Courses are listed on the Courses page. Open a course to view details, '
            'then click Enroll or Buy to access it. Teachers manage their courses '
            'from the instructor dashboard. Each course includes video lessons, '
            'assignments, and a certificate of completion.'
        )

    if intent == 'book_info':
        return (
            'Books are listed in the Books section. Open a book to view details, '
            'then click Buy to purchase it. You can read books online or download them.'
        )

    if intent == 'progress_help':
        return (
            'You can track your course progress from your student dashboard. '
            'Go to "My Courses" to see your enrolled courses and completion percentage. '
            'The dashboard shows which lessons you\'ve completed and what\'s next. '
            'You can also view your completed lessons and earned certificates.'
        )

    if intent == 'cart_help':
        return (
            'Your cart shows courses and books you\'ve added but haven\'t purchased yet. '
            'You can add items to your cart, review them, apply discount codes, and proceed to checkout. '
            'Your wishlist is a place to save items you\'re interested in for later.'
        )

    if intent == 'certificate_help':
        return (
            'You earn certificates upon completing courses. '
            'Certificates are available in your student dashboard under "Achievements" or "Certificates". '
            'You can download, print, or share your certificates on social media. '
            'Each certificate shows the course name, completion date, and your name.'
        )

    if intent == 'category_help':
        # Extract category from message
        stop_words = {
            'course', 'courses', 'show', 'category', 'categories', 'find', 'search',
            'level', 'beginner', 'intermediate', 'advanced', 'browse', 'for', 'me'
        }
        category = _extract_query(message, stop_words)
        
        if category:
            results = search_courses_by_category(category)
        else:
            # If no category specified, show popular
            results = get_popular_courses()
            category = 'popular'
        
        if results:
            formatted = _format_course_list(results, include_links=True)
            return f"Here are **{category}** courses:\n\n{formatted}"
        
        # Fallback to featured
        featured = get_featured_courses()
        if featured:
            formatted = _format_course_list(featured, include_links=True)
            return f"I couldn't find courses in the {category} category, but here are some **featured courses**:\n\n{formatted}"
        
        return f'Try searching for specific topics like Python, JavaScript, Data Science, Web Development, etc.'

    if intent == 'technical_help':
        return (
            'Common issues and solutions:\n'
            '• **Video won\'t play**: Try refreshing the page or using a different browser. '
            'Ensure your internet connection is stable.\n'
            '• **Can\'t access course**: Make sure you\'re enrolled or have purchased access.\n'
            '• **Download issues**: Check your browser download settings and storage space.\n'
            '• **Mobile app problems**: Try uninstalling and reinstalling the app.\n\n'
            'If you\'re still having issues, contact our support team for immediate assistance.'
        )

    if intent == 'payment_help':
        return (
            'Payment information:\n'
            '• We accept all major credit cards, debit cards, and digital payment methods.\n'
            '• You can view your billing history and invoices in your account settings.\n'
            '• Refund requests can be made within 30 days of purchase.\n'
            '• If you have questions about pricing or want to apply a discount code, contact support.\n\n'
            'For payment issues, please reach out to our support team.'
        )

    return None
