import sys
import os
import json

# Add the AI agent app to path
sys.path.insert(0, r'd:\FYP\AI Customer Support Agent for Multi-Vendor E-commerce')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_support_agent.settings')
import django
django.setup()

# Test the complete flow
from django.contrib.auth.models import User
from django.test import RequestFactory
from chat.views import ChatApiView
from rest_framework.test import force_authenticate

print("Testing complete chat flow (simulating API requests):")
print("=" * 70)

# Get or create test user
user, created = User.objects.get_or_create(
    username='testchatuser',
    defaults={'email': 'testchat@example.com'}
)

# Create request factory
factory = RequestFactory()
view = ChatApiView.as_view()

# Test messages
test_messages = [
    'Show me Python courses',
    'Find web development courses',
    'Recommend me some courses',
    'Search for data science',
]

for message in test_messages:
    print(f"\nTesting: '{message}'")
    print("-" * 70)
    
    try:
        # Create a POST request
        request = factory.post(
            '/api/chat/',
            json.dumps({'message': message}),
            content_type='application/json'
        )
        force_authenticate(request, user=user)
        
        # Call the view
        response = view(request)
        
        # Check response
        print(f"Status Code: {response.status_code}")
        
        if hasattr(response, 'data'):
            resp_data = response.data
            if isinstance(resp_data, dict) and 'response' in resp_data:
                resp_text = resp_data['response']
                if resp_text:
                    preview = resp_text[:120] + "..." if len(resp_text) > 120 else resp_text
                    print(f"Response: {preview}")
                    print("✅ SUCCESS: Got valid response")
                else:
                    print("Response is empty")
            else:
                print(f"Response data: {resp_data}")
        else:
            print(f"Response object doesn't have data attribute")
            
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 70)
print("Chat flow testing complete!")
