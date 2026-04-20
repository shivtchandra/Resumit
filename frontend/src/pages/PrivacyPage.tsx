import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Navbar } from '../components/layout/Navbar';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const EFFECTIVE_DATE = 'February 28, 2026';

const reveal = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45 },
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <motion.section
        className="space-y-3"
        initial={reveal.initial}
        whileInView={reveal.whileInView}
        viewport={reveal.viewport}
        transition={reveal.transition}
    >
        <h2 className="text-2xl md:text-3xl font-black text-brand-secondary tracking-tight">{title}</h2>
        <div className="space-y-3 text-sm md:text-base text-text-muted leading-relaxed">{children}</div>
    </motion.section>
);

export const PrivacyPage = () => {
    return (
        <PageLayout header={<Navbar />} maxWidth="full">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
                <motion.header
                    className="space-y-5"
                    initial={reveal.initial}
                    whileInView={reveal.whileInView}
                    viewport={reveal.viewport}
                    transition={reveal.transition}
                >
                    <div className="page-badge">
                        <ShieldCheck size={14} />
                        Privacy Policy
                    </div>
                    <h1 className="page-hero-title">Privacy Policy</h1>
                    <p className="text-lg text-text-muted max-w-3xl">
                        Effective Date: {EFFECTIVE_DATE}
                    </p>
                    <p className="text-text-muted">
                        This Privacy Policy explains how Resumit collects, uses, and protects data when you use our
                        resume analysis, rewrite, template, GitHub analysis, and export features.
                    </p>
                </motion.header>

                <Section title="1. Information We Collect">
                    <p>When you use the product, we may collect:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Uploaded resume files (PDF or DOCX) and extracted text/content.</li>
                        <li>Job descriptions, target role/ATS selections, and optional company name input.</li>
                        <li>Optional profile data such as GitHub username/URL and LinkedIn text you provide.</li>
                        <li>Optional GitHub personal access token if you submit one for rate-limit relief.</li>
                        <li>Generated outputs such as analysis reports, rewrite suggestions, and export content.</li>
                        <li>Technical and usage data such as timestamps, browser/app metadata, and API request logs.</li>
                    </ul>
                </Section>

                <Section title="2. How We Use Information">
                    <p>We use data to:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Run ATS analysis, keyword matching, rewrite, and template recommendations.</li>
                        <li>Generate exports and improve reliability/performance of core workflows.</li>
                        <li>Troubleshoot errors, monitor abuse, and maintain service security.</li>
                        <li>Produce aggregate usage metrics (such as analysis counts).</li>
                    </ul>
                </Section>

                <Section title="3. AI and Third-Party Processing">
                    <p>
                        Some features may send relevant text/content to configured AI providers (for example, OpenAI
                        and Google Gemini) to generate analysis or rewrite outputs.
                    </p>
                    <p>
                        We also use third-party infrastructure and APIs such as Supabase (database/storage), GitHub
                        APIs (profile/repository analysis), and hosting providers. These providers process data under
                        their own terms and privacy policies.
                    </p>
                </Section>

                <Section title="4. Storage and Retention">
                    <p>Depending on deployment configuration, data may be stored in database and storage services.</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Analysis records may include filename, score metadata, result JSON, and truncated resume text.</li>
                        <li>Configured storage buckets may apply retention windows (for example, resume and export auto-delete policies).</li>
                        <li>Template assets may be stored as longer-lived public resources.</li>
                    </ul>
                    <p>
                        Frontend session data is stored locally in browser session storage for active workflows and is
                        cleared on fresh app load for key analysis result keys.
                    </p>
                </Section>

                <Section title="5. Data Sharing">
                    <p>We do not sell personal information. We may share data only:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>With service providers that help us operate product features.</li>
                        <li>When required by law, legal process, or to protect rights/safety.</li>
                        <li>In aggregate or de-identified form for internal analytics.</li>
                    </ul>
                </Section>

                <Section title="6. Security">
                    <p>
                        We apply reasonable technical and organizational safeguards. No internet service is perfectly
                        secure, so we cannot guarantee absolute security.
                    </p>
                </Section>

                <Section title="7. Your Choices and Rights">
                    <p>You can choose not to submit optional fields (such as GitHub token or LinkedIn text).</p>
                    <p>
                        You may request deletion of data associated with your submissions where reasonably identifiable.
                        Contact details are listed below.
                    </p>
                </Section>

                <Section title="8. Children’s Privacy">
                    <p>
                        The service is not intended for children under 13, and we do not knowingly collect personal
                        data from children under 13.
                    </p>
                </Section>

                <Section title="9. International Data Transfers">
                    <p>
                        Your information may be processed in countries other than your own depending on hosting and
                        provider locations.
                    </p>
                </Section>

                <Section title="10. Policy Updates">
                    <p>
                        We may update this policy from time to time. Material updates will be reflected by a revised
                        effective date on this page.
                    </p>
                </Section>

                <Section title="11. Contact">
                    <p>
                        For privacy requests, contact: <a className="text-brand-primary font-semibold no-underline hover:underline" href="mailto:tekkdevv@gmail.com">tekkdevv@gmail.com</a>
                    </p>
                </Section>

                <Section title="Cookies and Local Storage">
                    <div id="cookies" className="space-y-3">
                        <p>
                            We primarily rely on necessary browser storage for app functionality (for example,
                            temporary session-based workflow inputs). We do not use advertising cookies in the current
                            product experience.
                        </p>
                    </div>
                </Section>

                <motion.div
                    className="pt-4 border-t border-border-subtle text-sm text-text-muted"
                    initial={reveal.initial}
                    whileInView={reveal.whileInView}
                    viewport={reveal.viewport}
                    transition={reveal.transition}
                >
                    See also our <Link to="/terms" className="text-brand-primary font-semibold no-underline hover:underline">Terms of Service</Link>.
                </motion.div>
            </main>
        </PageLayout>
    );
};
