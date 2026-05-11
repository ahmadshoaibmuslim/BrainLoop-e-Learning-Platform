import requests

# Test what fields are actually in the API response
print("API Response Fields Analysis:")
print("-" * 70)

try:
    resp = requests.get('http://127.0.0.1:8000/api/v1/course/course-list/', timeout=5)
    if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, list) and data:
            course = data[0]
            print(f"Top-level fields in course:")
            for key in sorted(course.keys()):
                value = course[key]
                value_type = type(value).__name__
                if isinstance(value, (dict, list)):
                    if isinstance(value, dict):
                        print(f"  {key}: dict with keys {list(value.keys())[:3]}")
                    else:
                        print(f"  {key}: list with {len(value)} items")
                else:
                    print(f"  {key}: {value_type} = {str(value)[:60]}")
            
            print("\n" + "=" * 70)
            print("Checking for specific fields the formatter needs:")
            print(f"  title: {course.get('title', 'MISSING')}")
            print(f"  slug: {course.get('slug', 'MISSING')}")
            print(f"  price: {course.get('price', 'MISSING')}")
            print(f"  level: {course.get('level', 'MISSING')}")
            print(f"  average_rating: {course.get('average_rating', 'MISSING')}")
            print(f"  total_students: {course.get('total_students', 'MISSING')}")
            print(f"  teacher: {type(course.get('teacher', 'MISSING'))}")
            
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
