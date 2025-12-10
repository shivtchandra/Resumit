"""
Generate PDF previews for ALL frontend categories
Modern Professional Style: Clean, Sans-Serif, Subtle Accents, ATS-Friendly
Content: Hyper-Realistic, Metric-Heavy, Authentic
"""
import os
from fpdf import FPDF

# Modern Professional Colors
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

    def entry_header(self, title, subtitle, date):
        # Title (Left) and Date (Right)
        self.set_font('Arial', 'B', 10)
        self.set_text_color(0, 0, 0)
        self.cell(130, 5, title, 0, 0, 'L')
        
        self.set_font('Arial', 'B', 9)
        self.set_text_color(*ACCENT_COLOR)
        self.cell(0, 5, date, 0, 1, 'R')
        
        # Subtitle (Company/School)
        self.set_font('Arial', 'I', 10)
        self.set_text_color(60, 60, 60)
        self.cell(0, 5, subtitle, 0, 1, 'L')

    def bullet_point(self, text):
        self.set_font('Arial', '', 10)
        self.set_text_color(*TEXT_COLOR)
        self.cell(5) 
        self.cell(3, 5, chr(149), 0, 0, 'L') # Bullet char
        self.multi_cell(0, 5, text)

def generate_pdf(data, filename):
    pdf = ATSResume()
    pdf.set_margins(15, 15, 15)
    pdf.add_page()
    
    # Name
    pdf.set_font('Arial', 'B', 22)
    pdf.set_text_color(*ACCENT_COLOR)
    pdf.cell(0, 10, data['name'].upper(), 0, 1, 'C')
    
    # Contact Info
    pdf.set_font('Arial', '', 9)
    pdf.set_text_color(80, 80, 80)
    contact_parts = [data['email'], data['phone'], data['linkedin']]
    contact_info = "  |  ".join([p for p in contact_parts if p])
    pdf.cell(0, 5, contact_info, 0, 1, 'C')
    pdf.ln(6)
    
    # Summary
    if data.get('summary'):
        pdf.section_title('Professional Summary')
        pdf.section_body(data['summary'])
    
    # Experience
    if data.get('experience'):
        pdf.section_title('Professional Experience')
        for job in data['experience']:
            pdf.entry_header(job['title'], job['company'], job['dates'])
            for bullet in job['bullets']:
                pdf.bullet_point(bullet)
            pdf.ln(3)
        
    # Education
    if data.get('education'):
        pdf.section_title('Education')
        for edu in data['education']:
            pdf.entry_header(edu['degree'], edu['school'], edu['year'])
            pdf.ln(2)
        
    # Skills
    if data.get('skills'):
        pdf.section_title('Technical Skills')
        pdf.section_body(data['skills'])
    
    pdf.output(filename, 'F')
    print(f"✅ Generated PDF: {filename}")

TEMPLATES = [
    {
        "filename": "software_engineer_mid.pdf",
        "data": {
            "name": "DAVID CHEN",
            "email": "david.chen@email.com",
            "phone": "(415) 555-0192",
            "linkedin": "linkedin.com/in/davidchen-dev",
            "summary": "Full Stack Engineer with 6 years of experience designing scalable microservices and real-time web applications. Specialized in Python/Django backends and React frontends. Successfully migrated legacy systems to AWS, reducing infrastructure costs by 40% while improving uptime to 99.99%.",
            "experience": [
                {
                    "title": "Senior Software Engineer",
                    "company": "Nexus Fintech Solutions",
                    "dates": "Jan 2021 - Present",
                    "bullets": [
                        "Architected a high-frequency trading dashboard using React and WebSocket, handling 5,000+ updates per second with <50ms latency.",
                        "Led the migration of a monolithic payment processing system to Kubernetes-based microservices, reducing deployment time by 75%.",
                        "Mentored 4 junior developers and introduced automated code quality checks (SonarQube), reducing production bugs by 30%."
                    ]
                },
                {
                    "title": "Software Engineer",
                    "company": "CloudScale Systems",
                    "dates": "Jun 2018 - Dec 2020",
                    "bullets": [
                        "Developed RESTful APIs for a SaaS analytics platform serving 50k+ daily active users using Python (FastAPI) and PostgreSQL.",
                        "Optimized database queries and implemented Redis caching, improving API response times from 500ms to 80ms.",
                        "Collaborated with product managers to implement A/B testing frameworks, leading to a 15% increase in user retention."
                    ]
                }
            ],
            "education": [{"degree": "B.S. Computer Science", "school": "University of California, Berkeley", "year": "2018"}],
            "skills": "Languages: Python, JavaScript (ES6+), TypeScript, SQL, Go\nFrameworks: React, Node.js, Django, FastAPI, Next.js\nInfrastructure: AWS (EC2, Lambda, S3), Docker, Kubernetes, Terraform\nTools: Git, CI/CD (Jenkins, GitHub Actions), Jira, Datadog"
        }
    },
    {
        "filename": "data_scientist_senior.pdf",
        "data": {
            "name": "ELENA RODRIGUEZ",
            "email": "elena.rodriguez@email.com",
            "phone": "(646) 555-0188",
            "linkedin": "linkedin.com/in/elenarodriguez-ds",
            "summary": "Senior Data Scientist with 8+ years of experience in predictive modeling, NLP, and causal inference. Proven track record of deploying machine learning models that drive revenue growth. Expert in translating complex data insights into actionable business strategies for executive stakeholders.",
            "experience": [
                {
                    "title": "Lead Data Scientist",
                    "company": "Global Retail Corp",
                    "dates": "Mar 2020 - Present",
                    "bullets": [
                        "Developed and deployed a personalized product recommendation engine using XGBoost and collaborative filtering, driving $12M in incremental annual revenue.",
                        "Built a customer churn prediction model with 92% accuracy, enabling the marketing team to launch targeted retention campaigns that reduced churn by 18%.",
                        "Designed and analyzed 50+ A/B tests to optimize pricing strategies, resulting in a 5% increase in average order value (AOV)."
                    ]
                },
                {
                    "title": "Data Scientist",
                    "company": "FinTech Innovations",
                    "dates": "Jul 2016 - Feb 2020",
                    "bullets": [
                        "Created a credit risk scoring model using Random Forest, reducing default rates by 22% within the first year of deployment.",
                        "Automated data pipelines using Apache Airflow and Python, reducing manual reporting time by 20 hours per week.",
                        "Conducted sentiment analysis on customer feedback using NLTK and BERT to identify key pain points, leading to a UX redesign."
                    ]
                },
                {
                    "title": "Data Analyst",
                    "company": "Market Insights LLC",
                    "dates": "Jun 2014 - Jun 2016",
                    "bullets": [
                        "Analyzed sales trends across 10 regions using SQL and Tableau, identifying underperforming markets and recommending inventory adjustments.",
                        "Cleaned and structured terabytes of raw transaction data for downstream analysis."
                    ]
                }
            ],
            "education": [
                {"degree": "M.S. Statistics", "school": "Columbia University", "year": "2014"},
                {"degree": "B.S. Mathematics", "school": "University of Michigan", "year": "2012"}
            ],
            "skills": "Languages: Python, R, SQL, Scala\nMachine Learning: Scikit-learn, TensorFlow, PyTorch, XGBoost, LightGBM\nData Engineering: Spark, Airflow, Hadoop, AWS Redshift, Snowflake\nVisualization: Tableau, PowerBI, Matplotlib, Seaborn"
        }
    },
    {
        "filename": "product_manager_mid.pdf",
        "data": {
            "name": "MICHAEL CHANG",
            "email": "michael.chang@email.com",
            "phone": "(206) 555-0144",
            "linkedin": "linkedin.com/in/michaelchang-pm",
            "summary": "Product Manager with 5 years of experience launching B2B SaaS products. Skilled in agile methodologies, user research, and cross-functional leadership. Passionate about building intuitive user experiences that solve complex business problems. Track record of increasing user adoption and driving product-led growth.",
            "experience": [
                {
                    "title": "Product Manager",
                    "company": "WorkFlow Solutions",
                    "dates": "Oct 2019 - Present",
                    "bullets": [
                        "Led the end-to-end launch of a new workflow automation feature, achieving 15% adoption within the first quarter and generating $500k in ARR.",
                        "Conducted 40+ user interviews and usability tests to validate product hypotheses, resulting in a 25% reduction in customer support tickets.",
                        "Prioritized the product backlog for a team of 8 engineers and 2 designers, ensuring on-time delivery of quarterly roadmap items."
                    ]
                },
                {
                    "title": "Associate Product Manager",
                    "company": "Logistics Tech Inc.",
                    "dates": "Aug 2017 - Sep 2019",
                    "bullets": [
                        "Managed the mobile app roadmap, overseeing 3 major version releases that increased App Store rating from 3.5 to 4.7 stars.",
                        "Collaborated with sales and marketing to create go-to-market assets, contributing to a 20% increase in lead conversion.",
                        "Analyzed user behavior data using Mixpanel to identify drop-off points in the onboarding flow, implementing fixes that improved activation rate by 10%."
                    ]
                }
            ],
            "education": [{"degree": "B.A. Economics", "school": "University of Washington", "year": "2017"}],
            "skills": "Product Strategy: Roadmap Planning, User Stories, PRDs, Competitive Analysis\nTools: Jira, Confluence, Figma, Amplitude, Mixpanel, Salesforce\nMethodologies: Agile, Scrum, Kanban, Design Thinking"
        }
    },
    {
        "filename": "designer_ux_mid.pdf",
        "data": {
            "name": "SOPHIA BENNETT",
            "email": "sophia.bennett@email.com",
            "phone": "(312) 555-0177",
            "linkedin": "linkedin.com/in/sophiabennett-ux",
            "summary": "UX/UI Designer with 6 years of experience creating accessible and user-centered digital products. Expert in design systems, rapid prototyping, and interaction design. Dedicated to bridging the gap between user needs and business goals through data-driven design decisions.",
            "experience": [
                {
                    "title": "Senior UX Designer",
                    "company": "Creative Digital Agency",
                    "dates": "Feb 2021 - Present",
                    "bullets": [
                        "Redesigned the checkout flow for a major e-commerce client, reducing cart abandonment by 18% and increasing conversion rate by 2.5%.",
                        "Spearheaded the creation of a comprehensive design system (Figma) used by 4 cross-functional teams, reducing design-to-dev handoff time by 40%.",
                        "Facilitated design workshops and critiques to foster a collaborative design culture and ensure consistency across product lines."
                    ]
                },
                {
                    "title": "UI/UX Designer",
                    "company": "HealthTech Startups",
                    "dates": "May 2018 - Jan 2021",
                    "bullets": [
                        "Designed the patient portal mobile app from concept to launch, achieving 50k+ downloads in the first 6 months.",
                        "Conducted accessibility audits (WCAG 2.1) and implemented improvements that increased the app's accessibility score to 98/100.",
                        "Created high-fidelity interactive prototypes in Protopie for stakeholder presentations, securing buy-in for key feature investments."
                    ]
                }
            ],
            "education": [{"degree": "B.F.A. Interaction Design", "school": "School of the Art Institute of Chicago", "year": "2018"}],
            "skills": "Design: Wireframing, Prototyping, User Research, Information Architecture, UI Design\nTools: Figma, Adobe XD, Sketch, Photoshop, Illustrator, Principle\nCode: HTML5, CSS3, Basic JavaScript, Webflow"
        }
    }
]

def main():
    print("🚀 Generating Hyper-Realistic PDFs...")
    for tmpl in TEMPLATES:
        generate_pdf(tmpl['data'], tmpl['filename'])
    print("✨ Done!")

if __name__ == "__main__":
    main()
