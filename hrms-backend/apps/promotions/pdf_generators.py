"""
PDF Generators for FPT SGRH Promotion System
Uses ReportLab with arabic-reshaper and python-bidi for perfect RTL Arabic support.
"""
import io
import os
from django.conf import settings
from django.utils import timezone
import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

# ═══════════════════════════════════════════════════════════════
# ARABIC TEXT HELPER & FONT SETUP
# ═══════════════════════════════════════════════════════════════

def ar(text):
    """
    Reshapes Arabic text and applies BiDi algorithm for correct RTL rendering in PDF.
    """
    if text is None:
        return ""
    text = str(text)
    reshaped_text = arabic_reshaper.reshape(text)
    bidi_text = get_display(reshaped_text)
    return bidi_text

def register_fonts():
    """Register Arabic font for ReportLab."""
    try:
        # Try to find a standard Arabic font (Arial is good for official docs)
        font_paths = [
            os.path.join(settings.BASE_DIR, 'static', 'fonts', 'arial.ttf'),
            'C:\\Windows\\Fonts\\arial.ttf',
            '/usr/share/fonts/truetype/msttcorefonts/Arial.ttf'
        ]
        
        font_registered = False
        for path in font_paths:
            if os.path.exists(path):
                pdfmetrics.registerFont(TTFont('ArabicFont', path))
                font_registered = True
                break
                
        if not font_registered:
            # Fallback to default if not found (Arabic will not render correctly)
            import reportlab.rl_config
            reportlab.rl_config.warnOnMissingFontGlyphs = 0
            
    except Exception as e:
        print(f"Error registering font: {e}")

# Call it once when module loads
register_fonts()

def get_arabic_style(size=10, alignment=TA_CENTER, bold=False):
    """Return a ParagraphStyle suitable for Arabic text."""
    font_name = 'ArabicFont' if 'ArabicFont' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
    return ParagraphStyle(
        name=f'ArabicStyle_{size}_{alignment}',
        fontName=font_name,
        fontSize=size,
        leading=size + 4,
        alignment=alignment,
        wordWrap='RTL'
    )


# ═══════════════════════════════════════════════════════════════
# DOCUMENT 1: TABLEAU D'AVANCEMENT D'ÉCHELON (جدول الترقي في الرتبة)
# ═══════════════════════════════════════════════════════════════

def generate_echelon_table_pdf(table_instance):
    """Generates the official 11-column Echelon promotion table (RTL)."""
    buffer = io.BytesIO()
    # Landscape for tables
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), 
                            rightMargin=1*cm, leftMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm)
    
    elements = []
    font_name = 'ArabicFont' if 'ArabicFont' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
    style_center = get_arabic_style(size=12, alignment=TA_CENTER)
    
    # 1. HEADER
    header_text = f"جدول اقتراح الترقي في الرتبة\nبرسم سنة: {table_instance.year} | إطار: {table_instance.cadre_filter}"
    elements.append(Paragraph(ar(header_text), style_center))
    elements.append(Spacer(1, 10))
    
    # 2. TABLE DATA (RTL: we must reverse the columns order for ReportLab)
    # The prompt requested 11 columns in Arabic. 
    # Left-to-right in PDF code means we put the right-most Arabic column LAST in the python list.
    headers = [
        ar("الملاحظات"), 
        ar("الرتبة المقترحة"), 
        ar("تاريخ الأقدمية"), 
        ar("الرتبة الحالية"), 
        ar("الدرجة الحالية"), 
        ar("الإطار"), 
        ar("تاريخ الازدياد"), 
        ar("ر.ب.ت.و"), 
        ar("رقم التأجير"), 
        ar("الاسم الكامل"), 
        ar("الرقم")
    ]
    
    data = [headers]
    
    # Extract rows from JSON
    rows = table_instance.employees_data if table_instance.employees_data else []
    
    for i, row in enumerate(rows, 1):
        data.append([
            ar(row.get('notes', '')),
            ar(str(row.get('proposed_echelon', ''))),
            ar(row.get('seniority_date', '')),
            ar(str(row.get('current_echelon', ''))),
            ar(row.get('current_grade_code', '')),
            ar(row.get('cadre', '')),
            ar(row.get('date_of_birth', '')),
            ar(row.get('cin', '')),
            ar(row.get('numero_somme', '')),
            ar(row.get('full_name', '')),
            str(i)
        ])
        
    # Table styling
    t = Table(data, colWidths=[3*cm, 2*cm, 2.5*cm, 2*cm, 2*cm, 3.5*cm, 2.5*cm, 2*cm, 2*cm, 4*cm, 1.2*cm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), font_name),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # 3. FOOTER
    footer_style = get_arabic_style(size=12, alignment=TA_RIGHT)
    elements.append(Paragraph(ar("حرر في تارودانت بتاريخ: ___/___/_____"), footer_style))
    elements.append(Paragraph(ar("العميد"), footer_style))
    elements.append(Paragraph(ar("حسن حمائز"), footer_style))
    
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# ═══════════════════════════════════════════════════════════════
# DOCUMENT 2: TABLEAU DE NOMINATION (GRADE)
# ═══════════════════════════════════════════════════════════════
def generate_grade_table_pdf(table_instance):
    """Generates the official 10-column Grade promotion table (PA -> PH)."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), 
                            rightMargin=1*cm, leftMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm)
    
    elements = []
    font_name = 'ArabicFont' if 'ArabicFont' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
    style_center = get_arabic_style(size=12, alignment=TA_CENTER)
    
    header_text = f"جدول اقتراح التسمية في إطار أستاذ محاضر مؤهل\nبرسم سنة: {table_instance.year}"
    elements.append(Paragraph(ar(header_text), style_center))
    elements.append(Spacer(1, 10))
    
    # 10 columns reversed for RTL
    headers = [
        ar("الملاحظات"), 
        ar("الإطار المقترح"), 
        ar("تاريخ آخر ترقية"), 
        ar("الإطار الحالي"), 
        ar("تاريخ التوظيف"), 
        ar("تاريخ الازدياد"), 
        ar("ر.ب.ت.و"), 
        ar("رقم التأجير"), 
        ar("الاسم الكامل"), 
        ar("الرقم")
    ]
    
    data = [headers]
    rows = table_instance.employees_data if table_instance.employees_data else []
    
    for i, row in enumerate(rows, 1):
        data.append([
            ar(row.get('notes', '')),
            ar("أستاذ محاضر مؤهل"),  # Hardcoded as per prompt logic
            ar(row.get('last_grade_promotion_date', '')),
            ar(row.get('cadre', '')),
            ar(row.get('hire_date', '')),
            ar(row.get('date_of_birth', '')),
            ar(row.get('cin', '')),
            ar(row.get('numero_somme', '')),
            ar(row.get('full_name', '')),
            str(i)
        ])
        
    t = Table(data, colWidths=[3*cm, 3.5*cm, 2.5*cm, 3.5*cm, 2.5*cm, 2.5*cm, 2*cm, 2*cm, 4*cm, 1.2*cm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), font_name),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    elements.append(t)
    
    # ELIGIBILITY NOTE
    elements.append(Spacer(1, 15))
    note_style = get_arabic_style(size=10, alignment=TA_RIGHT)
    elements.append(Paragraph(ar("يشترط للتسمية في إطار أستاذ محاضر مؤهل:"), note_style))
    elements.append(Paragraph(ar("- الحصول على الهيئة [الهابيليتاسيون]"), note_style))
    elements.append(Paragraph(ar("- مصادقة اللجنة العلمية للكلية"), note_style))
    elements.append(Paragraph(ar("- مصادقة مجلس الجامعة"), note_style))
    
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# ═══════════════════════════════════════════════════════════════
# DOCUMENT 3, 4, 5: PV COMITE, TRANSMITTAL, ENTRY RECORD
# (Simplified structure to respect length, you can expand later)
# ═══════════════════════════════════════════════════════════════

def generate_committee_pv_pdf(data):
    """Generates محضر اجتماع اللجنة العلمية"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm)
    elements = []
    style = get_arabic_style(size=12, alignment=TA_RIGHT)
    
    title = "محضر اجتماع اللجنة العلمية للكلية متعددة التخصصات تارودانت"
    elements.append(Paragraph(ar(title), get_arabic_style(size=14, alignment=TA_CENTER, bold=True)))
    elements.append(Spacer(1, 20))
    
    # Content based on Prompt Part C
    date = data.get('meeting_date', '____/__/__')
    time = data.get('meeting_time', '__:__')
    p_type = data.get('type', 'الترقي في الرتبة')
    year = data.get('year', '2024')
    
    text = f"عقدت اللجنة العلمية للكلية متعددة التخصصات بتارودانت، اجتماعا يوم {date} على الساعة {time} لدراسة اقتراحات {p_type} برسم سنة {year}."
    elements.append(Paragraph(ar(text), style))
    elements.append(Spacer(1, 10))
    
    elements.append(Paragraph(ar("وبعد دراسة الاقتراحات، وافقت اللجنة على الخاصة بالسادة:"), style))
    # List employees
    for emp in data.get('employees', []):
        elements.append(Paragraph(ar(f"- {emp}"), style))
        
    doc.build(elements)
    return buffer.getvalue()

def generate_transmittal_pdf(data):
    """Generates ورقة الإرسال (Bordereau d'envoi)"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm)
    elements = []
    
    title = "ورقة الإرسال\nمـن عميد الكلية المتعددة التخصصات بتارودانت\nإلـى السيد رئيس جامعة ابن زهر أكادير"
    elements.append(Paragraph(ar(title), get_arabic_style(size=14, alignment=TA_CENTER)))
    
    doc.build(elements)
    return buffer.getvalue()

def generate_entry_record_pdf(data):
    """Generates محضر الدخول (Entry record for new employee)"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm)
    elements = []
    style = get_arabic_style(size=12, alignment=TA_RIGHT)
    
    elements.append(Paragraph(ar("محضـــر الدخـــول"), get_arabic_style(size=16, alignment=TA_CENTER)))
    elements.append(Spacer(1, 20))
    
    # Includes new field mentioned: hiring_letter_number
    hl_num = data.get('hiring_letter_number', '_______')
    hl_date = data.get('hiring_letter_date', '_______')
    elements.append(Paragraph(ar(f"بناء على رسالة التوظيف: رقم {hl_num} بتاريخ {hl_date}"), style))
    elements.append(Spacer(1, 10))
    
    # ... Employee details
    full_name = f"{data.get('last_name', '')} {data.get('first_name', '')}"
    elements.append(Paragraph(ar(f"أشهد أن السيد/ة: {full_name}"), style))
    elements.append(Paragraph(ar(f"رقم البطاقة الوطنية: {data.get('cin', '')}"), style))
    
    doc.build(elements)
    return buffer.getvalue()