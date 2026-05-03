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

    def replace_src(match):
        src = match.group(1)
        if src.startswith('data:'):
            return match.group(0)
        if src.startswith('http://') or src.startswith('https://'):
            return match.group(0)
        # /media/templates/logos/x.png  →  MEDIA_ROOT/templates/logos/x.png
        if src.startswith(media_url + '/'):
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


def _html_to_pdf(html: str) -> bytes:
    """Convert HTML string to PDF bytes using xhtml2pdf."""
    from xhtml2pdf import pisa
    html = _embed_images(html)
    buf = BytesIO()
    pisa.CreatePDF(html.encode('utf-8'), dest=buf, encoding='utf-8')
    return buf.getvalue()


def generate_pdf(request_obj: DocumentRequest, generated_by=None) -> GeneratedDocument:
    """Generate a PDF for the given DocumentRequest and save it."""
    context = request_obj.build_context()
    rendered_html = request_obj.template.render(context)

    pdf_bytes = _html_to_pdf(rendered_html)
    file_content = ContentFile(pdf_bytes)
    filename = f'doc_{request_obj.id}.pdf'

    gen_doc = GeneratedDocument(
        request=request_obj,
        rendered_html=rendered_html,
        generated_by=generated_by,
    )
    gen_doc.pdf_file.save(filename, file_content, save=False)
    gen_doc.save()

    request_obj.status = DocumentRequest.Status.GENERATED
    request_obj.save(update_fields=['status'])

    return gen_doc


def preview_html(request_obj: DocumentRequest) -> str:
    """
    Generate a preview of the document without saving it.
    Returns the rendered HTML string for display in the frontend.
    This lets users see what the document will look like before confirming.
    """
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
