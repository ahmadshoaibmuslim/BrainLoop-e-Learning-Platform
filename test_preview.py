import requests

url = "http://127.0.0.1:8000/api/v1/books/1/preview/"
response = requests.get(url)
print(f"Status Code: {response.status_code}")
print(f"Headers: {dict(response.headers)}")
print(f"Content Type: {response.headers.get('Content-Type')}")
if response.status_code != 200:
    print(f"Response: {response.text[:500]}")
else:
    print(f"PDF received, size: {len(response.content)} bytes")
