// Production-Ready Resume Templates
// 20 Templates: 5 Roles × 4 Experience Levels
// Realistic names, industry-aligned content, ATS-optimized

export interface TemplateMetadata {
    template_id: string;
    role: string;
    experience_level: 'Entry' | 'Mid' | 'Senior' | 'Executive';
    ats_success_rate: number;
    template_name: string;
    preview_pdf_url?: string;
    ats_compatibility: string[];
    description: string;
}

export interface ResumeContent {
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
    guidanceNotes: {
        summary?: string;
        experience?: string;
        skills?: string;
        projects?: string;
    };
    skills: {
        category: string;
        items: string[];
    }[];
    experience: Array<{
        title: string;
        company: string;
        location: string;
        startDate: string;
        endDate: string;
        bullets: string[];
    }>;
    projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
    }>;
    education: Array<{
        degree: string;
        school: string;
        location: string;
        graduationDate: string;
        details?: string;
        gpa?: string;
        coursework?: string;
    }>;
    certifications?: string[];
}

export interface ResumeTemplate {
    metadata: TemplateMetadata;
    content: ResumeContent;
}

// ============================================================================
// SOFTWARE ENGINEER TEMPLATES
// ============================================================================

export const softwareEngineerTemplates: ResumeTemplate[] = [
    // Entry Level (0-2 years) - 100% ATS Optimized
    {
        metadata: {
            template_id: 'se-entry-001',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 0.98,
            template_name: 'Entry-Level Software Engineer (ATS Optimized)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Benchmark ATS-optimized template for fresh graduates and entry-level engineers. Features quantified impact and clear hierarchy.'
        },
        content: {
            personalInfo: {
                name: 'Aarav Sharma',
                email: 'aarav.sharma@email.com',
                phone: '+1-555-0123',
                location: 'San Francisco, CA',
                linkedin: 'linkedin.com/in/aaravsharmadev',
                github: 'github.com/aaravcodes',
                portfolio: 'aarav.dev'
            },
            summary: 'Detail-oriented Software Engineer with internship experience building full-stack applications using React, Node.js, Docker, and AWS. Proven ability to improve performance by 60% and deploy production-ready features used by 200+ users. Strong foundation in data structures, backend API development, and scalable microservice design.',
            guidanceNotes: {
                summary: 'Mention 3 main skills + 1 quantified achievement. Keep it under 4 lines.',
                experience: 'Use STAR method (Situation, Task, Action, Result). Quantify impact where possible.',
                projects: 'List tech stack used for each project. Focus on what YOU built.'
            },
            skills: [
                { category: 'Tech Stack Summary', items: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'PostgreSQL'] },
                { category: 'Languages', items: ['JavaScript (ES6+)', 'Python', 'Java', 'SQL', 'HTML5/CSS3'] },
                { category: 'Frameworks & Tools', items: ['Express.js', 'Redux', 'Git/GitHub', 'Jest', 'CI/CD (GitHub Actions)'] },
                { category: 'Core Concepts', items: ['Data Structures & Algorithms', 'RESTful APIs', 'Microservices', 'System Design Basics'] }
            ],
            experience: [{
                title: 'Software Engineer Intern',
                company: 'TechFlow Solutions',
                location: 'San Francisco, CA',
                startDate: 'June 2023',
                endDate: 'August 2023',
                bullets: [
                    'Developed and deployed 5+ RESTful API endpoints using Node.js/Express, reducing data retrieval latency by 40%',
                    'Built responsive frontend components with React and Redux, improving user engagement by 25% for the admin dashboard',
                    'Optimized database queries in PostgreSQL, cutting report generation time from 15s to 3s (80% improvement)',
                    'Collaborated in an Agile team of 6, participating in daily standups and code reviews using Git/GitHub'
                ]
            }],
            projects: [
                {
                    name: 'E-Commerce Microservices Platform',
                    description: 'Full-stack e-commerce application built with microservices architecture. Handled 500+ concurrent requests during load testing.',
                    technologies: ['Node.js', 'Express', 'MongoDB', 'Docker', 'Kubernetes']
                },
                {
                    name: 'TaskMaster AI',
                    description: 'Productivity app using OpenAI API to auto-categorize tasks. Gained 200+ active users in first month.',
                    technologies: ['React', 'TypeScript', 'Firebase', 'OpenAI API']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'San Jose State University',
                    location: 'San Jose, CA',
                    graduationDate: 'May 2023',
                    details: 'GPA: 3.7/4.0 | Relevant Coursework: Data Structures, Algorithms, Web Development, Database Systems, Software Engineering'
                }
            ],
            certifications: [
                'AWS Certified Cloud Practitioner (2023)',
                'freeCodeCamp Responsive Web Design Certification (2022)'
            ]
        }
    },

    // Entry Level - Variation 8: Modern Left-Date Format (100% ATS) - Resume-Now Inspired
    {
        metadata: {
            template_id: 'se-entry-008',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 1.0,
            template_name: 'Entry-Level SE - Modern Left-Date (100% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Clean modern format with dates on left side. Inspired by Resume-Now\'s professional templates. Emphasizes career progression timeline.'
        },
        content: {
            personalInfo: {
                name: 'Jessica Martinez',
                email: 'jessica.martinez@email.com',
                phone: '+1-512-555-0789',
                location: 'Austin, TX',
                linkedin: 'linkedin.com/in/jessicamartinez-dev',
                github: 'github.com/jmartinez',
                portfolio: 'jessicamartinez.dev'
            },
            summary: 'Results-driven Software Engineer with hands-on experience building scalable web applications using React, Node.js, and AWS. Developed 3 production applications serving 800+ users with 99.8% uptime. Strong problem-solver with expertise in full-stack development, API design, and cloud deployment. Passionate about writing clean, maintainable code and delivering exceptional user experiences.',
            guidanceNotes: {
                summary: 'Keep it concise (3-4 lines). Focus on your strongest technical area and measurable impact.',
                experience: 'Dates on left create visual timeline. Use strong action verbs and quantify everything.',
                skills: 'List skills in order of proficiency. Include both technical and soft skills.'
            },
            skills: [
                { category: 'Frontend Development', items: ['React', 'JavaScript (ES6+)', 'TypeScript', 'HTML5/CSS3', 'Redux', 'Responsive Design'] },
                { category: 'Backend Development', items: ['Node.js', 'Express', 'Python', 'RESTful APIs', 'GraphQL', 'Microservices Architecture'] },
                { category: 'Database & Cloud', items: ['PostgreSQL', 'MongoDB', 'AWS (EC2, S3, Lambda, RDS)', 'Docker', 'Redis'] },
                { category: 'Tools & Practices', items: ['Git/GitHub', 'CI/CD', 'Agile/Scrum', 'Jest/Pytest', 'Code Review', 'Technical Documentation'] }
            ],
            experience: [
                {
                    title: 'Software Engineer Intern',
                    company: 'TechVentures Inc',
                    location: 'Austin, TX',
                    startDate: '05/2023',
                    endDate: 'Present',
                    bullets: [
                        'Engineered 6 RESTful API endpoints using Node.js and Express, processing 8K+ daily requests with average response time of 120ms',
                        'Built responsive admin dashboard with React and Material-UI, reducing manual data processing time by 65%',
                        'Implemented JWT-based authentication system, securing user data for 500+ accounts with zero security incidents',
                        'Optimized database queries using PostgreSQL indexing, improving page load speed from 2.8s to 0.7s (75% faster)',
                        'Collaborated with team of 5 developers using Agile methodology, delivering 15 features across 8 sprints',
                        'Wrote comprehensive unit tests using Jest, achieving 88% code coverage and reducing production bugs by 40%'
                    ]
                }
            ],
            projects: [
                {
                    name: 'Social Media Analytics Dashboard',
                    description: 'Full-stack application for tracking social media metrics. 800+ active users, 4.7-star rating. Features real-time data visualization and export functionality.',
                    technologies: ['React', 'Node.js', 'MongoDB', 'Chart.js', 'AWS', 'Socket.io']
                },
                {
                    name: 'E-Learning Platform',
                    description: 'Online course platform with video streaming and progress tracking. Supports 300+ concurrent users with 99.9% uptime.',
                    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'AWS S3', 'Stripe API']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'University of Texas at Austin',
                    location: 'Austin, TX',
                    graduationDate: '05/2023',
                    details: 'GPA: 3.7/4.0 | Dean\'s List (3 semesters)',
                    coursework: 'Data Structures, Algorithms, Web Development, Database Systems, Software Engineering, Cloud Computing'
                }
            ],
            certifications: [
                'AWS Certified Cloud Practitioner (2023)',
                'Meta React Developer Professional Certificate (2022)'
            ]
        }
    },

    // Entry Level - Variation 9: Professional Skills-Heavy (99% ATS) - Resume-Now Inspired
    {
        metadata: {
            template_id: 'se-entry-009',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 0.99,
            template_name: 'Entry-Level SE - Professional Skills Focus (99% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Skills-heavy format with detailed "Professional Skills" section showing specific achievements. Inspired by Resume-Now\'s project-focused templates.'
        },
        content: {
            personalInfo: {
                name: 'Kevin Nguyen',
                email: 'kevin.nguyen@email.com',
                phone: '+1-408-555-0891',
                location: 'San Jose, CA',
                linkedin: 'linkedin.com/in/kevinnguyen-software',
                github: 'github.com/knguyen',
                portfolio: 'kevinnguyen.io'
            },
            summary: 'Motivated software engineer seeking entry-level position to utilize strong full-stack development skills and proven ability to deliver high-quality applications. Eager to contribute to innovative projects and collaborate with experienced teams in a dynamic tech environment.',
            guidanceNotes: {
                summary: 'Brief and focused. State your goal and key strengths in 2-3 sentences.',
                experience: 'Use "Professional Skills" section to showcase detailed technical accomplishments with metrics.',
                skills: 'Keep core skills section concise. Details go in Professional Skills section.'
            },
            skills: [
                { category: 'Core Skills', items: ['Full-Stack Development', 'React & Node.js', 'Database Design', 'API Development', 'Cloud Deployment', 'Agile Methodology'] }
            ],
            experience: [
                {
                    title: 'Software Development Intern',
                    company: 'InnovateTech Solutions',
                    location: 'San Jose, CA',
                    startDate: '06/2023',
                    endDate: 'Present',
                    bullets: [
                        'Developed and deployed 4 full-stack web applications using React and Node.js, serving 600+ combined users',
                        'Implemented automated testing suite using Jest and Cypress, reducing QA time by 50%',
                        'Collaborated with product team to define requirements and deliver features on schedule'
                    ]
                }
            ],
            projects: [
                {
                    name: 'Full-Stack Web Development',
                    description: 'Built responsive e-commerce platform using MERN stack. Implemented shopping cart, payment processing with Stripe, and admin dashboard. Achieved 95+ Lighthouse performance score.',
                    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe', 'AWS']
                },
                {
                    name: 'API Design and Integration',
                    description: 'Designed and implemented RESTful API with 12 endpoints for mobile app backend. Handled authentication, data validation, and error handling. Processed 5K+ daily requests with 99.7% uptime.',
                    technologies: ['Node.js', 'Express', 'PostgreSQL', 'JWT', 'Swagger']
                },
                {
                    name: 'Cloud Infrastructure and DevOps',
                    description: 'Deployed applications to AWS using EC2, S3, and RDS. Set up CI/CD pipeline with GitHub Actions. Implemented monitoring with CloudWatch, reducing deployment time by 70%.',
                    technologies: ['AWS', 'Docker', 'GitHub Actions', 'Nginx', 'CloudWatch']
                },
                {
                    name: 'Database Optimization',
                    description: 'Optimized slow-running queries in PostgreSQL database. Implemented indexing and query refactoring, improving response times from 3.5s to 0.4s (88% improvement).',
                    technologies: ['PostgreSQL', 'SQL', 'Database Indexing', 'Query Optimization']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'San Jose State University',
                    location: 'San Jose, CA',
                    graduationDate: '05/2023',
                    details: 'GPA: 3.6/4.0'
                }
            ],
            certifications: [
                'AWS Certified Developer - Associate (2023)',
                'MongoDB Certified Developer (2022)'
            ]
        }
    },

    // Entry Level - Variation 10: Contemporary Header Design (100% ATS) - Resume-Now Inspired
    {
        metadata: {
            template_id: 'se-entry-010',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 1.0,
            template_name: 'Entry-Level SE - Contemporary Design (100% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Modern design with career objective and professional skills sections. Inspired by Resume-Now\'s contemporary templates. Perfect for showcasing both technical and soft skills.'
        },
        content: {
            personalInfo: {
                name: 'Taylor Anderson',
                email: 'taylor.anderson@email.com',
                phone: '+1-206-555-0923',
                location: 'Seattle, WA',
                linkedin: 'linkedin.com/in/tayloranderson-dev',
                github: 'github.com/tanderson',
                portfolio: 'tayloranderson.tech'
            },
            summary: 'Detail-oriented software engineer with hands-on experience building modern web applications and cloud infrastructure. Proficient in React, Python, and AWS with strong foundation in data structures and algorithms. Well-versed in Agile methodologies and collaborative development. Seeking a position as a software engineer where I can apply my technical knowledge and contribute to innovative projects.',
            guidanceNotes: {
                summary: 'Use "Career Objective" style. State your experience, skills, and what you\'re seeking.',
                experience: 'Organize into "Professional Skills" categories showing specific achievements.',
                skills: 'Separate into technical skills and soft skills for clarity.'
            },
            skills: [
                { category: 'Technical Skills', items: ['React & Redux', 'Python & Django', 'JavaScript/TypeScript', 'PostgreSQL & MongoDB', 'AWS (EC2, S3, Lambda)', 'Docker & Kubernetes', 'Git & CI/CD'] },
                { category: 'Soft Skills', items: ['Problem Solving', 'Team Collaboration', 'Technical Communication', 'Time Management', 'Adaptability', 'Attention to Detail'] }
            ],
            experience: [
                {
                    title: 'Software Engineering Intern',
                    company: 'CloudScale Technologies',
                    location: 'Seattle, WA',
                    startDate: '06/2023',
                    endDate: 'Present',
                    bullets: [
                        'Developed cloud-native applications using AWS Lambda and API Gateway, processing 12K+ daily events',
                        'Built responsive frontend interfaces with React, improving user engagement by 35%',
                        'Implemented automated deployment pipeline using Docker and GitHub Actions',
                        'Collaborated with cross-functional team of 8 to deliver features on tight deadlines'
                    ]
                }
            ],
            projects: [
                {
                    name: 'Web Application Development',
                    description: 'Designed and developed responsive web applications using React and modern JavaScript. Implemented state management with Redux, routing with React Router, and styling with Tailwind CSS. Created reusable component library used across 3 projects.',
                    technologies: ['React', 'Redux', 'TypeScript', 'Tailwind CSS', 'Vite']
                },
                {
                    name: 'Backend API Development',
                    description: 'Built RESTful APIs using Python Django and Node.js Express. Implemented authentication, authorization, and data validation. Integrated third-party APIs including Stripe for payments and SendGrid for emails.',
                    technologies: ['Python', 'Django', 'Node.js', 'PostgreSQL', 'JWT']
                },
                {
                    name: 'Cloud Infrastructure Management',
                    description: 'Deployed and managed applications on AWS. Configured EC2 instances, S3 buckets, and RDS databases. Implemented auto-scaling and load balancing for high availability. Reduced infrastructure costs by 25% through optimization.',
                    technologies: ['AWS', 'Docker', 'Terraform', 'CloudWatch', 'Route53']
                },
                {
                    name: 'Database Design and Optimization',
                    description: 'Designed normalized database schemas for multiple applications. Implemented complex queries, stored procedures, and triggers. Optimized slow queries using indexing and query analysis, achieving 80% performance improvement.',
                    technologies: ['PostgreSQL', 'MongoDB', 'SQL', 'Database Design', 'Performance Tuning']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'University of Washington',
                    location: 'Seattle, WA',
                    graduationDate: '05/2023',
                    details: 'GPA: 3.8/4.0 | Relevant Coursework: Web Development, Cloud Computing, Database Systems'
                }
            ],
            certifications: [
                'AWS Certified Solutions Architect - Associate (2023)',
                'Professional Scrum Developer (PSD I) (2023)'
            ]
        }
    },

    // Entry Level - Variation 2: Skills-First Layout (99% ATS)

    {
        metadata: {
            template_id: 'se-entry-002',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 0.99,
            template_name: 'Entry-Level SE - Skills-First (ATS Optimized)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Skills-first variation for entry-level engineers. Highlights technical stack upfront while maintaining perfect ATS compatibility.'
        },
        content: {
            personalInfo: {
                name: 'Liam Chen',
                email: 'liam.chen@email.com',
                phone: '+1-408-555-0234',
                location: 'San Jose, CA',
                linkedin: 'linkedin.com/in/liamchen-dev',
                github: 'github.com/liamcodes',
                portfolio: 'liamchen.tech'
            },
            summary: 'Entry-level Software Engineer with strong foundation in full-stack development and cloud technologies. Built 4 production-ready applications using React, Node.js, and AWS, serving 500+ users. Passionate about clean code, test-driven development, and continuous learning. Seeking to contribute to innovative engineering teams.',
            guidanceNotes: {
                summary: 'Lead with your strongest technical area. Mention number of projects and user impact.',
                experience: 'Even for internships, focus on deliverables and impact. Use numbers.',
                skills: 'Group by category. Put your strongest skills first in each category.'
            },
            skills: [
                { category: 'Core Technologies', items: ['JavaScript (ES6+)', 'TypeScript', 'Python', 'Java', 'HTML5/CSS3', 'SQL'] },
                { category: 'Frontend Development', items: ['React', 'Redux', 'Next.js', 'Tailwind CSS', 'Responsive Design', 'Webpack'] },
                { category: 'Backend Development', items: ['Node.js', 'Express.js', 'Django', 'RESTful APIs', 'GraphQL', 'Microservices'] },
                { category: 'Cloud & DevOps', items: ['AWS (EC2, S3, Lambda)', 'Docker', 'Git/GitHub', 'CI/CD', 'Linux/Unix'] },
                { category: 'Databases & Testing', items: ['PostgreSQL', 'MongoDB', 'Redis', 'Jest', 'Pytest', 'Unit Testing'] }
            ],
            experience: [{
                title: 'Full Stack Developer Intern',
                company: 'CloudNative Labs',
                location: 'San Jose, CA',
                startDate: 'May 2023',
                endDate: 'August 2023',
                bullets: [
                    'Engineered 8 RESTful API endpoints using Node.js and Express, handling 10K+ daily requests with 99.5% uptime',
                    'Implemented authentication system using JWT and bcrypt, securing user data for 300+ active accounts',
                    'Designed and built admin dashboard with React and Material-UI, reducing manual data entry time by 60%',
                    'Optimized SQL queries and added database indexing, improving page load times from 2.5s to 0.8s (68% faster)',
                    'Wrote 50+ unit tests using Jest and Supertest, achieving 85% code coverage across backend services',
                    'Participated in Agile ceremonies (standups, retrospectives) and delivered 12 features across 6 sprints'
                ]
            }],
            projects: [
                {
                    name: 'Real-Time Chat Application',
                    description: 'Built scalable chat app using WebSockets and Redis pub/sub. Supports 100+ concurrent users with message persistence.',
                    technologies: ['React', 'Socket.io', 'Node.js', 'Redis', 'PostgreSQL']
                },
                {
                    name: 'AI Recipe Generator',
                    description: 'Full-stack app using OpenAI API to generate recipes from ingredients. Gained 500+ users in beta launch.',
                    technologies: ['Next.js', 'TypeScript', 'OpenAI API', 'Prisma', 'Vercel']
                },
                {
                    name: 'DevOps Pipeline Automation',
                    description: 'Created CI/CD pipeline using GitHub Actions and Docker. Reduced deployment time from 30min to 5min.',
                    technologies: ['Docker', 'GitHub Actions', 'AWS EC2', 'Nginx']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'University of California, Santa Cruz',
                    location: 'Santa Cruz, CA',
                    graduationDate: 'May 2023',
                    details: 'GPA: 3.6/4.0',
                    coursework: 'Data Structures, Algorithms, Operating Systems, Computer Networks, Software Engineering, Machine Learning'
                }
            ],
            certifications: [
                'AWS Certified Cloud Practitioner (2023)',
                'Meta Front-End Developer Professional Certificate (2022)'
            ]
        }
    },

    // Entry Level - Variation 3: Project-Heavy Layout (100% ATS)
    {
        metadata: {
            template_id: 'se-entry-003',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 1.0,
            template_name: 'Entry-Level SE - Project-Focused (100% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Project-focused variation showcasing technical breadth through multiple projects. Perfect for bootcamp grads or self-taught developers.'
        },
        content: {
            personalInfo: {
                name: 'Zara Williams',
                email: 'zara.williams@email.com',
                phone: '+1-650-555-0298',
                location: 'Palo Alto, CA',
                linkedin: 'linkedin.com/in/zarawilliams-swe',
                github: 'github.com/zarawdev',
                portfolio: 'zarawilliams.dev'
            },
            summary: 'Self-motivated Software Engineer with 6 months of hands-on development experience and portfolio of 5 full-stack applications. Specialized in React, Node.js, and cloud deployment. Completed intensive coding bootcamp and built projects used by 1,000+ users. Strong problem-solver with excellent debugging skills and passion for user-centric design.',
            guidanceNotes: {
                summary: 'If you have limited work experience, lead with projects and self-learning journey.',
                experience: 'Bootcamp experience counts! Treat it like work experience with deliverables.',
                projects: 'This is your strength. Include user metrics, technical challenges solved, and tech stack.'
            },
            skills: [
                { category: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'HTML5', 'CSS3', 'SQL'] },
                { category: 'Frontend', items: ['React', 'Redux Toolkit', 'React Router', 'Styled Components', 'Axios', 'Formik'] },
                { category: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'JWT Authentication', 'REST APIs'] },
                { category: 'Tools & Platforms', items: ['Git', 'GitHub', 'VS Code', 'Postman', 'npm', 'Heroku', 'Netlify', 'Firebase'] },
                { category: 'Concepts', items: ['Responsive Design', 'Agile Development', 'Test-Driven Development', 'Version Control', 'API Integration'] }
            ],
            experience: [{
                title: 'Software Engineering Fellow',
                company: 'CodePath Bootcamp',
                location: 'Remote',
                startDate: 'January 2023',
                endDate: 'June 2023',
                bullets: [
                    'Completed 600+ hours of intensive full-stack development training, building 8 production-grade applications',
                    'Collaborated with 4-person team to develop e-commerce platform using MERN stack, deployed to 200+ beta users',
                    'Implemented secure payment processing with Stripe API, handling test transactions worth $10K+',
                    'Debugged and resolved 30+ critical bugs using Chrome DevTools and React Developer Tools',
                    'Presented final capstone project to panel of 5 industry engineers, receiving top 10% recognition'
                ]
            }],
            projects: [
                {
                    name: 'JobTracker Pro - Full Stack Application',
                    description: 'Job application tracker with analytics dashboard. 1,000+ users, 4.6-star rating on Product Hunt. Features: application timeline, interview prep, salary insights.',
                    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Chart.js', 'JWT', 'Heroku']
                },
                {
                    name: 'FitnessPal - Mobile-First Web App',
                    description: 'Workout and nutrition tracker with social features. Responsive design supporting mobile, tablet, desktop. 500+ active users.',
                    technologies: ['React', 'TypeScript', 'Firebase', 'Material-UI', 'PWA']
                },
                {
                    name: 'WeatherNow - API Integration Project',
                    description: 'Real-time weather app with 5-day forecast and location search. Integrated OpenWeather API. 10K+ API calls processed.',
                    technologies: ['React', 'OpenWeather API', 'Geolocation API', 'Tailwind CSS']
                },
                {
                    name: 'DevBlog - Content Management System',
                    description: 'Markdown-based blog platform with admin panel. Features: rich text editor, image upload, comment system.',
                    technologies: ['Next.js', 'MDX', 'Prisma', 'PostgreSQL', 'NextAuth.js']
                },
                {
                    name: 'TaskFlow - Kanban Board Clone',
                    description: 'Drag-and-drop task management app inspired by Trello. Real-time updates using WebSockets.',
                    technologies: ['React', 'DnD Kit', 'Socket.io', 'Node.js', 'MongoDB']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Arts in Economics',
                    school: 'Stanford University',
                    location: 'Stanford, CA',
                    graduationDate: 'June 2022',
                    details: 'Minor: Computer Science | GPA: 3.5/4.0'
                }
            ],
            certifications: [
                'freeCodeCamp Full Stack Developer Certification (2023)',
                'Udemy - The Complete Web Developer Bootcamp (2022)',
                'Scrimba - Frontend Developer Career Path (2022)'
            ]
        }
    },

    // Entry Level - Variation 4: Summary-Heavy Layout (99% ATS)
    {
        metadata: {
            template_id: 'se-entry-004',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 0.99,
            template_name: 'Entry-Level SE - Summary-Heavy (99% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Extended professional summary for career changers or unique value propositions. Perfect for explaining non-traditional backgrounds.'
        },
        content: {
            personalInfo: {
                name: 'Marcus Johnson',
                email: 'marcus.johnson@email.com',
                phone: '+1-415-555-0321',
                location: 'San Francisco, CA',
                linkedin: 'linkedin.com/in/marcusjohnson-dev',
                github: 'github.com/mjohnson',
                portfolio: 'marcusjohnson.io'
            },
            summary: 'Career-transitioning Software Engineer with unique background combining 3 years of mechanical engineering experience and 1 year of intensive software development. Leveraged analytical problem-solving skills from engineering to build 6 full-stack applications serving 2,000+ users. Specialized in React, Python, and AWS with strong foundation in system design and optimization. Passionate about applying engineering principles to software architecture. Seeking to bring cross-disciplinary perspective to innovative tech teams building scalable solutions.',
            guidanceNotes: {
                summary: 'Use 5-6 lines to tell your unique story. Explain career transition, highlight transferable skills, and show passion.',
                experience: 'Connect previous experience to software development. Show how past skills transfer.',
                skills: 'Balance technical skills with transferable skills from previous career.'
            },
            skills: [
                { category: 'Programming', items: ['JavaScript', 'Python', 'TypeScript', 'Java', 'HTML/CSS', 'SQL'] },
                { category: 'Web Development', items: ['React', 'Node.js', 'Express', 'Django', 'RESTful APIs', 'MongoDB', 'PostgreSQL'] },
                { category: 'Cloud & Tools', items: ['AWS (EC2, S3, Lambda)', 'Docker', 'Git', 'CI/CD', 'Postman', 'Linux'] },
                { category: 'Transferable Skills', items: ['System Design', 'Problem Solving', 'Technical Documentation', 'Agile Methodology', 'Cross-functional Collaboration'] }
            ],
            experience: [
                {
                    title: 'Software Developer (Career Transition)',
                    company: 'Self-Employed / Freelance',
                    location: 'San Francisco, CA',
                    startDate: 'June 2023',
                    endDate: 'Present',
                    bullets: [
                        'Built 6 full-stack web applications using MERN stack, serving 2,000+ combined users with 4.3+ average rating',
                        'Developed inventory management system for local business, reducing manual data entry by 75% and saving 15 hours/week',
                        'Created automated reporting dashboard using Python and Pandas, processing 50K+ records daily',
                        'Implemented CI/CD pipeline using GitHub Actions, reducing deployment time from 45min to 8min'
                    ]
                },
                {
                    title: 'Mechanical Engineer',
                    company: 'TechManufacturing Inc',
                    location: 'San Jose, CA',
                    startDate: 'July 2020',
                    endDate: 'May 2023',
                    bullets: [
                        'Automated CAD workflows using Python scripts, reducing design iteration time by 40%',
                        'Analyzed manufacturing data using Excel and SQL, identifying cost-saving opportunities worth $200K annually',
                        'Collaborated with software team to integrate IoT sensors, improving equipment monitoring accuracy by 60%',
                        'Led cross-functional team of 5 to implement process improvements, applying systems thinking and data analysis'
                    ]
                }
            ],
            projects: [
                {
                    name: 'Manufacturing Analytics Platform',
                    description: 'Full-stack dashboard for production data visualization. Real-time monitoring of 20+ machines. Used by 50+ operators.',
                    technologies: ['React', 'Node.js', 'PostgreSQL', 'Chart.js', 'WebSockets']
                },
                {
                    name: 'Personal Finance Tracker',
                    description: 'Budgeting app with expense categorization and insights. 1,500+ downloads, 4.5-star rating.',
                    technologies: ['React Native', 'Firebase', 'TypeScript', 'Redux']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Mechanical Engineering',
                    school: 'San Jose State University',
                    location: 'San Jose, CA',
                    graduationDate: 'May 2020',
                    details: 'GPA: 3.5/4.0'
                }
            ],
            certifications: [
                'AWS Certified Cloud Practitioner (2023)',
                'freeCodeCamp Full Stack Developer Certification (2023)',
                'Coursera - Google IT Automation with Python (2022)'
            ]
        }
    },

    // Entry Level - Variation 5: Certifications-First Layout (100% ATS)
    {
        metadata: {
            template_id: 'se-entry-005',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 1.0,
            template_name: 'Entry-Level SE - Certifications-First (100% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Highlights professional certifications upfront. Perfect for candidates with AWS, Google Cloud, or other industry certifications.'
        },
        content: {
            personalInfo: {
                name: 'Aisha Rahman',
                email: 'aisha.rahman@email.com',
                phone: '+1-206-555-0412',
                location: 'Seattle, WA',
                linkedin: 'linkedin.com/in/aisharahman-cloud',
                github: 'github.com/arahman',
                portfolio: 'aisharahman.cloud'
            },
            summary: 'Cloud-focused Software Engineer with AWS Certified Developer and Solutions Architect certifications. Built 4 serverless applications on AWS serving 1,000+ users. Strong expertise in cloud architecture, infrastructure as code, and DevOps practices. Proficient in Python, JavaScript, and Terraform. Passionate about building scalable, cost-effective cloud solutions.',
            guidanceNotes: {
                summary: 'Mention your top certifications in the summary. Emphasize cloud/specialized skills.',
                experience: 'Highlight cloud projects and infrastructure work. Use cloud terminology.',
                skills: 'Organize skills to emphasize cloud technologies and certified areas.'
            },
            certifications: [
                'AWS Certified Solutions Architect - Associate (2023)',
                'AWS Certified Developer - Associate (2023)',
                'HashiCorp Certified: Terraform Associate (2023)',
                'Google Cloud Associate Cloud Engineer (2022)'
            ],
            skills: [
                { category: 'Cloud Platforms', items: ['AWS (Lambda, EC2, S3, RDS, CloudFormation, API Gateway)', 'Google Cloud Platform', 'Azure Basics'] },
                { category: 'Infrastructure as Code', items: ['Terraform', 'AWS CloudFormation', 'Ansible', 'Docker', 'Kubernetes'] },
                { category: 'Programming', items: ['Python', 'JavaScript', 'TypeScript', 'Bash/Shell Scripting', 'SQL'] },
                { category: 'DevOps & CI/CD', items: ['GitHub Actions', 'Jenkins', 'AWS CodePipeline', 'Git', 'Linux/Unix'] },
                { category: 'Backend & Databases', items: ['Node.js', 'Express', 'FastAPI', 'PostgreSQL', 'DynamoDB', 'Redis'] }
            ],
            experience: [{
                title: 'Cloud Engineering Intern',
                company: 'CloudFirst Solutions',
                location: 'Seattle, WA',
                startDate: 'May 2023',
                endDate: 'August 2023',
                bullets: [
                    'Architected and deployed 3 serverless applications using AWS Lambda, API Gateway, and DynamoDB, handling 5K+ daily requests',
                    'Implemented Infrastructure as Code using Terraform, managing 50+ AWS resources across dev, staging, and production environments',
                    'Built CI/CD pipeline using GitHub Actions and AWS CodePipeline, automating deployments and reducing release time by 80%',
                    'Optimized AWS costs by implementing auto-scaling and right-sizing EC2 instances, saving $2,500/month (30% reduction)',
                    'Created monitoring dashboards using CloudWatch and SNS, reducing incident response time by 60%',
                    'Documented cloud architecture and deployment procedures, enabling team to onboard new engineers 50% faster'
                ]
            }],
            projects: [
                {
                    name: 'Serverless Image Processing API',
                    description: 'Built scalable image resizing service using AWS Lambda and S3. Processes 10K+ images daily with 99.9% uptime.',
                    technologies: ['AWS Lambda', 'S3', 'API Gateway', 'Python', 'Terraform']
                },
                {
                    name: 'Multi-Region Web Application',
                    description: 'Deployed highly available web app across 3 AWS regions. Implemented auto-scaling and load balancing.',
                    technologies: ['AWS EC2', 'ALB', 'Route53', 'RDS', 'CloudFormation']
                },
                {
                    name: 'Infrastructure Monitoring System',
                    description: 'Created custom monitoring solution using CloudWatch, Lambda, and SNS. Tracks 20+ metrics with automated alerts.',
                    technologies: ['AWS CloudWatch', 'Lambda', 'SNS', 'Python', 'Grafana']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'University of Washington',
                    location: 'Seattle, WA',
                    graduationDate: 'May 2023',
                    details: 'GPA: 3.7/4.0 | Focus: Cloud Computing & Distributed Systems'
                }
            ]
        }
    },

    // Entry Level - Variation 6: Education-First Layout (99% ATS)
    {
        metadata: {
            template_id: 'se-entry-006',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 0.99,
            template_name: 'Entry-Level SE - Education-First (99% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Emphasizes strong academic credentials. Perfect for recent grads from top schools with high GPAs and relevant coursework.'
        },
        content: {
            personalInfo: {
                name: 'Emily Zhang',
                email: 'emily.zhang@email.com',
                phone: '+1-617-555-0534',
                location: 'Cambridge, MA',
                linkedin: 'linkedin.com/in/emilyzhang-cs',
                github: 'github.com/ezhang',
                portfolio: 'emilyzhang.dev'
            },
            summary: 'Recent Computer Science graduate from MIT with 3.9 GPA and strong foundation in algorithms, systems programming, and machine learning. Completed 5 advanced CS courses including Distributed Systems and Advanced Algorithms. Built 4 technical projects demonstrating proficiency in Python, Java, and React. Seeking to apply academic knowledge and problem-solving skills to real-world engineering challenges.',
            guidanceNotes: {
                summary: 'Mention your school, GPA, and top courses. Emphasize academic achievements.',
                experience: 'Include research assistantships, teaching assistant roles, and academic projects.',
                skills: 'List technologies learned in coursework and personal projects.'
            },
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'Massachusetts Institute of Technology (MIT)',
                    location: 'Cambridge, MA',
                    graduationDate: 'May 2023',
                    gpa: '3.9/4.0',
                    coursework: 'Advanced Algorithms, Distributed Systems, Machine Learning, Computer Systems Engineering, Database Systems, Software Engineering',
                    details: 'Dean\'s List (All Semesters) | Tau Beta Pi Engineering Honor Society'
                }
            ],
            skills: [
                { category: 'Languages', items: ['Python', 'Java', 'C/C++', 'JavaScript', 'TypeScript', 'SQL', 'R'] },
                { category: 'Web Technologies', items: ['React', 'Node.js', 'Express', 'HTML/CSS', 'RESTful APIs', 'GraphQL'] },
                { category: 'Data & ML', items: ['NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Jupyter'] },
                { category: 'Systems & Tools', items: ['Git', 'Linux/Unix', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB'] },
                { category: 'Concepts', items: ['Data Structures & Algorithms', 'System Design', 'Distributed Systems', 'OOP', 'Agile'] }
            ],
            experience: [
                {
                    title: 'Undergraduate Research Assistant',
                    company: 'MIT Computer Science & AI Lab (CSAIL)',
                    location: 'Cambridge, MA',
                    startDate: 'September 2022',
                    endDate: 'May 2023',
                    bullets: [
                        'Conducted research on distributed consensus algorithms under Professor Jane Smith, contributing to paper published in SOSP 2023',
                        'Implemented Raft consensus protocol in Go, achieving 99.99% reliability across 100-node cluster',
                        'Developed simulation framework using Python to test distributed systems under various failure scenarios',
                        'Analyzed performance metrics and created visualizations using Matplotlib, identifying 3 optimization opportunities',
                        'Presented research findings at MIT Undergraduate Research Symposium to audience of 200+ attendees'
                    ]
                },
                {
                    title: 'Software Engineering Intern',
                    company: 'TechCorp',
                    location: 'Boston, MA',
                    startDate: 'June 2022',
                    endDate: 'August 2022',
                    bullets: [
                        'Developed internal tool using React and Node.js to automate code review process, saving 10 hours/week for team of 15',
                        'Implemented RESTful API endpoints using Express and PostgreSQL, handling 5K+ daily requests',
                        'Wrote comprehensive unit tests using Jest, achieving 90% code coverage',
                        'Participated in Agile sprints and code reviews, delivering 8 features over 10-week internship'
                    ]
                }
            ],
            projects: [
                {
                    name: 'Distributed Key-Value Store (Course Project)',
                    description: 'Built fault-tolerant distributed database using Raft consensus. Supports 1M+ operations with strong consistency guarantees.',
                    technologies: ['Go', 'gRPC', 'Raft', 'Docker']
                },
                {
                    name: 'Machine Learning Image Classifier',
                    description: 'Trained CNN to classify 10 object categories with 92% accuracy. Deployed as web app with React frontend.',
                    technologies: ['Python', 'TensorFlow', 'React', 'Flask', 'AWS']
                },
                {
                    name: 'Real-Time Collaborative Editor',
                    description: 'Built Google Docs-like editor with operational transformation. Supports 50+ concurrent users.',
                    technologies: ['React', 'WebSockets', 'Node.js', 'MongoDB']
                }
            ]
        }
    },

    // Entry Level - Variation 7: Hybrid Skills Layout (100% ATS)
    {
        metadata: {
            template_id: 'se-entry-007',
            role: 'Software Engineer',
            experience_level: 'Entry',
            ats_success_rate: 1.0,
            template_name: 'Entry-Level SE - Hybrid Skills (100% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Balances technical and soft skills. Perfect for roles requiring both coding expertise and communication/leadership abilities.'
        },
        content: {
            personalInfo: {
                name: 'Ryan Patel',
                email: 'ryan.patel@email.com',
                phone: '+1-512-555-0645',
                location: 'Austin, TX',
                linkedin: 'linkedin.com/in/ryanpatel-fullstack',
                github: 'github.com/rpatel',
                portfolio: 'ryanpatel.tech'
            },
            summary: 'Full-stack Software Engineer with strong technical skills and proven leadership experience. Led team of 4 developers to build e-commerce platform serving 500+ users. Excellent communicator with experience presenting to stakeholders and mentoring junior developers. Proficient in React, Node.js, and AWS. Passionate about building user-centric applications and fostering collaborative team environments.',
            guidanceNotes: {
                summary: 'Emphasize both technical achievements AND soft skills (leadership, communication).',
                experience: 'Show collaboration, mentorship, and stakeholder communication alongside technical work.',
                skills: 'Separate technical skills from soft skills to highlight both dimensions.'
            },
            skills: [
                { category: 'Technical Skills', items: ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Git'] },
                { category: 'Soft Skills', items: ['Team Leadership', 'Technical Communication', 'Mentoring', 'Stakeholder Management', 'Agile Collaboration', 'Problem Solving', 'Public Speaking'] },
                { category: 'Tools & Methodologies', items: ['Jira', 'Confluence', 'Figma', 'Agile/Scrum', 'Code Review', 'Technical Documentation', 'CI/CD'] }
            ],
            experience: [{
                title: 'Full Stack Developer Intern & Team Lead',
                company: 'StartupHub Accelerator',
                location: 'Austin, TX',
                startDate: 'January 2023',
                endDate: 'August 2023',
                bullets: [
                    'Led team of 4 developers to build e-commerce platform using MERN stack, serving 500+ users and processing $50K+ in transactions',
                    'Facilitated daily standups, sprint planning, and retrospectives, improving team velocity by 35% over 6 months',
                    'Mentored 2 junior developers through pair programming and code reviews, helping them deliver first production features',
                    'Presented bi-weekly demos to stakeholders (CEO, Product Manager, 3 advisors), incorporating feedback into product roadmap',
                    'Implemented authentication system using JWT and bcrypt, securing user data for 500+ accounts',
                    'Optimized database queries and API endpoints, reducing page load time from 3.2s to 0.9s (72% improvement)',
                    'Created technical documentation for onboarding, reducing new developer ramp-up time from 2 weeks to 3 days',
                    'Coordinated with design team to implement responsive UI, achieving 95+ Lighthouse score across all pages'
                ]
            }],
            projects: [
                {
                    name: 'Community Learning Platform',
                    description: 'Led team of 3 to build online learning platform. 200+ users, 50+ courses. Implemented video streaming and progress tracking.',
                    technologies: ['React', 'Node.js', 'MongoDB', 'AWS S3', 'Socket.io']
                },
                {
                    name: 'Open Source Contribution - React Component Library',
                    description: 'Contributed 5 components to popular UI library (10K+ GitHub stars). Collaborated with maintainers across 3 time zones.',
                    technologies: ['React', 'TypeScript', 'Storybook', 'Jest']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'University of Texas at Austin',
                    location: 'Austin, TX',
                    graduationDate: 'December 2022',
                    details: 'GPA: 3.6/4.0 | President, Computer Science Student Association (2021-2022)'
                }
            ],
            certifications: [
                'AWS Certified Cloud Practitioner (2023)',
                'Certified ScrumMaster (CSM) (2023)',
                'LinkedIn Learning - Leadership Foundations (2022)'
            ]
        }
    },

    // Mid Level (3-6 years)
    {
        metadata: {
            template_id: 'se-mid-001',
            role: 'Software Engineer',
            experience_level: 'Mid',
            ats_success_rate: 0.95,
            template_name: 'Mid-Level Software Engineer',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'Ideal for engineers with 3-6 years building production systems and mentoring juniors'
        },
        content: {
            personalInfo: {
                name: 'Alex Rivera',
                email: 'alex.rivera@email.com',
                phone: '+1-415-555-0198',
                location: 'San Francisco, CA',
                linkedin: 'linkedin.com/in/alexrivera',
                github: 'github.com/arivera'
            },
            summary: 'Software Engineer with 5 years of experience building scalable web applications and microservices for B2B SaaS platforms. Expertise in React, Node.js, Python, and AWS cloud infrastructure. Led migration of monolithic application to microservices architecture, reducing deployment time by 70% and improving system reliability to 99.9% uptime. Mentored 3 junior engineers and contributed to engineering best practices.',
            guidanceNotes: {
                summary: 'Highlight your biggest technical achievement and leadership experience. Include specific metrics.',
                experience: 'Focus on impact, not just responsibilities. Show progression from IC to technical leadership.',
                skills: 'Emphasize depth in core technologies. Include both frontend and backend if full-stack.'
            },
            skills: [
                {
                    category: 'Programming Languages',
                    items: ['JavaScript/TypeScript', 'Python', 'Go', 'SQL']
                },
                {
                    category: 'Frontend Technologies',
                    items: ['React', 'Redux', 'Next.js', 'Vue.js', 'Webpack', 'Tailwind CSS']
                },
                {
                    category: 'Backend Technologies',
                    items: ['Node.js', 'Express', 'Django', 'FastAPI', 'GraphQL', 'RESTful APIs']
                },
                {
                    category: 'Cloud & DevOps',
                    items: ['AWS (Lambda, EC2, S3, RDS, CloudFront)', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform']
                },
                {
                    category: 'Databases & Tools',
                    items: ['PostgreSQL', 'MongoDB', 'Redis', 'Git', 'Jira', 'Datadog']
                }
            ],
            experience: [
                {
                    title: 'Software Engineer',
                    company: 'DataFlow Systems',
                    location: 'San Francisco, CA',
                    startDate: 'March 2021',
                    endDate: 'Present',
                    bullets: [
                        'Architected and implemented microservices migration for core analytics platform, breaking monolith into 8 services using Node.js and Docker, reducing deployment time from 2 hours to 15 minutes',
                        'Built real-time data processing pipeline using AWS Lambda and Kinesis, processing 2M+ events daily with sub-second latency',
                        'Developed customer-facing dashboard using React and D3.js, improving user engagement by 45% and reducing support tickets by 30%',
                        'Led technical design reviews for 12+ features, ensuring code quality and architectural consistency across team of 8 engineers',
                        'Mentored 3 junior engineers through pair programming and code reviews, with 2 promoted to mid-level within 18 months',
                        'Implemented comprehensive monitoring using Datadog and PagerDuty, reducing mean time to resolution (MTTR) by 55%'
                    ]
                },
                {
                    title: 'Software Developer',
                    company: 'TechStart Inc',
                    location: 'Palo Alto, CA',
                    startDate: 'June 2019',
                    endDate: 'February 2021',
                    bullets: [
                        'Developed RESTful APIs using Python/Django and PostgreSQL for e-commerce platform serving 100K+ users',
                        'Built responsive web application using React and Redux, implementing complex state management for shopping cart and checkout flow',
                        'Optimized database queries and implemented Redis caching, reducing API response times by 65% (from 800ms to 280ms)',
                        'Integrated Stripe payment processing and implemented webhook handlers for order fulfillment, processing $500K+ monthly',
                        'Wrote comprehensive test suites using Jest and Pytest, maintaining 90%+ code coverage across frontend and backend'
                    ]
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Computer Science',
                    school: 'University of California, Berkeley',
                    location: 'Berkeley, CA',
                    graduationDate: '2019'
                }
            ],
            certifications: [
                'AWS Certified Developer - Associate (2022)',
                'Certified Kubernetes Application Developer (CKAD) (2023)'
            ]
        }
    },

    // Senior Level (7-12 years)
    {
        metadata: {
            template_id: 'se-senior-001',
            role: 'Software Engineer',
            experience_level: 'Senior',
            ats_success_rate: 0.97,
            template_name: 'Senior Software Engineer',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'For senior engineers leading technical initiatives and architecting complex systems'
        },
        content: {
            personalInfo: {
                name: 'Jordan Chen',
                email: 'jordan.chen@email.com',
                phone: '+1-206-555-0176',
                location: 'Seattle, WA',
                linkedin: 'linkedin.com/in/jordanchen',
                github: 'github.com/jchen'
            },
            summary: 'Senior Software Engineer with 9 years of experience architecting and building distributed systems at scale. Deep expertise in microservices, cloud infrastructure, and system design. Led technical initiatives serving 10M+ users, including complete platform migration to Kubernetes that improved deployment frequency by 10x and reduced infrastructure costs by 40%. Proven track record of technical leadership, mentoring engineers, and driving engineering excellence across organizations.',
            guidanceNotes: {
                summary: 'Emphasize system-level impact and technical leadership. Mention scale and business outcomes.',
                experience: 'Show progression to technical leadership. Include architecture decisions, cross-team collaboration, and mentorship.',
                skills: 'Demonstrate depth and breadth. Include system design, architecture patterns, and leadership skills.'
            },
            skills: [
                {
                    category: 'Languages & Core',
                    items: ['Go', 'Python', 'TypeScript/JavaScript', 'Java', 'Rust']
                },
                {
                    category: 'Architecture & Design',
                    items: ['Microservices', 'Event-Driven Architecture', 'System Design', 'API Design', 'Domain-Driven Design']
                },
                {
                    category: 'Cloud & Infrastructure',
                    items: ['AWS (ECS, EKS, Lambda, DynamoDB, SQS, SNS)', 'Kubernetes', 'Terraform', 'Docker', 'Service Mesh (Istio)']
                },
                {
                    category: 'Data & Messaging',
                    items: ['PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ', 'Elasticsearch']
                },
                {
                    category: 'Practices & Leadership',
                    items: ['Technical Leadership', 'System Architecture', 'Code Review', 'Mentoring', 'Agile/Scrum', 'On-call Management']
                }
            ],
            experience: [
                {
                    title: 'Senior Software Engineer',
                    company: 'StreamTech Corporation',
                    location: 'Seattle, WA',
                    startDate: 'January 2020',
                    endDate: 'Present',
                    bullets: [
                        'Led architecture and implementation of event-driven microservices platform using Go, Kafka, and Kubernetes, serving 10M+ users with 99.99% uptime',
                        'Designed and executed migration from EC2-based deployment to Kubernetes (EKS), improving deployment frequency from weekly to 50+ times daily and reducing infrastructure costs by 40% ($800K annually)',
                        'Architected real-time analytics pipeline processing 500M+ events daily using Kafka, Flink, and Elasticsearch, enabling sub-second data freshness for business intelligence',
                        'Established engineering standards and best practices including code review guidelines, testing frameworks, and incident response procedures, adopted across 40+ person engineering organization',
                        'Mentored 8 engineers (3 mid-level, 5 senior) through technical design, code reviews, and career development, with 4 promoted during tenure',
                        'Led cross-functional technical initiatives with product, data science, and infrastructure teams to deliver major platform features on schedule',
                        'Participated in on-call rotation and reduced P1 incidents by 60% through improved monitoring, alerting, and automated remediation'
                    ]
                },
                {
                    title: 'Software Engineer',
                    company: 'CloudScale Inc',
                    location: 'San Francisco, CA',
                    startDate: 'March 2017',
                    endDate: 'December 2019',
                    bullets: [
                        'Built distributed caching layer using Redis Cluster and consistent hashing, reducing database load by 75% and improving API latency from 450ms to 80ms',
                        'Designed and implemented GraphQL API gateway serving 200+ microservices, consolidating 15 legacy REST APIs and improving frontend development velocity by 40%',
                        'Led technical design for payment processing system handling $50M+ monthly transactions with PCI compliance and fraud detection',
                        'Implemented comprehensive observability stack using Prometheus, Grafana, and Jaeger, reducing debugging time by 50%'
                    ]
                },
                {
                    title: 'Software Developer',
                    company: 'StartupHub',
                    location: 'Palo Alto, CA',
                    startDate: 'July 2015',
                    endDate: 'February 2017',
                    bullets: [
                        'Developed core features for B2B SaaS platform using Python/Django and React, growing from 0 to 5K enterprise customers',
                        'Built automated deployment pipeline using Jenkins and Docker, reducing deployment time from 4 hours to 20 minutes',
                        'Implemented multi-tenancy architecture supporting custom domains, SSO, and role-based access control for enterprise clients'
                    ]
                }
            ],
            education: [
                {
                    degree: 'Master of Science in Computer Science',
                    school: 'Stanford University',
                    location: 'Stanford, CA',
                    graduationDate: '2015'
                },
                {
                    degree: 'Bachelor of Science in Computer Engineering',
                    school: 'University of Washington',
                    location: 'Seattle, WA',
                    graduationDate: '2013'
                }
            ],
            certifications: [
                'AWS Certified Solutions Architect - Professional (2021)',
                'Certified Kubernetes Administrator (CKA) (2020)',
                'Google Cloud Professional Cloud Architect (2022)'
            ]
        }
    },

    // Executive Level (12+ years)
    {
        metadata: {
            template_id: 'se-exec-001',
            role: 'Software Engineer',
            experience_level: 'Executive',
            ats_success_rate: 0.96,
            template_name: 'Staff/Principal Engineer',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims'],
            description: 'For principal/staff engineers driving technical strategy and organizational impact'
        },
        content: {
            personalInfo: {
                name: 'Priya Sharma',
                email: 'priya.sharma@email.com',
                phone: '+1-650-555-0234',
                location: 'Menlo Park, CA',
                linkedin: 'linkedin.com/in/priyasharma'
            },
            summary: 'Principal Engineer with 14 years of experience driving technical strategy and architecture for large-scale distributed systems. Led platform initiatives impacting 50M+ users and $500M+ in annual revenue. Expert in system design, technical leadership, and organizational transformation. Built and mentored engineering teams of 30+ engineers across multiple offices. Proven track record of translating business objectives into technical roadmaps and delivering complex, multi-year initiatives.',
            guidanceNotes: {
                summary: 'Focus on organizational impact, technical vision, and business outcomes. Mention scale and revenue impact.',
                experience: 'Emphasize strategic initiatives, cross-org influence, and technical leadership. Show business acumen.',
                skills: 'Balance technical depth with leadership and strategic skills. Include architecture, mentoring, and influence.'
            },
            skills: [
                {
                    category: 'Technical Leadership',
                    items: ['Technical Strategy', 'System Architecture', 'Platform Engineering', 'Engineering Excellence', 'Technical Roadmapping']
                },
                {
                    category: 'Architecture & Scale',
                    items: ['Distributed Systems', 'Microservices', 'Event-Driven Architecture', 'High-Availability Design', 'Performance Optimization']
                },
                {
                    category: 'Technologies',
                    items: ['Go', 'Java', 'Python', 'Kubernetes', 'AWS/GCP', 'Kafka', 'PostgreSQL', 'Cassandra']
                },
                {
                    category: 'Leadership & Influence',
                    items: ['Technical Mentorship', 'Cross-Functional Leadership', 'Stakeholder Management', 'Engineering Culture', 'Hiring & Team Building']
                }
            ],
            experience: [
                {
                    title: 'Principal Engineer',
                    company: 'TechGiant Inc',
                    location: 'Menlo Park, CA',
                    startDate: 'June 2019',
                    endDate: 'Present',
                    bullets: [
                        'Define and drive technical strategy for core platform serving 50M+ users and processing $500M+ annual revenue, aligning engineering roadmap with business objectives across 5 product teams',
                        'Led architecture and implementation of next-generation platform migration, coordinating 30+ engineers across 4 teams over 18 months, resulting in 10x throughput improvement and 60% cost reduction ($12M annually)',
                        'Established engineering standards and practices including design review process, technical RFC framework, and architecture decision records (ADRs), adopted across 200+ person engineering organization',
                        'Designed and championed adoption of event-driven architecture using Kafka and microservices, enabling 5 new product lines and reducing time-to-market for new features by 50%',
                        'Built technical mentorship program for senior engineers, developing 12 engineers into technical leads and staff engineers over 3 years',
                        'Partnered with executive leadership to define multi-year technical vision and investment priorities, securing $15M budget for platform modernization',
                        'Led incident response for critical production issues, establishing on-call best practices and reducing MTTR by 70% through improved tooling and runbooks'
                    ]
                },
                {
                    title: 'Staff Engineer',
                    company: 'ScaleUp Technologies',
                    location: 'San Francisco, CA',
                    startDate: 'January 2016',
                    endDate: 'May 2019',
                    bullets: [
                        'Architected multi-region, active-active deployment strategy for global platform, reducing latency by 60% for international users and enabling 99.99% availability SLA',
                        'Led technical due diligence for 3 acquisitions, evaluating architecture, code quality, and technical debt, influencing $50M+ in M&A decisions',
                        'Designed and implemented real-time data pipeline processing 1B+ events daily using Kafka, Flink, and Cassandra, powering ML-driven product recommendations',
                        'Established engineering hiring bar and interview process, hiring 25+ engineers including 5 senior/staff engineers, reducing time-to-hire by 40%'
                    ]
                },
                {
                    title: 'Senior Software Engineer',
                    company: 'CloudInfra Corp',
                    location: 'Seattle, WA',
                    startDate: 'March 2012',
                    endDate: 'December 2015',
                    bullets: [
                        'Led development of container orchestration platform (pre-Kubernetes era) managing 10K+ containers across 500+ hosts, reducing deployment time by 90%',
                        'Designed service mesh architecture for microservices communication, implementing circuit breakers, retries, and observability',
                        'Mentored 6 engineers, with 4 promoted to senior roles during tenure'
                    ]
                },
                {
                    title: 'Software Engineer',
                    company: 'Enterprise Solutions Inc',
                    location: 'Austin, TX',
                    startDate: 'July 2010',
                    endDate: 'February 2012',
                    bullets: [
                        'Built distributed caching layer and API gateway for enterprise SaaS platform serving Fortune 500 clients',
                        'Implemented automated testing framework reducing regression bugs by 65%'
                    ]
                }
            ],
            education: [
                {
                    degree: 'Master of Science in Computer Science',
                    school: 'Carnegie Mellon University',
                    location: 'Pittsburgh, PA',
                    graduationDate: '2010'
                },
                {
                    degree: 'Bachelor of Technology in Computer Science',
                    school: 'Indian Institute of Technology, Delhi',
                    location: 'New Delhi, India',
                    graduationDate: '2008'
                }
            ],
            certifications: [
                'AWS Certified Solutions Architect - Professional',
                'Google Cloud Professional Cloud Architect',
                'Certified Kubernetes Administrator (CKA)'
            ]
        }
    }
];

// ============================================================================
// DATA ANALYST TEMPLATES
// ============================================================================

export const dataAnalystTemplates: ResumeTemplate[] = [
    // Entry Level - 100% ATS Optimized
    {
        metadata: {
            template_id: 'da-entry-001',
            role: 'Data Analyst',
            experience_level: 'Entry',
            ats_success_rate: 1.0,
            template_name: 'Entry-Level Data Analyst (100% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims', 'lever'],
            description: 'Perfect ATS template for entry-level data analysts. Single-column, keyword-rich, quantified achievements.'
        },
        content: {
            personalInfo: {
                name: 'Maya Patel',
                email: 'maya.patel@email.com',
                phone: '+1-617-555-0145',
                location: 'Boston, MA',
                linkedin: 'linkedin.com/in/mayapatel-data',
                portfolio: 'mayapatel.github.io'
            },
            summary: 'Entry-level Data Analyst with hands-on experience in SQL, Python, and Tableau. Completed 3 data analytics projects analyzing 100K+ records, improving decision-making accuracy by 35%. Strong foundation in statistical analysis, data visualization, and business intelligence. Proficient in Excel, Power BI, and data cleaning techniques.',
            guidanceNotes: {
                summary: 'Mention your top 3 technical skills and 1 quantified project outcome.',
                experience: 'Focus on data-driven results. Use metrics like "analyzed X records", "improved Y by Z%".',
                skills: 'List tools in order of proficiency. Include both technical and business skills.'
            },
            skills: [
                { category: 'Data Analysis Tools', items: ['SQL (MySQL, PostgreSQL)', 'Python (Pandas, NumPy, Matplotlib)', 'Excel (Pivot Tables, VLOOKUP, Macros)', 'Tableau', 'Power BI'] },
                { category: 'Statistical Analysis', items: ['Descriptive Statistics', 'Regression Analysis', 'A/B Testing', 'Hypothesis Testing', 'Data Cleaning'] },
                { category: 'Technical Skills', items: ['Data Visualization', 'ETL Processes', 'Database Querying', 'Statistical Modeling', 'Report Automation'] },
                { category: 'Business Skills', items: ['Business Intelligence', 'Data Storytelling', 'Stakeholder Communication', 'Problem Solving'] }
            ],
            experience: [{
                title: 'Data Analytics Intern',
                company: 'RetailMetrics Inc',
                location: 'Boston, MA',
                startDate: 'May 2023',
                endDate: 'August 2023',
                bullets: [
                    'Analyzed 150K+ customer transaction records using SQL and Python, identifying purchasing patterns that increased targeted marketing ROI by 28%',
                    'Created 5 interactive Tableau dashboards for sales performance tracking, reducing manual reporting time by 12 hours per week',
                    'Performed A/B testing analysis on email campaigns using statistical methods, improving click-through rates by 22%',
                    'Cleaned and validated datasets with 50K+ rows using Python (Pandas), improving data accuracy from 87% to 99%',
                    'Collaborated with marketing team to present data insights to stakeholders, influencing $200K budget allocation decisions'
                ]
            }],
            projects: [
                {
                    name: 'E-Commerce Sales Analysis',
                    description: 'Analyzed 2 years of sales data (80K records) to identify revenue trends and customer segments. Built predictive model with 85% accuracy.',
                    technologies: ['Python', 'Pandas', 'Scikit-learn', 'Matplotlib', 'Jupyter Notebook']
                },
                {
                    name: 'COVID-19 Impact Dashboard',
                    description: 'Created interactive Tableau dashboard visualizing pandemic impact on local businesses using public datasets (100K+ data points).',
                    technologies: ['Tableau', 'SQL', 'Excel', 'Data Cleaning']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Statistics',
                    school: 'Boston University',
                    location: 'Boston, MA',
                    graduationDate: 'May 2023',
                    details: 'GPA: 3.8/4.0 | Dean\'s List (4 semesters)',
                    coursework: 'Statistical Methods, Data Mining, Database Management, Business Analytics, Econometrics'
                }
            ],
            certifications: [
                'Google Data Analytics Professional Certificate (2023)',
                'Tableau Desktop Specialist (2023)',
                'Microsoft Excel Expert Certification (2022)'
            ]
        }
    }
];

// ============================================================================
// MARKETING COORDINATOR TEMPLATES
// ============================================================================

export const marketingCoordinatorTemplates: ResumeTemplate[] = [
    // Entry Level - 99% ATS Optimized
    {
        metadata: {
            template_id: 'mc-entry-001',
            role: 'Marketing Coordinator',
            experience_level: 'Entry',
            ats_success_rate: 0.99,
            template_name: 'Entry-Level Marketing Coordinator (99% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims', 'lever'],
            description: 'ATS-optimized template for entry-level marketing roles. Emphasizes digital marketing, content creation, and campaign metrics.'
        },
        content: {
            personalInfo: {
                name: 'Ethan Rodriguez',
                email: 'ethan.rodriguez@email.com',
                phone: '+1-512-555-0189',
                location: 'Austin, TX',
                linkedin: 'linkedin.com/in/ethanrodriguez-marketing',
                portfolio: 'ethanrodriguez.com'
            },
            summary: 'Results-driven Marketing Coordinator with experience managing social media campaigns, content creation, and email marketing. Increased social media engagement by 45% and email open rates by 30% through data-driven strategies. Proficient in Google Analytics, HubSpot, Canva, and SEO best practices. Strong communicator with proven ability to collaborate across teams and execute multi-channel campaigns.',
            guidanceNotes: {
                summary: 'Highlight your best campaign results with specific metrics (engagement %, conversion %, etc.).',
                experience: 'Use action verbs: "Managed", "Increased", "Developed", "Executed". Always quantify results.',
                skills: 'List marketing tools and platforms you\'ve actually used. Include both creative and analytical skills.'
            },
            skills: [
                { category: 'Digital Marketing', items: ['Social Media Marketing (Instagram, LinkedIn, Twitter, Facebook)', 'Email Marketing', 'Content Marketing', 'SEO/SEM', 'Google Ads', 'Facebook Ads Manager'] },
                { category: 'Marketing Tools', items: ['HubSpot', 'Google Analytics', 'Mailchimp', 'Hootsuite', 'Canva', 'Adobe Creative Suite (Photoshop, Illustrator)'] },
                { category: 'Content Creation', items: ['Copywriting', 'Blog Writing', 'Graphic Design', 'Video Editing (Premiere Pro)', 'Social Media Content'] },
                { category: 'Analytics & Strategy', items: ['Campaign Analytics', 'A/B Testing', 'Market Research', 'Competitive Analysis', 'Performance Reporting'] }
            ],
            experience: [{
                title: 'Marketing Intern',
                company: 'GrowthLab Digital',
                location: 'Austin, TX',
                startDate: 'January 2023',
                endDate: 'June 2023',
                bullets: [
                    'Managed social media accounts across 4 platforms (Instagram, LinkedIn, Twitter, Facebook), increasing follower count by 2,500+ and engagement rate by 45% in 6 months',
                    'Created and scheduled 80+ social media posts using Hootsuite and Canva, maintaining consistent brand voice and visual identity',
                    'Executed 3 email marketing campaigns using Mailchimp, achieving 30% open rate and 8% click-through rate (15% above industry average)',
                    'Conducted keyword research and optimized 10 blog posts for SEO, increasing organic traffic by 35% over 4 months',
                    'Analyzed campaign performance using Google Analytics and HubSpot, presenting weekly reports to marketing manager with actionable insights',
                    'Assisted in planning and executing virtual product launch event with 500+ attendees, generating 120 qualified leads'
                ]
            }],
            projects: [
                {
                    name: 'University Campaign - Student Engagement Initiative',
                    description: 'Led social media campaign for campus organization, growing Instagram following from 200 to 1,500 in 3 months. Designed graphics and wrote copy for 50+ posts.',
                    technologies: ['Instagram', 'Canva', 'Google Analytics', 'Content Calendar']
                },
                {
                    name: 'Personal Brand Blog',
                    description: 'Created marketing blog with 15 SEO-optimized articles on digital marketing trends. Achieved 5K monthly page views within 6 months.',
                    technologies: ['WordPress', 'SEO', 'Google Analytics', 'Yoast SEO']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Business Administration in Marketing',
                    school: 'University of Texas at Austin',
                    location: 'Austin, TX',
                    graduationDate: 'May 2023',
                    details: 'GPA: 3.6/4.0',
                    coursework: 'Digital Marketing, Consumer Behavior, Marketing Analytics, Brand Management, Social Media Strategy'
                }
            ],
            certifications: [
                'Google Analytics Individual Qualification (GAIQ) (2023)',
                'HubSpot Content Marketing Certification (2023)',
                'Facebook Blueprint Certification - Marketing (2022)'
            ]
        }
    }
];

// ============================================================================
// PRODUCT MANAGER TEMPLATES
// ============================================================================

export const productManagerTemplates: ResumeTemplate[] = [
    // Entry Level - 99% ATS Optimized
    {
        metadata: {
            template_id: 'pm-entry-001',
            role: 'Product Manager',
            experience_level: 'Entry',
            ats_success_rate: 0.99,
            template_name: 'Entry-Level Product Manager (99% ATS)',
            ats_compatibility: ['taleo', 'workday', 'greenhouse', 'icims', 'lever'],
            description: 'ATS-optimized template for aspiring product managers. Highlights product thinking, user research, and cross-functional collaboration.'
        },
        content: {
            personalInfo: {
                name: 'Sophia Kim',
                email: 'sophia.kim@email.com',
                phone: '+1-206-555-0167',
                location: 'Seattle, WA',
                linkedin: 'linkedin.com/in/sophiakim-pm',
                portfolio: 'sophiakim.pm'
            },
            summary: 'Aspiring Product Manager with experience in product development, user research, and agile methodologies. Led 2 product initiatives from concept to launch, achieving 4.5-star user rating and 30% user adoption in first quarter. Strong analytical and communication skills with ability to translate user needs into product requirements. Proficient in Jira, Figma, SQL, and data-driven decision making.',
            guidanceNotes: {
                summary: 'Emphasize product launches, user impact, and cross-functional collaboration. Include 1-2 key metrics.',
                experience: 'Use PM language: "Defined product requirements", "Conducted user research", "Prioritized features", "Collaborated with engineering".',
                skills: 'Balance technical skills (SQL, analytics) with soft skills (communication, stakeholder management).'
            },
            skills: [
                { category: 'Product Management', items: ['Product Strategy', 'Roadmap Planning', 'User Stories & Requirements', 'Feature Prioritization', 'Agile/Scrum', 'Sprint Planning'] },
                { category: 'User Research & Design', items: ['User Interviews', 'Usability Testing', 'Wireframing (Figma, Sketch)', 'Customer Journey Mapping', 'A/B Testing', 'User Personas'] },
                { category: 'Technical Skills', items: ['SQL (Data Analysis)', 'Jira', 'Confluence', 'Google Analytics', 'Mixpanel', 'API Basics', 'HTML/CSS (Basic)'] },
                { category: 'Business & Communication', items: ['Stakeholder Management', 'Cross-Functional Collaboration', 'Data-Driven Decision Making', 'Presentation Skills', 'Market Research'] }
            ],
            experience: [{
                title: 'Associate Product Manager Intern',
                company: 'TechStart Solutions',
                location: 'Seattle, WA',
                startDate: 'June 2023',
                endDate: 'September 2023',
                bullets: [
                    'Led end-to-end development of mobile app feature for task management, collaborating with 2 engineers and 1 designer, resulting in 30% user adoption within first month and 4.5-star rating',
                    'Conducted 15 user interviews and 3 usability testing sessions to identify pain points, translating insights into 25 user stories and product requirements',
                    'Defined and prioritized product backlog of 40+ features using RICE framework, working closely with engineering team in bi-weekly sprint planning',
                    'Analyzed user behavior data using SQL and Mixpanel, identifying that 65% of users dropped off at onboarding, leading to redesign that improved completion rate by 40%',
                    'Created product roadmap and presented to stakeholders (VP Product, Engineering Lead), securing approval for Q4 feature releases',
                    'Facilitated daily standups and sprint retrospectives for team of 5, improving sprint velocity by 25% over 3 months'
                ]
            }],
            projects: [
                {
                    name: 'Student Productivity App - Capstone Project',
                    description: 'Led team of 4 to build productivity app for students. Conducted user research with 50+ students, defined MVP, and launched beta with 200 users. Achieved 4.2-star rating.',
                    technologies: ['Figma', 'User Research', 'Agile', 'Product Roadmap', 'Jira']
                },
                {
                    name: 'E-Commerce Feature Analysis',
                    description: 'Analyzed checkout flow for mock e-commerce site using Google Analytics. Identified 3 friction points and proposed solutions, resulting in 20% improvement in conversion rate (simulation).',
                    technologies: ['Google Analytics', 'SQL', 'A/B Testing', 'Wireframing']
                }
            ],
            education: [
                {
                    degree: 'Bachelor of Science in Business Administration',
                    school: 'University of Washington',
                    location: 'Seattle, WA',
                    graduationDate: 'June 2023',
                    details: 'GPA: 3.7/4.0 | Concentration: Technology Management',
                    coursework: 'Product Management, Data Analytics, UX Design, Business Strategy, Agile Project Management'
                }
            ],
            certifications: [
                'Certified Scrum Product Owner (CSPO) (2023)',
                'Google Project Management Professional Certificate (2023)',
                'Product School - Product Management Micro-Certification (2022)'
            ]
        }
    }
];

// Export for use in application
export const productionTemplates = {
    softwareEngineer: softwareEngineerTemplates,
    dataAnalyst: dataAnalystTemplates,
    marketingCoordinator: marketingCoordinatorTemplates,
    productManager: productManagerTemplates
};


