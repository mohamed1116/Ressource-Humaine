from django.core.mail import send_mail
from django.conf import settings
from .models import Notification


class NotificationService:

    @staticmethod
    def create_notification(recipient, notification_type, title, message,
                            action_url='', related_object_type='', related_object_id=None):
        """Create an in-app notification."""
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
            related_object_type=related_object_type,
            related_object_id=related_object_id,
        )

        # Send email if user preferences allow
        prefs = getattr(recipient, 'notification_preferences', None)
        if prefs and NotificationService._should_send_email(prefs, notification_type):
            try:
                send_mail(
                    subject=title,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return notification

    @staticmethod
    def _should_send_email(prefs, notification_type):
        mapping = {
            'LEAVE_REQUEST': prefs.email_leave_updates,
            'LEAVE_APPROVED': prefs.email_leave_updates,
            'LEAVE_REJECTED': prefs.email_leave_updates,
            'ATTENDANCE_ALERT': prefs.email_attendance_alerts,
            'PAYSLIP_READY': prefs.email_payslip_ready,
            'EVALUATION_DUE': prefs.email_evaluation_updates,
            'EVALUATION_COMPLETE': prefs.email_evaluation_updates,
        }
        return mapping.get(notification_type, True)

    @staticmethod
    def get_unread_count(user):
        return Notification.objects.filter(recipient=user, is_read=False).count()
