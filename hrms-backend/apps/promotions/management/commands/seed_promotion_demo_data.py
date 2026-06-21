"""
Management command: seed_promotion_demo_data
Creates realistic demo data for the promotion module.
Usage: python manage.py seed_promotion_demo_data
"""
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.employees.models import Employee
from apps.promotions.models import PromotionRule, EmployeePromotionProfile, PromotionTableInstance, PromotionHistory


# ── Real cadre/grade/echelon/indice data from official Moroccan tables ──
PROMOTION_RULES = [
    # PROFESSORS — Echelon promotions (2 years per echelon)
    # Professeur de l'Enseignement Superieur (PES) Classe A
    dict(employee_type='PROFESSOR', cadre='Professeur de l\'Enseignement Superieur',
         current_grade_code='A', current_echelon=1, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=2, next_indice=785),
    dict(employee_type='PROFESSOR', cadre='Professeur de l\'Enseignement Superieur',
         current_grade_code='A', current_echelon=2, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=3, next_indice=810),
    dict(employee_type='PROFESSOR', cadre='Professeur de l\'Enseignement Superieur',
         current_grade_code='A', current_echelon=3, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=4, next_indice=835),
    dict(employee_type='PROFESSOR', cadre='Professeur de l\'Enseignement Superieur',
         current_grade_code='A', current_echelon=4, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=5, next_indice=860),
    # Professeur Habilite (MCH) Classe A
    dict(employee_type='PROFESSOR', cadre='Professeur Habilite',
         current_grade_code='A', current_echelon=1, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=2, next_indice=574),
    dict(employee_type='PROFESSOR', cadre='Professeur Habilite',
         current_grade_code='A', current_echelon=2, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=3, next_indice=580),
    dict(employee_type='PROFESSOR', cadre='Professeur Habilite',
         current_grade_code='A', current_echelon=3, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=4, next_indice=620),
    # Professeur Assistant (MCA) Classe A
    dict(employee_type='PROFESSOR', cadre='Professeur Assistant',
         current_grade_code='A', current_echelon=1, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=2, next_indice=542),
    dict(employee_type='PROFESSOR', cadre='Professeur Assistant',
         current_grade_code='A', current_echelon=2, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=3, next_indice=574),
    # GRADE PROMOTION: Professeur Assistant -> Professeur Habilite
    dict(employee_type='PROFESSOR', cadre='Professeur Assistant',
         current_grade_code='A', current_echelon=3, promotion_type='GRADE',
         min_years_in_echelon=2, min_evaluation_score=7.0,
         requires_habilitation=True,
         next_echelon=1, next_grade_code='A',
         next_cadre='Professeur Habilite', next_indice=580),
    # STAFF — Echelon promotions
    dict(employee_type='STAFF', cadre='Technicien',
         current_grade_code='A', current_echelon=1, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=2, next_indice=350),
    dict(employee_type='STAFF', cadre='Technicien',
         current_grade_code='A', current_echelon=2, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=3, next_indice=380),
    dict(employee_type='STAFF', cadre='Administrateur',
         current_grade_code='A', current_echelon=1, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=2, next_indice=420),
    dict(employee_type='STAFF', cadre='Administrateur',
         current_grade_code='A', current_echelon=2, promotion_type='ECHELON',
         min_years_in_echelon=2, next_echelon=3, next_indice=460),
]

# Demo employee promotion profiles (linked to existing employees by index)
DEMO_PROFILES = [
    # 2 professors eligible for echelon promotion (>2 years)
    dict(cadre='Professeur de l\'Enseignement Superieur', current_grade_code='A',
         current_grade_label='أستاذ التعليم العالي الدرجة أ',
         current_echelon=3, current_indice=810,
         last_echelon_promotion_date=date(2022, 11, 1),
         evaluation_score=8.5, habilitation_obtained=True,
         institution='الكلية متعددة التخصصات تارودانت'),
    dict(cadre='Professeur de l\'Enseignement Superieur', current_grade_code='A',
         current_grade_label='أستاذ التعليم العالي الدرجة أ',
         current_echelon=2, current_indice=785,
         last_echelon_promotion_date=date(2022, 11, 19),
         evaluation_score=7.8, habilitation_obtained=True,
         institution='الكلية متعددة التخصصات تارودانت'),
    # 1 professor eligible for grade promotion (habilitation obtained, echelon 3)
    dict(cadre='Professeur Assistant', current_grade_code='A',
         current_grade_label='أستاذ محاضر الدرجة أ',
         current_echelon=3, current_indice=574,
         last_echelon_promotion_date=date(2022, 12, 2),
         evaluation_score=8.0, habilitation_obtained=True,
         institution='الكلية متعددة التخصصات تارودانت'),
    # 1 professor eligible for grade promotion (MCH nomination)
    dict(cadre='Professeur Assistant', current_grade_code='A',
         current_grade_label='أستاذ محاضر الدرجة أ',
         current_echelon=3, current_indice=574,
         last_echelon_promotion_date=date(2023, 2, 7),
         evaluation_score=9.0, habilitation_obtained=True,
         institution='الكلية متعددة التخصصات تارودانت'),
    # 2 professors NOT eligible (low evaluation score)
    dict(cadre='Professeur Habilite', current_grade_code='A',
         current_grade_label='أستاذ محاضر مؤهل الدرجة أ',
         current_echelon=2, current_indice=620,
         last_echelon_promotion_date=date(2022, 12, 27),
         evaluation_score=4.5, habilitation_obtained=True,
         institution='الكلية متعددة التخصصات تارودانت'),
    dict(cadre='Professeur Habilite', current_grade_code='A',
         current_grade_label='أستاذ محاضر مؤهل الدرجة أ',
         current_echelon=2, current_indice=620,
         last_echelon_promotion_date=date(2022, 12, 27),
         evaluation_score=3.8, habilitation_obtained=False,
         institution='الكلية متعددة التخصصات تارودانت'),
    # 1 professor "soon eligible" (within 1 month)
    dict(cadre='Professeur de l\'Enseignement Superieur', current_grade_code='A',
         current_grade_label='أستاذ التعليم العالي الدرجة أ',
         current_echelon=3, current_indice=810,
         last_echelon_promotion_date=date.today() - timedelta(days=700),
         evaluation_score=8.2, habilitation_obtained=True,
         institution='الكلية متعددة التخصصات تارودانت'),
    # 1 professor requiring exam
    dict(cadre='Professeur Assistant', current_grade_code='A',
         current_grade_label='أستاذ محاضر الدرجة أ',
         current_echelon=2, current_indice=542,
         last_echelon_promotion_date=date(2022, 12, 12),
         evaluation_score=7.0, requires_exam=True, exam_passed=False,
         institution='الكلية متعددة التخصصات تارودانت'),
    # 1 staff eligible for echelon
    dict(cadre='Technicien', current_grade_code='A',
         current_grade_label='تقني الدرجة أ',
         current_echelon=1, current_indice=320,
         last_echelon_promotion_date=date(2022, 6, 1),
         evaluation_score=7.5,
         institution='الكلية متعددة التخصصات تارودانت'),
    # 1 staff not yet eligible
    dict(cadre='Administrateur', current_grade_code='A',
         current_grade_label='إداري الدرجة أ',
         current_echelon=2, current_indice=420,
         last_echelon_promotion_date=date(2024, 1, 1),
         evaluation_score=6.5,
         institution='الكلية متعددة التخصصات تارودانت'),
]


class Command(BaseCommand):
    help = 'Seeds promotion demo data (rules + employee profiles)'

    def handle(self, *args, **options):
        self.stdout.write('[PROMOTIONS] Seeding demo data...')
        self._seed_rules()
        self._seed_profiles()
        self.stdout.write('[OK] Done.')

    def _seed_rules(self):
        count = 0
        for r in PROMOTION_RULES:
            obj, created = PromotionRule.objects.update_or_create(
                employee_type=r['employee_type'],
                cadre=r['cadre'],
                current_grade_code=r['current_grade_code'],
                current_echelon=r['current_echelon'],
                promotion_type=r['promotion_type'],
                defaults={
                    'min_years_in_echelon':  r.get('min_years_in_echelon', 2),
                    'min_evaluation_score':  r.get('min_evaluation_score', 5.0),
                    'requires_exam':         r.get('requires_exam', False),
                    'requires_habilitation': r.get('requires_habilitation', False),
                    'next_echelon':          r.get('next_echelon'),
                    'next_grade_code':       r.get('next_grade_code', ''),
                    'next_cadre':            r.get('next_cadre', ''),
                    'next_indice':           r.get('next_indice'),
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  Rules: {count} created / {len(PROMOTION_RULES)} total')

    def _seed_profiles(self):
        employees = list(Employee.objects.filter(is_active=True).select_related('user'))
        if not employees:
            self.stdout.write('  WARN: No employees found. Run seed_fpt_data first.')
            return
        count = 0
        for i, profile_data in enumerate(DEMO_PROFILES):
            emp = employees[i % len(employees)]
            if hasattr(emp, 'promotion_profile'):
                continue
            EmployeePromotionProfile.objects.create(
                employee=emp,
                **profile_data,
            )
            count += 1
        self.stdout.write(f'  Profiles: {count} created')
