import sys
import os

# Add the AI agent app to path
sys.path.insert(0, r'd:\FYP\AI Customer Support Agent for Multi-Vendor E-commerce')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_support_agent.settings')
import django
django.setup()

# Now test the full action handler
from django.contrib.auth.models import User
from chat.services.action_service import handle_intent

print("Testing action handler with different intents:")
print("=" * 70)

# Get or create a test user
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={'email': 'test@example.com'}
)

# Test cases
test_cases = [
    ('course_search', 'Show me Python courses', 'Search for Python'),
    ('course_search', 'Find web development courses', 'Search for Web Dev'),
    ('recommendation', 'Recommend me some courses', 'Get recommendations'),
    ('course_search', 'Search for data science', 'Search for Data Science'),
]

for intent, message, label in test_cases:
    print(f"\n{label}:")
    print(f"  Intent: {intent}")
    print(f"  Message: {message}")
    try:
        result = handle_intent(intent, message, user)
        if result:
            print(f"  Result: {result[:100]}...")
            print("  ✅ SUCCESS")
        else:
            print(f"  Result: None (fallback to AI)")
            print("  ✅ SUCCESS (returns None when no data)")
    except Exception as e:
        print(f"  ❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
