from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.leaves.models import LeaveRequest
from apps.certificates.models import DocumentRequest
from apps.payroll.models import Payslip
from apps.attendance.models import AbsenceJustification
from .services import NotificationService


@receiver(post_save, sender=LeaveRequest)
def notify_on_leave_request(sender, instance, created, **kwargs):
    if created:
        dept_head = instance.employee.department.head
        if dept_head:
            NotificationService.create_notification(
                recipient=dept_head.user,
                notification_type='LEAVE_REQUEST',
                title=f'Nouvelle demande de conge - {instance.employee.full_name}',
                message=f'{instance.employee.full_name} a demande {instance.leave_type.name} du {instance.start_date} au {instance.end_date}.',
                action_url='/leaves',
                related_object_type='leave_request',
                related_object_id=instance.id,
            )
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
    if created:
        # Notify all HR admins
        for hr in User.objects.filter(role='ADMIN_HR'):
            NotificationService.create_notification(
                recipient=hr,
                notification_type='SYSTEM',
                title=f'Nouvelle demande de document - {instance.requested_by.get_full_name()}',
                message=f'{instance.requested_by.get_full_name()} a demande : {instance.template.name}.',
                action_url='/requests',
                related_object_type='document_request',
                related_object_id=instance.id,
            )
    elif instance.status == 'APPROVED':
        NotificationService.create_notification(
            recipient=instance.requested_by,
            notification_type='SYSTEM',
            title='Demande de document approuvee',
            message=f'Votre demande de "{instance.template.name}" a ete approuvee.',
            action_url='/requests',
            related_object_type='document_request',
            related_object_id=instance.id,
        )
    elif instance.status == 'REJECTED':
        NotificationService.create_notification(
            recipient=instance.requested_by,
            notification_type='SYSTEM',
            title='Demande de document rejetee',
            message=f'Votre demande de "{instance.template.name}" a ete rejetee. Motif: {instance.rejection_reason}',
            action_url='/requests',
            related_object_type='document_request',
            related_object_id=instance.id,
        )


@receiver(post_save, sender=Payslip)
def notify_on_payslip(sender, instance, created, **kwargs):
    if not created and instance.status == 'CONFIRMED':
        NotificationService.create_notification(
            recipient=instance.employee.user,
            notification_type='PAYSLIP_READY',
            title=f'Bulletin de paie disponible - {instance.month:02d}/{instance.year}',
            message=f'Votre bulletin de paie pour {instance.month:02d}/{instance.year} est disponible.',
            action_url='/salary',
            related_object_type='payslip',
            related_object_id=instance.id,
        )


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
