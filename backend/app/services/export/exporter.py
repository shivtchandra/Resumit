"""
Export Service
Handles exporting resumes to various formats (Markdown, HTML).
"""

import markdown

class ExportService:
    def __init__(self):
        pass
        
    def to_markdown(self, template_content: str, user_data: dict) -> str:
        """
        Fill a markdown template with user data.
        (Simple string replacement for MVP)
        """
        content = template_content
        for key, value in user_data.items():
            placeholder = f"[{key}]"
            content = content.replace(placeholder, str(value))
        return content
        
    def to_html(self, markdown_content: str) -> str:
        """
        Convert Markdown to HTML for preview/download.
        """
        html = markdown.markdown(markdown_content)
        
        # Add basic styling
        styled_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; max_width: 800px; margin: 0 auto; padding: 20px; }}
                h1 {{ border-bottom: 2px solid #333; padding-bottom: 10px; }}
                h2 {{ color: #2c3e50; margin-top: 20px; border-bottom: 1px solid #eee; }}
                ul {{ padding-left: 20px; }}
            </style>
        </head>
        <body>
            {html}
        </body>
        </html>
        """
        return styled_html
