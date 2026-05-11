import sys
import os

# Add the AI agent app to path
sys.path.insert(0, r'd:\FYP\AI Customer Support Agent for Multi-Vendor E-commerce')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_support_agent.settings')
import django
django.setup()

# Now test the formatting
import requests
from chat.services.action_service import _format_course_list, _format_book_list

print("Testing formatting with real API data:")
print("=" * 70)

# Get real course data
try:
    resp = requests.get('http://127.0.0.1:8000/api/v1/course/course-list/', timeout=5)
    if resp.status_code == 200:
        courses = resp.json()
        print(f"Got {len(courses)} courses from API")
        print("\nFormatted output:")
        print("-" * 70)
        formatted = _format_course_list(courses, include_links=True)
        print(formatted)
        print("\n✅ SUCCESS: Formatting worked without errors!")
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
