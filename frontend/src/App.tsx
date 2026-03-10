import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Landing } from './pages/Landing';
import { Templates } from './pages/Templates';
import { Analysis } from './pages/Analysis';
import { TemplateEditor } from './pages/TemplateEditor';
import { OptimizationHub } from './pages/OptimizationHub';
import { GitHubPage } from './pages/GitHub';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/github" element={<GitHubPage />} />
                    <Route path="/pricing" element={<Navigate to="/" replace />} />
                    <Route path="/resume-fix-lab" element={<OptimizationHub />} />
                    <Route path="/optimization-hub" element={<Navigate to="/resume-fix-lab" replace />} />
                    <Route path="/rewrite" element={<Navigate to="/resume-fix-lab" replace />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/editor/:id" element={<TemplateEditor />} />
                    <Route path="/editor" element={<TemplateEditor />} />
                </Routes>
            </BrowserRouter>
            <Analytics />
        </ErrorBoundary>
    );
}

export default App;
