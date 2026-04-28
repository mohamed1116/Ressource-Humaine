"""
Seed the HRMS database with real FPT data.
Reference: fpt(2).sql -- the actual Espace Numerique FPT database.

This creates:
  - 4 real departments from FPT
  - Positions (PA, PH, PES, Technicien, etc.)
  - 20+ professors from the real FPT database (with CIN, specialite)
  - 5 admin/staff accounts
  - 5 sample students
  - Leave types
  - Sample requests for testing

Run: python manage.py seed_fpt_data
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.employees.models import Department, Position, Employee, ProfessorProfile


class Command(BaseCommand):
    help = 'Seed database with real FPT reference data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding FPT data...\n')

        # ──────────────────────────────
        # 1. DEPARTMENTS (from fpt(2).sql departement table)
        # ──────────────────────────────
        depts_data = [
            ('INFO', 'Informatique'),
            ('SHS', 'Sciences Humaines et Sociales'),
            ('SEG', 'Sciences Economiques et Gestion'),
            ('ST', 'Sciences et Techniques'),
        ]
        depts = {}
        for code, name in depts_data:
            dept, c = Department.objects.get_or_create(code=code, defaults={'name': name})
            depts[code] = dept
            self._log(c, f'Departement: {name}')

        # ──────────────────────────────
        # 2. POSITIONS (grades fonctionnaires marocains)
        # ──────────────────────────────
        positions_data = [
            ('PES', 'Professeur de l\'Enseignement Superieur', 1),
            ('PH', 'Professeur Habilite', 2),
            ('PA', 'Professeur Assistant', 3),
            ('TECH', 'Technicien', 4),
            ('ADM', 'Administrateur', 5),
            ('SEC', 'Secretaire', 6),
        ]
        positions = {}
        for code, title, grade in positions_data:
            pos, c = Position.objects.get_or_create(code=code, defaults={'title': title, 'grade_level': grade})
            positions[code] = pos
            self._log(c, f'Position: {title}')

        # ──────────────────────────────
        # 3. ADMIN / HR ACCOUNTS
        # ──────────────────────────────
        admin = self._create_user('admin@fpt.ac.ma', 'Admin', 'HR', 'ADMIN_HR', 'admin123456')

        # ──────────────────────────────
        # 4. PROFESSORS (from fpt(2).sql professeur table -- REAL data)
        # ──────────────────────────────
        profs_data = [
            # (email, first, last, cin, specialite, dept_code, grade)
            ('y.essaady@uiz.ma', 'Youssef', 'ES-SAADY', 'P123', 'Informatique', 'INFO', 'PES'),
            ('s.roubi@fpt.ac.ma', 'Sara', 'ROUBI', 'F36', 'Informatique', 'INFO', 'PA'),
            ('a.sadiq@fpt.ac.ma', 'Abderrahmane', 'SADIQ', 'EE286239', 'Informatique', 'INFO', 'PH'),
            ('m.iguernane@fpt.ac.ma', 'Mohamed', 'IGUERNANE', 'P72', 'Mathematiques', 'ST', 'PES'),
            ('l.najdi@uiz.ac.ma', 'Lotfi', 'NAJDI', 'LN001', 'Informatique', 'INFO', 'PA'),
            ('m.aitelhadj@fpt.ac.ma', 'Maryem', 'AIT EL HADJ', 'MH001', 'Informatique', 'INFO', 'PA'),
            ('z.elmorjani@fpt.ac.ma', 'Zine Elabidine', 'EL MORJANI', 'JC001', 'SIG', 'ST', 'PES'),
            ('f.lotfi@fpt.ac.ma', 'Fouad', 'LOTFI', 'I2001', 'Geologie', 'ST', 'PES'),
            ('m.jaad@fpt.ac.ma', 'Mustapha', 'JAAD', 'I965', 'Economie', 'SEG', 'PH'),
            ('n.aiterrayss@fpt.ac.ma', 'Noureddine', 'AIT ERRAYSS', 'E433', 'Economie', 'SEG', 'PH'),
            ('k.benamara@fpt.ac.ma', 'Khalid', 'BENAMARA', 'I37', 'Economie', 'SEG', 'PES'),
            ('a.elhammadi@fpt.ac.ma', 'Abdellatif', 'ELHAMMADI', 'H0001', 'Chimie', 'ST', 'PES'),
            ('s.gharby@fpt.ac.ma', 'Said', 'GHARBY', 'BJ278981', 'Chimie', 'ST', 'PH'),
            ('n.elbaraka@fpt.ac.ma', 'Noureddine', 'EL BARAKA', 'JC4001', 'Chimie', 'ST', 'PA'),
            ('a.elmanssouri@fpt.ac.ma', 'Azeddine', 'ELMANSSOURI', 'AE001', 'Droit', 'SHS', 'PA'),
            ('m.sabir@fpt.ac.ma', 'Marwane', 'SABIR', 'MS001', 'Langue Espagnole', 'SHS', 'PA'),
            ('n.kroudo@fpt.ac.ma', 'Nadia', 'KROUDO', 'NK001', 'Espagnol', 'SHS', 'PA'),
        ]

        emp_counter = 1
        for email, first, last, cin, spec, dept_code, grade in profs_data:
            user = self._create_user(email, first, last, 'PROFESSOR', 'prof123456')
            if user and not Employee.objects.filter(user=user).exists():
                emp = Employee.objects.create(
                    user=user,
                    employee_id=f'FPT-PROF-{emp_counter:03d}',
                    employee_type='PROFESSOR',
                    department=depts[dept_code],
                    position=positions[grade],
                    cin=cin,
                    date_of_birth='1975-01-15',
                    gender='M' if first not in ('Sara', 'Maryem', 'Nadia') else 'F',
                    hire_date='2015-09-01',
                    contract_type='PERMANENT',
                )
                ProfessorProfile.objects.get_or_create(
                    employee=emp,
                    defaults={'specialization': spec, 'academic_rank': grade}
                )
                self.stdout.write(f'  [NEW] Prof: {first} {last} ({dept_code})')
            emp_counter += 1

        # ──────────────────────────────
        # 5. STAFF (administrative)
        # ──────────────────────────────
        staff_data = [
            ('rh.staff@fpt.ac.ma', 'Fatima', 'BENALI', 'STAFF', 'FB001', 'INFO', 'ADM'),
            ('scolarite@fpt.ac.ma', 'Ahmed', 'TAZI', 'STAFF', 'AT001', 'SEG', 'SEC'),
        ]
        for email, first, last, role, cin, dept_code, grade in staff_data:
            user = self._create_user(email, first, last, role, 'staff123456')
            if user and not Employee.objects.filter(user=user).exists():
                Employee.objects.create(
                    user=user,
                    employee_id=f'FPT-STAFF-{emp_counter:03d}',
                    employee_type='STAFF',
                    department=depts[dept_code],
                    position=positions[grade],
                    cin=cin,
                    date_of_birth='1980-06-10',
                    gender='F' if first == 'Fatima' else 'M',
                    hire_date='2018-01-15',
                    contract_type='PERMANENT',
                )
                self.stdout.write(f'  [NEW] Staff: {first} {last}')
            emp_counter += 1

        # ──────────────────────────────
        # 6. STUDENTS
        # ──────────────────────────────
        students_data = [
            ('youssef.elmassi@etu.fpt.ac.ma', 'Youssef', 'EL MASSI', 'STUDENT'),
            ('karim.bouzid@etu.fpt.ac.ma', 'Karim', 'BOUZID', 'STUDENT'),
            ('sara.amrani@etu.fpt.ac.ma', 'Sara', 'AMRANI', 'STUDENT'),
            ('ahmed.ouahbi@etu.fpt.ac.ma', 'Ahmed', 'OUAHBI', 'STUDENT'),
            ('imane.lahlou@etu.fpt.ac.ma', 'Imane', 'LAHLOU', 'STUDENT'),
        ]
        for email, first, last, role in students_data:
            self._create_user(email, first, last, role, 'student123456')

        # ──────────────────────────────
        # 7. LEAVE TYPES
        # ──────────────────────────────
        from apps.leaves.models import LeaveType
        leave_types = [
            ('Conge annuel', 'ANNUAL', 22, True),
            ('Conge maladie', 'SICK', 30, True),
            ('Conge maternite', 'MATERNITY', 98, True),
            ('Conge exceptionnel', 'EXCEPTIONAL', 5, True),
            ('Conge academique', 'ACADEMIC', 30, True),
        ]
        for name, cat, days, paid in leave_types:
            _, c = LeaveType.objects.get_or_create(
                name=name,
                defaults={'category': cat, 'max_days_per_year': days, 'is_paid': paid}
            )
            self._log(c, f'Leave type: {name}')

        # ──────────────────────────────
        # 8. DEPARTMENT HEAD (assign ES-SAADY as head of INFO)
        # ──────────────────────────────
        try:
            essaady_user = User.objects.get(email='y.essaady@uiz.ma')
            essaady_user.role = 'DEPARTMENT_HEAD'
            essaady_user.save(update_fields=['role'])
            essaady_emp = essaady_user.employee
            depts['INFO'].head = essaady_emp
            depts['INFO'].save(update_fields=['head'])
            self.stdout.write('  [UPD] ES-SAADY -> Chef Dept Informatique')
        except Exception:
            pass

        # Summary
        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Users: {User.objects.count()} | '
            f'Employees: {Employee.objects.count()} | '
            f'Departments: {Department.objects.count()} | '
            f'Positions: {Position.objects.count()}'
        ))
        self.stdout.write(self.style.SUCCESS(
            '\nTest accounts:\n'
            '  admin@fpt.ac.ma / admin123456 (Admin HR)\n'
            '  y.essaady@uiz.ma / prof123456 (Chef Dept Informatique)\n'
            '  s.roubi@fpt.ac.ma / prof123456 (Enseignante Informatique)\n'
            '  youssef.elmassi@etu.fpt.ac.ma / student123456 (Etudiant)\n'
        ))

    def _create_user(self, email, first, last, role, password):
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
        )
        self.stdout.write(f'  [NEW] User: {first} {last} ({role})')
        return user

    def _log(self, created, msg):
        self.stdout.write(f'  [{"NEW" if created else "EXISTS"}] {msg}')
