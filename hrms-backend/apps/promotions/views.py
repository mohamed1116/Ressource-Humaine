"""
views.py - Promotion Management Views for Faculté Polydisciplinaire de Taroudant
"""
import io
import os
from django.http import FileResponse
from rest_framework import status, views, viewsets, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Table, TableStyle

import arabic_reshaper
from bidi.algorithm import get_display

from .models import (
    PromotionTableInstance,
    EmployeePromotionProfile,
    PromotionRule,
    PromotionHistory,
    CommitteeMember,
    PromotionDocument,
)


def ar(text):
    if not text:
        return ''
    s = str(text).strip()
    if not s:
        return s
    return get_display(arabic_reshaper.reshape(s))


def _register_font():
    name = 'ArabicFont'
    if name in pdfmetrics.getRegisteredFontNames():
        return name
    for path in [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'DejaVuSans.ttf'),
        'C:\\Windows\\Fonts\\arial.ttf',
        'C:\\Windows\\Fonts\\tahoma.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(name, path))
                return name
            except Exception:
                continue
    return 'Helvetica'


def _build_promotion_pdf(table: PromotionTableInstance) -> io.BytesIO:
    font = _register_font()
    buf  = io.BytesIO()
    W, H = landscape(A4)
    c    = canvas.Canvas(buf, pagesize=landscape(A4))

    is_grade       = (table.table_type == 'GRADE_TITLE')
    is_grade_admin = (table.table_type == 'GRADE_ADMIN')

    titles = {
        'ECHELON':        f'جدول اقتراح الترقية في الرتبة برسم سنة {table.year}',
        'GRADE_TITLE':    f'جدول اقتراح التسمية في إطار استاذ محاضر مؤهل برسم سنة {table.year}',
        'TITULARISATION': f'جدول اقتراح الترسيم في إطار استاذ محاضر برسم سنة {table.year}',
        'GRADE_ADMIN':    f'جدول الترقية في الدرجة برسم سنة {table.year}',
    }
    title_text = titles.get(table.table_type, f'جدول الترقية {table.year}')

    base_dir  = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.normpath(
        os.path.join(base_dir, '..', '..', '..', 'hrms-frontend', 'public', 'assets', 'fpt-logo.png')
    )

    ML = 30
    TW = W - ML - 30

    def draw_header():
        logo_w, logo_h = 200, 200
        if os.path.exists(logo_path):
            c.drawImage(logo_path, W / 2 - logo_w / 2, H - logo_h - 10,
                        width=logo_w, height=logo_h,
                        preserveAspectRatio=True, mask='auto')

    # ── GRADE_ADMIN: 9 single-row columns ───────────────────
    if is_grade_admin:
        col_w = [
            TW * 0.13,  # المؤسسة
            TW * 0.14,  # الاسم الكامل
            TW * 0.08,  # رقم التأجير
            TW * 0.13,  # الإطار الحالي والدرجة
            TW * 0.08,  # تاريخ التعيين
            TW * 0.08,  # الأقدمية الإجمالية
            TW * 0.12,  # طريقة الترقية
            TW * 0.13,  # الدرجة الجديدة
            TW * 0.11,  # تاريخ مفعول الدرجة الجديدة
        ]
        header = [[
            ar('المؤسسة'),
            ar('الاسم الكامل'),
            ar('رقم التأجير'),
            ar('الإطار الحالي والدرجة'),
            ar('تاريخ التعيين'),
            ar('الأقدمية'),
            ar('طريقة الترقية'),
            ar('الدرجة الجديدة'),
            ar('تاريخ المفعول'),
        ]]
        span_cmds  = []
        old_start  = old_end = -1
        new_start  = new_end = -1
        n_header   = 1
        row_h_hdr  = [30]  # taller header to fit wrapped text

    # ── GRADE_TITLE: 11 cols, 2-row header ──────────────────
    elif is_grade:
        col_w = [
            TW * 0.14, TW * 0.14, TW * 0.08,
            TW * 0.06, TW * 0.055, TW * 0.055, TW * 0.09,
            TW * 0.06, TW * 0.055, TW * 0.055, TW * 0.09,
        ]
        header = [
            [ar('المؤسسة'), ar('الاسم الكامل'), ar('رقم التأجير'),
             ar('الوضعية القديمة'), '', '', '',
             ar('الوضعية المقترحة'), '', '', ''],
            ['', '', '',
             ar('الدرجة'), ar('الرتبة'), ar('ر.ا.ح'), ar('الأقدمية في الرتبة'),
             ar('الدرجة'), ar('الرتبة'), ar('ر.ا.ح'), ar('تاريخ مفعولها')],
        ]
        span_cmds = [
            ('SPAN', (0, 0), (0, 1)), ('SPAN', (1, 0), (1, 1)), ('SPAN', (2, 0), (2, 1)),
            ('SPAN', (3, 0), (6, 0)), ('SPAN', (7, 0), (10, 0)),
        ]
        old_start, old_end = 3, 6
        new_start, new_end = 7, 10
        n_header  = 2
        row_h_hdr = [18, 16]

    # ── ECHELON / TITULARISATION: 9 cols, 2-row header ──────
    else:
        col_w = [
            TW * 0.16, TW * 0.16, TW * 0.09,
            TW * 0.07, TW * 0.07, TW * 0.10,
            TW * 0.07, TW * 0.07, TW * 0.11,
        ]
        header = [
            [ar('المؤسسة'), ar('الاسم الكامل'), ar('رقم التأجير'),
             ar('الوضعية القديمة'), '', '',
             ar('الوضعية المقترحة'), '', ''],
            ['', '', '',
             ar('الرتبة'), ar('ر.ا.ح'), ar('الأقدمية في الرتبة'),
             ar('الرتبة'), ar('ر.ا.ح'), ar('تاريخ مفعولها')],
        ]
        span_cmds = [
            ('SPAN', (0, 0), (0, 1)), ('SPAN', (1, 0), (1, 1)), ('SPAN', (2, 0), (2, 1)),
            ('SPAN', (3, 0), (5, 0)), ('SPAN', (6, 0), (8, 0)),
        ]
        old_start, old_end = 3, 5
        new_start, new_end = 6, 8
        n_header  = 2
        row_h_hdr = [18, 16]

    # ── data rows ────────────────────────────────────────────
    data_rows = []
    for i, emp in enumerate(table.employees_data or []):
        full_name = emp.get('full_name') or emp.get('nom_complet') or emp.get('employee_name') or '-'
        ppr       = emp.get('ppr') or '-'
        inst      = emp.get('institution') or 'الكلية متعددة التخصصات تارودانت'
        inst_cell = ar(inst) if i == 0 else ''

        if is_grade_admin:
            row = [
                inst_cell,
                ar(full_name),
                ar(ppr),
                ar(emp.get('current_cadre_grade') or emp.get('old_grade_code') or '-'),
                ar(emp.get('appointment_date') or emp.get('seniority_date') or emp.get('date_anciennete') or '-'),
                ar(emp.get('total_seniority') or '-'),
                ar(emp.get('promotion_method') or '-'),
                ar(emp.get('new_grade') or emp.get('new_grade_code') or '-'),
                ar(emp.get('effective_date') or emp.get('date_effet_propose') or '-'),
            ]
        elif is_grade:
            row = [
                inst_cell, ar(full_name), ar(ppr),
                ar(emp.get('old_grade_code') or '-'),
                ar(str(emp.get('old_echelon') or emp.get('echelon_actuel') or '-')),
                ar(str(emp.get('old_indice') or emp.get('rah_actuel') or '-')),
                ar(emp.get('seniority_date') or emp.get('date_anciennete') or '-'),
                ar(emp.get('new_grade_code') or '-'),
                ar(str(emp.get('new_echelon') or emp.get('echelon_propose') or '-')),
                ar(str(emp.get('new_indice') or emp.get('rah_propose') or '-')),
                ar(emp.get('effective_date') or emp.get('date_effet_propose') or '-'),
            ]
        else:
            row = [
                inst_cell, ar(full_name), ar(ppr),
                ar(str(emp.get('old_echelon') or emp.get('echelon_actuel') or '-')),
                ar(str(emp.get('old_indice') or emp.get('rah_actuel') or '-')),
                ar(emp.get('seniority_date') or emp.get('date_anciennete') or '-'),
                ar(str(emp.get('new_echelon') or emp.get('echelon_propose') or '-')),
                ar(str(emp.get('new_indice') or emp.get('rah_propose') or '-')),
                ar(emp.get('effective_date') or emp.get('date_effet_propose') or '-'),
            ]
        data_rows.append(row)

    n_cols = len(col_w)
    n_data = len(data_rows) or 1
    if not data_rows:
        data_rows = [[''] * n_cols]

    all_rows    = header + data_rows
    row_heights = row_h_hdr + [22] * n_data

    # ── table style ──────────────────────────────────────────
    hdr_bg = colors.HexColor('#D9E1F2')
    old_bg = colors.HexColor('#FCE4D6')
    new_bg = colors.HexColor('#E2EFDA')

    style_list = [
        ('GRID',   (0, 0), (-1, -1), 0.5, colors.black),
        ('FONTNAME', (0, 0), (-1, -1), font),
        ('FONTSIZE', (0, 0), (-1, -1), 7 if is_grade_admin else 8),
        ('ALIGN',  (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('WORDWRAP', (0, 0), (-1, n_header - 1), True),
        ('BACKGROUND', (0, 0), (-1, n_header - 1), hdr_bg),
        ('ROWBACKGROUNDS', (0, n_header), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
    ]
    if old_start >= 0:
        style_list += [
            ('BACKGROUND', (old_start, n_header), (old_end, n_header + n_data - 1), old_bg),
            ('BACKGROUND', (new_start, n_header), (new_end, n_header + n_data - 1), new_bg),
        ]
    style_list += span_cmds

    tbl = Table(all_rows, colWidths=col_w, rowHeights=row_heights, repeatRows=n_header)
    tbl.setStyle(TableStyle(style_list))

    # ── draw page ────────────────────────────────────────────
    draw_header()

    title_y = H - 235
    box_w   = TW * 0.60
    box_x   = ML + (TW - box_w) / 2
    c.setStrokeColor(colors.black)
    c.setFillColor(colors.white)
    c.rect(box_x, title_y, box_w, 28, stroke=1, fill=1)
    c.setFillColor(colors.black)
    c.setFont(font, 12)
    c.drawCentredString(W / 2, title_y + 9, ar(title_text))

    cadre_str = table.cadre_filter or 'الأطر الإدارية والتقنية' if is_grade_admin else table.cadre_filter or 'استاذ التعليم العالي الدرجة أ'
    c.setFont(font, 9)
    c.setFillColor(colors.HexColor('#C00000'))
    c.drawRightString(ML + TW, title_y - 16, ar(f'الاطار : {cadre_str}'))
    c.setFillColor(colors.black)

    table_y_start = H - 275
    tbl_w, tbl_h  = tbl.wrapOn(c, TW, H)
    tbl_y         = table_y_start - tbl_h

    if tbl_y < 55:
        available = table_y_start - 55
        parts = tbl.splitOn(c, TW, available)
        y_pos = table_y_start
        first = True
        for part in parts:
            _, ph = part.wrapOn(c, TW, H)
            if not first:
                c.showPage()
                y_pos = H - 40
            part.drawOn(c, ML, y_pos - ph)
            y_pos -= ph
            first = False
        sig_y = y_pos - 40
    else:
        tbl.drawOn(c, ML, tbl_y)
        sig_y = tbl_y - 40

    if sig_y < 25:
        c.showPage()
        sig_y = H - 60
    c.setFont(font, 10)
    c.drawString(ML + 20, sig_y, ar('توقيع رئيس الجامعة'))
    c.drawRightString(ML + TW - 20, sig_y, ar('توقيع رئيس المؤسسة'))

    c.save()
    buf.seek(0)
    return buf


def get_dynamic_serializer(model_class):
    class DynamicSerializer(serializers.ModelSerializer):
        class Meta:
            model  = model_class
            fields = '__all__'
    return DynamicSerializer


class PromotionTableInstanceViewSet(viewsets.ModelViewSet):
    queryset           = PromotionTableInstance.objects.all().order_by('-id')
    permission_classes = [IsAuthenticated]
    serializer_class   = get_dynamic_serializer(PromotionTableInstance)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_table(self, request):
        table_type   = request.data.get('table_type') or request.data.get('type') or request.data.get('promotion_type')
        year         = request.data.get('year')
        cadre_filter = request.data.get('cadre_filter', '')

        if not table_type or not year:
            return Response(
                {"detail": "Le type de tableau et l'année budgétaire sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            if PromotionTableInstance.objects.filter(
                table_type=table_type, year=int(year), cadre_filter=cadre_filter
            ).exists():
                return Response(
                    {"detail": f"Un tableau de type '{table_type}' pour l'année {year} existe déjà."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            profiles = EmployeePromotionProfile.objects.select_related('employee__user').all()
            if cadre_filter:
                profiles = profiles.filter(cadre__icontains=cadre_filter)

            eligible_employees = []
            for profile in profiles:
                if table_type == 'ECHELON':
                    is_eligible, _ = profile.check_echelon_eligibility()
                elif table_type == 'GRADE_ADMIN':
                    # eligible if >= 6 years seniority in current grade
                    is_eligible = profile.seniority_in_echelon_years >= 6
                else:
                    is_eligible, _ = profile.check_grade_eligibility()

                if not is_eligible:
                    continue

                employee  = getattr(profile, 'employee', None)
                full_name = '-'
                if employee:
                    full_name = getattr(employee, 'full_name', None) or str(employee)

                ppr      = getattr(employee, 'numero_somme', '') or '-' if employee else '-'
                curr_ech = profile.current_echelon or '-'
                rah_val  = profile.current_indice or '-'

                date_anc = '-'
                dt_anc   = profile.last_echelon_promotion_date
                if dt_anc:
                    date_anc = dt_anc.strftime('%Y/%m/%d')

                date_effet = '-'
                if dt_anc:
                    try:
                        date_effet = dt_anc.replace(year=dt_anc.year + 2).strftime('%Y/%m/%d')
                    except Exception:
                        date_effet = date_anc

                seniority_years = round(profile.seniority_in_echelon_years, 1)
                method = 'بالاختيار (Par Choix)' if seniority_years >= 10 else 'امتحان مهني (Examen Pro.)'

                if table_type == 'GRADE_ADMIN':
                    eligible_employees.append({
                        "id":                  str(profile.id),
                        "ppr":                 ppr,
                        "nom_complet":         full_name,
                        "current_cadre_grade": f"{profile.cadre} {profile.current_grade_code}",
                        "appointment_date":    date_anc,
                        "total_seniority":     f"{seniority_years} سنة",
                        "promotion_method":    method,
                        "new_grade":           profile.current_grade_code,
                        "effective_date":      date_effet,
                    })
                else:
                    prop_ech = str(int(curr_ech) + 1) if curr_ech != '-' else '-'
                    eligible_employees.append({
                        "id":                 str(profile.id),
                        "ppr":                ppr,
                        "nom_complet":        full_name,
                        "echelon_actuel":     curr_ech,
                        "rah_actuel":         rah_val,
                        "date_anciennete":    date_anc,
                        "echelon_propose":    prop_ech,
                        "rah_propose":        rah_val,
                        "date_effet_propose": date_effet,
                    })

            titles_map = {
                'ECHELON':        f'جدول اقتراح الترقية في الرتبة لسنة {year}',
                'GRADE_TITLE':    f'جدول اقتراح التسمية في إطار لسنة {year}',
                'TITULARISATION': f'جدول اقتراح الترسيم لسنة {year}',
                'GRADE_ADMIN':    f'جدول الترقية في الدرجة لسنة {year}',
            }
            instance = PromotionTableInstance.objects.create(
                table_type     = table_type,
                year           = int(year),
                cadre_filter   = cadre_filter,
                status         = 'DRAFT',
                employees_data = eligible_employees,
                created_by     = request.user,
                title_ar       = titles_map.get(table_type, f'جدول الترقية {year}'),
            )
            return Response(
                {"detail": "Tableau officiel généré avec succès !", "table_id": str(instance.id)},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": f"Erreur lors de la génération: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['post'], url_path='validate')
    def validate_table(self, request, pk=None):
        table = self.get_object()
        table.status = 'VALIDATED'
        table.save()
        return Response({"detail": "Tableau validé avec succès !"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='update-rows')
    def update_rows(self, request, pk=None):
        table = self.get_object()
        rows  = request.data.get('rows')
        if not isinstance(rows, list):
            return Response({"detail": "'rows' doit être une liste."}, status=status.HTTP_400_BAD_REQUEST)
        table.employees_data = rows
        table.save(update_fields=['employees_data'])
        return Response({"detail": "Lignes mises à jour avec succès."}, status=status.HTTP_200_OK)


class EmployeePromotionProfileViewSet(viewsets.ModelViewSet):
    queryset           = EmployeePromotionProfile.objects.select_related(
        'employee__user', 'employee__department', 'employee__position'
    ).all().order_by('id')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return get_dynamic_serializer(EmployeePromotionProfile)

    def list(self, request, *args, **kwargs):
        data = []
        for profile in self.get_queryset():
            emp = profile.employee
            echelon_eligible, echelon_reason = profile.check_echelon_eligibility()
            grade_eligible,   grade_reason   = profile.check_grade_eligibility()
            data.append({
                'id':                          str(profile.id),
                'employee':                    str(emp.id),
                'employee_name':               emp.full_name,
                'employee_type':               emp.employee_type,
                'ppr':                         emp.numero_somme or '',
                'department':                  emp.department.name if emp.department else '',
                'cadre':                       profile.cadre,
                'current_grade_code':          profile.current_grade_code,
                'current_echelon':             profile.current_echelon,
                'current_indice':              profile.current_indice,
                'evaluation_score':            str(profile.evaluation_score) if profile.evaluation_score else None,
                'last_echelon_promotion_date': str(profile.last_echelon_promotion_date) if profile.last_echelon_promotion_date else None,
                'echelon_eligible':            echelon_eligible,
                'echelon_reason':              echelon_reason,
                'grade_eligible':              grade_eligible,
                'grade_reason':                grade_reason,
            })
        return Response(data)


class PromotionRuleViewSet(viewsets.ModelViewSet):
    queryset           = PromotionRule.objects.all().order_by('id')
    permission_classes = [IsAuthenticated]
    serializer_class   = get_dynamic_serializer(PromotionRule)


class PromotionHistoryViewSet(viewsets.ModelViewSet):
    queryset           = PromotionHistory.objects.all().order_by('-id')
    permission_classes = [IsAuthenticated]
    serializer_class   = get_dynamic_serializer(PromotionHistory)


class CommitteeMemberViewSet(viewsets.ModelViewSet):
    queryset           = CommitteeMember.objects.all().order_by('id')
    permission_classes = [IsAuthenticated]
    serializer_class   = get_dynamic_serializer(CommitteeMember)


class PromotionDocumentViewSet(viewsets.ModelViewSet):
    queryset           = PromotionDocument.objects.all().order_by('-id')
    permission_classes = [IsAuthenticated]
    serializer_class   = get_dynamic_serializer(PromotionDocument)

    @action(detail=False, methods=['post', 'get'], url_path='generate')
    def generate_document_pdf(self, request):
        table_id = (
            request.data.get('table_instance_id') or
            request.data.get('table_id') or
            request.query_params.get('table_instance_id')
        )
        if not table_id:
            return Response({"detail": "Le paramètre 'table_id' est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            table    = PromotionTableInstance.objects.get(id=table_id)
            buf      = _build_promotion_pdf(table)
            filename = f"Tableau_Promotion_{table.table_type}_{table.year}.pdf"
            return FileResponse(buf, as_attachment=True, filename=filename, content_type='application/pdf')
        except PromotionTableInstance.DoesNotExist:
            return Response({"detail": "Tableau introuvable."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"Erreur PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PromotionStatsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response({"status": "OK"}, status=status.HTTP_200_OK)
