#!/usr/bin/env python
"""
Reset Super Admin Password
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
print("Reset Super Admin Password")
print("=" * 60)

try:
    # Find Super Admin
    admin = User.objects.get(email='superadmin@fpt.ac.ma')
    
    print(f"\nFound: {admin.email}")
    print(f"Role: {admin.role}")
    print(f"Active: {admin.is_active}")
    
    # Set new password
    new_password = "admin123"
    admin.set_password(new_password)
    admin.save()
    
    print(f"\nPassword reset successfully!")
    print(f"New password: {new_password}")
    print(f"\nYou can now login with:")
    print(f"  Email: {admin.email}")
    print(f"  Password: {new_password}")
    
except User.DoesNotExist:
    print("\nERROR: Super Admin not found!")
    print("Creating new Super Admin...")
    
    admin = User.objects.create_user(
        email='superadmin@fpt.ac.ma',
        username='superadmin',
        password='admin123',
        first_name='Super',
        last_name='Admin',
        role='SUPER_ADMIN',
        is_active=True,
        is_staff=True,
        is_superuser=True
    )
    
    print(f"\nSuper Admin created!")
    print(f"Email: {admin.email}")
    print(f"Password: admin123")

print("\n" + "=" * 60)
print("Done!")
print("=" * 60)
