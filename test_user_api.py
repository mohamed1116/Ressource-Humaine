#!/usr/bin/env python
"""
سكريبت اختبار سريع للتحقق من عمل API
Quick test script to verify API is working
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_login():
    """اختبار تسجيل الدخول"""
    print("🔐 Testing login...")
    
    # استخدم بيانات Super Admin من قاعدة البيانات
    # يجب تغيير البريد وكلمة المرور حسب قاعدة البيانات
    data = {
        "email": "admin@fpt.ac.ma",  # غير هذا
        "password": "admin123"  # غير هذا
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful!")
            print(f"   User: {result['user']['email']}")
            print(f"   Role: {result['user']['role']}")
            return result['access']
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_get_users(token):
    """اختبار جلب المستخدمين"""
    print("\n👥 Testing get users...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/auth/users/", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Got {len(users)} users!")
            print("\n   First 5 users:")
            for user in users[:5]:
                print(f"   - {user['first_name']} {user['last_name']} ({user['email']}) - {user['role']}")
            return True
        else:
            print(f"❌ Failed to get users: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 User Management API Test")
    print("=" * 60)
    
    # اختبار تسجيل الدخول
    token = test_login()
    
    if token:
        # اختبار جلب المستخدمين
        test_get_users(token)
    else:
        print("\n⚠️  Cannot proceed without valid token")
        print("   Please update the email and password in this script")
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
