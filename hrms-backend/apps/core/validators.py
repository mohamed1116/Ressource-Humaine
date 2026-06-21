import re
# Custom validators for HRMS data validation
from django.core.exceptions import ValidationError


def validate_file_size(value, max_mb=5):
    """Validate that uploaded file does not exceed max_mb megabytes."""
    if value.size > max_mb * 1024 * 1024:
        raise ValidationError(f'File size must not exceed {max_mb}MB.')


def validate_cin(value):
    """Validate Moroccan CIN format (1-2 uppercase letters followed by 5-6 digits)."""
    if not re.match(r'^[A-Z]{1,2}\d{5,6}$', value):
        raise ValidationError('Invalid CIN format. Expected format: AB123456 or A12345.')
