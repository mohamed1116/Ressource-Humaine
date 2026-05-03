"""
Run: python update_templates.py
Updates the 5 FPT document templates to match the exact layout from the reference images.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.certificates.models import DocumentTemplate

CSS_BASE = """
body {
  font-family: "Times New Roman", serif;
  font-size: 12pt;
  line-height: 1.9;
  color: #000;
  padding: 10px 30px;
}
.title {
  text-align: center;
  font-size: 15pt;
  font-weight: bold;
  text-decoration: underline;
  font-style: italic;
  letter-spacing: 4px;
  margin: 25px 0;
}
.title-box {
  text-align: center;
  font-size: 14pt;
  font-weight: bold;
  border: 2px solid #000;
  display: inline-block;
  padding: 6px 24px;
  margin: 20px auto;
}
.title-center { text-align: center; margin: 20px 0; }
p { text-align: justify; margin: 8px 0; }
.indent { margin-left: 40px; }
.field { font-weight: bold; text-decoration: underline; }
.bold { font-weight: bold; }
.right { text-align: right; margin-top: 50px; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; }
td, th { border: 1px solid #000; padding: 4px 8px; text-align: center; }
.rtl { direction: rtl; text-align: right; }
"""

# ── 1. Attestation de Travail ──────────────────────────────────────────────
t1 = DocumentTemplate.objects.get(name='Attestation de Travail')
t1.content = """
<div class="title">Attestation&nbsp;&nbsp;de&nbsp;&nbsp;Travail</div>

<p>Le Doyen de La Facult&eacute; Polydisciplinaire de Taroudant atteste que Monsieur&nbsp;:</p>

<p class="indent">
  <span class="field">Nom et Pr&eacute;nom&nbsp;:</span> {{employee_name}}<br><br>
  <span class="field">Grade&nbsp;:</span> {{position}}<br><br>
  <span class="bold">SOM</span>&nbsp;&nbsp;: {{numero_somme}}<br><br>
  <span class="bold">CIN</span>&nbsp;&nbsp;&nbsp;: {{cin}}
</p>

<p>
  Est en fonction &agrave; la Facult&eacute; Polydisciplinaire de Taroudant depuis le
  <strong>{{hire_date}}</strong>.<br>
  La pr&eacute;sente attestation est d&eacute;livr&eacute;e &agrave; l&apos;int&eacute;ress&eacute;
  sur sa demande pour servir et valoir ce que de droit.
</p>

<p class="right">Fait &agrave; Taroudant le &nbsp;{{date_today}}</p>
"""
t1.custom_css = CSS_BASE
t1.variables = [
    {'key': 'employee_name', 'label': 'Nom et prenom',      'type': 'auto'},
    {'key': 'cin',           'label': 'N CIN',              'type': 'auto'},
    {'key': 'numero_somme',  'label': 'N de somme',         'type': 'auto'},
    {'key': 'position',      'label': 'Fonction',           'type': 'auto'},
    {'key': 'department',    'label': 'Departement',        'type': 'auto'},
    {'key': 'hire_date',     'label': 'Date de recrutement','type': 'auto'},
    {'key': 'date_today',    'label': 'Date du jour',       'type': 'auto'},
]
t1.save()
print('OK: Attestation de Travail')

# ── 2. Attestation de Surveillance ────────────────────────────────────────
t2 = DocumentTemplate.objects.get(name='Attestation de Surveillance')
t2.content = """
<div class="title">ATTESTATION&nbsp;&nbsp;&nbsp;SURVEILLANCE</div>

<p>
  Je soussign&eacute;, Monsieur le Doyen de la Facult&eacute; Polydisciplinaire de Taroudant
  atteste que le Professeur&nbsp;:
</p>

<p class="indent">
  <span class="field">Nom et Pr&eacute;nom</span>&nbsp;: {{employee_name}}<br><br>
  <span class="field">CIN</span>&nbsp;&nbsp;&mdash; {{cin}}
</p>

<p>
  A assur&eacute; <strong>{{heures_surveillance}}</strong> heures de surveillance au courant
  des examens de la <span style="color:red; font-style:italic;">session</span> du printemps des
  <span style="color:red; font-style:italic;">semestres</span>
  {{semestre1}}, {{semestre2}} et {{semestre3}}
  de l&apos;ann&eacute;e universitaire <strong>{{annee_univ}}</strong>.
</p>

<p>
  La pr&eacute;sente attestation est d&eacute;livr&eacute;e &agrave; l&apos;int&eacute;ress&eacute;
  sur sa demande pour servir et valoir ce que de droit.
</p>

<p class="right">Fait &agrave; Taroudant le &nbsp;{{date_today}}</p>
"""
t2.custom_css = CSS_BASE
t2.variables = [
    {'key': 'employee_name',       'label': 'Nom et Prenom',        'type': 'auto'},
    {'key': 'cin',                 'label': 'CIN',                  'type': 'auto'},
    {'key': 'heures_surveillance', 'label': "Nombre d'heures",      'type': 'manual'},
    {'key': 'session',             'label': 'Session',              'type': 'manual'},
    {'key': 'semestre1',           'label': 'Semestre 1',           'type': 'manual'},
    {'key': 'semestre2',           'label': 'Semestre 2',           'type': 'manual'},
    {'key': 'semestre3',           'label': 'Semestre 3',           'type': 'manual'},
    {'key': 'annee_univ',          'label': 'Annee universitaire',  'type': 'manual'},
    {'key': 'date_today',          'label': 'Date du jour',         'type': 'auto'},
]
t2.save()
print('OK: Attestation de Surveillance')

# ── 3. Ordre de Mission ────────────────────────────────────────────────────
t3 = DocumentTemplate.objects.get(name='Ordre de Mission')
t3.content = """
<div class="title-center">
  <span class="title-box">ORDRE DE MISSION</span>
</div>

<p>Le Doyen de La Facult&eacute; Polydisciplinaire de Taroudant<br>Ordonne &agrave; Monsieur&nbsp;:</p>

<p class="indent">
  <span class="bold">Nom et Pr&eacute;nom&nbsp;:</span> {{employee_name}}<br>
  <span class="bold">Grade&nbsp;:</span> {{position}}<br>
  <span class="bold">Indice&nbsp;:</span> {{indice}}<br>
  <span class="bold">SOM</span>&nbsp;: {{numero_somme}}<br>
  <span class="bold">CIN</span>&nbsp;&nbsp;: {{cin}}
</p>

<p>De se rendre en mission &agrave;&nbsp;: <strong>{{destination}}</strong>.</p>
<p>Pour (objet de mission)&nbsp;: {{objet_mission}}</p>
<p>&agrave; l&apos;&eacute;v&eacute;nement&nbsp;: <strong>{{evenement}}</strong>.</p>
<p>Moyen de Transport&nbsp;: <strong>{{moyen_transport}}</strong></p>
<p>Date de D&eacute;part&nbsp;: <strong>{{date_depart}}</strong></p>
<p>Date de retour&nbsp;: <strong>{{date_retour}}</strong></p>
<p>Accompagnants&nbsp;: {{accompagnants}}.</p>

<p class="right">Fait &agrave; Taroudant le &nbsp;{{date_today}}</p>
"""
t3.custom_css = CSS_BASE
t3.variables = [
    {'key': 'employee_name',   'label': 'Nom et Prenom',       'type': 'auto'},
    {'key': 'position',        'label': 'Grade',               'type': 'auto'},
    {'key': 'numero_somme',    'label': 'SOM (PPR)',           'type': 'auto'},
    {'key': 'cin',             'label': 'CIN',                 'type': 'auto'},
    {'key': 'indice',          'label': 'Indice',              'type': 'manual'},
    {'key': 'destination',     'label': 'Destination',         'type': 'manual'},
    {'key': 'objet_mission',   'label': 'Objet de la mission', 'type': 'manual'},
    {'key': 'evenement',       'label': 'Evenement',           'type': 'manual'},
    {'key': 'moyen_transport', 'label': 'Moyen de transport',  'type': 'manual'},
    {'key': 'date_depart',     'label': 'Date de depart',      'type': 'manual'},
    {'key': 'date_retour',     'label': 'Date de retour',      'type': 'manual'},
    {'key': 'accompagnants',   'label': 'Accompagnants',       'type': 'manual'},
    {'key': 'date_today',      'label': 'Date du jour',        'type': 'auto'},
]
t3.save()
print('OK: Ordre de Mission')

# ── 4. Demande d'Autorisation de Cumul ────────────────────────────────────
t4 = DocumentTemplate.objects.get(name="Demande d'Autorisation de Cumul")
t4.content = """
<div class="rtl">
<p style="text-align:center; font-weight:bold; font-size:13pt;">
  \u0637\u0644\u0628 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0628\u0627\u0644\u062c\u0645\u0639 \u0628\u064a\u0646 \u0627\u0644\u0648\u0638\u064a\u0641\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0623\u062e\u0631\u0649 (\u0645\u0632\u0627\u0648\u0644\u0629 \u0645\u0647\u0627\u0645 \u0627\u0644\u062a\u062f\u0631\u064a\u0633)
</p>
<p style="text-align:center; font-size:9pt;">
  \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u0633\u0648\u0645 \u0627\u0644\u0645\u0644\u0643\u064a \u0631\u0642\u0645 1.59.008 \u0628\u062a\u0627\u0631\u064a\u062e 24 \u0641\u0628\u0631\u0627\u064a\u0631 1968<br>
  - \u0645\u0646\u0634\u0648\u0631 \u0627\u0644\u0633\u064a\u062f \u0627\u0644\u0648\u0632\u064a\u0631 \u0627\u0644\u0623\u0648\u0644 \u0631\u0642\u0645 760 \u0628\u062a\u0627\u0631\u064a\u062e 7 \u0623\u0628\u0631\u064a\u0644 2003<br>
  - \u0627\u0644\u0645\u0631\u0633\u0648\u0645 \u0631\u0642\u0645 2.08.11 \u0628\u062a\u0627\u0631\u064a\u062e 9 \u064a\u0648\u0644\u064a\u0648\u0632 2009
</p>
<table>
  <tr>
    <td><strong>\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644</strong></td><td>{{employee_name}}</td>
    <td><strong>\u0631\u0642\u0645 \u0627\u0644\u062a\u0627\u062c\u0631</strong></td><td>{{cin}}</td>
  </tr>
  <tr>
    <td><strong>\u0627\u0644\u0625\u0637\u0627\u0631</strong></td><td colspan="3">{{numero_somme}}</td>
  </tr>
  <tr>
    <td><strong>\u0627\u0644\u062f\u0631\u062c\u0629</strong></td><td colspan="3">{{position}}</td>
  </tr>
  <tr>
    <td><strong>\u0627\u0644\u062c\u0627\u0645\u0639\u0629</strong></td><td>\u062c\u0627\u0645\u0639\u0629 \u0627\u0628\u0646 \u0632\u0647\u0631</td>
    <td><strong>\u0627\u0644\u0645\u0624\u0633\u0633\u0629</strong></td><td>\u0627\u0644\u0643\u0644\u064a\u0629 \u0627\u0644\u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u062a\u062e\u0635\u0635\u0627\u062a \u0628\u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a</td>
  </tr>
</table>
<p>\u064a\u0634\u0631\u0641\u0646\u064a \u0623\u0646 \u0623\u062a\u0645\u0633 \u0645\u0646 \u0627\u0644\u0633\u064a\u062f \u0631\u0626\u064a\u0633 \u0627\u0644\u062c\u0627\u0645\u0639\u0629 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0644\u064a \u0628\u0645\u0632\u0627\u0648\u0644\u0629 \u0645\u0647\u0646\u0629 \u0627\u0644\u062a\u062f\u0631\u064a\u0633 \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0648\u0638\u064a\u0641\u062a\u064a \u0627\u0644\u0623\u0635\u0644\u064a\u0629 \u062e\u0644\u0627\u0644 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u062c\u0627\u0645\u0639\u064a\u0629 ----/---- \u0641\u0642\u0637.</p>
<table>
  <tr><td><strong>\u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u062e\u0627\u0635\u0629 \u0648 \u0627\u0644\u0645\u062f\u0646\u064a\u0629</strong></td><td>{{institution}}</td></tr>
  <tr><td><strong>\u0627\u0644\u0623\u0633\u0627\u0633</strong></td><td>{{asas}}</td></tr>
  <tr><td><strong>\u0639\u062f\u062f \u0627\u0644\u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0634\u0647\u0631\u064a\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0628\u0647\u0627 (*)</strong></td><td>{{heures_cumul}}</td></tr>
</table>
<table>
  <tr>
    <th rowspan="2">\u0627\u0644\u0623\u064a\u0627\u0645</th>
    <th colspan="2">\u0627\u0644\u0641\u062a\u0631\u0629 \u0627\u0644\u0635\u0628\u0627\u062d\u064a\u0629</th>
    <th colspan="2">\u0627\u0644\u0641\u062a\u0631\u0629 \u0627\u0644\u0645\u0633\u0627\u0626\u064a\u0629</th>
  </tr>
  <tr><th>\u0645\u0646</th><th>\u0625\u0644\u0649</th><th>\u0645\u0646</th><th>\u0625\u0644\u0649</th></tr>
  <tr><td>\u0627\u0644\u0627\u062b\u0646\u064a\u0646</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u062e\u0645\u064a\u0633</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u062c\u0645\u0639\u0629</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u0633\u0628\u062a</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
<p><strong>(*) \u0643\u0645\u0627 \u0623\u0644\u062a\u0632\u0645 \u0628\u0627\u0644\u062a\u0642\u064a\u062f \u0628\u0639\u062f\u062f \u0627\u0644\u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0645\u0634\u0627\u0631 \u0625\u0644\u064a\u0647\u0627 \u0623\u0639\u0644\u0627\u0647 \u0641\u064a \u062d\u062f\u0648\u062f 20 \u0633\u0627\u0639\u0629 \u0643\u0644 \u0634\u0647\u0631.</strong></p>
<p>\u062d\u0631\u0631 \u0641\u064a \u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a \u0628\u062a\u0627\u0631\u064a\u062e: &nbsp;&nbsp; / &nbsp;&nbsp; /</p>
<div style="display:flex; justify-content:space-between; margin-top:40px;">
  <span>\u0645\u0648\u0627\u0641\u0642\u0629 \u0631\u0626\u064a\u0633 \u0627\u0644\u0645\u0624\u0633\u0633\u0629</span>
  <span>\u0625\u0645\u0636\u0627\u0621 \u0635\u0627\u062d\u0628 \u0627\u0644\u0637\u0644\u0628</span>
</div>
</div>
"""
t4.custom_css = CSS_BASE + "\nbody { direction: rtl; font-family: 'Traditional Arabic', 'Amiri', serif; }"
t4.variables = [
    {'key': 'employee_name', 'label': 'الاسم الكامل',          'type': 'auto'},
    {'key': 'cin',           'label': 'رقم التاجر / CIN',      'type': 'auto'},
    {'key': 'numero_somme',  'label': 'الإطار / SOM',          'type': 'auto'},
    {'key': 'position',      'label': 'الدرجة',                'type': 'auto'},
    {'key': 'institution',   'label': 'المؤسسة',               'type': 'manual'},
    {'key': 'asas',          'label': 'الأساس',                'type': 'manual'},
    {'key': 'heures_cumul',  'label': 'عدد الساعات الشهرية',   'type': 'manual'},
]
t4.save()
print('OK: Demande Autorisation Cumul')

# ── 5. شهادة FPT ──────────────────────────────────────────────────────────
t5 = DocumentTemplate.objects.get(name='\u0634\u0647\u0627\u062f\u0629 FPT')
t5.content = """
<div class="rtl">
<p style="text-align:center; font-size:22pt; font-weight:bold; font-family:'Comic Sans MS',cursive; margin:30px 0;">
  \u0634\u0647\u0627\u062f\u0629 <span style="color:red; text-decoration:underline wavy red;">fpt</span>
</p>
<p style="text-align:justify; line-height:2.2; font-size:13pt;">
  \u064a\u0634\u0647\u062f \u0627\u0644\u0633\u064a\u062f \u0639\u0645\u064a\u062f \u0627\u0644\u0643\u0644\u064a\u0629 \u0627\u0644\u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u062a\u062e\u0635\u0635\u0627\u062a \u0628\u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a -\u062c\u0627\u0645\u0639\u0629 \u0627\u0628\u0646 \u0632\u0647\u0631-
  \u0623\u0646 \u0627\u0644\u0623\u0633\u062a\u0627\u0630: <strong>{{employee_name}}</strong>
  \u0627\u0644\u062d\u0627\u0645\u0644 \u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0648\u0637\u0646\u064a\u0629 \u0631\u0642\u0645 <strong>{{cin}}</strong>
  \u0642\u062f \u062f\u0631\u0651\u0633 <strong>{{heures_cours}}</strong> \u0633\u0627\u0639\u0629 \u0645\u0646 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u062a\u0648\u062c\u064a\u0647\u064a\u0629\u060c
  \u0645\u0627\u062f\u0629 <strong><u>{{matiere}}</u></strong>
  ({{semestre}}) \u0645\u0633\u0644\u0643 {{filiere}}
  \u062e\u0644\u0627\u0644 \u0627\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u062c\u0627\u0645\u0639\u064a <strong>{{annee_univ}}</strong>.
</p>
<p style="text-align:justify; line-height:2.2; font-size:13pt;">
  \u0633\u0644\u0645\u062a \u0647\u0630\u0647 \u0627\u0644\u0634\u0647\u0627\u062f\u0629 \u0644\u0644\u0645\u0639\u0646\u064a \u0628\u0627\u0644\u0623\u0645\u0631 \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0637\u0644\u0628\u0647 \u0644\u0644\u0625\u062f\u0644\u0627\u0621 \u0628\u0647\u0627 \u0639\u0646\u062f \u0627\u0644\u062d\u0627\u062c\u0629.
</p>
<p style="text-align:right; margin-top:40px; font-size:12pt;">{{date_today}}</p>
</div>
"""
t5.custom_css = CSS_BASE + "\nbody { direction: rtl; font-family: 'Traditional Arabic', 'Amiri', serif; }"
t5.variables = [
    {'key': 'employee_name', 'label': 'اسم الأستاذ',          'type': 'auto'},
    {'key': 'cin',           'label': 'رقم بطاقة التعريف',    'type': 'auto'},
    {'key': 'heures_cours',  'label': 'عدد ساعات الدرس',      'type': 'manual'},
    {'key': 'matiere',       'label': 'اسم المادة',           'type': 'manual'},
    {'key': 'semestre',      'label': 'الفصل',                'type': 'manual'},
    {'key': 'filiere',       'label': 'المسلك',               'type': 'manual'},
    {'key': 'annee_univ',    'label': 'الموسم الجامعي',       'type': 'manual'},
    {'key': 'date_today',    'label': 'التاريخ',              'type': 'auto'},
]
t5.save()
print('OK: شهادة FPT')

print('\nDone! All 5 templates updated.')
