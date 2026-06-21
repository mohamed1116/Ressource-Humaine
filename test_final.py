import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 60)
print("Testing User Management API")
print("=" * 60)

# Test Login
print("\n[1] Testing Login...")
login_data = {
    "email": "superadmin@fpt.ac.ma",
    "password": "admin123"
}

response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
print(f"    Status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"    SUCCESS!")
    print(f"    User: {result['user']['email']}")
    print(f"    Role: {result['user']['role']}")
    token = result['access']
    
    # Test Get Users
    print("\n[2] Testing Get Users...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/auth/users/", headers=headers)
    print(f"    Status: {response.status_code}")
    
    if response.status_code == 200:
        users = response.json()
        print(f"    SUCCESS! Got {len(users)} users")
        
        if len(users) > 0:
            print("\n    Sample users:")
            count = min(3, len(users))
            for i in range(count):
                u = users[i]
                fname = u.get('first_name', 'N/A')
                lname = u.get('last_name', 'N/A')
                email = u.get('email', 'N/A')
                role = u.get('role', 'N/A')
                print(f"    {i+1}. {fname} {lname} - {email} ({role})")
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED!")
        print("=" * 60)
        print("\nYour Frontend should work now!")
        print("Login with:")
        print("  Email: superadmin@fpt.ac.ma")
        print("  Password: admin123")
        
    else:
        print(f"    ERROR: {response.text}")
else:
    print(f"    ERROR: {response.text}")
    print("\n    Please run: python reset_admin_password.py")

print("\n" + "=" * 60)
