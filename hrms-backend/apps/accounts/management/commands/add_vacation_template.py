from django.core.management.base import BaseCommand
from apps.certificates.models import DocumentTemplate

HEADER = '<div style="text-align:center;margin-bottom:10px;"><img src="/assets/fpt-logo.png" alt="FPT" style="max-height:80px;width:auto;"/></div>'
FOOTER = 'Hay El Mohammadi (Lastah), B.P : 271, C.P : 83000, Taroudant | Tel. : +212(0)5 28 55 10 10, Fax : +212(0)5 28 55 10 20, Site Web: <strong>www.fpt.ac.ma</strong>'

CSS = """
body { font-family: "Times New Roman", serif; font-size: 12pt;
       line-height: 1.9; padding: 10px 30px; }
.title { text-align: center; font-size: 16pt; font-weight: bold;
         text-decoration: underline; font-style: italic; margin: 30px 0; }
p { margin: 10px 0; text-align: justify; }
.field { font-weight: bold; text-decoration: underline; }
.sign { margin-top: 60px; text-align: right; }
"""

CONTENT = """
<p class="title">Attestation</p>

<p>Je soussign&eacute;, Monsieur le Doyen de la Facult&eacute; Polydisciplinaire
de Taroudant atteste que le Professeur :</p>

<p style="margin-left:20px;">
  <span class="field">Nom et Pr&eacute;nom</span> : {{employee_name}}
</p>
<p style="margin-left:20px;">
  <span class="field">CIN</span> &nbsp;: {{cin}}
</p>

<p>A assur&eacute; <strong>{{heures_cours}}</strong> heures de cours et/ou travaux
dirig&eacute;s (TD) de l&apos;&eacute;l&eacute;ment &laquo;&nbsp;<strong>{{element}}</strong>&nbsp;&raquo;
du module &laquo;&nbsp;<strong>{{module}}</strong>&nbsp;&raquo; sous la coordination
du d&eacute;partement, pour la fili&egrave;re :
<strong>{{filiere}}</strong>, du semestre <strong>{{semestre}}</strong>
de l&apos;ann&eacute;e universitaire <strong>{{annee_univ}}</strong>.</p>

<p>La pr&eacute;sente attestation est d&eacute;livr&eacute;e &agrave; l&apos;int&eacute;ress&eacute;
sur sa demande pour servir et valoir ce que de droit.</p>

<p class="sign">Fait &agrave; Taroudant le &nbsp;{{date_today}}</p>
"""

VARIABLES = [
    {'key': 'employee_name', 'label': 'Nom et Prenom',       'type': 'auto'},
    {'key': 'cin',           'label': 'CIN',                 'type': 'auto'},
    {'key': 'heures_cours',  'label': 'Heures de cours',     'type': 'manual'},
    {'key': 'element',       'label': 'Element',             'type': 'manual'},
    {'key': 'module',        'label': 'Module',              'type': 'manual'},
    {'key': 'filiere',       'label': 'Filiere',             'type': 'manual'},
    {'key': 'semestre',      'label': 'Semestre',            'type': 'manual'},
    {'key': 'annee_univ',    'label': 'Annee universitaire', 'type': 'manual'},
    {'key': 'date_today',    'label': 'Date du jour',        'type': 'auto'},
]


class Command(BaseCommand):
    help = 'Add Attestation de vacation template'

    def handle(self, *args, **options):
        obj, created = DocumentTemplate.objects.get_or_create(
            name='Attestation de vacation',
            defaults={
                'category':        'ATTESTATION',
                'language':        'FR',
                'target_audience': 'EMPLOYEE',
                'content':         CONTENT,
                'variables':       VARIABLES,
                'custom_css':      CSS,
                'header_html':     HEADER,
                'footer_html':     FOOTER,
                'is_active':       True,
            }
        )
        if not created:
            obj.content    = CONTENT
            obj.variables  = VARIABLES
            obj.custom_css = CSS
            obj.header_html = HEADER
            obj.footer_html = FOOTER
            obj.save()

        self.stdout.write(self.style.SUCCESS(
            '[{}] Attestation de vacation'.format('NEW' if created else 'UPDATED')
        ))
