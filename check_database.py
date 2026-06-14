#!/usr/bin/env python
"""
سكريبت للتحقق من مشكلة Failed to load users
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, 'hrms-backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 60)
print("Checking Database")
print("=" * 60)

# عدد المستخدمين
total = User.objects.count()
print(f"\nTotal Users: {total}")

# المستخدمين حسب الدور
print("\nUsers by Role:")
for role in ['SUPER_ADMIN', 'ADMIN_HR', 'DEPARTMENT_HEAD', 'PROFESSOR', 'STAFF', 'STUDENT']:
    count = User.objects.filter(role=role).count()
    print(f"   {role}: {count}")

# المستخدمين النشطين
active = User.objects.filter(is_active=True).count()
inactive = User.objects.filter(is_active=False).count()
print(f"\nActive Users: {active}")
print(f"Inactive Users: {inactive}")

# Super Admins
print("\nSuper Admin Accounts:")
super_admins = User.objects.filter(role='SUPER_ADMIN')
for admin in super_admins:
    print(f"   - {admin.email} (Active: {admin.is_active})")

print("\n" + "=" * 60)
print("Check completed!")
print("=" * 60)
