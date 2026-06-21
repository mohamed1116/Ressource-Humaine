from django.core.management.base import BaseCommand
from apps.certificates.models import DocumentTemplate, DocumentRequest

KEEP = [
    'Attestation de Travail',
    'Attestation de Surveillance',
    'Ordre de Mission',
    "Demande d'Autorisation de Cumul",
]

KEEP_CONTAINS = ['FPT', 'fpt', 'Hurra', 'Tarkhis', 'Cumul', 'Autorisation de Cumul']


class Command(BaseCommand):
    help = 'Delete all old templates and keep only the 6 FPT ones'

    def handle(self, *args, **options):
        deleted = 0
        kept = 0
        for t in DocumentTemplate.objects.all():
            should_keep = (
                t.name in KEEP
                or any(k in t.name for k in KEEP_CONTAINS)
                or '\u0637\u0644\u0628' in t.name
                or '\u0634\u0647\u0627\u062f\u0629' in t.name
            )
            if should_keep:
                kept += 1
                self.stdout.write('  [KEEP] ' + t.name.encode('ascii', 'replace').decode())
            else:
                # Delete linked requests first
                req_count = DocumentRequest.objects.filter(template=t).count()
                if req_count:
                    DocumentRequest.objects.filter(template=t).delete()
                    self.stdout.write(f'    -> deleted {req_count} linked requests')
                self.stdout.write('  [DEL]  ' + t.name.encode('ascii', 'replace').decode())
                t.delete()
                deleted += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Deleted: {deleted} | Kept: {kept}'
        ))
