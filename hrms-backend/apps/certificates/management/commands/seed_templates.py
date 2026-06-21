"""
Management command: python manage.py seed_templates

Seeds all 18 official administrative document templates for the university.
16 French attestations + 1 Arabic attestation + 1 Ordre de mission.

Each template uses formal administrative French language with {{variable}}
placeholders that get replaced at generation time. HR can edit any template
via the WYSIWYG editor -- these are starting points, not fixed formats.
"""
from django.core.management.base import BaseCommand
from apps.certificates.models import DocumentTemplate


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Shared institutional headers and footers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HEADER_FR = """
<div style="text-align: center; line-height: 1.4;">
    {{logo}}
    <p style="font-size: 10pt; margin: 0;">Royaume du Maroc</p>
    <p style="font-size: 10pt; margin: 0;">Universite Ibn Zohr</p>
    <p style="font-size: 12pt; font-weight: bold; margin: 4px 0;">
        Faculte Polydisciplinaire de Taroudant
    </p>
    <hr style="border: none; border-top: 2px solid #1a3a5c; margin: 10px auto; width: 50%;">
    <p style="font-size: 9pt; color: #555; margin: 0;">
        Service des Ressources Humaines
    </p>
</div>
"""

HEADER_SCOL = """
<div style="text-align: center; line-height: 1.4;">
    {{logo}}
    <p style="font-size: 10pt; margin: 0;">Royaume du Maroc</p>
    <p style="font-size: 10pt; margin: 0;">Universite Ibn Zohr</p>
    <p style="font-size: 12pt; font-weight: bold; margin: 4px 0;">
        Faculte Polydisciplinaire de Taroudant
    </p>
    <hr style="border: none; border-top: 2px solid #1a3a5c; margin: 10px auto; width: 50%;">
    <p style="font-size: 9pt; color: #555; margin: 0;">
        Service de la Scolarite
    </p>
</div>
"""

FOOTER_FR = """
<p>Faculte Polydisciplinaire de Taroudant &mdash; Hay El Mohammadi, BP 271, Taroudant</p>
<p>Tel: 05 28 55 16 00 &mdash; Fax: 05 28 55 16 01</p>
"""

HEADER_AR = (
    '<div style="text-align:center;line-height:1.6;direction:rtl;">'
    '{{logo}}'
    '<p style="font-size:11pt;margin:0;">&#x0627;&#x0644;&#x0645;&#x0645;&#x0644;&#x0643;&#x0629; '
    '&#x0627;&#x0644;&#x0645;&#x063A;&#x0631;&#x0628;&#x064A;&#x0629;</p>'
    '<p style="font-size:11pt;margin:0;">&#x062C;&#x0627;&#x0645;&#x0639;&#x0629; '
    '&#x0627;&#x0628;&#x0646; &#x0632;&#x0647;&#x0631;</p>'
    '<p style="font-size:13pt;font-weight:bold;margin:4px 0;">'
    '&#x0627;&#x0644;&#x0643;&#x0644;&#x064A;&#x0629; &#x0627;&#x0644;&#x0645;&#x062A;&#x0639;&#x062F;&#x062F;&#x0629; '
    '&#x0627;&#x0644;&#x062A;&#x062E;&#x0635;&#x0635;&#x0627;&#x062A; '
    '&#x0628;&#x062A;&#x0627;&#x0631;&#x0648;&#x062F;&#x0627;&#x0646;&#x062A;</p>'
    '<hr style="border:none;border-top:2px solid #1a3a5c;margin:10px auto;width:50%;"></div>'
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HTML helpers for consistent formatting
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def T(text):
    """Title block"""
    return (
        '<div style="text-align:center;margin:40px 0 30px;">'
        f'<h2 style="font-size:16pt;text-decoration:underline;letter-spacing:2px;">{text}</h2>'
        '</div>'
    )

def P(text):
    """Body paragraph"""
    return f'<p style="text-align:justify;font-size:12pt;line-height:2;">{text}</p>'

REF = '<p style="font-size:10pt;color:#666;text-align:center;">N&deg; _______ / {{year}}</p>'

CLOSING = P(
    "La presente attestation est delivree a l'interesse(e) pour servir "
    "et valoir ce que de droit."
)

SIG = (
    '<div style="margin-top:60px;text-align:right;">'
    '<p>Fait a Taroudant, le {{date_today}}</p>'
    '<p style="margin-top:40px;"><strong>Le Doyen</strong></p>'
    '<p style="margin-top:50px;color:#888;">[Signature et cachet]</p>'
    '</div>'
)

def build(*parts):
    return '\n\n'.join(parts)

def auto(key, label):
    return {'key': key, 'label': label, 'type': 'auto'}

def manual(key, label):
    return {'key': key, 'label': label, 'type': 'manual'}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# All 18 templates
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEMPLATES = [
    # 1
    {
        'name': 'Attestation de travail',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste qu'un employe exerce au sein de l'etablissement.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('numero_somme','N de somme'), auto('position','Fonction'), auto('department','Departement'), auto('hire_date','Date de recrutement'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE TRAVAIL'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{employee_name}}</strong>, titulaire de la CIN n&deg; <strong>{{cin}}</strong>, "
              "N&deg; de somme <strong>{{numero_somme}}</strong>, occupe le poste de <strong>{{position}}</strong> "
              "au departement <strong>{{department}}</strong> depuis le <strong>{{hire_date}}</strong>."),
            CLOSING, SIG),
    },
    # 2
    {
        'name': 'Attestation de salaire',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste du salaire mensuel d'un employe.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('numero_somme','N de somme'), auto('position','Fonction'), manual('salary_net','Salaire net (DH)'), manual('salary_brut','Salaire brut (DH)'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE SALAIRE'), REF,
            P("Le soussigne, Doyen de la Faculte Polydisciplinaire de Taroudant, atteste que :"),
            P("<strong>{{employee_name}}</strong>, CIN n&deg; <strong>{{cin}}</strong>, N&deg; de somme <strong>{{numero_somme}}</strong>, "
              "exercant la fonction de <strong>{{position}}</strong>, percoit une remuneration mensuelle nette de "
              "<strong>{{salary_net}} DH</strong> (brut : <strong>{{salary_brut}} DH</strong>)."),
            CLOSING, SIG),
    },
    # 3
    {
        'name': 'Attestation de conge',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste qu'un employe beneficie d'un conge.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('position','Fonction'), manual('leave_type','Type de conge'), manual('leave_start','Debut'), manual('leave_end','Fin'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE CONGE'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{employee_name}}</strong>, CIN n&deg; <strong>{{cin}}</strong>, fonction <strong>{{position}}</strong>, "
              "beneficie d'un conge de type <strong>{{leave_type}}</strong> du <strong>{{leave_start}}</strong> au <strong>{{leave_end}}</strong>."),
            CLOSING, SIG),
    },
    # 4
    {
        'name': 'Attestation de presence',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste de la presence effective d'un employe.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('position','Fonction'), auto('department','Departement'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE PRESENCE'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{employee_name}}</strong>, CIN n&deg; <strong>{{cin}}</strong>, occupant le poste de <strong>{{position}}</strong> "
              "au departement <strong>{{department}}</strong>, est effectivement present(e) a son poste de travail au sein de notre etablissement."),
            CLOSING, SIG),
    },
    # 5
    {
        'name': 'Attestation de fonction',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste de la fonction et du grade d'un employe.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('numero_somme','N de somme'), auto('position','Fonction'), auto('employee_type','Grade'), auto('department','Departement'), auto('hire_date','Date d\'effet'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE FONCTION'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{employee_name}}</strong>, CIN n&deg; <strong>{{cin}}</strong>, N&deg; de somme <strong>{{numero_somme}}</strong>, "
              "grade <strong>{{employee_type}}</strong>, exerce la fonction de <strong>{{position}}</strong> "
              "au departement <strong>{{department}}</strong> depuis le <strong>{{hire_date}}</strong>."),
            CLOSING, SIG),
    },
    # 6
    {
        'name': 'Attestation de cessation de fonction',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste qu'un employe a cesse ses fonctions.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('position','Derniere fonction'), auto('department','Departement'), auto('hire_date','Date de prise de fonction'), manual('cessation_date','Date de cessation'), manual('cessation_motif','Motif'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE CESSATION DE FONCTION'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{employee_name}}</strong>, CIN n&deg; <strong>{{cin}}</strong>, ayant occupe le poste de <strong>{{position}}</strong> "
              "au departement <strong>{{department}}</strong> depuis le <strong>{{hire_date}}</strong>, "
              "a cesse ses fonctions a compter du <strong>{{cessation_date}}</strong> pour le motif suivant : <strong>{{cessation_motif}}</strong>."),
            CLOSING, SIG),
    },
    # 7
    {
        'name': 'Attestation de scolarite',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_SCOL,
        'desc': "Atteste qu'un etudiant est regulierement inscrit.",
        'vars': [manual('student_name','Nom et prenom'), manual('student_cne','CNE'), manual('student_cin','CIN'), manual('filiere','Filiere'), manual('niveau','Niveau'), manual('annee_universitaire','Annee universitaire'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE SCOLARITE'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("L'etudiant(e) <strong>{{student_name}}</strong>, CNE : <strong>{{student_cne}}</strong>, CIN : <strong>{{student_cin}}</strong>, "
              "est regulierement inscrit(e) en <strong>{{filiere}}</strong>, niveau <strong>{{niveau}}</strong>, "
              "au titre de l'annee universitaire <strong>{{annee_universitaire}}</strong>."),
            CLOSING, SIG),
    },
    # 8
    {
        'name': "Attestation d'inscription",
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_SCOL,
        'desc': "Confirme l'inscription administrative d'un etudiant.",
        'vars': [manual('student_name','Nom et prenom'), manual('student_cne','CNE'), manual('student_cin','CIN'), manual('filiere','Filiere'), manual('annee_universitaire','Annee universitaire'), manual('date_inscription','Date d\'inscription'), auto('date_today','Date du jour')],
        'content': build(
            T("ATTESTATION D'INSCRIPTION"), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("L'etudiant(e) <strong>{{student_name}}</strong>, CNE : <strong>{{student_cne}}</strong>, CIN : <strong>{{student_cin}}</strong>, "
              "a ete regulierement inscrit(e) en <strong>{{filiere}}</strong> au titre de l'annee universitaire "
              "<strong>{{annee_universitaire}}</strong>, a compter du <strong>{{date_inscription}}</strong>."),
            CLOSING, SIG),
    },
    # 9
    {
        'name': 'Attestation de reussite',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_SCOL,
        'desc': "Atteste de la reussite d'un etudiant.",
        'vars': [manual('student_name','Nom et prenom'), manual('student_cne','CNE'), manual('student_cin','CIN'), manual('filiere','Filiere'), manual('diplome','Diplome'), manual('mention','Mention'), manual('annee_universitaire','Annee universitaire'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE REUSSITE'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("L'etudiant(e) <strong>{{student_name}}</strong>, CNE : <strong>{{student_cne}}</strong>, CIN : <strong>{{student_cin}}</strong>, "
              "a obtenu le diplome de <strong>{{diplome}}</strong> en <strong>{{filiere}}</strong>, mention <strong>{{mention}}</strong>, "
              "au titre de l'annee universitaire <strong>{{annee_universitaire}}</strong>."),
            CLOSING, SIG),
    },
    # 10
    {
        'name': 'Attestation de stage',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste qu'une personne a effectue un stage.",
        'vars': [manual('stagiaire_name','Nom du stagiaire'), manual('stagiaire_cin','CIN'), manual('stage_sujet','Sujet du stage'), manual('stage_service','Service d\'accueil'), manual('stage_start','Debut'), manual('stage_end','Fin'), manual('encadrant_name','Encadrant'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE STAGE'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{stagiaire_name}}</strong>, CIN n&deg; <strong>{{stagiaire_cin}}</strong>, a effectue un stage au sein du service "
              "<strong>{{stage_service}}</strong> du <strong>{{stage_start}}</strong> au <strong>{{stage_end}}</strong>, "
              "portant sur le theme : <em>{{stage_sujet}}</em>."),
            P("Le stage a ete encadre par <strong>{{encadrant_name}}</strong>."),
            CLOSING, SIG),
    },
    # 11
    {
        'name': 'Attestation de niveau',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_SCOL,
        'desc': "Atteste du niveau academique atteint par un etudiant.",
        'vars': [manual('student_name','Nom et prenom'), manual('student_cne','CNE'), manual('student_cin','CIN'), manual('filiere','Filiere'), manual('niveau','Niveau atteint'), manual('semestres_valides','Semestres valides'), manual('annee_universitaire','Annee universitaire'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE NIVEAU'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("L'etudiant(e) <strong>{{student_name}}</strong>, CNE : <strong>{{student_cne}}</strong>, CIN : <strong>{{student_cin}}</strong>, "
              "inscrit(e) en <strong>{{filiere}}</strong>, a atteint le niveau <strong>{{niveau}}</strong> "
              "apres validation de <strong>{{semestres_valides}}</strong>, annee <strong>{{annee_universitaire}}</strong>."),
            CLOSING, SIG),
    },
    # 12
    {
        'name': 'Attestation de non-redoublement',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_SCOL,
        'desc': "Atteste qu'un etudiant n'a pas redouble.",
        'vars': [manual('student_name','Nom et prenom'), manual('student_cne','CNE'), manual('student_cin','CIN'), manual('filiere','Filiere'), manual('annee_debut','Premiere annee'), manual('annee_fin','Derniere annee'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE NON-REDOUBLEMENT'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("L'etudiant(e) <strong>{{student_name}}</strong>, CNE : <strong>{{student_cne}}</strong>, CIN : <strong>{{student_cin}}</strong>, "
              "inscrit(e) en <strong>{{filiere}}</strong>, n'a jamais redouble au cours de son parcours universitaire "
              "de <strong>{{annee_debut}}</strong> a <strong>{{annee_fin}}</strong>."),
            CLOSING, SIG),
    },
    # 13
    {
        'name': 'Attestation de participation',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Atteste de la participation a un evenement.",
        'vars': [manual('participant_name','Nom et prenom'), manual('participant_cin','CIN'), manual('event_title','Intitule'), manual('event_type','Type (colloque, seminaire...)'), manual('event_date','Date'), manual('event_lieu','Lieu'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE PARTICIPATION'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{participant_name}}</strong>, CIN n&deg; <strong>{{participant_cin}}</strong>, a participe au "
              "<strong>{{event_type}}</strong> intitule <em>&laquo; {{event_title}} &raquo;</em>, "
              "organise le <strong>{{event_date}}</strong> a <strong>{{event_lieu}}</strong>."),
            CLOSING, SIG),
    },
    # 14
    {
        'name': 'Attestation de bourse',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_SCOL,
        'desc': "Atteste qu'un etudiant est boursier.",
        'vars': [manual('student_name','Nom et prenom'), manual('student_cne','CNE'), manual('student_cin','CIN'), manual('filiere','Filiere'), manual('annee_universitaire','Annee universitaire'), manual('bourse_type','Type de bourse'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION DE BOURSE'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("L'etudiant(e) <strong>{{student_name}}</strong>, CNE : <strong>{{student_cne}}</strong>, CIN : <strong>{{student_cin}}</strong>, "
              "inscrit(e) en <strong>{{filiere}}</strong>, beneficie d'une bourse de type <strong>{{bourse_type}}</strong> "
              "au titre de l'annee universitaire <strong>{{annee_universitaire}}</strong>."),
            CLOSING, SIG),
    },
    # 15
    {
        'name': 'Attestation pour visa',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Attestation destinee aux services consulaires.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), manual('passport_number','N Passeport'), auto('position','Fonction'), auto('department','Departement'), auto('hire_date','Date de recrutement'), manual('salary_net','Salaire net (DH)'), manual('destination_pays','Pays de destination'), manual('travel_motif','Motif du deplacement'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION ADMINISTRATIVE'),
            '<p style="text-align:center;font-size:10pt;color:#666;margin-top:-20px;">(Destinee aux services consulaires)</p>', REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{employee_name}}</strong>, CIN n&deg; <strong>{{cin}}</strong>, Passeport n&deg; <strong>{{passport_number}}</strong>, "
              "exerce la fonction de <strong>{{position}}</strong> au departement <strong>{{department}}</strong> depuis le <strong>{{hire_date}}</strong>."),
            P("L'interesse(e) percoit un salaire mensuel net de <strong>{{salary_net}} DH</strong>."),
            P("Cette attestation est delivree pour appuyer sa demande de visa a destination de <strong>{{destination_pays}}</strong> "
              "dans le cadre de : <strong>{{travel_motif}}</strong>."),
            CLOSING, SIG),
    },
    # 16
    {
        'name': 'Attestation administrative generale',
        'cat': 'ATTESTATION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Attestation a usage general, contenu libre.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('position','Fonction'), manual('objet','Objet'), manual('contenu_libre','Contenu personnalise'), auto('date_today','Date du jour')],
        'content': build(
            T('ATTESTATION ADMINISTRATIVE'), REF,
            '<p style="font-size:11pt;margin-bottom:20px;"><strong>Objet :</strong> {{objet}}</p>',
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant atteste que :"),
            P("<strong>{{employee_name}}</strong>, CIN n&deg; <strong>{{cin}}</strong>, exercant la fonction de <strong>{{position}}</strong>."),
            P("{{contenu_libre}}"),
            CLOSING, SIG),
    },
    # 17 - Ordre de mission
    {
        'name': 'Ordre de mission',
        'cat': 'ORDRE_MISSION', 'lang': 'FR', 'hdr': HEADER_FR,
        'desc': "Ordre de mission pour deplacement academique.",
        'vars': [auto('employee_name','Nom et prenom'), auto('cin','N CIN'), auto('numero_somme','N de somme'), auto('position','Fonction'), auto('department','Departement'), manual('mission_destination','Destination'), manual('mission_object','Objet de la mission'), manual('mission_start','Date de depart'), manual('mission_end','Date de retour'), manual('mission_transport','Moyen de transport'), auto('date_today','Date du jour')],
        'content': build(
            T('ORDRE DE MISSION'), REF,
            P("Le Doyen de la Faculte Polydisciplinaire de Taroudant ordonne a :"),
            '<table style="width:100%;border-collapse:collapse;font-size:11pt;margin:15px 0;">'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;width:35%;background:#f5f5f5;"><strong>Nom et Prenom</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{employee_name}}</td></tr>'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;background:#f5f5f5;"><strong>CIN</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{cin}}</td></tr>'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;background:#f5f5f5;"><strong>N&deg; de somme</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{numero_somme}}</td></tr>'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;background:#f5f5f5;"><strong>Fonction</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{position}}</td></tr>'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;background:#f5f5f5;"><strong>Departement</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{department}}</td></tr>'
            '</table>',
            P("De se rendre a <strong>{{mission_destination}}</strong> pour : <strong>{{mission_object}}</strong>."),
            '<table style="width:100%;border-collapse:collapse;font-size:11pt;margin:15px 0;">'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;width:35%;background:#f5f5f5;"><strong>Date de depart</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{mission_start}}</td></tr>'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;background:#f5f5f5;"><strong>Date de retour</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{mission_end}}</td></tr>'
            '<tr><td style="padding:8px 12px;border:1px solid #ccc;background:#f5f5f5;"><strong>Moyen de transport</strong></td><td style="padding:8px 12px;border:1px solid #ccc;">{{mission_transport}}</td></tr>'
            '</table>',
            SIG),
    },
    # 18 - Arabic: Attestation de travail
    {
        'name': '\u0634\u0647\u0627\u062f\u0629 \u0627\u0644\u0639\u0645\u0644',
        'cat': 'ATTESTATION', 'lang': 'AR', 'hdr': HEADER_AR,
        'desc': 'Attestation de travail en arabe.',
        'vars': [
            {'key': 'employee_name', 'label': '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644', 'type': 'auto'},
            {'key': 'cin', 'label': '\u0631\u0642\u0645 \u0628.\u0648', 'type': 'auto'},
            {'key': 'position', 'label': '\u0627\u0644\u0645\u0646\u0635\u0628', 'type': 'auto'},
            {'key': 'department', 'label': '\u0627\u0644\u0642\u0633\u0645', 'type': 'auto'},
            {'key': 'hire_date', 'label': '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0648\u0638\u064a\u0641', 'type': 'auto'},
            {'key': 'date_today', 'label': '\u0627\u0644\u062a\u0627\u0631\u064a\u062e', 'type': 'auto'},
        ],
        'content': (
            '<div style="text-align:center;margin:40px 0 30px;">'
            '<h2 style="font-size:18pt;text-decoration:underline;">\u0634\u0647\u0627\u062f\u0629 \u0627\u0644\u0639\u0645\u0644</h2></div>'
            '<p style="text-align:justify;font-size:14pt;line-height:2.2;">'
            '\u064a\u0634\u0647\u062f \u0639\u0645\u064a\u062f \u0627\u0644\u0643\u0644\u064a\u0629 \u0627\u0644\u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u062a\u062e\u0635\u0635\u0627\u062a \u0628\u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a \u0623\u0646 \u0627\u0644\u0633\u064a\u062f(\u0629) '
            '<strong>{{employee_name}}</strong>\u060c \u0627\u0644\u062d\u0627\u0645\u0644(\u0629) \u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0648\u0637\u0646\u064a\u0629 \u0631\u0642\u0645 '
            '<strong>{{cin}}</strong>\u060c \u064a\u0634\u063a\u0644(\u062a\u0634\u063a\u0644) \u0645\u0646\u0635\u0628 <strong>{{position}}</strong> '
            '\u0628\u0642\u0633\u0645 <strong>{{department}}</strong> \u0628\u0645\u0624\u0633\u0633\u062a\u0646\u0627 \u0645\u0646\u0630 <strong>{{hire_date}}</strong>.</p>'
            '<p style="text-align:justify;font-size:14pt;line-height:2.2;">'
            '\u0633\u0644\u0645\u062a \u0647\u0630\u0647 \u0627\u0644\u0634\u0647\u0627\u062f\u0629 \u0644\u0644\u0645\u0639\u0646\u064a(\u0629) \u0628\u0627\u0644\u0623\u0645\u0631 \u0644\u062a\u0642\u062f\u064a\u0645\u0647\u0627 \u0639\u0646\u062f \u0627\u0644\u062d\u0627\u062c\u0629.</p>'
            '<div style="margin-top:60px;text-align:left;">'
            '<p>\u062d\u0631\u0631 \u0628\u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a \u0641\u064a {{date_today}}</p>'
            '<p style="margin-top:40px;"><strong>\u0627\u0644\u0639\u0645\u064a\u062f</strong></p>'
            '<p style="margin-top:50px;color:#888;">[\u0627\u0644\u062a\u0648\u0642\u064a\u0639 \u0648\u0627\u0644\u062e\u062a\u0645]</p></div>'
        ),
    },
]


class Command(BaseCommand):
    help = 'Seed all 18 official document templates for the university.'

    def handle(self, *args, **options):
        created = 0
        for tpl in TEMPLATES:
            obj, was_created = DocumentTemplate.objects.update_or_create(
                name=tpl['name'],
                defaults={
                    'category': tpl['cat'],
                    'language': tpl['lang'],
                    'description': tpl['desc'],
                    'content': tpl['content'],
                    'variables': tpl['vars'],
                    'header_html': tpl.get('hdr', HEADER_FR),
                    'footer_html': FOOTER_FR,
                },
            )
            status = 'NEW' if was_created else 'UPD'
            created += 1 if was_created else 0
            self.stdout.write(f'  [{status}] {obj.name}')

        total = DocumentTemplate.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {created} created, {len(TEMPLATES)-created} updated. Total: {total}'
        ))
