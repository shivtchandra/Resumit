"""
PDF Exporter
Converts DOCX files to PDF format.
"""

import subprocess
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class PDFExporter:
    def __init__(self):
        """Initialize PDF exporter."""
        self.libreoffice_path = self._find_libreoffice()
    
    def _find_libreoffice(self) -> Optional[str]:
        """Find LibreOffice installation."""
        # Common LibreOffice paths
        possible_paths = [
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",  # macOS
            "/usr/bin/libreoffice",  # Linux
            "/usr/bin/soffice",  # Linux alternative
            "C:\\Program Files\\LibreOffice\\program\\soffice.exe",  # Windows
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                logger.info(f"Found LibreOffice at: {path}")
                return path
        
        # Try which command
        try:
            result = subprocess.run(
                ["which", "soffice"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                path = result.stdout.strip()
                logger.info(f"Found LibreOffice via which: {path}")
                return path
        except Exception as e:
            logger.warning(f"Failed to find LibreOffice via which: {e}")
        
        logger.warning("LibreOffice not found. PDF export will not be available.")
        return None
    
    def convert_docx_to_pdf(self, docx_path: str, output_dir: Optional[str] = None) -> str:
        """
        Convert DOCX to PDF using LibreOffice.
        
        Args:
            docx_path: Path to DOCX file
            output_dir: Output directory (defaults to same as DOCX)
            
        Returns:
            Path to created PDF file
        """
        if not self.libreoffice_path:
            raise RuntimeError("LibreOffice not found. Cannot convert to PDF.")
        
        if not os.path.exists(docx_path):
            raise FileNotFoundError(f"DOCX file not found: {docx_path}")
        
        # Determine output directory
        if output_dir is None:
            output_dir = os.path.dirname(docx_path)
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Run LibreOffice conversion
        try:
            cmd = [
                self.libreoffice_path,
                "--headless",
                "--convert-to", "pdf",
                "--outdir", output_dir,
                docx_path
            ]
            
            logger.info(f"Running LibreOffice conversion: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                logger.error(f"LibreOffice conversion failed: {result.stderr}")
                raise RuntimeError(f"PDF conversion failed: {result.stderr}")
            
            # Determine PDF path
            base_name = os.path.splitext(os.path.basename(docx_path))[0]
            pdf_path = os.path.join(output_dir, f"{base_name}.pdf")
            
            if not os.path.exists(pdf_path):
                raise RuntimeError(f"PDF file was not created: {pdf_path}")
            
            logger.info(f"Successfully created PDF: {pdf_path}")
            return pdf_path
            
        except subprocess.TimeoutExpired:
            raise RuntimeError("PDF conversion timed out after 60 seconds")
        except Exception as e:
            logger.error(f"PDF conversion failed: {e}")
            raise
    
    def convert_html_to_pdf_fallback(self, html_content: str, output_path: str) -> str:
        """
        Fallback: Convert HTML to PDF using WeasyPrint.
        
        Args:
            html_content: HTML content
            output_path: Path to save PDF
            
        Returns:
            Path to created PDF file
        """
        try:
            from weasyprint import HTML
            
            HTML(string=html_content).write_pdf(output_path)
            logger.info(f"Successfully created PDF via WeasyPrint: {output_path}")
            
            return output_path
        except ImportError:
            raise RuntimeError("WeasyPrint not installed. Cannot use fallback PDF export.")
        except Exception as e:
            logger.error(f"WeasyPrint PDF export failed: {e}")
            raise
