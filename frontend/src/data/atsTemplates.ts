// ATS-Optimized Template Data
export interface ATSTemplateData {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        location: string;
        linkedin: string;
        github?: string;
        portfolio?: string;
    };
    summary: string;
    experience: Array<{
        title: string;
        company: string;
        location: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    education: Array<{
        degree: string;
        school: string;
        location: string;
        graduationDate: string;
    }>;
    skills: string[];
    certifications?: string[];
    projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
    }>;
}

// Template content by role and ATS parser
export const atsTemplateContent: Record<string, Record<string, ATSTemplateData>> = {
    'Software Engineer': {
        taleo: {
            personalInfo: {
                name: 'John Doe',
                email: 'john.doe@email.com',
                phone: '+1-555-123-4567',
                location: 'San Francisco, California, United States',
                linkedin: 'linkedin.com/in/johndoe',
                github: 'github.com/johndoe'
            },
            summary: 'Senior Software Engineer with 7 years of experience in full-stack development, specializing in React, Node.js, and AWS cloud architecture. Proven track record of building scalable web applications serving 5 million users and reducing infrastructure costs by 35 percent. Experienced with microservices, Docker, Kubernetes, and agile methodologies in B2B SaaS environments.',
            experience: [
                {
                    title: 'Senior Software Engineer',
                    company: 'TechCorp Inc',
                    location: 'San Francisco, California',
                    startDate: 'June 2020',
                    endDate: 'Present',
                    description: 'Architected microservices platform using Node.js, Docker, and Kubernetes on AWS, reducing deployment time by 60 percent and improving system uptime to 99.9 percent. Led team of 5 engineers to migrate legacy monolith to 12 microservices, resulting in 40 percent faster feature delivery and 35 percent reduction in infrastructure costs. Implemented CI/CD pipeline using Jenkins and Terraform, automating deployments across development, staging, and production environments.'
                },
                {
                    title: 'Software Engineer',
                    company: 'StartupXYZ',
                    location: 'Palo Alto, California',
                    startDate: 'January 2018',
                    endDate: 'May 2020',
                    description: 'Built customer dashboard using React and Redux, improving user engagement by 45 percent and reducing support tickets by 30 percent. Optimized PostgreSQL database queries and implemented Redis caching, reducing page load times by 55 percent. Integrated Stripe and PayPal payment systems processing 2 million dollars monthly with 99.99 percent success rate.'
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'University of California Berkeley',
                    location: 'Berkeley, California',
                    graduationDate: 'May 2016'
                }
            ],
            skills: ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Git', 'CI/CD'],
            certifications: ['AWS Certified Solutions Architect Associate - 2021', 'Certified Kubernetes Administrator - 2022']
        },
        workday: {
            personalInfo: {
                name: 'Jane Smith',
                email: 'jane.smith@email.com',
                phone: '555-987-6543',
                location: 'Boston, Massachusetts 02101',
                linkedin: 'linkedin.com/in/janesmith',
                portfolio: 'janesmith.dev'
            },
            summary: 'Full Stack Software Engineer with 5 years of experience developing web applications using JavaScript, React, Node.js, and cloud technologies. Skilled in agile software development, test-driven development, and continuous integration. Proven ability to deliver high-quality code, collaborate with cross-functional teams, and solve complex technical problems.',
            experience: [
                {
                    title: 'Full Stack Software Engineer',
                    company: 'FinTech Solutions Inc',
                    location: 'Boston, Massachusetts',
                    startDate: 'July 2021',
                    endDate: 'Present',
                    description: 'Design and develop web applications using React, TypeScript, and Node.js for financial services platform serving 500,000 users. Build RESTful APIs and microservices using Node.js and Express, processing 1 million requests daily. Deploy applications to AWS using Docker containers and Kubernetes orchestration. Implement automated testing using Jest, Mocha, and Cypress, maintaining 90 percent code coverage.'
                },
                {
                    title: 'Software Developer',
                    company: 'E-Commerce Company',
                    location: 'Cambridge, Massachusetts',
                    startDate: 'June 2019',
                    endDate: 'June 2021',
                    description: 'Developed e-commerce platform features using React, Redux, and Node.js. Integrated third-party APIs including payment gateways, shipping providers, and analytics tools. Implemented responsive design ensuring compatibility across desktop, tablet, and mobile devices. Reduced page load time by 40 percent through performance optimization and caching strategies.'
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science Degree in Computer Science',
                    school: 'Massachusetts Institute of Technology',
                    location: 'Cambridge, Massachusetts',
                    graduationDate: 'May 2017'
                }
            ],
            skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'MongoDB', 'Git', 'Jest', 'Agile'],
            certifications: ['AWS Certified Developer Associate - 2022', 'Professional Scrum Developer - 2021']
        },
        greenhouse: {
            personalInfo: {
                name: 'Alex Chen',
                email: 'alex.chen@email.com',
                phone: '555-246-8135',
                location: 'Seattle, WA 98101',
                linkedin: 'linkedin.com/in/alexchen',
                github: 'github.com/alexchen'
            },
            summary: 'Software Engineer with 4+ years of experience building scalable web applications using modern JavaScript frameworks and cloud technologies. Expertise in React, Node.js, Python, and AWS. Strong background in agile development, code quality, and team collaboration. Passionate about writing clean, maintainable code and delivering exceptional user experiences.',
            experience: [
                {
                    title: 'Software Engineer',
                    company: 'CloudTech Corporation',
                    location: 'Seattle, WA',
                    startDate: 'March 2021',
                    endDate: 'Present',
                    description: 'Develop and maintain SaaS platform using React, TypeScript, and Node.js, serving 100K+ enterprise users. Build serverless applications using AWS Lambda, API Gateway, and DynamoDB, reducing infrastructure costs by 45%. Implement real-time features using WebSockets and Redis, improving user engagement by 35%. Write comprehensive unit and integration tests using Jest and Cypress, achieving 88% code coverage.'
                },
                {
                    title: 'Software Developer',
                    company: 'StartupHub Inc',
                    location: 'Portland, OR',
                    startDate: 'June 2019',
                    endDate: 'February 2021',
                    description: 'Built customer-facing features using React, Redux, and Material-UI for B2B marketplace platform. Developed RESTful APIs using Node.js and Express, handling 500K+ daily API calls. Optimized database queries and implemented caching with Redis, reducing response times by 60%. Integrated third-party services including Stripe payments, SendGrid emails, and Twilio SMS.'
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science, Computer Science',
                    school: 'University of Washington',
                    location: 'Seattle, WA',
                    graduationDate: '2017'
                }
            ],
            skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS Lambda', 'Docker', 'PostgreSQL', 'Redis', 'Git', 'Jest', 'Cypress'],
            certifications: ['AWS Certified Developer Associate - 2022']
        }
    },
    'Product Manager': {
        taleo: {
            personalInfo: {
                name: 'Sarah Martinez',
                email: 'sarah.martinez@email.com',
                phone: '+1-555-321-7890',
                location: 'New York, New York, United States',
                linkedin: 'linkedin.com/in/sarahmartinez'
            },
            summary: 'Senior Product Manager with 6 years of experience leading B2B SaaS products from ideation to launch. Proven track record of driving product strategy, managing cross-functional teams, and delivering features that increase revenue by 40 percent and user engagement by 50 percent. Expertise in agile methodologies, data-driven decision making, and stakeholder management in fintech and enterprise software domains.',
            experience: [
                {
                    title: 'Senior Product Manager',
                    company: 'PaymentTech Solutions',
                    location: 'New York, New York',
                    startDate: 'April 2021',
                    endDate: 'Present',
                    description: 'Own product roadmap for payment processing platform serving 5,000 merchants processing 500 million dollars annually. Launched embedded payments API adopted by 200 enterprise clients, generating 4 million dollars in new annual recurring revenue. Define and track 15 product KPIs using SQL and Mixpanel, identifying optimization opportunities that increased conversion by 28 percent. Lead cross-functional team of 12 including engineering, design, marketing, and sales through agile sprints.'
                },
                {
                    title: 'Product Manager',
                    company: 'SaaS Company Inc',
                    location: 'New York, New York',
                    startDate: 'June 2019',
                    endDate: 'March 2021',
                    description: 'Managed CRM platform with 10,000 active users, increasing monthly active users by 35 percent year over year. Designed and executed 12 A/B tests using Optimizely, improving user retention by 22 percent and reducing churn by 18 percent. Collaborated with engineering to integrate 3 third-party APIs, enabling features that drove 40 percent increase in premium subscriptions.'
                }
            ],
            education: [
                {
                    degree: 'Master of Business Administration',
                    school: 'Columbia Business School',
                    location: 'New York, New York',
                    graduationDate: 'May 2017'
                }
            ],
            skills: ['Product Strategy', 'Roadmap Planning', 'SQL', 'Google Analytics', 'Mixpanel', 'A/B Testing', 'Agile', 'Scrum', 'Jira', 'Figma', 'Stakeholder Management'],
            certifications: ['Certified Scrum Product Owner - 2020', 'Product Management Certificate - 2019']
        }
    },
    'Data Scientist': {
        greenhouse: {
            personalInfo: {
                name: 'Emily Wang',
                email: 'emily.wang@email.com',
                phone: '555-654-3210',
                location: 'Austin, TX 78701',
                linkedin: 'linkedin.com/in/emilywang'
            },
            summary: 'Data Scientist with 5+ years of experience building machine learning models and delivering data-driven insights for business decision-making. Expertise in Python, SQL, statistical analysis, and machine learning algorithms. Proven track record of developing predictive models that increased revenue by $5M+ and improved operational efficiency by 40%. Strong communicator skilled at translating complex technical concepts for non-technical stakeholders.',
            experience: [
                {
                    title: 'Senior Data Scientist',
                    company: 'E-Commerce Tech Corp',
                    location: 'Austin, TX',
                    startDate: 'June 2021',
                    endDate: 'Present',
                    description: 'Build recommendation engine using collaborative filtering and deep learning, increasing product discovery by 45% and revenue by $3M annually. Develop customer churn prediction model using XGBoost and feature engineering, achieving 89% accuracy and reducing churn by 22%. Design and analyze 20+ A/B tests for product features, providing statistical insights that improved conversion rates by 18%. Create automated reporting dashboards using Tableau and SQL, reducing manual reporting time by 15 hours weekly.'
                },
                {
                    title: 'Data Scientist',
                    company: 'FinTech Startup',
                    location: 'San Antonio, TX',
                    startDate: 'July 2019',
                    endDate: 'May 2021',
                    description: 'Built credit risk model using logistic regression and gradient boosting, improving default prediction accuracy by 25%. Analyzed transaction data (10M+ records) using SQL and Python to detect fraud patterns, reducing fraud losses by $2M. Developed customer segmentation model using K-means clustering, enabling targeted marketing campaigns with 35% higher ROI.'
                }
            ],
            education: [
                {
                    degree: 'Master of Science, Data Science',
                    school: 'University of Texas at Austin',
                    location: 'Austin, TX',
                    graduationDate: '2017'
                }
            ],
            skills: ['Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Tableau', 'AWS', 'Statistical Analysis'],
            certifications: ['AWS Certified Machine Learning Specialty - 2022', 'TensorFlow Developer Certificate - 2021']
        }
    },
    'Designer': {
        workday: {
            personalInfo: {
                name: 'Olivia Taylor',
                email: 'olivia.taylor@email.com',
                phone: '555-111-2222',
                location: 'Los Angeles, California 90001',
                linkedin: 'linkedin.com/in/oliviataylor',
                portfolio: 'oliviataylor.design'
            },
            summary: 'UX/UI Designer with 5 years of experience creating user-centered digital experiences for web and mobile applications. Skilled in user research, wireframing, prototyping, and visual design. Proven ability to collaborate with product managers and engineers to deliver intuitive interfaces that improve user satisfaction and business metrics. Passionate about accessibility, inclusive design, and creating delightful user experiences.',
            experience: [
                {
                    title: 'Senior UX/UI Designer',
                    company: 'SaaS Platform Company',
                    location: 'Los Angeles, California',
                    startDate: 'March 2021',
                    endDate: 'Present',
                    description: 'Lead end-to-end design process for B2B SaaS platform serving 50,000 enterprise users. Conduct user research including 40 interviews and usability tests to inform design decisions and validate solutions. Design wireframes, high-fidelity mockups, and interactive prototypes using Figma for 8 major product features. Create and maintain design system with 100 reusable components, improving design consistency and development speed by 40 percent.'
                },
                {
                    title: 'UX/UI Designer',
                    company: 'Mobile App Startup',
                    location: 'Santa Monica, California',
                    startDate: 'June 2019',
                    endDate: 'February 2021',
                    description: 'Designed user interfaces for iOS and Android mobile application with 200,000 active users. Conducted competitive analysis and heuristic evaluations to benchmark against industry standards. Created user personas and journey maps based on research with 30 target users. Designed onboarding flow that increased user activation rate by 35 percent.'
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Fine Arts Degree in Graphic Design',
                    school: 'Art Center College of Design',
                    location: 'Pasadena, California',
                    graduationDate: 'May 2017'
                }
            ],
            skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Visual Design', 'Design Systems', 'HTML', 'CSS', 'Usability Testing'],
            certifications: ['Google UX Design Professional Certificate - 2021', 'Nielsen Norman Group UX Certificate - 2022']
        }
    },
    'Marketing': {
        taleo: {
            personalInfo: {
                name: 'David Rodriguez',
                email: 'david.rodriguez@email.com',
                phone: '+1-555-999-8888',
                location: 'Chicago, Illinois, United States',
                linkedin: 'linkedin.com/in/davidrodriguez'
            },
            summary: 'Digital Marketing Manager with 6 years of experience driving customer acquisition, engagement, and retention through data-driven marketing strategies. Expertise in SEO, SEM, content marketing, email marketing, and social media marketing. Proven track record of increasing website traffic by 150 percent, generating 5 million dollars in revenue, and reducing customer acquisition cost by 40 percent. Skilled in marketing analytics, A/B testing, and marketing automation platforms.',
            experience: [
                {
                    title: 'Digital Marketing Manager',
                    company: 'E-Commerce Company',
                    location: 'Chicago, Illinois',
                    startDate: 'January 2021',
                    endDate: 'Present',
                    description: 'Develop and execute digital marketing strategy across SEO, SEM, email, and social media channels, generating 5 million dollars in annual revenue. Manage Google Ads and Facebook Ads campaigns with 500,000 dollar monthly budget, achieving 4.5 ROAS and reducing CPA by 35 percent. Lead SEO initiatives that increased organic traffic by 120 percent and improved keyword rankings for 50 target keywords to page 1.'
                },
                {
                    title: 'Senior Marketing Specialist',
                    company: 'SaaS Startup',
                    location: 'Evanston, Illinois',
                    startDate: 'March 2019',
                    endDate: 'December 2020',
                    description: 'Executed content marketing strategy including blog posts, whitepapers, and case studies, increasing website traffic by 80 percent. Managed social media presence across LinkedIn, Twitter, and Facebook, growing followers by 200 percent and engagement by 150 percent. Implemented marketing automation workflows using Marketo, nurturing 10,000 leads and improving conversion rate by 25 percent.'
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Marketing',
                    school: 'Northwestern University',
                    location: 'Evanston, Illinois',
                    graduationDate: 'May 2017'
                }
            ],
            skills: ['SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Email Marketing', 'Google Analytics', 'HubSpot', 'Marketo', 'Social Media Marketing'],
            certifications: ['Google Analytics Individual Qualification - 2021', 'Google Ads Certification - 2021', 'HubSpot Inbound Marketing - 2020']
        }
    }
};

// Get template content by role and parser
export const getTemplateContent = (role: string, parser: string = 'taleo'): ATSTemplateData | null => {
    const roleTemplates = atsTemplateContent[role];
    if (!roleTemplates) return null;

    return roleTemplates[parser] || roleTemplates['taleo'] || null;
};
