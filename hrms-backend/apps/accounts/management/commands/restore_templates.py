from django.core.management.base import BaseCommand
from apps.certificates.models import DocumentTemplate

HEADER = '<div style="text-align:center;margin-bottom:10px;"><img src="/assets/fpt-logo.png" alt="FPT" style="max-height:80px;width:auto;"/></div>'
FOOTER = 'Hay El Mohammadi (Lastah), B.P : 271, C.P : 83000, Taroudant | Tel. : +212(0)5 28 55 10 10, Fax : +212(0)5 28 55 10 20, Site Web: <strong>www.fpt.ac.ma</strong>'

CSS = 'body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.9;padding:10px 30px;} .title{text-align:center;font-size:15pt;font-weight:bold;text-decoration:underline;font-style:italic;margin:25px 0;} p{margin:8px 0;text-align:justify;} .sign{margin-top:60px;text-align:right;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #000;padding:5px 8px;}'

TEMPLATES = [
    # ── Already customized (skip if exists with good content) ──
    # ── Generic ones to restore ──
    {
        'name': 'Attestation administrative generale',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation Administrative</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p><strong>Poste :</strong> {{position}}</p><p><strong>Departement :</strong> {{department}}</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'position','label':'Poste','type':'auto'},{'key':'department','label':'Departement','type':'auto'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': "Attestation d'inscription",
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation d\'Inscription</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>Est inscrit(e) a la Faculte Polydisciplinaire de Taroudant pour l\'annee universitaire <strong>{{annee_univ}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'annee_univ','label':'Annee universitaire','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de bourse',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Bourse</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>Beneficie d\'une bourse d\'etudes pour l\'annee universitaire <strong>{{annee_univ}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'annee_univ','label':'Annee universitaire','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de cessation de fonction',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Cessation de Fonction</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p><strong>Grade :</strong> {{position}}</p><p>A cesse ses fonctions a la Faculte Polydisciplinaire de Taroudant a compter du <strong>{{date_cessation}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'position','label':'Grade','type':'auto'},{'key':'date_cessation','label':'Date de cessation','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de conge',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Conge</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p><strong>Grade :</strong> {{position}}</p><p>Beneficie d\'un conge du <strong>{{date_debut}}</strong> au <strong>{{date_fin}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'position','label':'Grade','type':'auto'},{'key':'date_debut','label':'Date debut','type':'manual'},{'key':'date_fin','label':'Date fin','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de fonction',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Fonction</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p><strong>Grade :</strong> {{position}}</p><p><strong>Departement :</strong> {{department}}</p><p>Exerce ses fonctions a la Faculte Polydisciplinaire de Taroudant depuis le <strong>{{hire_date}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'position','label':'Grade','type':'auto'},{'key':'department','label':'Departement','type':'auto'},{'key':'hire_date','label':'Date recrutement','type':'auto'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de niveau',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Niveau</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>A atteint le niveau <strong>{{niveau}}</strong> dans le domaine de <strong>{{domaine}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'niveau','label':'Niveau','type':'manual'},{'key':'domaine','label':'Domaine','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de non-redoublement',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Non-Redoublement</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>N\'a pas redouble durant l\'annee universitaire <strong>{{annee_univ}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'annee_univ','label':'Annee universitaire','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de participation',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Participation</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>A participe a <strong>{{evenement}}</strong> le <strong>{{date_evenement}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'evenement','label':'Evenement','type':'manual'},{'key':'date_evenement','label':'Date evenement','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de presence',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Presence</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>Est present(e) a la Faculte Polydisciplinaire de Taroudant.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de reussite',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Reussite</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>A reussi avec mention <strong>{{mention}}</strong> durant l\'annee universitaire <strong>{{annee_univ}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'mention','label':'Mention','type':'manual'},{'key':'annee_univ','label':'Annee universitaire','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de salaire',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Salaire</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p><strong>Grade :</strong> {{position}}</p><p><strong>N de somme :</strong> {{numero_somme}}</p><p>Percoit un salaire mensuel net de <strong>{{salaire}}</strong> DH.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'position','label':'Grade','type':'auto'},{'key':'numero_somme','label':'N de somme','type':'auto'},{'key':'salaire','label':'Salaire net','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de scolarite',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Scolarite</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>Est regulierement inscrit(e) a la Faculte Polydisciplinaire de Taroudant pour l\'annee universitaire <strong>{{annee_univ}}</strong> en <strong>{{filiere}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'annee_univ','label':'Annee universitaire','type':'manual'},{'key':'filiere','label':'Filiere','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation de stage',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation de Stage</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p>A effectue un stage du <strong>{{date_debut}}</strong> au <strong>{{date_fin}}</strong> au sein de <strong>{{organisme}}</strong>.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'date_debut','label':'Date debut','type':'manual'},{'key':'date_fin','label':'Date fin','type':'manual'},{'key':'organisme','label':'Organisme','type':'manual'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
    {
        'name': 'Attestation pour visa',
        'category': 'ATTESTATION', 'language': 'FR',
        'content': '<p class="title">Attestation pour Visa</p><p>Le Doyen de La Faculte Polydisciplinaire de Taroudant atteste que :</p><p><strong>Nom et Prenom :</strong> {{employee_name}}</p><p><strong>CIN :</strong> {{cin}}</p><p><strong>Grade :</strong> {{position}}</p><p><strong>N de somme :</strong> {{numero_somme}}</p><p>Est en fonction a la Faculte Polydisciplinaire de Taroudant depuis le <strong>{{hire_date}}</strong>.</p><p>Cette attestation est delivree pour servir de piece justificative dans le cadre d\'une demande de visa.</p><p>La presente attestation est delivree a l\'interesse sur sa demande pour servir et valoir ce que de droit.</p><p class="sign">Fait a Taroudant le {{date_today}}</p>',
        'variables': [{'key':'employee_name','label':'Nom et Prenom','type':'auto'},{'key':'cin','label':'CIN','type':'auto'},{'key':'position','label':'Grade','type':'auto'},{'key':'numero_somme','label':'N de somme','type':'auto'},{'key':'hire_date','label':'Date recrutement','type':'auto'},{'key':'date_today','label':'Date du jour','type':'auto'}],
    },
]


class Command(BaseCommand):
    help = 'Restore all deleted templates with FPT logo'

    def handle(self, *args, **options):
        created_count = 0
        for t in TEMPLATES:
            obj, created = DocumentTemplate.objects.get_or_create(
                name=t['name'],
                defaults={
                    'category':        t['category'],
                    'language':        t['language'],
                    'target_audience': 'ALL',
                    'content':         t['content'],
                    'variables':       t['variables'],
                    'custom_css':      CSS,
                    'header_html':     HEADER,
                    'footer_html':     FOOTER,
                    'is_active':       True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write('  [NEW] ' + t['name'])
            else:
                # Update header/footer for existing ones
                obj.header_html = HEADER
                obj.footer_html = FOOTER
                obj.save(update_fields=['header_html', 'footer_html'])
                self.stdout.write('  [UPD] ' + t['name'])

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Created: {created_count} | Total: {DocumentTemplate.objects.count()}'
        ))
