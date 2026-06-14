import requests

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 60)
print("Checking All Users with Pagination")
print("=" * 60)

# Login
login_data = {"email": "superadmin@fpt.ac.ma", "password": "admin123"}
response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)

if response.status_code == 200:
    token = response.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all users with pagination
    all_users = []
    page = 1
    
    while True:
        print(f"\n[Page {page}]")
        response = requests.get(f"{BASE_URL}/auth/users/", headers=headers, params={"page": page})
        
        if response.status_code == 200:
            data = response.json()
            users = data.get('results', [])
            all_users.extend(users)
            
            print(f"  Got {len(users)} users")
            print(f"  Total so far: {len(all_users)}")
            
            if not data.get('next'):
                break
            page += 1
        else:
            print(f"  Error: {response.status_code}")
            break
    
    print("\n" + "=" * 60)
    print(f"TOTAL USERS: {len(all_users)}")
    print("=" * 60)
    
    # Count by role
    from collections import Counter
    roles = Counter([u['role'] for u in all_users])
    
    print("\nUsers by Role:")
    for role, count in sorted(roles.items()):
        print(f"  {role}: {count}")
    
    print("\n" + "=" * 60)
    print("SUCCESS! All users loaded")
    print("=" * 60)
    
else:
    print("Login failed")
