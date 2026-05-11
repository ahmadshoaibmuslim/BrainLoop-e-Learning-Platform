"""
E-learning API integration helpers.
"""

from __future__ import annotations

import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

BASE_URL = "http://127.0.0.1:8000/api/v1"
REQUEST_TIMEOUT_S = 15


def _safe_get_list(url: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    try:
        resp = requests.get(url, params=params, timeout=REQUEST_TIMEOUT_S)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list):
            return data
        logger.warning('Unexpected response shape from %s', url)
        return []
    except requests.Timeout:
        logger.warning('Timeout calling %s', url)
    except requests.RequestException:
        logger.warning('Connection error calling %s', url)
    except ValueError:
        logger.warning('Invalid JSON from %s', url)
    return []


def search_courses(query: str) -> list[dict[str, Any]]:
    """Search for courses with fallback to all courses if no results."""
    if not query:
        return []
    
    url = f"{BASE_URL}/course/search/"
    results = _safe_get_list(url, params={'query': query})
    
    # If no results from exact search, try getting all courses and filter client-side
    if not results:
        all_courses = _safe_get_list(f"{BASE_URL}/course/course-list/")
        if all_courses:
            query_lower = query.lower()
            # Filter by title or description
            results = [
                c for c in all_courses
                if query_lower in str(c.get('title', '')).lower() or
                   query_lower in str(c.get('description', '')).lower()
            ]
    
    return results


def search_books(query: str) -> list[dict[str, Any]]:
    if not query:
        return []
    url = f"{BASE_URL}/books/"
    books = _safe_get_list(url)
    if not query:
        return books
    lowered = query.lower()
    return [book for book in books if str(book.get('title', '')).lower().find(lowered) != -1]


def get_featured_courses() -> list[dict[str, Any]]:
    """Get featured courses with multiple fallback strategies."""
    url = f"{BASE_URL}/course/course-list/"
    courses = _safe_get_list(url)
    
    if not courses:
        return []
    
    # First: Try to get featured courses
    featured = [c for c in courses if c.get('featured', False)]
    if featured:
        return featured[:5]
    
    # Second: Try to get highly-rated courses
    rated = sorted(
        courses,
        key=lambda x: float(x.get('average_rating', 0) or 0),
        reverse=True
    )
    if rated:
        return rated[:5]
    
    # Third: Just return first 5
    return courses[:5]


def get_popular_courses() -> list[dict[str, Any]]:
    """Get popular courses with multiple sorting strategies."""
    url = f"{BASE_URL}/course/course-list/"
    courses = _safe_get_list(url)
    
    if not courses:
        return []
    
    # First: Sort by total students (enrollment count)
    by_students = sorted(
        courses,
        key=lambda x: int(x.get('total_students', 0) or 0),
        reverse=True
    )
    if by_students and by_students[0].get('total_students', 0):
        return by_students[:5]
    
    # Second: Sort by rating
    by_rating = sorted(
        courses,
        key=lambda x: float(x.get('average_rating', 0) or 0),
        reverse=True
    )
    if by_rating:
        return by_rating[:5]
    
    # Third: Just return first 5
    return courses[:5]


def get_course_recommendations(course_id: int) -> list[dict[str, Any]]:
    """Get similar courses using the recommendation API (TF-IDF based)."""
    url = f"{BASE_URL}/recommend-courses/{course_id}/"
    try:
        resp = requests.get(url, timeout=REQUEST_TIMEOUT_S)
        resp.raise_for_status()
        data = resp.json()
        return data.get('recommended_courses', [])
    except requests.Timeout:
        logger.warning('Timeout calling recommendations API')
        return []
    except requests.RequestException as e:
        logger.warning('Error calling recommendations API: %s', e)
        return []
    except ValueError:
        logger.warning('Invalid JSON from recommendations API')
        return []


def get_user_enrollments(user_id: int) -> list[dict[str, Any]]:
    """Get courses the user is enrolled in."""
    url = f"{BASE_URL}/student/enrollments/{user_id}/"
    return _safe_get_list(url)


def get_course_by_slug(slug: str) -> dict[str, Any] | None:
    """Get detailed course information by slug."""
    url = f"{BASE_URL}/course/course-detail/{slug}/"
    try:
        resp = requests.get(url, timeout=REQUEST_TIMEOUT_S)
        resp.raise_for_status()
        return resp.json()
    except:
        return None


def search_courses_by_category(category: str) -> list[dict[str, Any]]:
    """Search for courses by category."""
    url = f"{BASE_URL}/course/course-list/"
    courses = _safe_get_list(url)
    if not category:
        return courses
    category_lower = category.lower()
    return [
        c for c in courses
        if category_lower in str(c.get('category', '')).lower()
    ]
