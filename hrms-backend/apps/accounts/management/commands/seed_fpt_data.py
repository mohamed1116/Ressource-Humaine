"""
Seed the HRMS database with real FPT data.
Reference: Espace-num-rqiue-FPT (professeur + departement tables)

Creates:
  - 4 departments (from Espace departement table)
  - Positions (PES, PH, PA, TECH, ADM, SEC)
  - 30 professors (from Espace professeur table, with phone + numero_somme)
  - 4 staff accounts
  - Leave types

Run: python manage.py seed_fpt_data
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.employees.models import Department, Position, Employee, ProfessorProfile, StaffProfile


class Command(BaseCommand):
    help = 'Seed database with real FPT reference data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding FPT data...\n')

        # ──────────────────────────────
        # 1. DEPARTMENTS (from Espace: departement table)
        # id=4 Mathématiques et Informatique | id=5 Sciences humaines et sociales
        # id=6 Sciences économiques et gestion | id=7 Sciences et techniques
        # ──────────────────────────────
        depts_data = [
            ('INFO', 'Mathématiques et Informatique'),
            ('SHS',  'Sciences Humaines et Sociales'),
            ('SEG',  'Sciences Économiques et Gestion'),
            ('ST',   'Sciences et Techniques'),
        ]
        depts = {}
        for code, name in depts_data:
            dept, c = Department.objects.get_or_create(code=code, defaults={'name': name})
            depts[code] = dept
            self._log(c, f'Département: {name}')

        # ──────────────────────────────
        # 2. POSITIONS (grades fonctionnaires marocains)
        # ──────────────────────────────
        positions_data = [
            ('PES',  "Professeur de l'Enseignement Supérieur", 1),
            ('PH',   'Professeur Habilité',                    2),
            ('PA',   'Professeur Assistant',                   3),
            ('TECH', 'Technicien',                             4),
            ('ADM',  'Administrateur',                         5),
            ('SEC',  'Secrétaire',                             6),
        ]
        positions = {}
        for code, title, grade in positions_data:
            pos, c = Position.objects.get_or_create(
                code=code, defaults={'title': title, 'grade_level': grade}
            )
            positions[code] = pos
            self._log(c, f'Position: {title}')

        # ──────────────────────────────
        # 3. ADMIN / HR
        # ──────────────────────────────
        self._create_user('admin@fpt.ac.ma', 'Admin', 'HR', 'ADMIN_HR', 'admin123456')

        # ──────────────────────────────
        # 4. PROFESSORS
        # Source: Espace professeur table
        # Fields added from Espace: telephone, specialite, cin, department
        # Fields added: numero_somme (PPR), date_of_birth, gender, hire_date
        # ──────────────────────────────
        # (email, first, last, cin, phone, numero_somme, specialite, dept_code, grade, dob, gender, hire)
        profs_data = [
            # ── Département INFO ──
            ('y.essaady@uiz.ma',        'Youssef',        'ES-SAADY',       'P123456',   '0661234501', 'PPR-INFO-001', 'Informatique',           'INFO', 'PES', '1968-03-12', 'M', '1995-09-01'),
            ('s.roubi@fpt.ac.ma',       'Sara',           'ROUBI',          'F360001',   '0661234502', 'PPR-INFO-002', 'Informatique',           'INFO', 'PA',  '1985-07-22', 'F', '2012-09-01'),
            ('a.sadiq@fpt.ac.ma',       'Abderrahmane',   'SADIQ',          'EE286239',  '0661234503', 'PPR-INFO-003', 'Informatique',           'INFO', 'PH',  '1975-11-05', 'M', '2003-09-01'),
            ('l.najdi@uiz.ac.ma',       'Lotfi',          'NAJDI',          'LN001234',  '0661234504', 'PPR-INFO-004', 'Informatique',           'INFO', 'PA',  '1987-04-18', 'M', '2014-09-01'),
            ('m.aitelhadj@fpt.ac.ma',   'Maryem',         'AIT EL HADJ',    'MH001234',  '0661234505', 'PPR-INFO-005', 'Informatique',           'INFO', 'PA',  '1989-09-30', 'F', '2016-09-01'),
            ('h.bouziane@fpt.ac.ma',    'Hassan',         'BOUZIANE',       'HB001234',  '0661234506', 'PPR-INFO-006', 'Réseaux',                'INFO', 'PH',  '1972-06-14', 'M', '2000-09-01'),
            ('k.khayya@fpt.ac.ma',      'Khalid',         'KHAYYA',         'KK001234',  '0661234507', 'PPR-INFO-007', 'Génie Logiciel',         'INFO', 'PA',  '1990-01-25', 'M', '2018-09-01'),
            ('f.benali@fpt.ac.ma',      'Fatima',         'BENALI',         'FB001234',  '0661234508', 'PPR-INFO-008', 'Intelligence Artificielle','INFO','PA', '1991-08-10', 'F', '2019-09-01'),

            # ── Département ST ──
            ('m.iguernane@fpt.ac.ma',   'Mohamed',        'IGUERNANE',      'P720001',   '0661234509', 'PPR-ST-001',  'Mathématiques',          'ST',   'PES', '1965-02-28', 'M', '1993-09-01'),
            ('z.elmorjani@fpt.ac.ma',   'Zine Elabidine', 'EL MORJANI',     'JC001234',  '0661234510', 'PPR-ST-002',  'SIG / Géomatique',       'ST',   'PES', '1967-10-03', 'M', '1994-09-01'),
            ('f.lotfi@fpt.ac.ma',       'Fouad',          'LOTFI',          'I200001',   '0661234511', 'PPR-ST-003',  'Géologie',               'ST',   'PES', '1969-05-17', 'M', '1997-09-01'),
            ('a.elhammadi@fpt.ac.ma',   'Abdellatif',     'ELHAMMADI',      'H000001',   '0661234512', 'PPR-ST-004',  'Chimie',                 'ST',   'PES', '1966-12-09', 'M', '1994-09-01'),
            ('s.gharby@fpt.ac.ma',      'Said',           'GHARBY',         'BJ278981',  '0661234513', 'PPR-ST-005',  'Chimie',                 'ST',   'PH',  '1973-08-21', 'M', '2001-09-01'),
            ('n.elbaraka@fpt.ac.ma',    'Noureddine',     'EL BARAKA',      'JC400001',  '0661234514', 'PPR-ST-006',  'Chimie',                 'ST',   'PA',  '1983-03-07', 'M', '2010-09-01'),
            ('r.aitbrahim@fpt.ac.ma',   'Rachid',         'AIT BRAHIM',     'RA001234',  '0661234515', 'PPR-ST-007',  'Physique',               'ST',   'PH',  '1971-07-19', 'M', '1999-09-01'),
            ('h.ouali@fpt.ac.ma',       'Houda',          'OUALI',          'HO001234',  '0661234516', 'PPR-ST-008',  'Biologie',               'ST',   'PA',  '1986-11-02', 'F', '2013-09-01'),

            # ── Département SEG ──
            ('m.jaad@fpt.ac.ma',        'Mustapha',       'JAAD',           'I965001',   '0661234517', 'PPR-SEG-001', 'Économie',               'SEG',  'PH',  '1970-04-11', 'M', '1998-09-01'),
            ('n.aiterrayss@fpt.ac.ma',  'Noureddine',     'AIT ERRAYSS',    'E433001',   '0661234518', 'PPR-SEG-002', 'Économie',               'SEG',  'PH',  '1972-09-25', 'M', '2000-09-01'),
            ('k.benamara@fpt.ac.ma',    'Khalid',         'BENAMARA',       'I370001',   '0661234519', 'PPR-SEG-003', 'Économie',               'SEG',  'PES', '1964-01-30', 'M', '1992-09-01'),
            ('s.oulhaj@fpt.ac.ma',      'Samir',          'OULHAJ',         'SO001234',  '0661234520', 'PPR-SEG-004', 'Gestion',                'SEG',  'PA',  '1984-06-16', 'M', '2011-09-01'),
            ('n.benmoussa@fpt.ac.ma',   'Naima',          'BEN MOUSSA',     'NB001234',  '0661234521', 'PPR-SEG-005', 'Finance',                'SEG',  'PA',  '1988-02-14', 'F', '2015-09-01'),
            ('a.elgharbi@fpt.ac.ma',    'Abdelkrim',      'EL GHARBI',      'AG001234',  '0661234522', 'PPR-SEG-006', 'Comptabilité',           'SEG',  'PH',  '1974-10-08', 'M', '2002-09-01'),

            # ── Département SHS ──
            ('a.elmanssouri@fpt.ac.ma', 'Azeddine',       'ELMANSSOURI',    'AE001234',  '0661234523', 'PPR-SHS-001', 'Droit',                  'SHS',  'PA',  '1982-05-20', 'M', '2009-09-01'),
            ('m.sabir@fpt.ac.ma',       'Marwane',        'SABIR',          'MS001234',  '0661234524', 'PPR-SHS-002', 'Langue Espagnole',       'SHS',  'PA',  '1986-03-15', 'M', '2013-09-01'),
            ('n.kroudo@fpt.ac.ma',      'Nadia',          'KROUDO',         'NK001234',  '0661234525', 'PPR-SHS-003', 'Espagnol',               'SHS',  'PA',  '1988-07-04', 'F', '2015-09-01'),
            ('m.elharti@fpt.ac.ma',     'Mohammed',       'EL HARTI',       'ME001234',  '0661234526', 'PPR-SHS-004', 'Langue Française',       'SHS',  'PH',  '1973-12-22', 'M', '2001-09-01'),
            ('f.zouine@fpt.ac.ma',      'Fatima',         'ZOUINE',         'FZ001234',  '0661234527', 'PPR-SHS-005', 'Sociologie',             'SHS',  'PA',  '1987-09-11', 'F', '2014-09-01'),
            ('a.benhaddou@fpt.ac.ma',   'Ahmed',          'BEN HADDOU',     'AB001234',  '0661234528', 'PPR-SHS-006', 'Histoire',               'SHS',  'PES', '1963-04-05', 'M', '1991-09-01'),
            ('l.aittaleb@fpt.ac.ma',    'Laila',          'AIT TALEB',      'LA001234',  '0661234529', 'PPR-SHS-007', 'Philosophie',            'SHS',  'PA',  '1990-06-28', 'F', '2017-09-01'),
            ('o.benkirane@fpt.ac.ma',   'Omar',           'BENKIRANE',      'OB001234',  '0661234530', 'PPR-SHS-008', 'Langue Arabe',           'SHS',  'PH',  '1976-11-17', 'M', '2004-09-01'),
        ]

        emp_counter = Employee.objects.count() + 1
        for email, first, last, cin, phone, ppr, spec, dept_code, grade, dob, gender, hire in profs_data:
            user = self._create_user(email, first, last, 'PROFESSOR', 'prof123456', phone=phone)
            if user and not Employee.objects.filter(user=user).exists():
                emp = Employee.objects.create(
                    user=user,
                    employee_id=f'FPT-PROF-{emp_counter:03d}',
                    employee_type='PROFESSOR',
                    department=depts[dept_code],
                    position=positions[grade],
                    numero_somme=ppr,
                    cin=cin,
                    date_of_birth=dob,
                    gender=gender,
                    hire_date=hire,
                    contract_type='PERMANENT',
                )
                ProfessorProfile.objects.get_or_create(
                    employee=emp,
                    defaults={'specialization': spec, 'academic_rank': grade}
                )
                self.stdout.write(f'  [NEW] Prof: {first} {last} ({dept_code} / {grade})')
            emp_counter += 1

        # ──────────────────────────────
        # 5. STAFF (administratif)
        # ──────────────────────────────
        staff_data = [
            ('rh@fpt.ac.ma',         'Fatima',   'TAHIRI',   'ADMIN_HR', 'FT001234', '0661234531', 'PPR-ADM-001', 'INFO', 'ADM', '1978-03-10', 'F', '2005-01-15'),
            ('scolarite@fpt.ac.ma',  'Ahmed',    'TAZI',     'STAFF',    'AT001234', '0661234532', 'PPR-ADM-002', 'SEG',  'SEC', '1982-07-20', 'M', '2008-09-01'),
            ('comptable@fpt.ac.ma',  'Khadija',  'AMRANI',   'STAFF',    'KA001234', '0661234533', 'PPR-ADM-003', 'SEG',  'ADM', '1980-11-05', 'F', '2006-01-01'),
            ('biblio@fpt.ac.ma',     'Youssef',  'LAHLOU',   'STAFF',    'YL001234', '0661234534', 'PPR-ADM-004', 'SHS',  'TECH','1985-04-25', 'M', '2010-09-01'),
        ]
        for email, first, last, role, cin, phone, ppr, dept_code, grade, dob, gender, hire in staff_data:
            user = self._create_user(email, first, last, role, 'staff123456', phone=phone)
            if user and not Employee.objects.filter(user=user).exists():
                emp = Employee.objects.create(
                    user=user,
                    employee_id=f'FPT-STAFF-{emp_counter:03d}',
                    employee_type='STAFF',
                    department=depts[dept_code],
                    position=positions[grade],
                    numero_somme=ppr,
                    cin=cin,
                    date_of_birth=dob,
                    gender=gender,
                    hire_date=hire,
                    contract_type='PERMANENT',
                )
                StaffProfile.objects.get_or_create(
                    employee=emp,
                    defaults={'service': depts[dept_code].name}
                )
                self.stdout.write(f'  [NEW] Staff: {first} {last} ({role})')
            emp_counter += 1

        # ──────────────────────────────
        # 6. LEAVE TYPES
        # ──────────────────────────────
        from apps.leaves.models import LeaveType
        leave_types = [
            ('Congé annuel',       'ANNUAL',      22, True),
            ('Congé maladie',      'SICK',         30, True),
            ('Congé maternité',    'MATERNITY',    98, True),
            ('Congé exceptionnel', 'EXCEPTIONAL',   5, True),
            ('Congé académique',   'ACADEMIC',     30, True),
        ]
        for name, cat, days, paid in leave_types:
            _, c = LeaveType.objects.get_or_create(
                name=name,
                defaults={'category': cat, 'max_days_per_year': days, 'is_paid': paid}
            )
            self._log(c, f'Leave type: {name}')

        # ──────────────────────────────
        # 7. CHEFS DE DÉPARTEMENT
        # Source Espace: dept 4 → chef=30 (IGUERNANE), dept 5 → chef=83,
        #                dept 6 → chef=52 (BENAMARA),  dept 7 → chef=16 (EL MORJANI)
        # ──────────────────────────────
        chef_map = {
            'INFO': 'y.essaady@uiz.ma',
            'ST':   'z.elmorjani@fpt.ac.ma',
            'SEG':  'k.benamara@fpt.ac.ma',
            'SHS':  'a.benhaddou@fpt.ac.ma',
        }
        for dept_code, chef_email in chef_map.items():
            try:
                chef_user = User.objects.get(email=chef_email)
                chef_user.role = 'DEPARTMENT_HEAD'
                chef_user.save(update_fields=['role'])
                depts[dept_code].head = chef_user.employee
                depts[dept_code].save(update_fields=['head'])
                self.stdout.write(f'  [UPD] Chef {dept_code}: {chef_email}')
            except Exception:
                pass

        # ──────────────────────────────
        # 8. DOCUMENT TEMPLATES (5 modèles FPT réels)
        # ──────────────────────────────
        from apps.certificates.models import DocumentTemplate

        HEADER = '<div style="text-align:center; margin-bottom:10px;"><img src="/assets/fpt-logo.png" alt="FPT" style="max-height:80px; width:auto;"/></div>'

        FOOTER = '''Hay El Mohammadi (Lastah), B.P : 271, C.P : 83000, Taroudant تارودانت &nbsp;|&nbsp;
        Tél. : +212(0)5 28 55 10 10, Fax : +212(0)5 28 55 10 20, Site Web: <strong>www.fpt.ac.ma</strong>'''

        templates = [
            # ── 1. Attestation de Travail ──
            {
                'name': 'Attestation de Travail',
                'category': 'ATTESTATION',
                'language': 'FR',
                'target_audience': 'EMPLOYEE',
                'description': 'Attestation confirmant que l\'employé est en fonction à la FPT.',
                'variables': [
                    {'key': 'employee_name',  'label': 'Nom et Prénom',   'type': 'auto'},
                    {'key': 'position',       'label': 'Grade',           'type': 'auto'},
                    {'key': 'numero_somme',   'label': 'SOM (PPR)',       'type': 'auto'},
                    {'key': 'cin',            'label': 'CIN',             'type': 'auto'},
                    {'key': 'hire_date',      'label': 'Date de recrutement', 'type': 'auto'},
                    {'key': 'date_today',     'label': 'Date du jour',    'type': 'auto'},
                ],
                'custom_css': '''
                    body { font-family: "Times New Roman", serif; font-size: 12pt; }
                    .title { text-align:center; font-size:16pt; font-weight:bold;
                             text-decoration:underline; font-style:italic; margin:30px 0; }
                    .body-text { text-align:justify; line-height:2; margin: 20px 0; }
                    .field { font-weight:bold; text-decoration:underline; }
                    .signature { margin-top:60px; text-align:right; }
                ''',
                'content': '''
                <div class="title">Attestation de Travail</div>
                <div class="body-text">
                  Le Doyen de La Faculté Polydisciplinaire de Taroudant atteste que Monsieur :
                </div>
                <div class="body-text" style="margin-left:40px;">
                  <span class="field">Nom et Prénom :</span> {{employee_name}}<br><br>
                  <span class="field">Grade :</span> {{position}}<br><br>
                  <span style="font-weight:bold;">SOM</span> : {{numero_somme}}<br><br>
                  <span style="font-weight:bold;">CIN</span> &nbsp;: {{cin}}
                </div>
                <div class="body-text">
                  Est en fonction à la Faculté Polydisciplinaire de Taroudant depuis le
                  <strong>{{hire_date}}</strong>.<br>
                  La présente attestation est délivrée à l\'intéressé sur sa demande pour servir et valoir
                  ce que de droit.
                </div>
                <div class="signature">
                  Fait à Taroudant le {{date_today}}
                </div>
                <div class="signature-block" style="margin-top:50px;">
                  <table><tr>
                    <td><div class="sig-label">Signature de l'intéressé(e)</div><div class="sig-img">{{employee_signature}}</div></td>
                    <td style="text-align:right;"><div class="sig-label">Le Doyen</div><div class="sig-img">{{signature}}</div></td>
                  </tr></table>
                </div>
                ''',
            },

            # ── 2. Attestation de Surveillance ──
            {
                'name': 'Attestation de Surveillance',
                'category': 'ATTESTATION',
                'language': 'FR',
                'target_audience': 'EMPLOYEE',
                'description': 'Attestation des heures de surveillance des examens.',
                'variables': [
                    {'key': 'employee_name',      'label': 'Nom et Prénom',          'type': 'auto'},
                    {'key': 'cin',                'label': 'CIN',                    'type': 'auto'},
                    {'key': 'heures_surveillance','label': 'Nombre d\'heures',       'type': 'manual'},
                    {'key': 'session',            'label': 'Session (printemps...)', 'type': 'manual'},
                    {'key': 'semestre1',          'label': 'Semestre 1',             'type': 'manual'},
                    {'key': 'semestre2',          'label': 'Semestre 2',             'type': 'manual'},
                    {'key': 'semestre3',          'label': 'Semestre 3',             'type': 'manual'},
                    {'key': 'annee_univ',         'label': 'Année universitaire',    'type': 'manual'},
                    {'key': 'date_today',         'label': 'Date du jour',           'type': 'auto'},
                ],
                'custom_css': '''
                    body { font-family: "Times New Roman", serif; font-size: 12pt; }
                    .title { text-align:center; font-size:16pt; font-weight:bold;
                             text-decoration:underline; font-style:italic; margin:30px 0; letter-spacing:3px; }
                    .body-text { text-align:justify; line-height:2; margin:20px 0; }
                    .field { font-weight:bold; text-decoration:underline; }
                    .highlight { color: red; font-style:italic; }
                    .signature { margin-top:60px; text-align:right; }
                ''',
                'content': '''
                <div class="title">ATTESTATION &nbsp; SURVEILLANCE</div>
                <div class="body-text">
                  Je soussigné, Monsieur le Doyen de la Faculté Polydisciplinaire de Taroudant atteste
                  que le Professeur :
                </div>
                <div class="body-text" style="margin-left:20px;">
                  <span class="field">Nom et Prénom</span> : {{employee_name}}<br><br>
                  <span class="field">CIN</span> &nbsp;— {{cin}}
                </div>
                <div class="body-text">
                  A assuré <strong>{{heures_surveillance}}</strong> heures de surveillance au courant des examens
                  de la <span class="highlight">session</span> du printemps des
                  <span class="highlight">semestres</span> {{semestre1}}, {{semestre2}} et {{semestre3}}
                  de l\'année universitaire <strong>{{annee_univ}}</strong>.<br><br>
                  La présente attestation est délivrée à l\'intéressé sur sa demande pour servir et valoir
                  ce que de droit.
                </div>
                <div class="signature">
                  Fait à Taroudant le {{date_today}}
                </div>
                <div class="signature-block" style="margin-top:50px;">
                  <table><tr>
                    <td><div class="sig-label">Signature de l'intéressé(e)</div><div class="sig-img">{{employee_signature}}</div></td>
                    <td style="text-align:right;"><div class="sig-label">Le Doyen</div><div class="sig-img">{{signature}}</div></td>
                  </tr></table>
                </div>
                ''',
            },

            # ── 3. Ordre de Mission ──
            {
                'name': 'Ordre de Mission',
                'category': 'ORDRE_MISSION',
                'language': 'FR',
                'target_audience': 'EMPLOYEE',
                'description': 'Ordre de mission pour déplacement officiel.',
                'variables': [
                    {'key': 'employee_name',   'label': 'Nom et Prénom',      'type': 'auto'},
                    {'key': 'position',        'label': 'Grade',              'type': 'auto'},
                    {'key': 'numero_somme',    'label': 'SOM (PPR)',          'type': 'auto'},
                    {'key': 'cin',             'label': 'CIN',                'type': 'auto'},
                    {'key': 'indice',          'label': 'Indice',             'type': 'manual'},
                    {'key': 'destination',     'label': 'Destination',        'type': 'manual'},
                    {'key': 'objet_mission',   'label': 'Objet de la mission','type': 'manual'},
                    {'key': 'evenement',       'label': 'Événement',          'type': 'manual'},
                    {'key': 'moyen_transport', 'label': 'Moyen de transport', 'type': 'manual'},
                    {'key': 'date_depart',     'label': 'Date de départ',     'type': 'manual'},
                    {'key': 'date_retour',     'label': 'Date de retour',     'type': 'manual'},
                    {'key': 'accompagnants',   'label': 'Accompagnants',      'type': 'manual'},
                    {'key': 'date_today',      'label': 'Date du jour',       'type': 'auto'},
                ],
                'custom_css': '''
                    body { font-family: "Times New Roman", serif; font-size: 12pt; }
                    .title { text-align:center; font-size:15pt; font-weight:bold;
                             border:2px solid #000; padding:8px 20px;
                             display:inline-block; margin:20px auto; }
                    .title-wrap { text-align:center; margin:20px 0; }
                    .body-text { text-align:justify; line-height:1.9; margin:10px 0; }
                    .indent { margin-left:40px; }
                    .field { font-weight:bold; }
                    .signature { margin-top:60px; text-align:right; }
                ''',
                'content': '''
                <div class="title-wrap"><span class="title">ORDRE DE MISSION</span></div>
                <div class="body-text">
                  Le Doyen de La Faculté Polydisciplinaire de Taroudant<br>
                  Ordonne à Monsieur :
                </div>
                <div class="body-text indent">
                  <span class="field">Nom et Prénom :</span> {{employee_name}}<br>
                  <span class="field">Grade :</span> {{position}}<br>
                  <span class="field">Indice :</span> {{indice}}<br>
                  <span class="field">SOM</span> : {{numero_somme}}<br>
                  <span class="field">CIN</span> &nbsp;: {{cin}}
                </div>
                <div class="body-text" style="margin-top:20px;">
                  De se rendre en mission à : <strong>{{destination}}</strong>.<br>
                  Pour (objet de mission) : {{objet_mission}}<br>
                  à l\'événement : <strong>{{evenement}}</strong>.<br>
                  Moyen de Transport : <strong>{{moyen_transport}}</strong><br>
                  Date de Départ : <strong>{{date_depart}}</strong><br>
                  Date de retour : <strong>{{date_retour}}</strong><br>
                  Accompagnants : {{accompagnants}}.
                </div>
                <div class="signature">
                  Fait à Taroudant le {{date_today}}
                </div>
                <div class="signature-block" style="margin-top:50px;">
                  <table><tr>
                    <td><div class="sig-label">Signature de l'intéressé(e)</div><div class="sig-img">{{employee_signature}}</div></td>
                    <td style="text-align:right;"><div class="sig-label">Le Doyen</div><div class="sig-img">{{signature}}</div></td>
                  </tr></table>
                </div>
                ''',
            },

            # ── 4. Demande d'Autorisation (Cumul de fonctions) ──
            {
                'name': "Demande d'Autorisation de Cumul",
                'category': 'AUTORISATION',
                'language': 'AR',
                'target_audience': 'EMPLOYEE',
                'description': 'طلب الترخيص بالجمع بين الوظيفة والأنشطة الأخرى (مزاولة مهام التدريس).',
                'variables': [
                    {'key': 'employee_name',  'label': 'الاسم الكامل',         'type': 'auto'},
                    {'key': 'cin',            'label': 'رقم التاجر / CIN',     'type': 'auto'},
                    {'key': 'position',       'label': 'الدرجة',               'type': 'auto'},
                    {'key': 'numero_somme',   'label': 'الإطار / SOM',         'type': 'auto'},
                    {'key': 'institution',    'label': 'المؤسسة',              'type': 'manual'},
                    {'key': 'asas',           'label': 'الأساس',               'type': 'manual'},
                    {'key': 'heures_cumul',   'label': 'عدد الساعات الشهرية', 'type': 'manual'},
                    {'key': 'date_today',     'label': 'التاريخ',              'type': 'auto'},
                ],
                'custom_css': '''
                    body { font-family: "Traditional Arabic", "Amiri", serif;
                           font-size: 12pt; direction: rtl; text-align: right; }
                    .title { text-align:center; font-size:14pt; font-weight:bold; margin:20px 0; }
                    table { width:100%; border-collapse:collapse; margin:15px 0; font-size:11pt; }
                    td, th { border:1px solid #000; padding:5px 8px; text-align:center; }
                    .schedule-table td { height:25px; }
                    .note { font-weight:bold; margin-top:15px; }
                    .signature-row { display:flex; justify-content:space-between; margin-top:50px; }
                ''',
                'content': '''
                <div class="title">طلب الترخيص بالجمع بين الوظيفة والأنشطة الأخرى (مزاولة مهام التدريس)</div>
                <p style="text-align:center; font-size:10pt;">
                  بناء على المرسوم الملكي رقم 1.59.008 بتاريخ 24 فبراير 1968<br>
                  - منشور السيد الوزير الأول رقم 760 بتاريخ 7 أبريل 2003<br>
                  - المرسوم رقم 2.08.11 بتاريخ 9 يوليوز 2009
                </p>
                <table>
                  <tr>
                    <td><strong>الاسم الكامل</strong></td>
                    <td>{{employee_name}}</td>
                    <td><strong>رقم التاجر</strong></td>
                    <td>{{cin}}</td>
                  </tr>
                  <tr>
                    <td><strong>الإطار</strong></td>
                    <td colspan="3">{{numero_somme}}</td>
                  </tr>
                  <tr>
                    <td><strong>الدرجة</strong></td>
                    <td colspan="3">{{position}}</td>
                  </tr>
                  <tr>
                    <td><strong>الجامعة</strong></td>
                    <td>جامعة ابن زهر</td>
                    <td><strong>المؤسسة</strong></td>
                    <td>الكلية المتعددة التخصصات بتارودانت</td>
                  </tr>
                </table>
                <p>يشرفني أن أتمس من السيد رئيس الجامعة الترخيص لي بمزاولة مهنة التدريس بالإضافة إلى وظيفتي الأصلية خلال السنة الجامعية ----/----  فقط.</p>
                <table>
                  <tr><td><strong>المؤسسة الخاصة و المدنية</strong></td><td>{{institution}}</td></tr>
                  <tr><td><strong>الأساس</strong></td><td>{{asas}}</td></tr>
                  <tr><td><strong>عدد الساعات الشهرية المطلوب الترخيص بها (*)</strong></td><td>{{heures_cumul}}</td></tr>
                </table>
                <table class="schedule-table">
                  <tr>
                    <th rowspan="2">الأيام</th>
                    <th colspan="2">الفترة الصباحية</th>
                    <th colspan="2">الفترة المسائية</th>
                  </tr>
                  <tr><th>من</th><th>إلى</th><th>من</th><th>إلى</th></tr>
                  <tr><td>الاثنين</td><td></td><td></td><td></td><td></td></tr>
                  <tr><td>الثلاثاء</td><td></td><td></td><td></td><td></td></tr>
                  <tr><td>الأربعاء</td><td></td><td></td><td></td><td></td></tr>
                  <tr><td>الخميس</td><td></td><td></td><td></td><td></td></tr>
                  <tr><td>الجمعة</td><td></td><td></td><td></td><td></td></tr>
                  <tr><td>السبت</td><td></td><td></td><td></td><td></td></tr>
                </table>
                <p class="note">(*) كما ألتزم بالتقيد بعدد الساعات المشار إليها أعلاه في حدود 20 ساعة كل شهر.</p>
                <p style="margin-top:30px;">حرر في تارودانت بتاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;</p>
                <div class="signature-row">
                  <span>موافقة رئيس المؤسسة</span>
                  <span>إمضاء صاحب الطلب</span>
                </div>
                ''',
            },

            # ── 5. شهادة FPT ──
            {
                'name': 'شهادة FPT',
                'category': 'ATTESTATION',
                'language': 'AR',
                'target_audience': 'EMPLOYEE',
                'description': 'شهادة تثبت قيام الأستاذ بتدريس مادة معينة خلال الموسم الجامعي.',
                'variables': [
                    {'key': 'employee_name',  'label': 'اسم الأستاذ',          'type': 'auto'},
                    {'key': 'cin',            'label': 'رقم بطاقة التعريف',    'type': 'auto'},
                    {'key': 'heures_cours',   'label': 'عدد ساعات الدرس',      'type': 'manual'},
                    {'key': 'matiere',        'label': 'اسم المادة',           'type': 'manual'},
                    {'key': 'semestre',       'label': 'الفصل',                'type': 'manual'},
                    {'key': 'filiere',        'label': 'المسلك',               'type': 'manual'},
                    {'key': 'annee_univ',     'label': 'الموسم الجامعي',       'type': 'manual'},
                    {'key': 'date_today',     'label': 'التاريخ',              'type': 'auto'},
                ],
                'custom_css': '''
                    body { font-family: "Traditional Arabic", "Amiri", serif;
                           font-size: 13pt; direction: rtl; text-align: right; line-height: 2; }
                    .title { text-align:center; font-size:22pt; font-weight:bold;
                             color:#000; margin:30px 0; font-family: "Comic Sans MS", cursive; }
                    .title span { color: red; text-decoration: underline wavy red; }
                    .body-text { text-align:justify; margin:20px 0; }
                    .signature { margin-top:40px; text-align:right; }
                ''',
                'content': '''
                <div class="title">شهادة <span>fpt</span></div>
                <div class="body-text">
                  يشهد السيد عميد الكلية المتعددة التخصصات بتارودانت -جامعة ابن زهر-
                  أن الأستاذ: {{employee_name}} الحامل لبطاقة التعريف الوطنية رقم {{cin}}
                  قد درّس {{heures_cours}} ساعة من الأعمال التوجيهية، مادة <strong>{{matiere}}</strong>
                  ({{semestre}}) مسلك {{filiere}}
                  خلال الموسم الجامعي {{annee_univ}}.
                </div>
                <div class="body-text">
                  سلمت هذه الشهادة للمعني بالأمر بناء على طلبه للإدلاء بها عند الحاجة.
                </div>
                <div class="signature">
                  {{date_today}}
                </div>
                ''',
            },
        ]

        for t in templates:
            obj, c = DocumentTemplate.objects.get_or_create(
                name=t['name'],
                defaults={
                    'category':        t['category'],
                    'language':        t['language'],
                    'target_audience': t['target_audience'],
                    'description':     t['description'],
                    'variables':       t['variables'],
                    'custom_css':      t['custom_css'],
                    'content':         t['content'],
                    'header_html':     HEADER,
                    'footer_html':     FOOTER,
                    'is_active':       True,
                }
            )
            self._log(c, f'Template: {t["name"]}')

        # Summary
        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Users: {User.objects.count()} | '
            f'Employees: {Employee.objects.count()} | '
            f'Departments: {Department.objects.count()} | '
            f'Positions: {Position.objects.count()}'
        ))
        self.stdout.write(self.style.SUCCESS(
            '\nTest accounts:\n'
            '  admin@fpt.ac.ma        / admin123456  (Admin HR)\n'
            '  y.essaady@uiz.ma       / prof123456   (Chef Dept INFO)\n'
            '  z.elmorjani@fpt.ac.ma  / prof123456   (Chef Dept ST)\n'
            '  k.benamara@fpt.ac.ma   / prof123456   (Chef Dept SEG)\n'
            '  a.benhaddou@fpt.ac.ma  / prof123456   (Chef Dept SHS)\n'
            '  rh@fpt.ac.ma           / staff123456  (Admin HR Staff)\n'
        ))

    def _create_user(self, email, first, last, role, password, phone=''):
        if User.objects.filter(email=email).exists():
            self.stdout.write(f'  [EXISTS] {email}')
            return User.objects.get(email=email)
        user = User.objects.create_user(
            username=email.split('@')[0].replace('.', '_'),
            email=email,
            password=password,
            first_name=first,
            last_name=last,
            role=role,
            phone=phone,
        )
        self.stdout.write(f'  [NEW] User: {first} {last} ({role})')
        return user

    def _log(self, created, msg):
        try:
            self.stdout.write(f'  [{"NEW" if created else "EXISTS"}] {msg}')
        except UnicodeEncodeError:
            self.stdout.write(f'  [{"NEW" if created else "EXISTS"}] (non-ascii name)')
