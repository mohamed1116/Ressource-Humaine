"""
PDF Generation Service
----------------------
Renders a DocumentRequest into a PDF file using the template system.

Uses WeasyPrint if available, falls back to a simple HTML-to-file approach.
WeasyPrint converts HTML+CSS to pixel-perfect A4 PDFs, which is essential
for official university documents.

Install WeasyPrint: pip install weasyprint
(requires system dependencies: pango, cairo, gdk-pixbuf)

If WeasyPrint is not installed, the service generates an HTML file instead,
which can be printed to PDF from a browser. This makes the system work
in development without the system dependencies.
"""
from io import BytesIO
import base64
import os
import re
from django.conf import settings
from django.core.files.base import ContentFile
from .models import DocumentRequest, GeneratedDocument


def _embed_images(html: str) -> str:
    """
    Replace all <img src="..."> with base64-encoded data URIs so xhtml2pdf
    can render them without needing HTTP access.
    """
    media_root = str(settings.MEDIA_ROOT).rstrip('/').rstrip('\\')
    media_url = str(settings.MEDIA_URL).rstrip('/')
    # Frontend public assets folder (for /assets/... paths used in templates)
    frontend_public = os.path.normpath(
        os.path.join(os.path.dirname(settings.BASE_DIR), 'hrms-frontend', 'public')
    )

    def replace_src(match):
        src = match.group(1)
        if src.startswith('data:'):
            return match.group(0)
        if src.startswith('http://') or src.startswith('https://'):
            return match.group(0)
        # /assets/... → hrms-frontend/public/assets/...
        if src.startswith('/assets/'):
            file_path = os.path.join(frontend_public, src.lstrip('/'))
        elif src.startswith(media_url + '/'):
            rel = src[len(media_url) + 1:]
            file_path = os.path.join(media_root, rel)
        elif src.startswith('/'):
            file_path = os.path.join(media_root, src.lstrip('/').replace('media/', '', 1))
        else:
            file_path = os.path.join(media_root, src)
        file_path = os.path.normpath(file_path)
        if os.path.exists(file_path):
            ext = os.path.splitext(file_path)[1].lower().lstrip('.')
            mime = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'gif': 'gif', 'svg': 'svg+xml'}.get(ext, 'png')
            with open(file_path, 'rb') as f:
                b64 = base64.b64encode(f.read()).decode()
            return f'src="data:image/{mime};base64,{b64}"'
        return match.group(0)

    return re.sub(r'src="([^"]+)"', replace_src, html)


def _has_arabic(text: str) -> bool:
    import re as _re
    return bool(_re.search(r'[\u0600-\u06FF]', text))


def _html_to_pdf_arabic(html: str, sig_tag: str = None) -> bytes:
    """
    Render an Arabic HTML document to PDF using fpdf2 + arabic-reshaper.
    Footer is rendered at the bottom of the page.
    """
    import re as _re
    import arabic_reshaper
    from bidi.algorithm import get_display
    from fpdf import FPDF
    import html as _html_mod

    font_path = r'C:\Windows\Fonts\arabtype.ttf'

    # Extract footer text
    footer_match = _re.search(
        r'<div[^>]*class="footer"[^>]*>(.*?)</div>',
        html, flags=_re.DOTALL | _re.IGNORECASE
    )
    footer_text = ''
    if footer_match:
        ft = _re.sub(r'<[^>]+>', '', footer_match.group(1))
        footer_text = _html_mod.unescape(ft).strip()

    # Extract content (without footer)
    clean = _re.sub(r'<(style|script)[^>]*>.*?</(style|script)>', '', html, flags=_re.DOTALL)
    clean = _re.sub(r'<div[^>]*class="footer"[^>]*>.*?</div>', '', clean, flags=_re.DOTALL | _re.IGNORECASE)
    clean = _re.sub(r'<(br|p|div|h[1-6]|tr|li)\b[^>]*>', '\n', clean, flags=_re.IGNORECASE)
    clean = _re.sub(r'</(p|div|h[1-6]|tr|li)>', '\n', clean, flags=_re.IGNORECASE)
    clean = _re.sub(r'<[^>]+>', '', clean)
    clean = _html_mod.unescape(clean)
    lines = [l.strip() for l in clean.splitlines() if l.strip()]

    # Extract sig image bytes if provided
    sig_img_data = None
    sig_img_ext = 'PNG'
    if sig_tag:
        m = _re.search(r'src="data:image/(\w+);base64,([^"]+)"', sig_tag)
        if m:
            sig_img_ext = m.group(1).upper().replace('JPEG', 'JPG')
            sig_img_data = base64.b64decode(m.group(2))

    # Build PDF with footer
    class DocPDF(FPDF):
        def __init__(self, footer_txt, font_path):
            super().__init__()
            self._footer_txt = footer_txt
            self._font_path = font_path

        def footer(self):
            if not self._footer_txt:
                return
            self.add_font('ArabicFont', fname=self._font_path)
            self.set_y(-20)
            self.set_font('ArabicFont', size=8)
            self.set_draw_color(180, 180, 180)
            self.line(15, self.get_y(), self.w - 15, self.get_y())
            self.ln(2)
            self.set_text_color(100, 100, 100)
            self.multi_cell(0, 5, self._footer_txt, align='C')
            self.set_text_color(0, 0, 0)

    pdf = DocPDF(footer_text, font_path)
    pdf.set_auto_page_break(auto=True, margin=25)
    pdf.add_page()
    pdf.add_font('ArabicFont', fname=font_path)
    pdf.set_font('ArabicFont', size=12)
    pdf.set_margins(15, 15, 15)

    date_idx = next((i for i, l in enumerate(lines) if 'Fait ' in l or 'fait ' in l), None)

    for i, line in enumerate(lines):
        is_date_line = (i == date_idx)

        if is_date_line and sig_img_data:
            y_before = pdf.get_y()
            import tempfile, os as _os
            with tempfile.NamedTemporaryFile(suffix='.' + sig_img_ext.lower(), delete=False) as tmp:
                tmp.write(sig_img_data)
                tmp_path = tmp.name
            try:
                pdf.image(tmp_path, x=15, y=y_before, h=15)
            finally:
                _os.unlink(tmp_path)
            pdf.set_xy(pdf.w / 2, y_before)
            pdf.set_font('ArabicFont', size=11)
            display_line = get_display(arabic_reshaper.reshape(line)) if _has_arabic(line) else line
            pdf.multi_cell(pdf.w / 2 - 15, 8, display_line, align='R')
            pdf.set_font('ArabicFont', size=12)
            pdf.ln(2)
            continue

        if _has_arabic(line):
            pdf.multi_cell(0, 8, get_display(arabic_reshaper.reshape(line)), align='R')
        else:
            pdf.multi_cell(0, 8, line, align='L')

    if sig_img_data and date_idx is None:
        import tempfile, os as _os
        with tempfile.NamedTemporaryFile(suffix='.' + sig_img_ext.lower(), delete=False) as tmp:
            tmp.write(sig_img_data)
            tmp_path = tmp.name
        try:
            pdf.image(tmp_path, x=15, h=15)
        finally:
            _os.unlink(tmp_path)

    return bytes(pdf.output())


def _html_to_pdf(html: str, sig_tag: str = None) -> bytes:
    """Convert HTML string to PDF bytes. Uses fpdf2 for Arabic, xhtml2pdf otherwise."""
    if _has_arabic(html):
        try:
            return _html_to_pdf_arabic(html, sig_tag=sig_tag)
        except Exception:
            pass
    # xhtml2pdf path for French/Latin documents
    from xhtml2pdf import pisa
    # Fix footer at bottom and ensure single page layout
    footer_fix = '''
    <style>
      @page { size: A4; margin: 2cm 2cm 3cm 2cm; }
      .footer {
        position: fixed;
        bottom: -2cm;
        left: 0; right: 0;
        text-align: center;
        font-size: 8pt;
        color: #666;
        border-top: 1px solid #ccc;
        padding-top: 6px;
      }
      .content { min-height: auto; }
    </style>
    '''
    if '</head>' in html:
        html = html.replace('</head>', footer_fix + '</head>', 1)
    processed = _embed_images(html)
    buf = BytesIO()
    result = pisa.CreatePDF(processed.encode('utf-8'), dest=buf, encoding='utf-8')
    if result.err:
        raise Exception(f'Erreur xhtml2pdf: {result.err}')
    pdf_bytes = buf.getvalue()
    if not pdf_bytes:
        raise Exception('PDF genere est vide.')
    return pdf_bytes


def _inject_signature_at_bottom(html: str, sig_tag: str) -> str:
    """
    Place professor signature (left) + date (right) on the same line,
    BEFORE the footer div. Never injects after the footer.
    """
    sig_cell = (
        '<td style="width:45%;vertical-align:bottom;padding-right:12px;">'
        '<p style="font-size:10pt;color:#444;margin:0 0 4px 0;">Signature du professeur&nbsp;:</p>'
        + sig_tag
        + '</td>'
    )

    marker = 'Fait '
    idx = html.find(marker)
    if idx != -1:
        start = html.rfind('<', 0, idx)
        gt = html.index('>', start)
        raw = html[start + 1:gt].split()[0]
        tag_name = re.sub(r'[^a-zA-Z0-9]', '', raw)
        close_tag = '</' + tag_name + '>'
        end = html.find(close_tag, idx)
        if end != -1 and tag_name:
            end += len(close_tag)
            date_block = html[start:end]
            table = (
                '<table style="width:100%;margin-top:24px;border-collapse:collapse;page-break-inside:avoid;">'
                '<tr>'
                + sig_cell
                + '<td style="width:55%;text-align:right;vertical-align:bottom;">' + date_block + '</td>'
                + '</tr></table>'
            )
            return html[:start] + table + html[end:]

    # Fallback: insert just before the footer div (never after it)
    footer_marker = '<div class="footer"'
    if footer_marker in html:
        return html.replace(
            footer_marker,
            '<table style="width:100%;margin-top:24px;border-collapse:collapse;page-break-inside:avoid;">'
            '<tr>' + sig_cell + '<td style="width:55%;"></td></tr></table>'
            + footer_marker,
            1
        )
    # Last resort: before </body>
    fallback = (
        '<table style="width:100%;margin-top:24px;border-collapse:collapse;page-break-inside:avoid;">'
        '<tr>' + sig_cell + '<td style="width:55%;"></td></tr></table>'
    )
    if '</body>' in html:
        return html.replace('</body>', fallback + '</body>', 1)
    return html + fallback


def generate_pdf(request_obj: DocumentRequest, generated_by=None, sig_tag: str = None) -> GeneratedDocument:
    """Generate a PDF for the given DocumentRequest and save it."""
    if not request_obj.template:
        raise Exception('Le modèle de document associé a été supprimé.')
    context = request_obj.build_context()
    rendered_html = request_obj.template.render(context)
    if sig_tag:
        rendered_html = _inject_signature_at_bottom(rendered_html, sig_tag)

    pdf_bytes = _html_to_pdf(rendered_html, sig_tag=sig_tag)
    file_content = ContentFile(pdf_bytes)
    filename = f'doc_{request_obj.id}.pdf'

    # Check if this is a regeneration (already has generated documents)
    is_regeneration = request_obj.generated_documents.exists()

    gen_doc = GeneratedDocument(
        request=request_obj,
        rendered_html=rendered_html,
        generated_by=generated_by,
    )
    gen_doc.pdf_file.save(filename, file_content, save=False)
    gen_doc.save()

    request_obj.status = DocumentRequest.Status.GENERATED
    request_obj.save(update_fields=['status'])

    # Send notification to the requester
    if is_regeneration:
        # Notification for regeneration
        from apps.notifications.services import NotificationService
        try:
            NotificationService.create_notification(
                recipient=request_obj.requested_by,
                notification_type='DOCUMENT_REGENERATED',
                title='Document régénéré',
                message=f'Votre document "{request_obj.template.name}" a été régénéré et est maintenant disponible au téléchargement.',
                action_url=f'/certificates',
                related_object_type='document_request',
                related_object_id=str(request_obj.id),
            )
        except Exception:
            pass  # Don't fail PDF generation if notification fails
    else:
        # Notification for first generation
        from apps.notifications.services import NotificationService
        try:
            NotificationService.create_notification(
                recipient=request_obj.requested_by,
                notification_type='DOCUMENT_READY',
                title='Document prêt',
                message=f'Votre document "{request_obj.template.name}" est maintenant prêt et disponible au téléchargement.',
                action_url=f'/certificates',
                related_object_type='document_request',
                related_object_id=str(request_obj.id),
            )
        except Exception:
            pass

    return gen_doc


def preview_html(request_obj: DocumentRequest) -> str:
    if not request_obj.template:
        raise Exception('Le modèle de document associé a été supprimé.')
    context = request_obj.build_context()
    return request_obj.template.render(context)


def preview_template(template, sample_context: dict = None) -> str:
    """
    Preview a template with sample data (for template editing).
    If no sample_context is provided, uses placeholder strings.
    """
    if sample_context is None:
        # Generate sample data from the template's variable definitions
        sample_context = {}
        for var in template.variables:
            key = var.get('key', '')
            label = var.get('label', key)
            sample_context[key] = f'[{label}]'

    return template.render(sample_context)
