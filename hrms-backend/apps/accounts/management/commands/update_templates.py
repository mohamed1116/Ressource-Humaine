from django.core.management.base import BaseCommand
from apps.certificates.models import DocumentTemplate

CSS_BASE = """
body { font-family: "Times New Roman", serif; font-size: 12pt;
       line-height: 1.9; color: #000; padding: 10px 30px; }
.title { text-align:center; font-size:15pt; font-weight:bold;
         text-decoration:underline; font-style:italic;
         letter-spacing:3px; margin:25px 0; }
.title-box { text-align:center; margin:20px 0; }
.title-box span { font-size:14pt; font-weight:bold;
                  border:2px solid #000; padding:6px 20px; }
p { margin: 8px 0; text-align:justify; }
.indent { margin-left:40px; }
.field { font-weight:bold; text-decoration:underline; }
.sign { margin-top:60px; text-align:right; }
table { border-collapse:collapse; width:100%; margin:12px 0; }
td,th { border:1px solid #000; padding:5px 8px; text-align:center; }
"""

CSS_AR = """
body { font-family: "Traditional Arabic","Amiri",serif; font-size:13pt;
       direction:rtl; text-align:right; line-height:2; padding:10px 30px; }
.title { text-align:center; font-size:14pt; font-weight:bold; margin:20px 0; }
.fpt-title { text-align:center; font-size:22pt; font-weight:bold; margin:30px 0; }
.fpt-title span { color:red; text-decoration:underline wavy red; }
p { margin:8px 0; text-align:justify; }
table { border-collapse:collapse; width:100%; margin:12px 0; }
td,th { border:1px solid #000; padding:5px 8px; text-align:center; }
.sign { margin-top:50px; }
.sign-row { display:flex; justify-content:space-between; margin-top:40px; }
"""

TEMPLATES = [
    {
        "name": "Attestation de Travail",
        "custom_css": CSS_BASE,
        "variables": [
            {"key": "employee_name", "label": "Nom et Prenom",       "type": "auto"},
            {"key": "cin",           "label": "N CIN",               "type": "auto"},
            {"key": "numero_somme",  "label": "N de somme",          "type": "auto"},
            {"key": "position",      "label": "Fonction",            "type": "auto"},
            {"key": "department",    "label": "Departement",         "type": "auto"},
            {"key": "hire_date",     "label": "Date de recrutement", "type": "auto"},
            {"key": "date_today",    "label": "Date du jour",        "type": "auto"},
        ],
        "content": """
<p class="title">Attestation&nbsp;&nbsp;de&nbsp;&nbsp;Travail</p>

<p>Le Doyen de La Facult&eacute; Polydisciplinaire de Taroudant atteste que Monsieur :</p>

<p class="indent"><span class="field">Nom et Pr&eacute;nom :</span> {{employee_name}}</p>
<p class="indent"><span class="field">Grade :</span> {{position}}</p>
<p class="indent"><strong>SOM</strong> &nbsp;: {{numero_somme}}</p>
<p class="indent"><strong>CIN</strong> &nbsp;&nbsp;: {{cin}}</p>

<p>Est en fonction &agrave; la Facult&eacute; Polydisciplinaire de Taroudant depuis le
<strong>{{hire_date}}</strong>.</p>
<p>La pr&eacute;sente attestation est d&eacute;livr&eacute;e &agrave; l&apos;int&eacute;ress&eacute;
sur sa demande pour servir et valoir ce que de droit.</p>

<p class="sign">Fait &agrave; Taroudant le &nbsp;{{date_today}}</p>
""",
    },
    {
        "name": "Attestation de Surveillance",
        "custom_css": CSS_BASE,
        "variables": [
            {"key": "employee_name",       "label": "Nom et Prenom",       "type": "auto"},
            {"key": "cin",                 "label": "CIN",                 "type": "auto"},
            {"key": "heures_surveillance", "label": "Nombre d heures",     "type": "manual"},
            {"key": "session",             "label": "Session",             "type": "manual"},
            {"key": "semestre1",           "label": "Semestre 1",          "type": "manual"},
            {"key": "semestre2",           "label": "Semestre 2",          "type": "manual"},
            {"key": "semestre3",           "label": "Semestre 3",          "type": "manual"},
            {"key": "annee_univ",          "label": "Annee universitaire", "type": "manual"},
            {"key": "date_today",          "label": "Date du jour",        "type": "auto"},
        ],
        "content": """
<p class="title">ATTESTATION&nbsp;&nbsp;&nbsp;SURVEILLANCE</p>

<p>Je soussign&eacute;, Monsieur le Doyen de la Facult&eacute; Polydisciplinaire de Taroudant
atteste que le Professeur :</p>

<p class="indent"><span class="field">Nom et Pr&eacute;nom</span> : {{employee_name}}</p>
<p class="indent"><span class="field">CIN</span> &nbsp;&mdash; {{cin}}</p>

<p>A assur&eacute; <strong>{{heures_surveillance}}</strong> heures de surveillance au courant
des examens de la <span style="color:red;font-style:italic;">session</span> du printemps des
<span style="color:red;font-style:italic;">semestres</span>
{{semestre1}}, {{semestre2}} et {{semestre3}} de l&apos;ann&eacute;e universitaire
<strong>{{annee_univ}}</strong>.</p>

<p>La pr&eacute;sente attestation est d&eacute;livr&eacute;e &agrave; l&apos;int&eacute;ress&eacute;
sur sa demande pour servir et valoir ce que de droit.</p>

<p class="sign">Fait &agrave; Taroudant le &nbsp;{{date_today}}</p>
""",
    },
    {
        "name": "Ordre de Mission",
        "custom_css": CSS_BASE,
        "variables": [
            {"key": "employee_name",   "label": "Nom et Prenom",       "type": "auto"},
            {"key": "position",        "label": "Grade",               "type": "auto"},
            {"key": "numero_somme",    "label": "SOM (PPR)",           "type": "auto"},
            {"key": "cin",             "label": "CIN",                 "type": "auto"},
            {"key": "indice",          "label": "Indice",              "type": "manual"},
            {"key": "destination",     "label": "Destination",         "type": "manual"},
            {"key": "objet_mission",   "label": "Objet de la mission", "type": "manual"},
            {"key": "evenement",       "label": "Evenement",           "type": "manual"},
            {"key": "moyen_transport", "label": "Moyen de transport",  "type": "manual"},
            {"key": "date_depart",     "label": "Date de depart",      "type": "manual"},
            {"key": "date_retour",     "label": "Date de retour",      "type": "manual"},
            {"key": "accompagnants",   "label": "Accompagnants",       "type": "manual"},
            {"key": "date_today",      "label": "Date du jour",        "type": "auto"},
        ],
        "content": """
<div class="title-box"><span>ORDRE DE MISSION</span></div>

<p>Le Doyen de La Facult&eacute; Polydisciplinaire de Taroudant<br>
Ordonne &agrave; Monsieur :</p>

<p class="indent"><strong>Nom et Pr&eacute;nom :</strong> {{employee_name}}</p>
<p class="indent"><strong>Grade :</strong> {{position}}</p>
<p class="indent"><strong>Indice :</strong> {{indice}}</p>
<p class="indent"><strong>SOM</strong> : {{numero_somme}}</p>
<p class="indent"><strong>CIN</strong> &nbsp;: {{cin}}</p>

<p>De se rendre en mission &agrave; : <strong>{{destination}}</strong>.</p>
<p>Pour (objet de mission) : {{objet_mission}}</p>
<p>&agrave; l&apos;&eacute;v&eacute;nement : <strong>{{evenement}}</strong>.</p>
<p>Moyen de Transport : <strong>{{moyen_transport}}</strong></p>
<p>Date de D&eacute;part : <strong>{{date_depart}}</strong></p>
<p>Date de retour : <strong>{{date_retour}}</strong></p>
<p>Accompagnants : {{accompagnants}}.</p>

<p class="sign">Fait &agrave; Taroudant le &nbsp;{{date_today}}</p>
""",
    },
    {
        "name": "Demande d'Autorisation de Cumul",
        "custom_css": CSS_AR,
        "variables": [
            {"key": "employee_name", "label": "Nom complet",          "type": "auto"},
            {"key": "cin",           "label": "N CIN",                "type": "auto"},
            {"key": "position",      "label": "Fonction",             "type": "auto"},
            {"key": "numero_somme",  "label": "N de somme",           "type": "auto"},
            {"key": "institution",   "label": "Institution",          "type": "manual"},
            {"key": "asas",          "label": "Asas",                 "type": "manual"},
            {"key": "heures_cumul",  "label": "Heures mensuelles",    "type": "manual"},
            {"key": "date_today",    "label": "Date du jour",         "type": "auto"},
        ],
        "content": """
<div class="title">
  \u0637\u0644\u0628 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0628\u0627\u0644\u062c\u0645\u0639 \u0628\u064a\u0646 \u0627\u0644\u0648\u0638\u064a\u0641\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0623\u062e\u0631\u0649 (\u0645\u0632\u0627\u0648\u0644\u0629 \u0645\u0647\u0627\u0645 \u0627\u0644\u062a\u062f\u0631\u064a\u0633)
</div>
<p style="text-align:center;font-size:10pt;">
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
<p class="sign">\u062d\u0631\u0631 \u0641\u064a \u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a \u0628\u062a\u0627\u0631\u064a\u062e: &nbsp;&nbsp; / &nbsp;&nbsp; / &nbsp;&nbsp;</p>
<div class="sign-row">
  <span>\u0645\u0648\u0627\u0641\u0642\u0629 \u0631\u0626\u064a\u0633 \u0627\u0644\u0645\u0624\u0633\u0633\u0629</span>
  <span>\u0625\u0645\u0636\u0627\u0621 \u0635\u0627\u062d\u0628 \u0627\u0644\u0637\u0644\u0628</span>
</div>
""",
    },
    {
        "name": "\u0634\u0647\u0627\u062f\u0629 FPT",
        "custom_css": CSS_AR,
        "variables": [
            {"key": "employee_name", "label": "Nom de l enseignant",   "type": "auto"},
            {"key": "cin",           "label": "N CIN",                 "type": "auto"},
            {"key": "heures_cours",  "label": "Heures de cours",       "type": "manual"},
            {"key": "matiere",       "label": "Matiere",               "type": "manual"},
            {"key": "semestre",      "label": "Semestre",              "type": "manual"},
            {"key": "filiere",       "label": "Filiere",               "type": "manual"},
            {"key": "annee_univ",    "label": "Annee universitaire",   "type": "manual"},
            {"key": "date_today",    "label": "Date du jour",          "type": "auto"},
        ],
        "content": """
<div class="fpt-title">\u0634\u0647\u0627\u062f\u0629 <span>fpt</span></div>

<p>
  \u064a\u0634\u0647\u062f \u0627\u0644\u0633\u064a\u062f \u0639\u0645\u064a\u062f \u0627\u0644\u0643\u0644\u064a\u0629 \u0627\u0644\u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u062a\u062e\u0635\u0635\u0627\u062a \u0628\u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a -\u062c\u0627\u0645\u0639\u0629 \u0627\u0628\u0646 \u0632\u0647\u0631-
  \u0623\u0646 \u0627\u0644\u0623\u0633\u062a\u0627\u0630: <strong>{{employee_name}}</strong>
  \u0627\u0644\u062d\u0627\u0645\u0644 \u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0648\u0637\u0646\u064a\u0629 \u0631\u0642\u0645 <strong>{{cin}}</strong>
  \u0642\u062f \u062f\u0631\u0651\u0633 <strong>{{heures_cours}}</strong> \u0633\u0627\u0639\u0629 \u0645\u0646 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u062a\u0648\u062c\u064a\u0647\u064a\u0629\u060c
  \u0645\u0627\u062f\u0629 <strong><u>{{matiere}}</u></strong>
  ({{semestre}}) \u0645\u0633\u0644\u0643 {{filiere}}
  \u062e\u0644\u0627\u0644 \u0627\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u062c\u0627\u0645\u0639\u064a <strong>{{annee_univ}}</strong>.
</p>

<p>\u0633\u0644\u0645\u062a \u0647\u0630\u0647 \u0627\u0644\u0634\u0647\u0627\u062f\u0629 \u0644\u0644\u0645\u0639\u0646\u064a \u0628\u0627\u0644\u0623\u0645\u0631 \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0637\u0644\u0628\u0647 \u0644\u0644\u0625\u062f\u0644\u0627\u0621 \u0628\u0647\u0627 \u0639\u0646\u062f \u0627\u0644\u062d\u0627\u062c\u0629.</p>

<p class="sign">{{date_today}}</p>
""",
    },
]


TEMPLATE_NEW = {
    "name": "\u0637\u0644\u0628 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0628\u0627\u0644\u062c\u0645\u0639 \u0628\u064a\u0646 \u0627\u0644\u0648\u0638\u064a\u0641\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062d\u0631\u0629",
    "category": "AUTORISATION",
    "language": "AR",
    "target_audience": "EMPLOYEE",
    "description": "\u0637\u0644\u0628 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0628\u0627\u0644\u062c\u0645\u0639 \u0628\u064a\u0646 \u0627\u0644\u0648\u0638\u064a\u0641\u0629 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062d\u0631\u0629 (\u0645\u0632\u0627\u0648\u0644\u0629 \u0645\u0647\u0627\u0645 \u0627\u0644\u062a\u062f\u0631\u064a\u0633)",
    "custom_css": """
body { font-family: "Traditional Arabic","Amiri",serif; font-size:12pt;
       direction:rtl; text-align:right; line-height:1.8; padding:10px 20px; }
.main-title { font-size:16pt; font-weight:bold; margin:15px 0 5px 0; }
.sub-title { font-size:10pt; text-align:center; margin-bottom:10px; }
table { border-collapse:collapse; width:100%; margin:8px 0; font-size:11pt; }
td,th { border:1px solid #000; padding:4px 8px; }
.schedule td { height:22px; }
.note { font-weight:bold; margin:10px 0; }
.sign-area { margin-top:30px; }
.sign-row { display:flex; justify-content:space-between; margin-top:40px; }
""",
    "variables": [
        {"key": "employee_name", "label": "Nom complet",       "type": "auto"},
        {"key": "cin",           "label": "N CIN",             "type": "auto"},
        {"key": "position",      "label": "Fonction",          "type": "auto"},
        {"key": "numero_somme",  "label": "N de somme",        "type": "auto"},
        {"key": "institution",   "label": "Institution",       "type": "manual"},
        {"key": "asas",          "label": "Asas",              "type": "manual"},
        {"key": "heures_cumul",  "label": "Heures mensuelles", "type": "manual"},
        {"key": "date_today",    "label": "Date du jour",      "type": "auto"},
    ],
    "content": """
<p class="main-title" style="text-align:center;">
  \u0637\u0644\u0628 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0628\u0627\u0644\u062c\u0645\u0639 \u0628\u064a\u0646 \u0627\u0644\u0648\u0638\u064a\u0641\u0629 &nbsp;\u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062d\u0631\u0629 &nbsp;(\u0645\u0632\u0627\u0648\u0644\u0629 \u0645\u0647\u0627\u0645 \u0627\u0644\u062a\u062f\u0631\u064a\u0633)
</p>
<p class="sub-title">
  \u0628\u0646\u0627\u0621 \u0639\u0644\u0649- \u0627\u0644\u0638\u0647\u064a\u0631 \u0627\u0644\u0634\u0631\u064a\u0641 \u0631\u0642\u0645 1.58.008 \u0628\u062a\u0627\u0631\u064a\u062e 24 \u0641\u0628\u0631\u0627\u064a\u0631 1958<br>
  - \u0645\u0646\u0634\u0648\u0631 \u0627\u0644\u0633\u064a\u062f \u0627\u0644\u0648\u0632\u064a\u0631 \u0627\u0644\u0623\u0648\u0644 \u0631\u0642\u0645 760 \u0628\u062a\u0627\u0631\u064a\u062e 7 \u0623\u0628\u0631\u064a\u0644 2003<br>
  - \u0627\u0644\u0645\u0631\u0633\u0648\u0645 \u0631\u0642\u0645 2.08.11 \u0628\u062a\u0627\u0631\u064a\u062e 9 \u064a\u0648\u0644\u064a\u0648\u0632 2009
</p>
<table>
  <tr>
    <td style="width:25%"><strong>\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644</strong></td>
    <td style="width:25%">{{employee_name}}</td>
    <td style="width:25%"><strong>\u0627\u0644\u062a\u0627\u062c\u0631 \u0631\u0642\u0645</strong></td>
    <td style="width:25%">{{cin}}</td>
  </tr>
  <tr>
    <td><strong>\u0627\u0644\u0625\u0637\u0627\u0631</strong></td>
    <td>{{numero_somme}}</td>
    <td></td><td></td>
  </tr>
  <tr>
    <td><strong>\u0627\u0644\u062f\u0631\u062c\u0629</strong></td>
    <td>{{position}}</td>
    <td><strong>\u0627\u0644\u0645\u0624\u0633\u0633\u0629</strong></td>
    <td>\u0627\u0644\u062a\u062e\u0635\u0635\u0627\u062a \u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644 \u0643\u0644\u064a\u0629 \u0628\u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a</td>
  </tr>
  <tr>
    <td><strong>\u0627\u0644\u062c\u0627\u0645\u0639\u0629</strong></td>
    <td>\u0632\u0647\u0631 \u0627\u0628\u0646 \u062c\u0627\u0645\u0639\u0629</td>
    <td></td><td></td>
  </tr>
</table>
<p>\u064a\u0634\u0631\u0641\u0646\u064a \u0623\u0646 \u0627\u0644\u062a\u0645\u0633 \u0645\u0646 \u0627\u0644\u0633\u064a\u062f \u0631\u0626\u064a\u0633 \u0627\u0644\u062c\u0627\u0645\u0639\u0629 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0644\u064a \u0628\u0645\u0632\u0627\u0648\u0644\u0629 \u0645\u0647\u0646\u0629 \u0627\u0644\u062a\u062f\u0631\u064a\u0633 &nbsp;\u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0648\u0638\u064a\u0641\u062a\u064a &nbsp;\u0627\u0644\u0623\u0635\u0644\u064a\u0629 &nbsp;\u062e\u0644\u0627 \u0644 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u062c\u0627\u0645\u0639\u064a\u0629 ----/---- \u0641\u0642\u0637.</p>
<table>
  <tr>
    <td style="width:40%"><strong>\u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u062e\u0627\u0635\u0629 \u0648 \u0627\u0644\u0645\u062f\u064a\u0646\u0629</strong></td>
    <td>{{institution}}</td>
  </tr>
  <tr>
    <td><strong>\u0633\u062f\u0633\u0627\u0644\u0644</strong></td>
    <td>{{asas}}</td>
  </tr>
  <tr>
    <td><strong>(*) \u0628\u0647\u0627 \u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0627\u0644\u0633\u0627\u0639\u0627\u062a \u0639\u062f\u062f</strong></td>
    <td><strong>{{heures_cumul}}</strong></td>
  </tr>
</table>
<table class="schedule">
  <tr>
    <th rowspan="2">\u0627\u0644\u0623\u064a\u0627\u0645</th>
    <th colspan="2">\u0627\u0644\u0635\u0628\u0627\u062d\u064a\u0629 \u0627\u0644\u0641\u062a\u0631\u0629</th>
    <th colspan="2">\u0627\u0644\u0645\u0633\u0627\u0626\u064a\u0629 \u0627\u0644\u0641\u062a\u0631\u0629</th>
  </tr>
  <tr><th>\u0645\u0646</th><th>\u0627\u0644\u0649</th><th>\u0645\u0646</th><th>\u0627\u0644\u0649</th></tr>
  <tr><td>\u0627\u0644\u0627\u062b\u0646\u064a\u0646</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u062e\u0645\u064a\u0633</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u062c\u0645\u0639\u0629</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>\u0627\u0644\u0633\u0628\u062a</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>
<p class="note">(*) \u0643\u0645\u0627 \u0627\u0644\u062a\u0632\u0645 \u0628\u0627\u0644\u062a\u0642\u064a\u062f \u0628\u0639\u062f\u062f \u0627\u0644\u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0645\u0634\u0627\u0631 \u0625\u0644\u064a\u0647\u0627 &nbsp;\u0623\u0639\u0644\u0627\u0647 \u0641\u064a \u062d\u062f\u0648\u062f 20 \u0633\u0627\u0639\u0629 \u0643\u0644 \u0634\u0647\u0631.</p>
<div class="sign-area">
  <p>\u062d\u0631\u0631 \u0641\u064a \u062a\u0627\u0631\u0648\u062f\u0627\u0646\u062a \u0628\u062a\u0627\u0631\u064a\u062e: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;</p>
  <div class="sign-row">
    <span style="text-decoration:underline;">\u0645\u0648\u0627\u0641\u0642\u0629 \u0631\u0626\u064a\u0633 \u0627\u0644\u0645\u0624\u0633\u0633\u0629</span>
    <span style="text-decoration:underline;">\u0627\u0645\u0636\u0627\u0621 \u0635\u0627\u062d\u0628 \u0627\u0644\u0637\u0644\u0628</span>
  </div>
</div>
""",
}


class Command(BaseCommand):
    help = 'Update the 5 FPT document templates to match the real document images'

    def handle(self, *args, **options):
        # Update existing 5 templates
        for t in TEMPLATES:
            try:
                obj = DocumentTemplate.objects.get(name=t['name'])
                obj.content    = t['content']
                obj.custom_css = t['custom_css']
                obj.variables  = t['variables']
                obj.save()
                self.stdout.write('  [UPDATED] ' + t['name'].encode('ascii','replace').decode())
            except DocumentTemplate.DoesNotExist:
                self.stdout.write('  [NOT FOUND] ' + t['name'].encode('ascii','replace').decode())

        # Add the new 6th template
        FOOTER = 'Hay El Mohammadi (Lastah), B.P : 271, C.P : 83000, Taroudant | Tel. : +212(0)5 28 55 10 10, Fax : +212(0)5 28 55 10 20, Site Web: <strong>www.fpt.ac.ma</strong>'
        HEADER = '<div style="text-align:center;margin-bottom:10px;"><img src="/assets/fpt-logo.png" alt="FPT" style="max-height:80px;width:auto;"/></div>'
        t6 = TEMPLATE_NEW
        obj, created = DocumentTemplate.objects.get_or_create(
            name=t6['name'],
            defaults={
                'category':        t6['category'],
                'language':        t6['language'],
                'target_audience': t6['target_audience'],
                'description':     t6['description'],
                'custom_css':      t6['custom_css'],
                'variables':       t6['variables'],
                'content':         t6['content'],
                'header_html':     HEADER,
                'footer_html':     FOOTER,
                'is_active':       True,
            }
        )
        if not created:
            obj.content    = t6['content']
            obj.custom_css = t6['custom_css']
            obj.variables  = t6['variables']
            obj.save()
        self.stdout.write('  [{}] template 6 (Tarkhis Hurra)'.format('NEW' if created else 'UPDATED'))
        self.stdout.write(self.style.SUCCESS('Done.'))
