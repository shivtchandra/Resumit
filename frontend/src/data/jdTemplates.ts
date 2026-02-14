export interface JDTemplate {
    id: string;
    role: string;
    company: string;
    title: string;
    location: string;
    jd: string;
}

export const jdTemplates: JDTemplate[] = [
    {
        id: 'google-swe-ii',
        role: 'Software Engineer',
        company: 'Google',
        title: 'Software Engineer II',
        location: 'Mountain View, CA',
        jd: `As a Software Engineer II at Google, you will design and build scalable backend systems that support billions of requests. You will collaborate with cross-functional teams, contribute to architectural decisions, and improve reliability/performance.

Requirements:
- 2+ years experience in software engineering.
- Strong proficiency in Python, Java, or Go.
- Experience with distributed systems, APIs, and cloud infrastructure.
- Strong problem-solving and system design fundamentals.

Preferred:
- Experience with Kubernetes, CI/CD, observability, and large-scale data systems.
- Experience in production incident response and root-cause analysis.`
    },
    {
        id: 'amazon-sde',
        role: 'Software Engineer',
        company: 'Amazon',
        title: 'Software Development Engineer',
        location: 'Seattle, WA',
        jd: `As an SDE at Amazon, you will own services end-to-end, from design through deployment and operations. You will build customer-facing APIs, improve service reliability, and work backward from customer needs.

Requirements:
- 2+ years professional software development experience.
- Strong coding skills in Java, Python, or TypeScript.
- Experience building REST APIs and backend services.
- Experience with testing, CI/CD, and cloud services (AWS preferred).

Preferred:
- Experience in microservices architecture, distributed systems, and performance optimization.`
    },
    {
        id: 'microsoft-frontend',
        role: 'Frontend Engineer',
        company: 'Microsoft',
        title: 'Frontend Engineer',
        location: 'Redmond, WA',
        jd: `Join Microsoft as a Frontend Engineer to build intuitive web experiences used by enterprise customers. You will partner with design and product teams to deliver accessible, high-performance interfaces.

Requirements:
- 2+ years experience with React and TypeScript.
- Strong understanding of HTML, CSS, and responsive design.
- Experience consuming APIs and handling async state.
- Familiarity with testing frameworks and performance profiling.

Preferred:
- Experience with design systems, accessibility (WCAG), and modern tooling (Vite, Webpack).`
    },
    {
        id: 'meta-data-scientist',
        role: 'Data Scientist',
        company: 'Meta',
        title: 'Data Scientist',
        location: 'Menlo Park, CA',
        jd: `As a Data Scientist at Meta, you will turn large-scale data into product and business insights. You will frame ambiguous problems, run experiments, and influence product direction.

Requirements:
- Strong SQL and Python/R skills.
- Experience in experimentation, A/B testing, and statistical inference.
- Ability to communicate technical findings to non-technical stakeholders.

Preferred:
- Experience in product analytics, causal inference, and dashboarding (Tableau/Looker).`
    },
    {
        id: 'netflix-product-manager',
        role: 'Product Manager',
        company: 'Netflix',
        title: 'Product Manager',
        location: 'Los Gatos, CA',
        jd: `Netflix seeks a Product Manager to lead cross-functional teams in delivering high-impact user experiences. You will define product strategy, prioritize roadmaps, and measure outcomes.

Requirements:
- 3+ years product management experience.
- Experience writing PRDs, defining KPIs, and shipping products.
- Strong communication and stakeholder management.
- Data-informed decision-making with experimentation mindset.

Preferred:
- Experience in consumer product growth, personalization, and platform teams.`
    },
    {
        id: 'stripe-backend',
        role: 'Backend Engineer',
        company: 'Stripe',
        title: 'Backend Engineer',
        location: 'San Francisco, CA',
        jd: `As a Backend Engineer at Stripe, you will build and operate APIs that process critical financial workflows. You will design resilient systems and improve reliability at scale.

Requirements:
- Strong backend development experience (Python/Go/Ruby/Java).
- Experience with APIs, databases, and distributed systems.
- Strong debugging skills and production ownership.

Preferred:
- Experience in payments, fraud/risk systems, and reliability engineering.`
    },
    {
        id: 'generic-devops',
        role: 'DevOps Engineer',
        company: 'Generic Tech Company',
        title: 'DevOps Engineer',
        location: 'Remote',
        jd: `We are hiring a DevOps Engineer to improve deployment reliability, observability, and infrastructure automation.

Requirements:
- Experience with Docker, Kubernetes, CI/CD pipelines.
- Strong scripting skills (Python/Bash).
- Experience with cloud platforms (AWS/Azure/GCP).
- Familiarity with IaC tools (Terraform) and monitoring stacks.

Preferred:
- Experience with incident response, SRE practices, and cost optimization.`
    },
    {
        id: 'generic-business-analyst',
        role: 'Business Analyst',
        company: 'Enterprise Organization',
        title: 'Business Analyst',
        location: 'Hybrid',
        jd: `We are looking for a Business Analyst to gather requirements, analyze processes, and deliver actionable recommendations.

Requirements:
- Experience in stakeholder interviews and process documentation.
- Strong analytical skills with Excel/SQL.
- Ability to translate business needs into technical requirements.
- Experience creating dashboards and performance reports.

Preferred:
- Experience with Agile teams and tools such as Jira/Confluence.`
    }
];

export const getJDTemplateById = (id: string): JDTemplate | undefined => jdTemplates.find((template) => template.id === id);
