export interface JDTemplate {
    id: string;
    role: string;
    company: string;
    title: string;
    location: string;
    jd: string;
}

// role key → human label (matches <option value="..."> in AnalysisSetupConsole)
export const ROLE_LABELS: Record<string, string> = {
    'software-engineer': 'Software Engineer',
    'frontend-developer': 'Frontend Developer',
    'backend-developer': 'Backend Developer',
    'full-stack-developer': 'Full Stack Developer',
    'data-scientist': 'Data Scientist',
    'product-manager': 'Product Manager',
};

export const jdTemplates: JDTemplate[] = [
    // ─────────────────────────── GOOGLE ───────────────────────────
    {
        id: 'google-software-engineer',
        role: 'software-engineer',
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
        id: 'google-frontend-developer',
        role: 'frontend-developer',
        company: 'Google',
        title: 'Frontend Software Engineer',
        location: 'Mountain View, CA',
        jd: `Google is looking for a Frontend Software Engineer to build next-generation web experiences used by billions. You will work on Google's consumer-facing products, collaborating with UX and product teams.

Requirements:
- 2+ years experience building production web applications.
- Expert-level proficiency in JavaScript/TypeScript and modern frameworks (React, Angular, or Vue).
- Deep understanding of browser rendering, performance optimization, and Web APIs.
- Experience with responsive design, accessibility (WCAG), and cross-browser compatibility.

Preferred:
- Experience with Web Components, PWAs, or large-scale design systems.
- Familiarity with performance profiling tools (Lighthouse, WebPageTest).`
    },
    {
        id: 'google-backend-developer',
        role: 'backend-developer',
        company: 'Google',
        title: 'Backend Software Engineer',
        location: 'Mountain View, CA',
        jd: `Join Google as a Backend Software Engineer to build and maintain the infrastructure and APIs powering Google's core products at planetary scale.

Requirements:
- 2+ years of backend engineering experience.
- Proficiency in Java, Python, Go, or C++.
- Experience designing and operating high-throughput distributed services.
- Solid understanding of databases (SQL and NoSQL), caching, and messaging systems.

Preferred:
- Experience with gRPC, Protocol Buffers, and internal platforms like Borg/Spanner.
- Track record of improving service SLO/SLA and reducing operational toil.`
    },
    {
        id: 'google-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Google',
        title: 'Full Stack Engineer',
        location: 'Mountain View, CA',
        jd: `Google seeks a Full Stack Engineer to own features end-to-end—from database schema to polished UI—on products reaching billions of users.

Requirements:
- 3+ years building full-stack web applications.
- Proficiency in at least one backend language (Go, Python, Java) and one frontend framework (React, Angular).
- Experience with REST/gRPC APIs, relational databases, and cloud services.
- Comfort operating in a monorepo, running CI/CD pipelines, and writing integration tests.

Preferred:
- Experience with Google Cloud Platform (GCP), Kubernetes, and observability tooling.
- History of cross-functional collaboration with UX, PM, and SRE teams.`
    },
    {
        id: 'google-data-scientist',
        role: 'data-scientist',
        company: 'Google',
        title: 'Data Scientist',
        location: 'Mountain View, CA',
        jd: `Google's Data Science team is seeking a Data Scientist to extract insights from massive datasets and guide product decisions for global-scale features.

Requirements:
- Strong SQL and Python/R skills.
- Experience with large-scale data pipelines (BigQuery, Spark, or Dataflow).
- Proven experience in A/B experimentation and statistical inference.
- Ability to communicate complex findings clearly to engineering and product stakeholders.

Preferred:
- Experience with causal inference, Bayesian methods, or recommendation systems.
- Familiarity with Google's internal tools (Dremel, Flume) or equivalent.`
    },
    {
        id: 'google-product-manager',
        role: 'product-manager',
        company: 'Google',
        title: 'Product Manager',
        location: 'Mountain View, CA',
        jd: `Google is hiring a Product Manager to define and drive the roadmap for high-impact consumer or enterprise products used by millions globally.

Requirements:
- 3+ years of product management experience at a technology company.
- Track record of shipping successful products with measurable impact.
- Strong data literacy — comfortable defining KPIs, reading dashboards, and running experiments.
- Exceptional communication and stakeholder management skills.

Preferred:
- Experience with AI/ML product features, platform products, or international markets.
- Technical background (CS degree or engineering experience) is a strong plus.`
    },

    // ─────────────────────────── AMAZON ───────────────────────────
    {
        id: 'amazon-software-engineer',
        role: 'software-engineer',
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
        id: 'amazon-frontend-developer',
        role: 'frontend-developer',
        company: 'Amazon',
        title: 'Frontend Engineer',
        location: 'Seattle, WA',
        jd: `Amazon is seeking a Frontend Engineer to build fast, accessible, and conversion-optimized shopping and enterprise experiences used by hundreds of millions of customers.

Requirements:
- 2+ years of frontend development experience.
- Strong proficiency in React and TypeScript.
- Experience optimizing Core Web Vitals and building accessible UIs (WCAG AA).
- Familiarity with A/B testing frameworks and feature flagging.

Preferred:
- Experience with server-side rendering (Next.js), CDN strategies, and internationalization.
- Understanding of Amazon's design system or equivalent large-scale component libraries.`
    },
    {
        id: 'amazon-backend-developer',
        role: 'backend-developer',
        company: 'Amazon',
        title: 'Backend Software Development Engineer',
        location: 'Seattle, WA',
        jd: `Amazon is hiring a Backend SDE to build and scale the APIs and microservices that power Amazon's retail, logistics, and AWS services.

Requirements:
- 2+ years backend engineering experience.
- Expertise in Java or Python with a focus on clean, well-tested code.
- Experience designing scalable REST or event-driven APIs.
- Hands-on experience with AWS services (EC2, Lambda, DynamoDB, SQS/SNS).

Preferred:
- Experience with high-throughput, low-latency systems and on-call operations.
- Familiarity with Amazon's operational excellence bar: runbooks, alarms, and post-mortems.`
    },
    {
        id: 'amazon-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Amazon',
        title: 'Full Stack SDE',
        location: 'Seattle, WA',
        jd: `Amazon seeks a Full Stack SDE to deliver complete features across the stack — from React frontends to Java/Python microservices — working backwards from the customer.

Requirements:
- 3+ years of full-stack experience in production environments.
- Frontend: React/TypeScript. Backend: Java or Python REST/GraphQL APIs.
- Experience with relational and NoSQL databases and AWS cloud services.
- Strong ownership mindset: design, build, deploy, and monitor your own services.

Preferred:
- Experience with infrastructure-as-code (CDK, CloudFormation) and containerized deployments.
- History of improving both user experience metrics and operational health simultaneously.`
    },
    {
        id: 'amazon-data-scientist',
        role: 'data-scientist',
        company: 'Amazon',
        title: 'Data Scientist',
        location: 'Seattle, WA',
        jd: `Amazon's Science team is looking for a Data Scientist to build models and drive data-informed decisions across retail, logistics, and advertising products.

Requirements:
- Strong proficiency in Python or R and SQL.
- Experience with ML modeling (regression, classification, ranking) and evaluation frameworks.
- Track record of translating analytical insights into product changes.
- Experience with A/B testing and experimentation at scale.

Preferred:
- Experience with Amazon's data ecosystem (Redshift, EMR) or equivalent.
- Exposure to demand forecasting, recommendation systems, or supply chain analytics.`
    },
    {
        id: 'amazon-product-manager',
        role: 'product-manager',
        company: 'Amazon',
        title: 'Product Manager – Technical',
        location: 'Seattle, WA',
        jd: `Amazon is hiring a Product Manager – Technical (PMT) who can write detailed PRFAQs, define technical requirements, and own product decisions for platform services or customer-facing features.

Requirements:
- 3+ years in product or program management at a technology company.
- Ability to write crisp PRDs, define measurable success metrics, and prioritize ruthlessly.
- Strong analytical foundation — comfortable interpreting data to make decisions.
- Experience working with engineering teams on complex technical systems.

Preferred:
- Experience delivering AWS, e-commerce, or logistics products.
- Background in software engineering is a significant plus.`
    },

    // ─────────────────────────── MICROSOFT ───────────────────────────
    {
        id: 'microsoft-software-engineer',
        role: 'software-engineer',
        company: 'Microsoft',
        title: 'Software Engineer II',
        location: 'Redmond, WA',
        jd: `Microsoft is hiring a Software Engineer II to build and maintain cloud-scale services across Azure, Microsoft 365, and other enterprise platforms.

Requirements:
- 2+ years of software engineering experience.
- Proficiency in C#, Java, or Python.
- Solid understanding of distributed systems, REST APIs, and cloud infrastructure.
- Experience with automated testing and agile development.

Preferred:
- Familiarity with Azure services, DevOps pipelines, and monitoring tooling.
- Passion for security, reliability, and customer empathy.`
    },
    {
        id: 'microsoft-frontend-developer',
        role: 'frontend-developer',
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
        id: 'microsoft-backend-developer',
        role: 'backend-developer',
        company: 'Microsoft',
        title: 'Backend Software Engineer',
        location: 'Redmond, WA',
        jd: `Microsoft is seeking a Backend Software Engineer to design and build the APIs and services powering Microsoft 365, Teams, and Azure-native products.

Requirements:
- 2+ years of backend engineering experience.
- Proficiency in C#/.NET or Python/Go.
- Experience with SQL Server, Cosmos DB, or equivalent databases.
- Experience with event-driven architecture (Service Bus, Kafka) and REST APIs.

Preferred:
- Familiarity with Azure Service Fabric, AKS, and Azure DevOps.
- Experience supporting multi-tenant, enterprise-grade SaaS systems.`
    },
    {
        id: 'microsoft-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Microsoft',
        title: 'Full Stack Engineer',
        location: 'Redmond, WA',
        jd: `Microsoft seeks a Full Stack Engineer to contribute to products like Microsoft 365 and Azure Portal — owning features across the entire technical stack.

Requirements:
- 3+ years of full-stack development with C#/.NET or Node.js backends and React frontends.
- Experience with Azure PaaS services, CI/CD, and automated testing.
- Ability to write clean, maintainable code in a large enterprise codebase.

Preferred:
- Experience building accessible (WCAG), internationalized enterprise UIs.
- Knowledge of OAuth 2.0, Azure AD, and enterprise security patterns.`
    },
    {
        id: 'microsoft-data-scientist',
        role: 'data-scientist',
        company: 'Microsoft',
        title: 'Data Scientist',
        location: 'Redmond, WA',
        jd: `Microsoft's AI and Data Science teams are looking for a Data Scientist to develop models and analytical frameworks that improve products like Microsoft 365, Bing, and Azure AI.

Requirements:
- Strong Python/R skills and deep familiarity with ML frameworks (scikit-learn, PyTorch, or TensorFlow).
- Experience with large-scale data platforms (Azure Synapse, Azure ML, or Spark).
- Expertise in experimentation, A/B testing, and causal analysis.

Preferred:
- Experience with NLP, ranking, or recommender systems.
- Exposure to responsible AI principles and fairness-aware modeling.`
    },
    {
        id: 'microsoft-product-manager',
        role: 'product-manager',
        company: 'Microsoft',
        title: 'Product Manager',
        location: 'Redmond, WA',
        jd: `Microsoft is hiring a Product Manager to lead cross-functional teams building enterprise software products that serve millions of business customers.

Requirements:
- 3+ years of product management experience.
- Proven track record of shipping enterprise or SaaS products.
- Strong analytical skills and experience with product telemetry and KPI frameworks.
- Excellent written communication and ability to influence without authority.

Preferred:
- Experience with Microsoft 365, Azure, or Dynamics product ecosystems.
- Understanding of enterprise procurement cycles and IT decision-making.`
    },

    // ─────────────────────────── META ───────────────────────────
    {
        id: 'meta-software-engineer',
        role: 'software-engineer',
        company: 'Meta',
        title: 'Software Engineer',
        location: 'Menlo Park, CA',
        jd: `Meta is looking for a Software Engineer to build social products, infrastructure, and AI-powered features that connect billions of people worldwide.

Requirements:
- 2+ years of software engineering experience.
- Strong coding fundamentals in Python, C++, Java, or Hack.
- Experience with distributed systems, APIs, and scalable architectures.
- Passion for solving hard engineering problems with measurable impact.

Preferred:
- Experience with Meta's tech stack (React, GraphQL, Hack) or equivalent.
- Track record of improving product reliability or developer productivity at scale.`
    },
    {
        id: 'meta-frontend-developer',
        role: 'frontend-developer',
        company: 'Meta',
        title: 'Frontend Engineer',
        location: 'Menlo Park, CA',
        jd: `Meta is hiring a Frontend Engineer to build the experiences powering Facebook, Instagram, WhatsApp, and Meta Quest — products used by billions daily.

Requirements:
- 2+ years of frontend engineering experience.
- Expert-level React and JavaScript/TypeScript skills.
- Deep understanding of browser performance, rendering, and state management.
- Experience working with design systems and component libraries at scale.

Preferred:
- Experience with React Native for cross-platform development.
- Familiarity with GraphQL (Relay) and product experimentation frameworks.`
    },
    {
        id: 'meta-backend-developer',
        role: 'backend-developer',
        company: 'Meta',
        title: 'Backend Engineer',
        location: 'Menlo Park, CA',
        jd: `Meta seeks a Backend Engineer to build the systems, APIs, and infrastructure supporting billions of social interactions every day.

Requirements:
- 2+ years of backend engineering experience.
- Proficiency in Python, C++, Java, or Hack.
- Experience designing high-throughput, fault-tolerant distributed services.
- Solid grasp of database design (SQL, NoSQL, key-value stores) and caching.

Preferred:
- Experience with Meta's internal stack (Thrift, TAO, Scuba, Hive) or equivalent.
- Background in real-time messaging, social graph, or content ranking systems.`
    },
    {
        id: 'meta-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Meta',
        title: 'Full Stack Engineer',
        location: 'Menlo Park, CA',
        jd: `Meta is looking for a Full Stack Engineer to ship features end-to-end on Facebook, Instagram, or Meta Business tools — from GraphQL APIs to polished React UIs.

Requirements:
- 3+ years of full-stack development experience.
- Strong React/TypeScript frontend skills and Python or Hack backend skills.
- Experience with GraphQL APIs and relational or distributed databases.
- Comfort owning features from inception to production.

Preferred:
- Experience with A/B testing infrastructure and feature flagging at scale.
- Familiarity with Meta's product development culture and rapid iteration.`
    },
    {
        id: 'meta-data-scientist',
        role: 'data-scientist',
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
        id: 'meta-product-manager',
        role: 'product-manager',
        company: 'Meta',
        title: 'Product Manager',
        location: 'Menlo Park, CA',
        jd: `Meta is hiring a Product Manager to lead cross-functional teams shipping features for Facebook, Instagram, WhatsApp, or Meta's AR/VR platforms.

Requirements:
- 3+ years in product management at a consumer technology company.
- Demonstrated ability to define strategy, set OKRs, and ship impactful products.
- Strong experimentation mindset — comfortable running A/B tests and interpreting results.
- Excellent stakeholder management and cross-functional leadership skills.

Preferred:
- Experience in consumer social, monetization, or AI-powered product features.
- Technical background or comfort partnering closely with ML/data teams.`
    },

    // ─────────────────────────── NETFLIX ───────────────────────────
    {
        id: 'netflix-software-engineer',
        role: 'software-engineer',
        company: 'Netflix',
        title: 'Software Engineer',
        location: 'Los Gatos, CA',
        jd: `Netflix is seeking a Software Engineer to build and scale the platform that delivers streaming experiences to 250M+ members globally.

Requirements:
- 3+ years of software engineering experience.
- Strong expertise in Java, Python, or Go.
- Experience with microservices, event-driven architecture, and cloud platforms (AWS).
- High ownership mindset — you build it, you run it.

Preferred:
- Experience with Netflix OSS (Hystrix, Eureka, Zuul) or equivalent resilience patterns.
- Track record improving streaming quality, latency, or reliability at large scale.`
    },
    {
        id: 'netflix-frontend-developer',
        role: 'frontend-developer',
        company: 'Netflix',
        title: 'UI Engineer',
        location: 'Los Gatos, CA',
        jd: `Netflix is hiring a UI Engineer to craft the streaming experiences enjoyed by 250M+ members across TVs, web, and mobile platforms.

Requirements:
- 3+ years of frontend engineering in a high-scale production environment.
- Expert React and JavaScript/TypeScript skills.
- Experience with performance optimization (lazy loading, code splitting, CDN caching).
- Deep understanding of web accessibility and cross-device/browser compatibility.

Preferred:
- Experience building TV or set-top-box UIs (Gibbon renderer, React Native TV).
- Familiarity with AB testing infrastructure and feature experimentation.`
    },
    {
        id: 'netflix-backend-developer',
        role: 'backend-developer',
        company: 'Netflix',
        title: 'Backend Engineer',
        location: 'Los Gatos, CA',
        jd: `Netflix seeks a Backend Engineer to build resilient, high-throughput microservices that power content delivery, personalization, and account management for a global streaming platform.

Requirements:
- 3+ years backend engineering experience.
- Expertise in Java or Python with a focus on service reliability.
- Experience with REST APIs, Kafka, Cassandra/DynamoDB, and AWS infrastructure.
- Comfort with on-call operations and chaos engineering principles.

Preferred:
- Experience with Netflix's Zuul, Hystrix, or Conductor orchestration framework.
- Background in streaming protocols (DASH, HLS) or CDN architecture.`
    },
    {
        id: 'netflix-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Netflix',
        title: 'Full Stack Engineer',
        location: 'Los Gatos, CA',
        jd: `Netflix is looking for a Full Stack Engineer to own features across our content management, studio tools, and partner portals — from React interfaces to Java/Python APIs.

Requirements:
- 4+ years of full-stack experience in production environments.
- Proficiency in React/TypeScript (frontend) and Java or Python (backend).
- Experience with REST and GraphQL APIs, PostgreSQL, and cloud infrastructure.
- Strong autonomy — Netflix operates with minimal process and maximum responsibility.

Preferred:
- Experience in media, content operations, or B2B SaaS tooling.
- Comfort with infrastructure-as-code and self-service deployments.`
    },
    {
        id: 'netflix-data-scientist',
        role: 'data-scientist',
        company: 'Netflix',
        title: 'Data Scientist',
        location: 'Los Gatos, CA',
        jd: `Netflix is hiring a Data Scientist to improve content recommendation, member personalization, and streaming quality through rigorous analysis and experimentation.

Requirements:
- Strong Python/R and SQL skills.
- Expertise in A/B testing, causal inference, and statistical modeling.
- Experience communicating complex analyses to product and business stakeholders.
- Familiarity with large-scale data platforms (Spark, Presto, or Druid).

Preferred:
- Experience with recommendation systems, NLP, or time-series forecasting.
- Background in consumer product analytics or content performance analysis.`
    },
    {
        id: 'netflix-product-manager',
        role: 'product-manager',
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

    // ─────────────────────────── STRIPE ───────────────────────────
    {
        id: 'stripe-software-engineer',
        role: 'software-engineer',
        company: 'Stripe',
        title: 'Software Engineer',
        location: 'San Francisco, CA',
        jd: `Stripe is seeking a Software Engineer to build the financial infrastructure that powers the internet economy. You will work on APIs, payments, and platform services used by millions of businesses.

Requirements:
- 2+ years of software engineering experience.
- Strong backend skills in Ruby, Go, Java, or Python.
- Experience with distributed systems, databases, and API design.
- High bar for code quality, testing, and production reliability.

Preferred:
- Experience in payments, banking, or fintech systems.
- Background in fraud detection, risk systems, or financial compliance.`
    },
    {
        id: 'stripe-frontend-developer',
        role: 'frontend-developer',
        company: 'Stripe',
        title: 'Frontend Engineer',
        location: 'San Francisco, CA',
        jd: `Stripe is hiring a Frontend Engineer to build the dashboards, checkout flows, and developer tools that millions of businesses rely on daily.

Requirements:
- 2+ years of frontend engineering experience.
- Expert-level React and TypeScript skills.
- Experience building complex forms, data tables, and financial UI patterns.
- High attention to UX quality, accessibility, and cross-browser compatibility.

Preferred:
- Experience with Stripe's dashboard or developer documentation tools.
- Familiarity with design systems, storybook-driven development, and visual regression testing.`
    },
    {
        id: 'stripe-backend-developer',
        role: 'backend-developer',
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
        id: 'stripe-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Stripe',
        title: 'Full Stack Engineer',
        location: 'San Francisco, CA',
        jd: `Stripe seeks a Full Stack Engineer to own Stripe's internal tools, merchant-facing dashboards, and API-facing features end-to-end.

Requirements:
- 3+ years of full-stack development experience.
- Frontend: React/TypeScript for data-dense financial UIs. Backend: Ruby, Go, or Python APIs.
- Experience with PostgreSQL, Redis, and event-driven architecture.
- High standards for code quality and thoughtful API design.

Preferred:
- Exposure to financial products (billing, subscriptions, payouts, compliance).
- Experience with Stripe's developer experience philosophy and documentation culture.`
    },
    {
        id: 'stripe-data-scientist',
        role: 'data-scientist',
        company: 'Stripe',
        title: 'Data Scientist',
        location: 'San Francisco, CA',
        jd: `Stripe's Data Science team is hiring to power decisions around fraud, risk, pricing, and business health using Stripe's uniquely rich payments dataset.

Requirements:
- Strong SQL and Python skills; proficiency in statistical modeling.
- Experience with fraud/risk modeling, anomaly detection, or financial analytics.
- Ability to own analyses end-to-end: hypothesis → model → recommendation → impact measurement.
- Comfort with large-scale data warehouses (Redshift, BigQuery, or Snowflake).

Preferred:
- Background in fintech, payments, or risk management.
- Experience with uplift modeling, survival analysis, or time-series forecasting.`
    },
    {
        id: 'stripe-product-manager',
        role: 'product-manager',
        company: 'Stripe',
        title: 'Product Manager',
        location: 'San Francisco, CA',
        jd: `Stripe is hiring a Product Manager to define and deliver financial products that make it easier for businesses to accept payments, manage revenue, and grow globally.

Requirements:
- 3+ years of product management experience in B2B or developer-facing products.
- Deep curiosity about financial systems, APIs, and developer experience.
- Strong ability to translate merchant and developer needs into clear product specs.
- Data-driven approach with experience defining and tracking business metrics.

Preferred:
- Experience in payments, financial infrastructure, or fintech.
- Technical background (engineering or CS degree) is a strong asset.`
    },

    // ─────────────────────────── GENERIC TECH COMPANY ───────────────────────────
    {
        id: 'generic-software-engineer',
        role: 'software-engineer',
        company: 'Generic Tech Company',
        title: 'Software Engineer',
        location: 'Remote',
        jd: `We are hiring a Software Engineer to build and maintain scalable backend and platform services.

Requirements:
- 2+ years of software engineering experience.
- Proficiency in Python, Java, Go, or TypeScript.
- Experience with REST APIs, relational and NoSQL databases, and CI/CD pipelines.
- Strong fundamentals in data structures, algorithms, and system design.

Preferred:
- Experience with cloud platforms (AWS/GCP/Azure) and containerization (Docker, Kubernetes).
- Familiarity with observability tooling (Prometheus, Grafana, Datadog).`
    },
    {
        id: 'generic-frontend-developer',
        role: 'frontend-developer',
        company: 'Generic Tech Company',
        title: 'Frontend Developer',
        location: 'Remote',
        jd: `We are looking for a Frontend Developer to build responsive, accessible, and high-performance web applications.

Requirements:
- 2+ years of frontend development experience.
- Strong skills in React and TypeScript.
- Solid understanding of HTML5, CSS3, and responsive/mobile-first design.
- Experience consuming REST or GraphQL APIs.

Preferred:
- Experience with testing (Jest, Cypress), Storybook, and performance profiling.
- Familiarity with accessibility standards (WCAG 2.1).`
    },
    {
        id: 'generic-backend-developer',
        role: 'backend-developer',
        company: 'Generic Tech Company',
        title: 'Backend Developer',
        location: 'Remote',
        jd: `We are hiring a Backend Developer to design and build robust APIs and microservices that power our platform.

Requirements:
- 2+ years of backend development experience.
- Proficiency in Python, Node.js, Go, or Java.
- Experience with REST API design, database management (PostgreSQL/MySQL), and message queues.
- Solid understanding of security best practices and performance optimization.

Preferred:
- Experience with Docker, Kubernetes, and CI/CD pipelines.
- Familiarity with event-driven architectures (Kafka, RabbitMQ, SQS).`
    },
    {
        id: 'generic-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Generic Tech Company',
        title: 'Full Stack Developer',
        location: 'Remote',
        jd: `We are seeking a Full Stack Developer to own features from database to browser, working across a modern TypeScript/React frontend and Python or Node.js backend.

Requirements:
- 3+ years of full-stack development experience.
- Frontend: React, TypeScript, and modern CSS. Backend: Python, Node.js, or Go APIs.
- Experience with relational and NoSQL databases, REST APIs, and cloud deployments.

Preferred:
- Experience with Docker, Terraform, and cloud-native deployments on AWS or GCP.
- History of improving developer experience through tooling and documentation.`
    },
    {
        id: 'generic-devops',
        role: 'software-engineer',
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
        id: 'generic-data-scientist',
        role: 'data-scientist',
        company: 'Generic Tech Company',
        title: 'Data Scientist',
        location: 'Remote',
        jd: `We are hiring a Data Scientist to build predictive models and deliver data-driven insights that improve our product and business operations.

Requirements:
- Strong Python and SQL skills.
- Experience with ML modeling (classification, regression, clustering).
- Proven ability to translate analytical findings into actionable business recommendations.
- Experience with A/B experimentation.

Preferred:
- Familiarity with MLOps tooling (MLflow, SageMaker) and dashboarding (Tableau, Looker).
- Experience with NLP or time-series forecasting.`
    },
    {
        id: 'generic-product-manager',
        role: 'product-manager',
        company: 'Generic Tech Company',
        title: 'Product Manager',
        location: 'Remote',
        jd: `We are looking for a Product Manager to own the roadmap and delivery of key product initiatives.

Requirements:
- 2+ years of product management experience.
- Experience writing PRDs, user stories, and defining success metrics.
- Strong analytical and communication skills.
- Ability to collaborate with engineering, design, and stakeholders.

Preferred:
- Experience in agile development and OKR-based goal setting.
- Data fluency: SQL or comfort with analytics dashboards.`
    },

    // ─────────────────────────── ENTERPRISE ORGANIZATION ───────────────────────────
    {
        id: 'enterprise-software-engineer',
        role: 'software-engineer',
        company: 'Enterprise Organization',
        title: 'Application Developer',
        location: 'Hybrid',
        jd: `We are seeking an Application Developer to build and maintain enterprise-grade internal systems and customer-facing platforms.

Requirements:
- 2+ years of software development experience.
- Proficiency in Java, C#/.NET, or Python.
- Experience with enterprise application integration patterns (SOA, REST APIs, message queues).
- Familiarity with SDLC processes, code review, and security compliance.

Preferred:
- Experience with ERP integrations (SAP, Salesforce) or enterprise middleware.
- Familiarity with on-prem to cloud migration strategies.`
    },
    {
        id: 'enterprise-frontend-developer',
        role: 'frontend-developer',
        company: 'Enterprise Organization',
        title: 'Frontend Developer',
        location: 'Hybrid',
        jd: `We are looking for a Frontend Developer to modernize our enterprise web portals and internal tools, making complex data accessible to business users.

Requirements:
- 2+ years of frontend development experience.
- Proficiency in React or Angular with TypeScript.
- Experience building data-dense enterprise UIs (tables, forms, dashboards).
- Commitment to accessibility and cross-browser compatibility.

Preferred:
- Experience with enterprise design systems (Fluent UI, Material UI, or Ant Design).
- Familiarity with SharePoint, Power Apps, or legacy enterprise portal migration.`
    },
    {
        id: 'enterprise-backend-developer',
        role: 'backend-developer',
        company: 'Enterprise Organization',
        title: 'Backend Developer',
        location: 'Hybrid',
        jd: `We are hiring a Backend Developer to build and integrate the APIs and services that power our enterprise data platform and internal tools.

Requirements:
- 2+ years of backend development experience.
- Proficiency in Java, C#/.NET, or Python.
- Experience with SQL Server or Oracle, REST APIs, and enterprise authentication (LDAP, SAML).
- Understanding of data governance and enterprise security standards.

Preferred:
- Experience with Azure or AWS enterprise-tier services and hybrid deployments.
- Exposure to legacy system modernization and API-first transformation programs.`
    },
    {
        id: 'enterprise-full-stack-developer',
        role: 'full-stack-developer',
        company: 'Enterprise Organization',
        title: 'Full Stack Developer',
        location: 'Hybrid',
        jd: `We are seeking a Full Stack Developer to deliver new enterprise capabilities across internal portals and customer-facing web applications.

Requirements:
- 3+ years of full-stack development experience.
- Frontend: React or Angular. Backend: Java, C#, or Python REST APIs.
- Experience with SQL Server or PostgreSQL, enterprise authentication, and CI/CD pipelines.
- Comfortable working in regulated, process-driven environments.

Preferred:
- Experience with enterprise integration (REST/SOAP APIs, ERP connectors).
- Familiarity with SOX, GDPR, or other compliance frameworks.`
    },
    {
        id: 'enterprise-data-scientist',
        role: 'data-scientist',
        company: 'Enterprise Organization',
        title: 'Data Scientist',
        location: 'Hybrid',
        jd: `We are looking for a Data Scientist to deliver forecasting models, operational analytics, and executive dashboards that drive enterprise decision-making.

Requirements:
- Strong SQL and Python/R skills.
- Experience with predictive modeling, demand forecasting, and reporting automation.
- Proven ability to communicate data insights to senior business stakeholders.
- Familiarity with enterprise BI tools (Power BI, Tableau).

Preferred:
- Experience with Azure ML, Databricks, or Snowflake.
- Background in supply chain, finance, HR, or operations analytics.`
    },
    {
        id: 'enterprise-business-analyst',
        role: 'product-manager',
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
    },
];

/**
 * Get all templates matching a specific role slug.
 * Returns one template per company for the given role.
 */
export const getJDTemplatesByRole = (roleSlug: string): JDTemplate[] =>
    jdTemplates.filter((t) => t.role === roleSlug);

/**
 * Get a single template by its unique ID.
 */
export const getJDTemplateById = (id: string): JDTemplate | undefined =>
    jdTemplates.find((template) => template.id === id);

/**
 * Get the best-matching template for a given company + role combination.
 * Falls back to any template for that company if no role match exists.
 */
export const getJDTemplateByCompanyAndRole = (
    company: string,
    roleSlug: string
): JDTemplate | undefined => {
    const exact = jdTemplates.find(
        (t) => t.company === company && t.role === roleSlug
    );
    if (exact) return exact;
    return jdTemplates.find((t) => t.company === company);
};
