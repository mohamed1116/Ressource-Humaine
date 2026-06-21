"""
Promotion Services — Faculté Polydisciplinaire de Taroudant
Business logic for promotion operations.
All multi-step operations are wrapped in @transaction.atomic.
"""
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.employees.models import Employee
from .models import (
    PromotionRule,
    EmployeePromotionProfile,
    PromotionTableInstance,
    PromotionHistory,
)

User = get_user_model()


# ═══════════════════════════════════════════════════════════════
# 1. PROFILE MANAGEMENT
# ═══════════════════════════════════════════════════════════════

def get_or_create_promotion_profile(employee):
    """
    Get or create a PromotionProfile for an employee.
    Seeds initial data from Employee and Position if creating new.
    
    Args:
        employee: Employee instance
    
    Returns:
        tuple: (EmployeePromotionProfile, created: bool)
    """
    profile, created = EmployeePromotionProfile.objects.get_or_create(
        employee=employee,
        defaults={
            'cadre': employee.position.title if employee.position else '',
            'current_grade_code': 'A',  # Default, should be updated by HR
            'current_grade_label': employee.position.title if employee.position else '',
            'current_echelon': 1,
            'current_indice': 100,  # Default base indice
            'last_echelon_promotion_date': employee.hire_date,
            'institution': 'الكلية متعددة التخصصات تارودانت',
        }
    )
    return profile, created


def ensure_all_employees_have_profiles():
    """
    Batch create promotion profiles for all active employees who don't have one.
    Useful for initial setup or after importing employees.
    
    Returns:
        dict: {'created': int, 'existing': int}
    """
    employees = Employee.objects.filter(is_active=True).select_related('position')
    created_count = 0
    existing_count = 0
    
    for employee in employees:
        _, created = get_or_create_promotion_profile(employee)
        if created:
            created_count += 1
        else:
            existing_count += 1
    
    return {'created': created_count, 'existing': existing_count}


# ═══════════════════════════════════════════════════════════════
# 2. ELIGIBILITY CHECKING
# ═══════════════════════════════════════════════════════════════

def get_all_eligible(promotion_type='ECHELON', cadre_filter=''):
    """
    Get all employees eligible for a specific promotion type.
    
    Args:
        promotion_type: 'ECHELON', 'GRADE', or 'TITULARISATION'
        cadre_filter: Optional cadre to filter by (e.g., 'Professeur Habilité')
    
    Returns:
        QuerySet of EmployeePromotionProfile instances
    """
    profiles = EmployeePromotionProfile.objects.select_related(
        'employee', 'employee__user', 'employee__department', 'employee__position'
    ).filter(
        employee__is_active=True
    )
    
    if cadre_filter:
        profiles = profiles.filter(cadre__icontains=cadre_filter)
    
    # Filter by eligibility
    eligible_profiles = []
    for profile in profiles:
        if promotion_type == 'ECHELON':
            eligible, _ = profile.check_echelon_eligibility()
        elif promotion_type == 'GRADE':
            eligible, _ = profile.check_grade_eligibility()
        elif promotion_type == 'TITULARISATION':
            # Titularisation is for contractuels becoming permanent
            eligible = (
                profile.employee.contract_type == 'CONTRACT' and
                profile.titularisation_date is None
            )
        else:
            eligible = False
        
        if eligible:
            eligible_profiles.append(profile.id)
    
    return profiles.filter(id__in=eligible_profiles)


# ═══════════════════════════════════════════════════════════════
# 3. TABLE GENERATION
# ═══════════════════════════════════════════════════════════════

def generate_echelon_table_rows(profiles, year):
    """
    Generate rows for an ECHELON promotion table.
    
    Args:
        profiles: QuerySet of EmployeePromotionProfile
        year: Year of the promotion table
    
    Returns:
        list: Array of row dictionaries matching official table structure
    """
    rows = []
    
    for profile in profiles:
        # Find applicable rule
        try:
            rule = PromotionRule.objects.get(
                employee_type=profile.employee.employee_type,
                cadre=profile.cadre,
                current_grade_code=profile.current_grade_code,
                current_echelon=profile.current_echelon,
                promotion_type='ECHELON',
            )
            next_echelon = rule.next_echelon or (profile.current_echelon + 1)
            next_indice = rule.next_indice or (profile.current_indice + 10)
        except PromotionRule.DoesNotExist:
            # Default increment
            next_echelon = profile.current_echelon + 1
            next_indice = profile.current_indice + 10
        
        # Calculate effective date (usually January 1st of the year)
        effective_date = f"{year}-01-01"
        
        row = {
            'employee_id': str(profile.employee.id),
            'full_name': profile.employee.full_name,
            'ppr': profile.employee.numero_somme or '',
            'institution': profile.institution,
            'old_echelon': profile.current_echelon,
            'old_indice': profile.current_indice,
            'seniority_date': profile.last_echelon_promotion_date.isoformat() if profile.last_echelon_promotion_date else '',
            'new_echelon': next_echelon,
            'new_indice': next_indice,
            'effective_date': effective_date,
        }
        rows.append(row)
    
    return rows


def generate_grade_table_rows(profiles, year):
    """
    Generate rows for a GRADE promotion table (nomination/titularisation).
    
    Args:
        profiles: QuerySet of EmployeePromotionProfile
        year: Year of the promotion table
    
    Returns:
        list: Array of row dictionaries
    """
    rows = []
    
    for profile in profiles:
        # Find applicable rule
        try:
            rule = PromotionRule.objects.get(
                employee_type=profile.employee.employee_type,
                cadre=profile.cadre,
                current_grade_code=profile.current_grade_code,
                current_echelon=profile.current_echelon,
                promotion_type='GRADE',
            )
            next_cadre = rule.next_cadre or profile.cadre
            next_grade_code = rule.next_grade_code or profile.current_grade_code
            next_echelon = rule.next_echelon or 1  # Usually start at echelon 1 in new grade
            next_indice = rule.next_indice or (profile.current_indice + 50)
        except PromotionRule.DoesNotExist:
            # No rule found, skip or use defaults
            continue
        
        effective_date = f"{year}-01-01"
        
        row = {
            'employee_id': str(profile.employee.id),
            'full_name': profile.employee.full_name,
            'ppr': profile.employee.numero_somme or '',
            'institution': profile.institution,
            'old_grade_code': profile.current_grade_code,
            'old_echelon': profile.current_echelon,
            'old_indice': profile.current_indice,
            'seniority_date': profile.last_grade_promotion_date.isoformat() if profile.last_grade_promotion_date else '',
            'new_cadre': next_cadre,
            'new_grade_code': next_grade_code,
            'new_echelon': next_echelon,
            'new_indice': next_indice,
            'effective_date': effective_date,
        }
        rows.append(row)
    
    return rows


def generate_titularisation_rows(profiles, year):
    """
    Generate rows for a TITULARISATION table (contractuels → permanent).
    
    Args:
        profiles: QuerySet of EmployeePromotionProfile
        year: Year of the promotion table
    
    Returns:
        list: Array of row dictionaries
    """
    rows = []
    
    for profile in profiles:
        if profile.employee.contract_type != 'CONTRACT':
            continue
        
        effective_date = f"{year}-01-01"
        
        row = {
            'employee_id': str(profile.employee.id),
            'full_name': profile.employee.full_name,
            'ppr': profile.employee.numero_somme or '',
            'institution': profile.institution,
            'old_status': 'Contractuel',
            'new_status': 'Titulaire',
            'cadre': profile.cadre,
            'grade_code': profile.current_grade_code,
            'echelon': profile.current_echelon,
            'indice': profile.current_indice,
            'effective_date': effective_date,
        }
        rows.append(row)
    
    return rows


@transaction.atomic
def create_table_instance(table_type, year, cadre_filter, created_by, rows):
    """
    Create a new PromotionTableInstance with generated rows.
    
    Args:
        table_type: 'ECHELON', 'GRADE_TITLE', or 'TITULARISATION'
        year: Year of the table
        cadre_filter: Cadre filter applied
        created_by: User who created the table
        rows: List of row dictionaries
    
    Returns:
        PromotionTableInstance
    """
    # Generate Arabic title based on type
    title_map = {
        'ECHELON': f'جدول اقتراح الترقية في الرتبة لسنة {year}',
        'GRADE_TITLE': f'جدول اقتراح التسمية في إطار لسنة {year}',
        'TITULARISATION': f'جدول اقتراح الترسيم لسنة {year}',
    }
    
    instance = PromotionTableInstance.objects.create(
        table_type=table_type,
        year=year,
        cadre_filter=cadre_filter,
        title_ar=title_map.get(table_type, f'جدول الترقية {year}'),
        employees_data=rows,
        created_by=created_by,
        status='DRAFT',
    )
    
    return instance


# ═══════════════════════════════════════════════════════════════
# 4. TABLE EXECUTION (IRREVERSIBLE)
# ═══════════════════════════════════════════════════════════════

@transaction.atomic
def execute_promotions_from_table(table_instance, signed_by):
    """
    Execute all promotions in a validated table.
    This is IRREVERSIBLE and updates all employee profiles.
    
    Args:
        table_instance: PromotionTableInstance to execute
        signed_by: User who signs/approves the promotions
    
    Returns:
        int: Number of promotions executed
    
    Raises:
        ValueError: If table is not in VALIDATED status
    """
    if table_instance.status != 'VALIDATED':
        raise ValueError('Seuls les tableaux validés peuvent être appliqués.')
    
    count = 0
    
    for row in table_instance.employees_data:
        try:
            employee_id = row.get('employee_id')
            if not employee_id:
                continue
            
            profile = EmployeePromotionProfile.objects.select_for_update().get(
                employee__id=employee_id
            )
            
            # Determine promotion type and update profile
            if table_instance.table_type == 'ECHELON':
                old_echelon = profile.current_echelon
                old_indice = profile.current_indice
                
                profile.current_echelon = row.get('new_echelon', old_echelon + 1)
                profile.current_indice = row.get('new_indice', old_indice + 10)
                profile.last_echelon_promotion_date = row.get('effective_date', timezone.now().date())
                
                # Create history record
                PromotionHistory.objects.create(
                    employee=profile.employee,
                    table_instance=table_instance,
                    promotion_type='ECHELON',
                    old_cadre=profile.cadre,
                    new_cadre=profile.cadre,
                    old_grade_code=profile.current_grade_code,
                    new_grade_code=profile.current_grade_code,
                    old_echelon=old_echelon,
                    new_echelon=profile.current_echelon,
                    old_indice=old_indice,
                    new_indice=profile.current_indice,
                    seniority_date=row.get('seniority_date'),
                    effective_date=row.get('effective_date', timezone.now().date()),
                    signed_by=signed_by,
                )
            
            elif table_instance.table_type == 'GRADE_TITLE':
                old_cadre = profile.cadre
                old_grade_code = profile.current_grade_code
                old_echelon = profile.current_echelon
                old_indice = profile.current_indice
                
                profile.cadre = row.get('new_cadre', old_cadre)
                profile.current_grade_code = row.get('new_grade_code', old_grade_code)
                profile.current_echelon = row.get('new_echelon', 1)
                profile.current_indice = row.get('new_indice', old_indice + 50)
                profile.last_grade_promotion_date = row.get('effective_date', timezone.now().date())
                
                # Create history record
                PromotionHistory.objects.create(
                    employee=profile.employee,
                    table_instance=table_instance,
                    promotion_type='GRADE',
                    old_cadre=old_cadre,
                    new_cadre=profile.cadre,
                    old_grade_code=old_grade_code,
                    new_grade_code=profile.current_grade_code,
                    old_echelon=old_echelon,
                    new_echelon=profile.current_echelon,
                    old_indice=old_indice,
                    new_indice=profile.current_indice,
                    seniority_date=row.get('seniority_date'),
                    effective_date=row.get('effective_date', timezone.now().date()),
                    signed_by=signed_by,
                )
            
            elif table_instance.table_type == 'TITULARISATION':
                profile.titularisation_date = row.get('effective_date', timezone.now().date())
                
                # Update employee contract type
                profile.employee.contract_type = 'PERMANENT'
                profile.employee.save(update_fields=['contract_type'])
                
                # Create history record
                PromotionHistory.objects.create(
                    employee=profile.employee,
                    table_instance=table_instance,
                    promotion_type='TITULARISATION',
                    old_cadre=profile.cadre,
                    new_cadre=profile.cadre,
                    old_grade_code=profile.current_grade_code,
                    new_grade_code=profile.current_grade_code,
                    old_echelon=profile.current_echelon,
                    new_echelon=profile.current_echelon,
                    old_indice=profile.current_indice,
                    new_indice=profile.current_indice,
                    effective_date=row.get('effective_date', timezone.now().date()),
                    signed_by=signed_by,
                    notes='Titularisation: Contractuel → Permanent',
                )
            
            profile.save()
            count += 1
        
        except EmployeePromotionProfile.DoesNotExist:
            # Skip if profile not found
            continue
        except Exception as e:
            # Log error but continue with other promotions
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error executing promotion for employee {employee_id}: {e}")
            continue
    
    # Mark table as ARCHIVED after execution
    table_instance.status = 'ARCHIVED'
    table_instance.save(update_fields=['status'])
    
    return count


# ═══════════════════════════════════════════════════════════════
# 5. STATISTICS
# ═══════════════════════════════════════════════════════════════

def get_promotion_stats():
    """
    Get dashboard statistics for promotions.
    
    Returns:
        dict: Statistics summary
    """
    from django.db.models import Count, Q
    
    # Profile stats
    total_profiles = EmployeePromotionProfile.objects.filter(
        employee__is_active=True
    ).count()
    
    # Count eligible for echelon
    echelon_eligible = 0
    grade_eligible = 0
    profiles = EmployeePromotionProfile.objects.filter(employee__is_active=True)
    for profile in profiles:
        eligible_echelon, _ = profile.check_echelon_eligibility()
        eligible_grade, _ = profile.check_grade_eligibility()
        if eligible_echelon:
            echelon_eligible += 1
        if eligible_grade:
            grade_eligible += 1
    
    # Table stats
    table_stats = PromotionTableInstance.objects.aggregate(
        total=Count('id'),
        draft=Count('id', filter=Q(status='DRAFT')),
        validated=Count('id', filter=Q(status='VALIDATED')),
        archived=Count('id', filter=Q(status='ARCHIVED')),
    )
    
    # History stats
    current_year = timezone.now().year
    promotions_this_year = PromotionHistory.objects.filter(
        effective_date__year=current_year
    ).count()
    
    return {
        'total_profiles': total_profiles,
        'echelon_eligible': echelon_eligible,
        'grade_eligible': grade_eligible,
        'tables_total': table_stats['total'],
        'tables_draft': table_stats['draft'],
        'tables_validated': table_stats['validated'],
        'tables_archived': table_stats['archived'],
        'promotions_this_year': promotions_this_year,
    }
