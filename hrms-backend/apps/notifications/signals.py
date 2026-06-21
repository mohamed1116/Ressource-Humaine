# Django signals for automatic notification triggers
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.leaves.models import LeaveRequest
from apps.certificates.models import DocumentRequest
from apps.attendance.models import AbsenceJustification
from .services import NotificationService


@receiver(post_save, sender=LeaveRequest)
def notify_on_leave_request(sender, instance, created, **kwargs):
    if created:
        from apps.accounts.models import User
        try:
            dept_head = instance.employee.department.head if (instance.employee.department and instance.employee.department.head) else None
            if dept_head:
                NotificationService.create_notification(
                    recipient=dept_head.user,
                    notification_type='LEAVE_REQUEST',
                    title=f'Nouvelle demande de congé - {instance.employee.full_name}',
                    message=f'{instance.employee.full_name} a demandé {instance.leave_type.name} du {instance.start_date} au {instance.end_date}.',
                    action_url='/requests/all',
                    related_object_type='leave_request',
                    related_object_id=instance.id,
                )
        except Exception:
            pass
        try:
            for admin in User.objects.filter(role__in=['ADMIN_HR', 'SUPER_ADMIN'], is_active=True):
                NotificationService.create_notification(
                    recipient=admin,
                    notification_type='LEAVE_REQUEST',
                    title=f'Nouvelle demande de congé - {instance.employee.full_name}',
                    message=f'{instance.employee.full_name} a demandé {instance.leave_type.name} du {instance.start_date} au {instance.end_date}.',
                    action_url='/requests/all',
                    related_object_type='leave_request',
                    related_object_id=instance.id,
                )
        except Exception:
            pass
    elif instance.status == 'APPROVED':
        NotificationService.create_notification(
            recipient=instance.employee.user,
            notification_type='LEAVE_APPROVED',
            title='Demande de conge approuvee',
            message=f'Votre demande de {instance.leave_type.name} a ete approuvee.',
            action_url='/leaves',
            related_object_type='leave_request',
            related_object_id=instance.id,
        )
    elif instance.status == 'REJECTED':
        NotificationService.create_notification(
            recipient=instance.employee.user,
            notification_type='LEAVE_REJECTED',
            title='Demande de conge rejetee',
            message=f'Votre demande de {instance.leave_type.name} a ete rejetee.',
            action_url='/leaves',
            related_object_type='leave_request',
            related_object_id=instance.id,
        )


@receiver(post_save, sender=DocumentRequest)
def notify_on_document_request(sender, instance, created, **kwargs):
    from apps.accounts.models import User
    template_name = instance.template.name if instance.template else 'Demande libre'
    subject = (instance.extra_data or {}).get('subject', '') if not instance.template else ''
    doc_label = subject or template_name
    try:
        if created:
            for admin in User.objects.filter(role__in=['ADMIN_HR', 'SUPER_ADMIN'], is_active=True):
                NotificationService.create_notification(
                    recipient=admin,
                    notification_type='SYSTEM',
                    title=f'Nouvelle demande - {instance.requested_by.get_full_name()}',
                    message=f'{instance.requested_by.get_full_name()} a soumis : {doc_label}.',
                    action_url='/requests/all',
                    related_object_type='document_request',
                    related_object_id=instance.id,
                )
        elif instance.status == 'APPROVED':
            NotificationService.create_notification(
                recipient=instance.requested_by,
                notification_type='SYSTEM',
                title='Demande approuvee',
                message=f'Votre demande "{doc_label}" a ete approuvee.',
                action_url='/requests',
                related_object_type='document_request',
                related_object_id=instance.id,
            )
        elif instance.status == 'REJECTED':
            NotificationService.create_notification(
                recipient=instance.requested_by,
                notification_type='SYSTEM',
                title='Demande rejetee',
                message=f'Votre demande "{doc_label}" a ete rejetee. Motif: {instance.rejection_reason}',
                action_url='/requests',
                related_object_type='document_request',
                related_object_id=instance.id,
            )
    except Exception:
        pass


@receiver(post_save, sender=AbsenceJustification)
def notify_on_justification(sender, instance, created, **kwargs):
    if not created and instance.status == 'ACCEPTED':
        NotificationService.create_notification(
            recipient=instance.attendance_record.employee.user,
            notification_type='ATTENDANCE_ALERT',
            title='Justification d absence acceptee',
            message=f'Votre justification d absence du {instance.attendance_record.date} a ete acceptee.',
            action_url='/attendance',
        )
    elif not created and instance.status == 'REJECTED':
        NotificationService.create_notification(
            recipient=instance.attendance_record.employee.user,
            notification_type='ATTENDANCE_ALERT',
            title='Justification d absence rejetee',
            message=f'Votre justification d absence du {instance.attendance_record.date} a ete rejetee.',
            action_url='/attendance',
        )
