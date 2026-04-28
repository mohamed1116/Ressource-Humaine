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
import os
from io import BytesIO
from django.core.files.base import ContentFile
from .models import DocumentRequest, GeneratedDocument

# Use xhtml2pdf instead of WeasyPrint (works better on Windows)
try:
    from xhtml2pdf import pisa
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False


def generate_pdf(request_obj: DocumentRequest, generated_by=None) -> GeneratedDocument:
    context = request_obj.build_context()
    rendered_html = request_obj.template.render(context)

    if PDF_AVAILABLE:
        # Generate PDF using xhtml2pdf
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(BytesIO(rendered_html.encode('utf-8')), dest=pdf_buffer)
        
        if pisa_status.err:
            # Fallback to HTML if PDF generation fails
            file_content = ContentFile(rendered_html.encode('utf-8'))
            filename = f'doc_{request_obj.id}.html'
        else:
            pdf_buffer.seek(0)
            file_content = ContentFile(pdf_buffer.read())
            filename = f'doc_{request_obj.id}.pdf'
    else:
        # Fallback: save as HTML
        file_content = ContentFile(rendered_html.encode('utf-8'))
        filename = f'doc_{request_obj.id}.html'

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
