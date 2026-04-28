from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.leaves.models import LeaveRequest
from .services import NotificationService


@receiver(post_save, sender=LeaveRequest)
def notify_on_leave_request(sender, instance, created, **kwargs):
    """Create notifications when leave requests change status."""
    if created:
        # Notify department head about new leave request
        dept_head = instance.employee.department.head
        if dept_head:
            NotificationService.create_notification(
                recipient=dept_head.user,
                notification_type='LEAVE_REQUEST',
                title=f'New Leave Request from {instance.employee.full_name}',
                message=(
                    f'{instance.employee.full_name} has requested {instance.leave_type.name} '
                    f'from {instance.start_date} to {instance.end_date}.'
                ),
                action_url=f'/leaves/approvals',
                related_object_type='leave_request',
                related_object_id=instance.id,
            )
    elif instance.status == 'APPROVED':
        NotificationService.create_notification(
            recipient=instance.employee.user,
            notification_type='LEAVE_APPROVED',
            title='Leave Request Approved',
            message=f'Your {instance.leave_type.name} request has been approved.',
            action_url='/leaves',
            related_object_type='leave_request',
            related_object_id=instance.id,
        )
    elif instance.status == 'REJECTED':
        NotificationService.create_notification(
            recipient=instance.employee.user,
            notification_type='LEAVE_REJECTED',
            title='Leave Request Rejected',
            message=f'Your {instance.leave_type.name} request has been rejected.',
            action_url='/leaves',
            related_object_type='leave_request',
            related_object_id=instance.id,
        )
