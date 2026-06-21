"""
Management command to create a Super Admin user.
Usage: python manage.py create_superadmin
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a Super Admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email address')
        parser.add_argument('--username', type=str, help='Username')
        parser.add_argument('--password', type=str, help='Password')
        parser.add_argument('--first-name', type=str, help='First name')
        parser.add_argument('--last-name', type=str, help='Last name')

    def handle(self, *args, **options):
        email = options.get('email') or input('Email: ')
        username = options.get('username') or input('Username: ')
        first_name = options.get('first_name') or input('First name: ')
        last_name = options.get('last_name') or input('Last name: ')
        password = options.get('password') or input('Password: ')

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'User with email {email} already exists.'))
            return

        user = User.objects.create_user(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            password=password,
            role='SUPER_ADMIN',
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )

        self.stdout.write(self.style.SUCCESS(f'Super Admin created successfully: {user.email}'))
        self.stdout.write(f'  Name: {user.get_full_name()}')
        self.stdout.write(f'  Role: {user.get_role_display()}')
