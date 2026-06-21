import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Login
login_data = {"email": "superadmin@fpt.ac.ma", "password": "admin123"}
response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)

if response.status_code == 200:
    token = response.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get Users
    response = requests.get(f"{BASE_URL}/auth/users/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("Response type:", type(data))
        print("Response:", json.dumps(data, indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
else:
    print("Login failed")
