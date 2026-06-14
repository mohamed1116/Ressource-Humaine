"""
Management command: check_promotion_eligibility
Runs daily (via cron/celery beat) to detect newly eligible employees
and send notifications to all ADMIN_HR users.

Cron setup (crontab):
    0 7 * * * cd /path/to/project && python manage.py check_promotion_eligibility

Windows Task Scheduler:
    python manage.py check_promotion_eligibility
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.promotions.models import EmployeePromotionProfile
from apps.notifications.services import NotificationService
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Checks promotion eligibility and notifies ADMIN_HR'

    def handle(self, *args, **options):
        self.stdout.write('[PROMOTIONS] Checking eligibility...')

        # Get all ADMIN_HR users to notify
        admins = list(User.objects.filter(role__in=['ADMIN_HR', 'SUPER_ADMIN'], is_active=True))
        if not admins:
            self.stdout.write('  No ADMIN_HR users found.')
            return

        profiles = EmployeePromotionProfile.objects.select_related(
            'employee', 'employee__user'
        ).filter(employee__is_active=True)

        newly_eligible_echelon = []
        newly_eligible_grade   = []
        soon_eligible          = []  # within 30 days

        today = timezone.now().date()

        for profile in profiles:
            echelon_ok, _ = profile.check_echelon_eligibility()
            grade_ok, _   = profile.check_grade_eligibility()
            next_date      = profile.next_echelon_eligibility_date

            if echelon_ok:
                newly_eligible_echelon.append(profile)
            elif next_date:
                days_left = (next_date - today).days
                if 0 < days_left <= 30:
                    soon_eligible.append((profile, days_left))

            if grade_ok:
                newly_eligible_grade.append(profile)

        notif_count = 0

        # Notify about echelon eligible
        if newly_eligible_echelon:
            names = ', '.join(p.employee.full_name for p in newly_eligible_echelon[:5])
            extra = f' et {len(newly_eligible_echelon) - 5} autres' if len(newly_eligible_echelon) > 5 else ''
            for admin in admins:
                NotificationService.create_notification(
                    recipient=admin,
                    notification_type='SYSTEM',
                    title=f'{len(newly_eligible_echelon)} employe(s) eligible(s) a la promotion en echelon',
                    message=(
                        f'{len(newly_eligible_echelon)} employe(s) sont desormais eligible(s) '
                        f'a une promotion en echelon: {names}{extra}. '
                        f'Cliquez pour generer le tableau officiel.'
                    ),
                    action_url='/promotions',
                )
                notif_count += 1

        # Notify about grade eligible
        if newly_eligible_grade:
            names = ', '.join(p.employee.full_name for p in newly_eligible_grade[:3])
            extra = f' et {len(newly_eligible_grade) - 3} autres' if len(newly_eligible_grade) > 3 else ''
            for admin in admins:
                NotificationService.create_notification(
                    recipient=admin,
                    notification_type='SYSTEM',
                    title=f'{len(newly_eligible_grade)} professeur(s) eligible(s) a la promotion en grade',
                    message=(
                        f'{len(newly_eligible_grade)} professeur(s) sont eligible(s) '
                        f'a une nomination de grade: {names}{extra}. '
                        f'Cliquez pour generer le tableau de nomination.'
                    ),
                    action_url='/promotions',
                )
                notif_count += 1

        # Notify about soon eligible (within 30 days)
        if soon_eligible:
            details = ', '.join(
                f'{p.employee.full_name} ({d}j)' for p, d in soon_eligible[:4]
            )
            extra = f' et {len(soon_eligible) - 4} autres' if len(soon_eligible) > 4 else ''
            for admin in admins:
                NotificationService.create_notification(
                    recipient=admin,
                    notification_type='SYSTEM',
                    title=f'{len(soon_eligible)} employe(s) bientot eligible(s) a la promotion',
                    message=(
                        f'Dans moins de 30 jours: {details}{extra} '
                        f'seront eligible(s) a une promotion en echelon.'
                    ),
                    action_url='/promotions',
                )
                notif_count += 1

        self.stdout.write(
            f'  Echelon eligible: {len(newly_eligible_echelon)} | '
            f'Grade eligible: {len(newly_eligible_grade)} | '
            f'Soon: {len(soon_eligible)} | '
            f'Notifications sent: {notif_count}'
        )
        self.stdout.write('[OK] Done.')
