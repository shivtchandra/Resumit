"""
Export endpoint to generate PDF from editor content
"""
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional, Dict
from fpdf import FPDF
import io

router = APIRouter()

# Modern Professional Colors (Same as generate_all_previews.py)
PRIMARY_COLOR = (0, 0, 0)       # Black text
ACCENT_COLOR = (0, 51, 102)     # Navy Blue for headers
TEXT_COLOR = (50, 50, 50)       # Dark Gray for body

class ATSResume(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'Page ' + str(self.page_no()), 0, 0, 'C')

    def section_title(self, title):
        self.ln(4)
        self.set_font('Arial', 'B', 11)
        self.set_text_color(*ACCENT_COLOR)
        self.cell(0, 6, title.upper(), 0, 1, 'L')
        
        # Accent line
        self.set_draw_color(*ACCENT_COLOR)
        self.set_line_width(0.5)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(2)

    def section_body(self, body):
        self.set_font('Arial', '', 10)
        self.set_text_color(*TEXT_COLOR)
        self.multi_cell(0, 5, body)
        self.ln(2)

class ExportRequest(BaseModel):
    name: str = "Your Name"
    contact_info: str = "email@example.com | (555) 123-4567"
    sections: Dict[str, str] # e.g. {"summary": "...", "experience": "..."}

@router.post("/export/pdf")
async def export_pdf(request: ExportRequest):
    """
    Generate a PDF from the provided resume content.
    Returns a binary PDF file.
    """
    try:
        pdf = ATSResume()
        pdf.set_margins(15, 15, 15)
        pdf.add_page()
        
        # Name
        pdf.set_font('Arial', 'B', 22)
        pdf.set_text_color(*ACCENT_COLOR)
        pdf.cell(0, 10, request.name.upper(), 0, 1, 'C')
        
        # Contact Info
        pdf.set_font('Arial', '', 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(0, 5, request.contact_info, 0, 1, 'C')
        pdf.ln(6)
        
        # Dynamic Sections (Ordered)
        # We define a standard order, but fallback to what's provided
        ORDER = ['summary', 'experience', 'education', 'skills', 'projects']
        
        # Process standard sections first
        for key in ORDER:
            if key in request.sections and request.sections[key]:
                # Map key to display title
                titles = {
                    'summary': 'Professional Summary',
                    'experience': 'Professional Experience',
                    'education': 'Education',
                    'skills': 'Technical Skills',
                    'projects': 'Projects'
                }
                pdf.section_title(titles.get(key, key.replace('_', ' ')))
                pdf.section_body(request.sections[key])
        
        # Process any remaining sections
        for key, content in request.sections.items():
            if key not in ORDER and content:
                pdf.section_title(key.replace('_', ' '))
                pdf.section_body(content)

        # Output to buffer
        pdf_buffer = io.BytesIO()
        pdf_output = pdf.output(dest='S').encode('latin-1') # FPDF returns string, encode to bytes
        pdf_buffer.write(pdf_output)
        pdf_buffer.seek(0)
        
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=resume.pdf"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
