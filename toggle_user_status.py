#!/usr/bin/env python
"""
Toggle User Status - تبديل حالة المستخدم (Active/Inactive)
"""

import os
import sys
import django

sys.path.insert(0, 'hrms-backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def toggle_user_status(email):
    """تبديل حالة المستخدم (Active/Inactive)"""
    try:
        user = User.objects.get(email=email)
        user.is_active = not user.is_active
        user.save()
        
        status = "Active" if user.is_active else "Inactive"
        print(f"\n{'='*60}")
        print(f"User {user.email} is now {status}")
        print(f"{'='*60}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"   Role: {user.role}")
        print(f"\n{'='*60}")
        print(f"Status: {status}")
        print(f"{'='*60}\n")
        
    except User.DoesNotExist:
        print(f"\n❌ User with email '{email}' not found\n")

def deactivate_user(email):
    """تعطيل حساب مستخدم"""
    try:
        user = User.objects.get(email=email)
        
        if not user.is_active:
            print(f"\n⚠️  {user.email} is already Inactive\n")
            return
        
        user.is_active = False
        user.save()
        
        print(f"\n{'='*60}")
        print(f"User {user.email} has been DEACTIVATED")
        print(f"{'='*60}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"   Role: {user.role}")
        print(f"   User cannot login anymore")
        print(f"{'='*60}\n")
        
    except User.DoesNotExist:
        print(f"\n❌ User with email '{email}' not found\n")

def activate_user(email):
    """تفعيل حساب مستخدم"""
    try:
        user = User.objects.get(email=email)
        
        if user.is_active:
            print(f"\n⚠️  {user.email} is already Active\n")
            return
        
        user.is_active = True
        user.save()
        
        print(f"\n{'='*60}")
        print(f"User {user.email} has been ACTIVATED")
        print(f"{'='*60}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"   Role: {user.role}")
        print(f"   User can login now")
        print(f"{'='*60}\n")
        
    except User.DoesNotExist:
        print(f"\n❌ User with email '{email}' not found\n")

def list_inactive_users():
    """عرض جميع الحسابات غير النشطة"""
    inactive = User.objects.filter(is_active=False).order_by('email')
    
    print(f"\n{'='*60}")
    print(f"Inactive Users: {inactive.count()}")
    print(f"{'='*60}\n")
    
    if inactive.count() == 0:
        print("   All users are Active!\n")
        return
    
    for i, user in enumerate(inactive, 1):
        print(f"   {i}. {user.email}")
        print(f"      Name: {user.first_name} {user.last_name}")
        print(f"      Role: {user.role}")
        print(f"      Created: {user.created_at.strftime('%Y-%m-%d')}")
        print()

def list_all_users():
    """عرض جميع المستخدمين مع حالتهم"""
    users = User.objects.all().order_by('-is_active', 'email')
    
    active_count = users.filter(is_active=True).count()
    inactive_count = users.filter(is_active=False).count()
    
    print(f"\n{'='*60}")
    print(f"All Users: {users.count()}")
    print(f"{'='*60}")
    print(f"   Active: {active_count}")
    print(f"   Inactive: {inactive_count}")
    print(f"{'='*60}\n")
    
    for i, user in enumerate(users, 1):
        status = "Active" if user.is_active else "Inactive"
        print(f"   {i}. {user.email} - {status}")
        print(f"      {user.first_name} {user.last_name} ({user.role})")
        print()

def show_help():
    """عرض المساعدة"""
    print("""
============================================================
         Toggle User Status - User Management Tool
============================================================

Usage:
  python toggle_user_status.py <command> [email]

Commands:
  toggle <email>      - Toggle user status (Active <-> Inactive)
  deactivate <email>  - Deactivate user account
  activate <email>    - Activate user account
  list                - List all inactive users
  all                 - List all users with their status
  help                - Show this help message

Examples:
  python toggle_user_status.py toggle user@example.com
  python toggle_user_status.py deactivate user@example.com
  python toggle_user_status.py activate user@example.com
  python toggle_user_status.py list
  python toggle_user_status.py all

Notes:
  - Only Super Admin can change user status
  - Inactive users cannot login
  - User data is preserved when deactivated
  - Users can be reactivated anytime
    """)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        show_help()
        sys.exit(1)
    
    action = sys.argv[1].lower()
    
    if action == "help":
        show_help()
    elif action == "list":
        list_inactive_users()
    elif action == "all":
        list_all_users()
    elif action == "toggle" and len(sys.argv) == 3:
        toggle_user_status(sys.argv[2])
    elif action == "deactivate" and len(sys.argv) == 3:
        deactivate_user(sys.argv[2])
    elif action == "activate" and len(sys.argv) == 3:
        activate_user(sys.argv[2])
    else:
        print("\n❌ Invalid command\n")
        show_help()
        sys.exit(1)
