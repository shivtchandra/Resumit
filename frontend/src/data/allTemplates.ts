// Complete Production Template System - All 20 Templates
// Streamlined for performance while maintaining quality

import type { ResumeTemplate, ResumeContent } from './realisticTemplates';
import { softwareEngineerTemplates } from './realisticTemplates';

// Helper function to create template
const createTemplate = (

    id: string,
    role: string,
    level: 'Entry' | 'Mid' | 'Senior' | 'Executive',
    templateName: string,
    content: Partial<ResumeContent>
): ResumeTemplate => ({
    metadata: {
        template_id: id,
        role,
        experience_level: level,
        ats_success_rate: level === 'Entry' ? 0.88 : level === 'Mid' ? 0.93 : level === 'Senior' ? 0.96 : 0.94,
        template_name: templateName,
        ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
        description: `Production-ready ${level.toLowerCase()}-level ${role.toLowerCase()} resume`
    },
    content: content as ResumeContent
});

// Data Scientist Templates
const getDataScientistTemplates = (): ResumeTemplate[] => [
    createTemplate('ds-entry-001', 'Data Scientist', 'Entry', 'Aisha Mohammed', {
        personalInfo: {
            name: 'Aisha Mohammed',
            email: 'aisha.mohammed@email.com',
            phone: '+1-512-555-0198',
            location: 'Austin, TX',
            linkedin: 'linkedin.com/in/aishamohammed',
            github: 'github.com/amohammed'
        },
        summary: 'Recent Data Science graduate with hands-on ML experience building predictive models. Completed 3 end-to-end projects including customer churn prediction (87% accuracy) and sentiment analysis tool. Proficient in Python, SQL, and data visualization with Tableau and Power BI.',
        guidanceNotes: {
            summary: 'Highlight academic projects and internship experience. Mention specific ML techniques and accuracy metrics.',
            projects: 'Include 2-3 projects showing full ML pipeline: data collection, preprocessing, modeling, evaluation.'
        },
        skills: [
            { category: 'Programming', items: ['Python', 'R', 'SQL'] },
            { category: 'ML & Data', items: ['Scikit-learn', 'TensorFlow', 'Pandas', 'NumPy', 'Statistical Analysis'] },
            { category: 'Visualization', items: ['Tableau', 'Power BI', 'Matplotlib', 'Seaborn'] }
        ],
        experience: [{
            title: 'Data Analytics Intern',
            company: 'FinTech Solutions',
            location: 'Austin, TX',
            startDate: 'June 2023',
            endDate: 'August 2023',
            bullets: [
                'Analyzed 100K+ transaction records using SQL and Python to identify fraud patterns, reducing false positives by 30%',
                'Created interactive Tableau dashboards visualizing key business metrics for executive team',
                'Built customer segmentation model using K-means clustering, enabling targeted marketing campaigns'
            ]
        }],
        projects: [{
            name: 'Customer Churn Prediction',
            description: 'Built ML model using XGBoost to predict customer churn with 87% accuracy on 50K customer dataset',
            technologies: ['Python', 'Scikit-learn', 'XGBoost', 'Pandas']
        }],
        education: [{
            degree: 'Bachelor of Science in Data Science',
            school: 'University of Texas at Austin',
            location: 'Austin, TX',
            graduationDate: '2023',
            details: 'GPA: 3.8/4.0'
        }],
        certifications: ['Google Data Analytics Professional Certificate', 'IBM Data Science Professional']
    }),

    createTemplate('ds-mid-001', 'Data Scientist', 'Mid', 'Marcus Johnson', {
        personalInfo: {
            name: 'Marcus Johnson',
            email: 'marcus.johnson@email.com',
            phone: '+1-617-555-0234',
            location: 'Boston, MA',
            linkedin: 'linkedin.com/in/marcusjohnson'
        },
        summary: 'Data Scientist with 5 years building ML models for business impact. Developed recommendation engine increasing revenue by $4M annually. Expert in Python, SQL, and deploying models to production using AWS SageMaker.',
        guidanceNotes: {
            experience: 'Focus on business impact and production ML. Show progression from analysis to deployment.'
        },
        skills: [
            { category: 'Languages', items: ['Python', 'R', 'SQL', 'Scala'] },
            { category: 'ML & AI', items: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'XGBoost', 'Deep Learning'] },
            { category: 'Cloud & Tools', items: ['AWS SageMaker', 'Spark', 'Airflow', 'Docker', 'Git'] }
        ],
        experience: [{
            title: 'Senior Data Scientist',
            company: 'E-Commerce Tech Corp',
            location: 'Boston, MA',
            startDate: 'March 2021',
            endDate: 'Present',
            bullets: [
                'Built recommendation engine using collaborative filtering and deep learning, increasing revenue by $4M annually',
                'Developed fraud detection model using gradient boosting, reducing fraud losses by $2M (35% improvement)',
                'Deployed 5 ML models to production using AWS SageMaker and Docker, serving 1M+ predictions daily',
                'Mentored 2 junior data scientists on ML best practices and model deployment'
            ]
        }],
        education: [{
            degree: 'Master of Science in Data Science',
            school: 'Massachusetts Institute of Technology',
            location: 'Cambridge, MA',
            graduationDate: '2019'
        }],
        certifications: ['AWS Certified Machine Learning - Specialty', 'TensorFlow Developer Certificate']
    }),

    createTemplate('ds-senior-001', 'Data Scientist', 'Senior', 'Dr. Lisa Wang', {
        personalInfo: {
            name: 'Dr. Lisa Wang',
            email: 'lisa.wang@email.com',
            phone: '+1-415-555-0287',
            location: 'San Francisco, CA',
            linkedin: 'linkedin.com/in/lisawang'
        },
        summary: 'Senior Data Scientist with 9 years leading ML initiatives at scale. Built ML platform serving 20+ models in production, processing 10M+ predictions daily. Led data science team of 6, established MLOps best practices.',
        guidanceNotes: {
            experience: 'Emphasize platform building, team leadership, and strategic impact. Show technical depth and business acumen.'
        },
        skills: [
            { category: 'Leadership', items: ['Technical Leadership', 'ML Strategy', 'Team Management', 'Stakeholder Communication'] },
            { category: 'ML & Scale', items: ['Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Model Monitoring'] },
            { category: 'Technologies', items: ['Python', 'TensorFlow', 'PyTorch', 'Spark', 'Kubernetes', 'MLflow'] }
        ],
        experience: [{
            title: 'Senior Data Scientist',
            company: 'TechCorp Inc',
            location: 'San Francisco, CA',
            startDate: 'January 2018',
            endDate: 'Present',
            bullets: [
                'Built ML platform serving 20+ models in production, processing 10M+ daily predictions with 99.9% uptime',
                'Led team of 6 data scientists, mentored 4 to senior roles',
                'Developed dynamic pricing model increasing revenue by $8M annually',
                'Implemented MLOps practices including model versioning and A/B testing'
            ]
        }],
        education: [{
            degree: 'PhD in Machine Learning',
            school: 'Stanford University',
            location: 'Stanford, CA',
            graduationDate: '2015'
        }],
        certifications: ['AWS ML Specialty', 'Google Cloud ML Engineer']
    }),

    createTemplate('ds-exec-001', 'Data Scientist', 'Executive', 'Dr. Raj Patel', {
        personalInfo: {
            name: 'Dr. Raj Patel',
            email: 'raj.patel@email.com',
            phone: '+1-212-555-0345',
            location: 'New York, NY',
            linkedin: 'linkedin.com/in/rajpatel'
        },
        summary: 'Principal Data Scientist with 13 years driving AI/ML strategy for Fortune 500 companies. Led data science organization of 30+ scientists and engineers, delivering $50M+ in business value.',
        guidanceNotes: {
            experience: 'Focus on organizational leadership, strategic vision, and business outcomes. Show influence at executive level.'
        },
        skills: [
            { category: 'Leadership', items: ['AI/ML Strategy', 'Organizational Leadership', 'Executive Communication', 'Team Building'] },
            { category: 'Technical', items: ['ML Architecture', 'Platform Strategy', 'Python', 'Spark', 'Kubernetes'] }
        ],
        experience: [{
            title: 'Principal Data Scientist',
            company: 'Enterprise Tech Corp',
            location: 'New York, NY',
            startDate: 'June 2017',
            endDate: 'Present',
            bullets: [
                'Define AI/ML strategy for organization, leading team of 30+ data scientists and ML engineers',
                'Drove $50M+ in business value through personalization platform serving 50M users',
                'Built ML infrastructure reducing model deployment time from weeks to hours',
                'Hired and mentored 25+ data scientists, with 8 promoted to senior/staff roles'
            ]
        }],
        education: [{
            degree: 'PhD in Computer Science',
            school: 'Massachusetts Institute of Technology',
            location: 'Cambridge, MA',
            graduationDate: '2011'
        }]
    })
];

// Designer Templates
const getDesignerTemplates = (): ResumeTemplate[] => [
    createTemplate('des-entry-001', 'Designer', 'Entry', 'Olivia Kim', {
        personalInfo: {
            name: 'Olivia Kim',
            email: 'olivia.kim@email.com',
            phone: '+1-213-555-0111',
            location: 'Los Angeles, CA',
            linkedin: 'linkedin.com/in/oliviakimdesign',
            portfolio: 'oliviakim.design'
        },
        summary: 'Creative UI/UX Designer with a passion for user-centered design. Proficient in Figma, Adobe Creative Suite, and prototyping. Experience creating intuitive interfaces for web and mobile applications through internships and freelance projects.',
        guidanceNotes: {
            summary: 'Mention design tools and your design philosophy. Link to your portfolio is crucial.',
            projects: 'Describe the problem, your design process, and the final solution.'
        },
        skills: [
            { category: 'Design', items: ['UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Visual Design'] },
            { category: 'Tools', items: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'InVision'] },
            { category: 'Code', items: ['HTML', 'CSS', 'Basic JavaScript'] }
        ],
        experience: [{
            title: 'Junior UX Designer Intern',
            company: 'Creative Agency',
            location: 'Los Angeles, CA',
            startDate: 'May 2023',
            endDate: 'August 2023',
            bullets: [
                'Assisted in redesigning the checkout flow for a major e-commerce client, resulting in a projected 10% conversion increase',
                'Created high-fidelity prototypes in Figma for client presentations and user testing',
                'Conducted usability testing with 15 participants to validate design concepts'
            ]
        }],
        projects: [{
            name: 'EcoLife App',
            description: 'Designed a mobile app to help users track their carbon footprint. Created user personas, user flows, and final UI assets.',
            technologies: ['Figma', 'User Research', 'Prototyping']
        }],
        education: [{
            degree: 'Bachelor of Fine Arts in Interaction Design',
            school: 'ArtCenter College of Design',
            location: 'Pasadena, CA',
            graduationDate: '2023'
        }]
    }),

    createTemplate('des-mid-001', 'Designer', 'Mid', 'David Lee', {
        personalInfo: {
            name: 'David Lee',
            email: 'david.lee@email.com',
            phone: '+1-512-555-0222',
            location: 'Austin, TX',
            linkedin: 'linkedin.com/in/davidleedesign',
            portfolio: 'davidlee.design'
        },
        summary: 'Product Designer with 4 years of experience crafting digital experiences for B2C startups. Strong ability to translate complex requirements into simple, elegant design solutions. Expert in design systems and cross-functional collaboration.',
        guidanceNotes: {
            experience: 'Show how your designs impacted business metrics. Mention collaboration with engineers and PMs.'
        },
        skills: [
            { category: 'Product Design', items: ['Interaction Design', 'Design Systems', 'User Journeys', 'Information Architecture'] },
            { category: 'Software', items: ['Figma', 'Sketch', 'Principle', 'Zeplin', 'Jira'] },
            { category: 'Research', items: ['User Interviews', 'Usability Testing', 'Heuristic Evaluation'] }
        ],
        experience: [{
            title: 'Product Designer',
            company: 'TechStart Inc',
            location: 'Austin, TX',
            startDate: 'February 2021',
            endDate: 'Present',
            bullets: [
                'Led the design of the new mobile app, achieving a 4.8-star rating on the App Store',
                'Established and maintained the company design system, improving design-to-dev handoff efficiency by 40%',
                'Collaborated with PMs to define product requirements and run A/B tests on landing pages',
                'Mentored a junior designer and conducted design critiques'
            ]
        }],
        education: [{
            degree: 'Bachelor of Design',
            school: 'Carnegie Mellon University',
            location: 'Pittsburgh, PA',
            graduationDate: '2019'
        }]
    }),

    createTemplate('des-senior-001', 'Designer', 'Senior', 'Emma Davis', {
        personalInfo: {
            name: 'Emma Davis',
            email: 'emma.davis@email.com',
            phone: '+1-917-555-0333',
            location: 'New York, NY',
            linkedin: 'linkedin.com/in/emmadavisdesign',
            portfolio: 'emmadavis.design'
        },
        summary: 'Senior Product Designer with 8 years of experience in FinTech and Enterprise SaaS. Specialist in complex system design and data visualization. Proven track record of leading design strategy and elevating product quality.',
        guidanceNotes: {
            experience: 'Highlight leadership in design strategy and mentoring. Show ability to handle ambiguity.'
        },
        skills: [
            { category: 'Strategy', items: ['Design Strategy', 'Service Design', 'Workshop Facilitation', 'Design Ops'] },
            { category: 'Advanced Design', items: ['Data Visualization', 'Accessibility (WCAG)', 'Micro-interactions'] },
            { category: 'Leadership', items: ['Mentorship', 'Stakeholder Management', 'Critique Leadership'] }
        ],
        experience: [{
            title: 'Senior Product Designer',
            company: 'FinTech Global',
            location: 'New York, NY',
            startDate: 'October 2018',
            endDate: 'Present',
            bullets: [
                'Redesigned the core trading platform, simplifying complex workflows and reducing error rates by 25%',
                'Led a team of 4 designers for the "Wealth Management" vertical, overseeing design quality and consistency',
                'Championed accessibility initiative, ensuring all products meet WCAG 2.1 AA standards',
                'Facilitated design sprints with executive stakeholders to define long-term product vision'
            ]
        }],
        education: [{
            degree: 'Master of Fine Arts in Design and Technology',
            school: 'Parsons School of Design',
            location: 'New York, NY',
            graduationDate: '2016'
        }]
    }),

    createTemplate('des-exec-001', 'Designer', 'Executive', 'Robert Chen', {
        personalInfo: {
            name: 'Robert Chen',
            email: 'robert.chen@email.com',
            phone: '+1-415-555-0444',
            location: 'San Francisco, CA',
            linkedin: 'linkedin.com/in/robertchendesign',
            portfolio: 'robertchen.design'
        },
        summary: 'Director of Design with 15 years of experience building and scaling world-class design organizations. Passionate about creating design-led cultures and delivering products that delight users. Expert in brand strategy and creative direction.',
        guidanceNotes: {
            experience: 'Focus on organizational impact, hiring, and shaping design culture.'
        },
        skills: [
            { category: 'Executive', items: ['Design Leadership', 'Brand Strategy', 'Org Design', 'Budget Management'] },
            { category: 'Management', items: ['Hiring', 'Performance Management', 'Career Development', 'Design Ops'] },
            { category: 'Strategic', items: ['Product Vision', 'Cross-functional Alignment', 'Innovation'] }
        ],
        experience: [{
            title: 'Director of Product Design',
            company: 'Innovate Corp',
            location: 'San Francisco, CA',
            startDate: 'July 2017',
            endDate: 'Present',
            bullets: [
                'Grew the design team from 5 to 35 designers, researchers, and writers over 4 years',
                'Established the "Design at Innovate" brand, attracting top talent and speaking at major industry conferences',
                'Collaborated with C-suite to define company strategy, ensuring design had a seat at the table',
                'Oversaw the complete rebrand of the company, aligning visual identity across marketing and product'
            ]
        }],
        education: [{
            degree: 'Bachelor of Arts in Graphic Design',
            school: 'Rhode Island School of Design',
            location: 'Providence, RI',
            graduationDate: '2007'
        }]
    })
];


// Product Manager Templates
const getProductManagerTemplates = (): ResumeTemplate[] => [
    createTemplate('pm-entry-001', 'Product Manager', 'Entry', 'James Wilson', {
        personalInfo: {
            name: 'James Wilson',
            email: 'james.wilson@email.com',
            phone: '+1-312-555-0123',
            location: 'Chicago, IL',
            linkedin: 'linkedin.com/in/jwilsonpm',
            portfolio: 'jameswilson.pm'
        },
        summary: 'Aspiring Product Manager with background in Business Analysis and CS. Experience leading cross-functional teams in university projects and internships. Skilled in Agile methodologies, user research, and data analysis with SQL.',
        guidanceNotes: {
            summary: 'Highlight leadership in academic or intern projects. Focus on user empathy and data-driven decisions.',
            projects: 'Showcase projects where you defined requirements or managed a timeline.'
        },
        skills: [
            { category: 'Product', items: ['User Research', 'Agile/Scrum', 'Wireframing', 'A/B Testing'] },
            { category: 'Tools', items: ['Jira', 'Figma', 'Google Analytics', 'SQL', 'Tableau'] },
            { category: 'Soft Skills', items: ['Communication', 'Leadership', 'Problem Solving', 'Stakeholder Management'] }
        ],
        experience: [{
            title: 'Associate Product Manager Intern',
            company: 'FinTech Innovations',
            location: 'Chicago, IL',
            startDate: 'June 2023',
            endDate: 'August 2023',
            bullets: [
                'Conducted user research interviews with 20+ clients to identify pain points in mobile app onboarding',
                'Collaborated with engineering and design teams to launch a new "Quick Pay" feature, increasing transaction volume by 15%',
                'Analyzed usage data using SQL to recommend feature improvements for the Q4 roadmap'
            ]
        }],
        projects: [{
            name: 'Campus Marketplace App',
            description: 'Led a team of 4 students to build a mobile app for buying/selling textbooks. Defined MVP features and managed sprint backlog.',
            technologies: ['Product Management', 'Figma', 'User Stories', 'Market Research']
        }],
        education: [{
            degree: 'Bachelor of Business Administration',
            school: 'University of Chicago',
            location: 'Chicago, IL',
            graduationDate: '2023',
            details: 'Minor in Computer Science'
        }],
        certifications: ['Certified ScrumMaster (CSM)', 'Google Project Management Certificate']
    }),

    createTemplate('pm-mid-001', 'Product Manager', 'Mid', 'Sarah Chen', {
        personalInfo: {
            name: 'Sarah Chen',
            email: 'sarah.chen@email.com',
            phone: '+1-206-555-0456',
            location: 'Seattle, WA',
            linkedin: 'linkedin.com/in/sarahchenpm'
        },
        summary: 'Product Manager with 4 years of experience in B2B SaaS. Proven track record of launching successful features that drive user retention and revenue. Expert in roadmap planning, stakeholder management, and agile execution.',
        guidanceNotes: {
            experience: 'Focus on metrics: revenue, retention, adoption. Show ownership of specific features or products.'
        },
        skills: [
            { category: 'Strategy', items: ['Roadmap Planning', 'Go-to-Market', 'Competitive Analysis', 'OKRs'] },
            { category: 'Technical', items: ['API Integration', 'SQL', 'Data Modeling', 'System Design Basics'] },
            { category: 'Tools', items: ['Jira', 'Confluence', 'Mixpanel', 'Salesforce', 'Figma'] }
        ],
        experience: [{
            title: 'Product Manager',
            company: 'CloudSaaS Inc',
            location: 'Seattle, WA',
            startDate: 'March 2021',
            endDate: 'Present',
            bullets: [
                'Led the launch of the "Enterprise Analytics" module, generating $2M in ARR within the first year',
                'Optimized user onboarding flow, increasing activation rate from 45% to 65%',
                'Managed a cross-functional team of 8 engineers and 2 designers, running bi-weekly sprints',
                'Partnered with Sales and Customer Success to prioritize feature requests and reduce churn by 10%'
            ]
        }],
        education: [{
            degree: 'Bachelor of Science in Information Systems',
            school: 'University of Washington',
            location: 'Seattle, WA',
            graduationDate: '2019'
        }],
        certifications: ['Product School PMC', 'Certified Product Manager (CPM)']
    }),

    createTemplate('pm-senior-001', 'Product Manager', 'Senior', 'Michael Ross', {
        personalInfo: {
            name: 'Michael Ross',
            email: 'michael.ross@email.com',
            phone: '+1-415-555-0789',
            location: 'San Francisco, CA',
            linkedin: 'linkedin.com/in/mrosspm'
        },
        summary: 'Senior Product Manager with 8 years of experience scaling consumer mobile apps. Expertise in growth strategy, monetization, and leading high-performing product teams. Successfully launched 3 major products with 1M+ MAU.',
        guidanceNotes: {
            experience: 'Highlight strategic impact, mentorship, and handling complex cross-team initiatives.'
        },
        skills: [
            { category: 'Leadership', items: ['Product Strategy', 'Team Mentorship', 'Vision Setting', 'Executive Presentation'] },
            { category: 'Growth', items: ['Monetization', 'User Acquisition', 'Retention Strategy', 'Experimentation'] },
            { category: 'Domain', items: ['Mobile Apps', 'Consumer Tech', 'Social Media', 'Marketplace'] }
        ],
        experience: [{
            title: 'Senior Product Manager',
            company: 'SocialConnect',
            location: 'San Francisco, CA',
            startDate: 'January 2019',
            endDate: 'Present',
            bullets: [
                'Defined and executed product vision for the core mobile app, growing MAU from 500K to 2M',
                'Launched a new subscription tier, achieving $5M in annual recurring revenue',
                'Mentored 3 junior PMs and established product best practices across the organization',
                'Led cross-functional initiative to rewrite the legacy backend, improving app performance by 50%'
            ]
        }],
        education: [{
            degree: 'MBA',
            school: 'Stanford Graduate School of Business',
            location: 'Stanford, CA',
            graduationDate: '2016'
        }],
        certifications: ['Reforge Growth Series', 'Scrum Alliance CSP']
    }),

    createTemplate('pm-exec-001', 'Product Manager', 'Executive', 'Elena Rodriguez', {
        personalInfo: {
            name: 'Elena Rodriguez',
            email: 'elena.rodriguez@email.com',
            phone: '+1-646-555-0912',
            location: 'New York, NY',
            linkedin: 'linkedin.com/in/elenarodriguez'
        },
        summary: 'VP of Product with 15 years of experience transforming product organizations. Track record of scaling product lines to $100M+ revenue. Expert in portfolio strategy, M&A integration, and building world-class product teams.',
        guidanceNotes: {
            experience: 'Focus on organizational transformation, P&L responsibility, and industry influence.'
        },
        skills: [
            { category: 'Executive', items: ['Portfolio Strategy', 'P&L Management', 'M&A', 'Board Relations'] },
            { category: 'Organizational', items: ['Org Design', 'Culture Building', 'Change Management', 'Talent Acquisition'] },
            { category: 'Strategic', items: ['Digital Transformation', 'Global Expansion', 'Innovation Management'] }
        ],
        experience: [{
            title: 'VP of Product',
            company: 'GlobalTech Solutions',
            location: 'New York, NY',
            startDate: 'June 2018',
            endDate: 'Present',
            bullets: [
                'Oversee product portfolio generating $150M in annual revenue, managing a team of 40+ PMs and designers',
                'Led the integration of two acquired companies, unifying product stacks and retaining 95% of customers',
                'Spearheaded digital transformation initiative, shifting company from license-based to SaaS model',
                'Established product innovation lab, resulting in 3 new patent filings and 2 new product lines'
            ]
        }],
        education: [{
            degree: 'Master of Science in Engineering',
            school: 'Columbia University',
            location: 'New York, NY',
            graduationDate: '2008'
        }]
    })
];



// Marketing Templates
const getMarketingTemplates = (): ResumeTemplate[] => [
    createTemplate('mkt-entry-001', 'Marketing', 'Entry', 'Sophie Anderson', {
        personalInfo: {
            name: 'Sophie Anderson',
            email: 'sophie.anderson@email.com',
            phone: '+1-305-555-0555',
            location: 'Miami, FL',
            linkedin: 'linkedin.com/in/sophieandersonmkt'
        },
        summary: 'Energetic Marketing Coordinator with experience in social media management and content creation. Proven ability to grow online communities and execute email marketing campaigns. Skilled in Canva, Hootsuite, and Google Analytics.',
        guidanceNotes: {
            summary: 'Highlight internships and specific channels you managed (social, email, events).',
            projects: 'Showcase campaigns you helped execute and their results.'
        },
        skills: [
            { category: 'Digital Marketing', items: ['Social Media Marketing', 'Email Marketing', 'Content Creation', 'SEO Basics'] },
            { category: 'Tools', items: ['Canva', 'Hootsuite', 'Mailchimp', 'Google Analytics', 'WordPress'] },
            { category: 'Soft Skills', items: ['Creativity', 'Communication', 'Organization', 'Teamwork'] }
        ],
        experience: [{
            title: 'Marketing Intern',
            company: 'Lifestyle Brand Co',
            location: 'Miami, FL',
            startDate: 'May 2023',
            endDate: 'August 2023',
            bullets: [
                'Managed Instagram and TikTok accounts, growing follower count by 25% in 3 months',
                'Designed graphics for social media posts and email newsletters using Canva',
                'Assisted in organizing a product launch event attended by 200+ influencers',
                'Drafted blog posts and website copy to improve SEO rankings'
            ]
        }],
        projects: [{
            name: 'University Social Media Campaign',
            description: 'Led a student organization campaign to increase event attendance. Used Instagram Stories and polls to engage students.',
            technologies: ['Social Media', 'Event Planning', 'Content Strategy']
        }],
        education: [{
            degree: 'Bachelor of Science in Marketing',
            school: 'University of Florida',
            location: 'Gainesville, FL',
            graduationDate: '2023'
        }],
        certifications: ['Google Digital Garage', 'HubSpot Social Media Certification']
    }),

    createTemplate('mkt-mid-001', 'Marketing', 'Mid', 'Ryan Miller', {
        personalInfo: {
            name: 'Ryan Miller',
            email: 'ryan.miller@email.com',
            phone: '+1-312-555-0666',
            location: 'Chicago, IL',
            linkedin: 'linkedin.com/in/ryanmillermkt'
        },
        summary: 'Digital Marketing Specialist with 4 years of experience driving growth for B2B tech companies. Expert in paid search (SEM), SEO, and lead generation. Certified in Google Ads and Analytics.',
        guidanceNotes: {
            experience: 'Focus on ROI, conversion rates, and lead quality. Show ability to manage budgets.'
        },
        skills: [
            { category: 'Performance Marketing', items: ['Google Ads (PPC)', 'Facebook Ads', 'LinkedIn Ads', 'SEO'] },
            { category: 'Analytics', items: ['Google Analytics 4', 'Looker Studio', 'Excel', 'A/B Testing'] },
            { category: 'Tools', items: ['HubSpot', 'Salesforce', 'SEMrush', 'WordPress'] }
        ],
        experience: [{
            title: 'Digital Marketing Manager',
            company: 'TechGrowth Agency',
            location: 'Chicago, IL',
            startDate: 'February 2021',
            endDate: 'Present',
            bullets: [
                'Managed $50K/month ad spend across Google and LinkedIn, achieving a 300% ROAS',
                'Optimized landing pages through A/B testing, increasing conversion rate from 2% to 5%',
                'Implemented SEO strategy that grew organic traffic by 150% year-over-year',
                'Nurtured leads through automated email workflows in HubSpot, improving lead-to-opportunity ratio'
            ]
        }],
        education: [{
            degree: 'Bachelor of Business Administration',
            school: 'DePaul University',
            location: 'Chicago, IL',
            graduationDate: '2019'
        }],
        certifications: ['Google Ads Search Certification', 'Google Analytics Individual Qualification']
    }),

    createTemplate('mkt-senior-001', 'Marketing', 'Senior', 'Amanda White', {
        personalInfo: {
            name: 'Amanda White',
            email: 'amanda.white@email.com',
            phone: '+1-212-555-0777',
            location: 'New York, NY',
            linkedin: 'linkedin.com/in/amandawhitemkt'
        },
        summary: 'Senior Marketing Manager with 8 years of experience in brand management and integrated marketing. Proven track record of launching global campaigns that drive brand awareness and revenue. Skilled in team leadership and agency management.',
        guidanceNotes: {
            experience: 'Highlight strategic planning, cross-channel integration, and team leadership.'
        },
        skills: [
            { category: 'Strategy', items: ['Brand Strategy', 'Integrated Marketing', 'Go-to-Market', 'Market Research'] },
            { category: 'Leadership', items: ['Team Management', 'Budgeting', 'Agency Management', 'Public Relations'] },
            { category: 'Channels', items: ['Content Marketing', 'Events', 'Social Media', 'Email'] }
        ],
        experience: [{
            title: 'Senior Brand Manager',
            company: 'Global Consumer Goods',
            location: 'New York, NY',
            startDate: 'September 2018',
            endDate: 'Present',
            bullets: [
                'Led the global launch of a new product line, achieving $20M in first-year sales',
                'Managed a $5M annual marketing budget, allocating resources across digital and traditional channels',
                'Directed a team of 5 marketers and managed relationships with creative and media agencies',
                'Developed brand positioning and messaging guidelines used across all markets'
            ]
        }],
        education: [{
            degree: 'Master of Science in Marketing',
            school: 'New York University',
            location: 'New York, NY',
            graduationDate: '2016'
        }]
    }),

    createTemplate('mkt-exec-001', 'Marketing', 'Executive', 'Thomas Green', {
        personalInfo: {
            name: 'Thomas Green',
            email: 'thomas.green@email.com',
            phone: '+1-415-555-0888',
            location: 'San Francisco, CA',
            linkedin: 'linkedin.com/in/thomasgreenmkt'
        },
        summary: 'Chief Marketing Officer (CMO) with 15 years of experience scaling high-growth tech startups. Expert in building marketing engines from scratch, demand generation, and brand storytelling. Successfully led marketing through 2 IPOs.',
        guidanceNotes: {
            experience: 'Focus on revenue impact, organizational leadership, and investor relations.'
        },
        skills: [
            { category: 'Executive', items: ['Marketing Strategy', 'Revenue Growth', 'Board Reporting', 'Investor Relations'] },
            { category: 'Leadership', items: ['Org Design', 'Talent Development', 'Culture', 'Change Management'] },
            { category: 'Functional', items: ['Demand Gen', 'Product Marketing', 'Brand', 'Communications'] }
        ],
        experience: [{
            title: 'Chief Marketing Officer',
            company: 'SaaS Unicorn',
            location: 'San Francisco, CA',
            startDate: 'January 2017',
            endDate: 'Present',
            bullets: [
                'Built the marketing function from ground up to a team of 50+, scaling ARR from $10M to $100M',
                'Led company rebranding and positioning strategy for IPO, resulting in a successful public listing',
                'Oversaw all aspects of marketing: demand gen, product marketing, brand, comms, and events',
                'Partnered with Sales and Product leadership to align go-to-market strategy and drive growth'
            ]
        }],
        education: [{
            degree: 'MBA',
            school: 'Harvard Business School',
            location: 'Boston, MA',
            graduationDate: '2009'
        }]
    })
];


// Get all templates by role and level
// Get all templates by role and level
export const getProductionTemplates = (): ResumeTemplate[] => {
    return [
        ...softwareEngineerTemplates,
        ...getDataScientistTemplates(),
        ...getProductManagerTemplates(),
        ...getDesignerTemplates(),
        ...getMarketingTemplates()
    ];
};

