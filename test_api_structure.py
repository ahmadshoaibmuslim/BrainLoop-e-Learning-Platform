import requests
import json

# Test what the API actually returns
print("Testing actual API response structure:")
print("-" * 70)

try:
    resp = requests.get('http://127.0.0.1:8000/api/v1/course/course-list/', timeout=5)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Total courses: {len(data)}")
        if data:
            course = data[0]
            print(f"\nFirst course structure:")
            print(json.dumps(course, indent=2))
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

# Test search response
print("\n" + "=" * 70)
print("Testing search response:")
print("-" * 70)

try:
    resp = requests.get('http://127.0.0.1:8000/api/v1/course/search/', params={'query': 'python'}, timeout=5)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Search results: {len(data) if isinstance(data, list) else 'not a list'}")
        if isinstance(data, list) and data:
            course = data[0]
            print(f"\nFirst search result structure:")
            print(json.dumps(course, indent=2))
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
