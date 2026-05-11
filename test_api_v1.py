import requests

# Test the backend API with correct v1 path
print("Testing Backend API with /api/v1/:")
print("-" * 50)

try:
    resp = requests.get('http://127.0.0.1:8000/api/v1/course/course-list/', timeout=5)
    print(f'Course list status: {resp.status_code}')
    if resp.status_code == 200:
        data = resp.json()
        count = len(data) if isinstance(data, list) else 0
        print(f'Courses returned: {count}')
        if isinstance(data, list) and len(data) > 0:
            print(f'First course: {data[0].get("title", "N/A")}')
except Exception as e:
    print(f'Error calling course-list: {type(e).__name__}: {e}')

print()

# Test search
try:
    resp = requests.get('http://127.0.0.1:8000/api/v1/course/search/', params={'query': 'python'}, timeout=5)
    print(f'Search "python" status: {resp.status_code}')
    if resp.status_code == 200:
        data = resp.json()
        count = len(data) if isinstance(data, list) else 0
        print(f'Search results for "python": {count}')
        if isinstance(data, list) and len(data) > 0:
            for course in data:
                print(f'  - {course.get("title", "N/A")}')
except Exception as e:
    print(f'Error calling search: {type(e).__name__}: {e}')

print()

# Test data science search (the one that was failing)
try:
    resp = requests.get('http://127.0.0.1:8000/api/v1/course/search/', params={'query': 'data science'}, timeout=5)
    print(f'Search "data science" status: {resp.status_code}')
    if resp.status_code == 200:
        data = resp.json()
        count = len(data) if isinstance(data, list) else 0
        print(f'Search results for "data science": {count}')
except Exception as e:
    print(f'Error calling search: {type(e).__name__}: {e}')
