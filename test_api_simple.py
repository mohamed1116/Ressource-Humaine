import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 60)
print("Testing User Management API")
print("=" * 60)

# Test 1: Login with Super Admin
print("\n1. Testing Login...")
login_data = {
    "email": "superadmin@fpt.ac.ma",
    "password": "admin123"  # Change this to the correct password
}

try:
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   SUCCESS! User: {result['user']['email']}")
        print(f"   Role: {result['user']['role']}")
        token = result['access']
        print(f"   Token: {token[:50]}...")
        
        # Test 2: Get Users
        print("\n2. Testing Get Users...")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/auth/users/", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            users = response.json()
            print(f"   SUCCESS! Got {len(users)} users")
            print("\n   First 3 users:")
            for i, user in enumerate(users[:3]):
                print(f"   {i+1}. {user.get('first_name', 'N/A')} {user.get('last_name', 'N/A')} ({user.get('email', 'N/A')}) - {user.get('role', 'N/A')}")
        else:
            print(f"   ERROR: {response.text}")
            
    else:
        print(f"   ERROR: {response.text}")
        print("\n   Possible reasons:")
        print("   1. Wrong email or password")
        print("   2. User is not active")
        print("   3. Backend is not running")
        
except Exception as e:
    print(f"   ERROR: {e}")
    print("\n   Make sure Backend is running on http://localhost:8000")

print("\n" + "=" * 60)
print("Test completed!")
print("=" * 60)

print("\nNotes:")
print("   - If login fails, update the password in this script")
print("   - Make sure Backend is running: python manage.py runserver")
print("   - Check that superadmin@fpt.ac.ma exists in database")
