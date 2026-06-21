from django.core.management.base import BaseCommand
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Seed demo notifications'

    def handle(self, *args, **options):
        try:
            admin  = User.objects.get(email='admin@fpt.ac.ma')
            prof1  = User.objects.get(email='y.essaady@uiz.ma')
            prof2  = User.objects.get(email='s.roubi@fpt.ac.ma')
            prof3  = User.objects.get(email='k.benamara@fpt.ac.ma')
            prof4  = User.objects.get(email='z.elmorjani@fpt.ac.ma')
        except User.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(str(e)))
            return

        data = [
            (prof1, 'LEAVE_APPROVED',  'Demande de conge approuvee',          'Votre demande de Conge annuel a ete approuvee.',                '/leaves'),
            (prof1, 'PAYSLIP_READY',   'Bulletin de paie - 04/2026',          'Votre bulletin de paie pour 04/2026 est disponible.',           '/salary'),
            (prof2, 'LEAVE_REJECTED',  'Demande de conge rejetee',            'Votre demande de Conge maladie a ete rejetee.',                 '/leaves'),
            (prof2, 'PAYSLIP_READY',   'Bulletin de paie - 04/2026',          'Votre bulletin de paie pour 04/2026 est disponible.',           '/salary'),
            (prof3, 'PAYSLIP_READY',   'Bulletin de paie - 04/2026',          'Votre bulletin de paie pour 04/2026 est disponible.',           '/salary'),
            (prof4, 'LEAVE_APPROVED',  'Demande de conge approuvee',          'Votre demande de Conge exceptionnel a ete approuvee.',          '/leaves'),
            (admin, 'LEAVE_REQUEST',   'Nouvelle demande - Youssef ES-SAADY', 'Youssef ES-SAADY a demande Conge annuel du 10/05 au 20/05.',    '/leaves'),
            (admin, 'LEAVE_REQUEST',   'Nouvelle demande - Sara ROUBI',       'Sara ROUBI a demande Conge maladie du 05/05 au 08/05.',         '/leaves'),
            (admin, 'SYSTEM',          'Demande de document - Sara ROUBI',    'Sara ROUBI a demande : Attestation de Travail.',                '/requests'),
            (admin, 'SYSTEM',          'Demande de document - K. BENAMARA',   'Khalid BENAMARA a demande : Ordre de Mission.',                 '/requests'),
            (admin, 'ATTENDANCE_ALERT','Alerte absence - Houda OUALI',        'Houda OUALI est absente sans justification le 02/05/2026.',     '/attendance'),
        ]

        for user, ntype, title, msg, url in data:
            NotificationService.create_notification(
                recipient=user,
                notification_type=ntype,
                title=title,
                message=msg,
                action_url=url,
            )

        self.stdout.write(self.style.SUCCESS(
            f'Done. Total notifications: {Notification.objects.count()}'
        ))
