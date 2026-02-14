import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Landing } from './pages/Landing';
import { Templates } from './pages/Templates';
import { Analysis } from './pages/Analysis';
import { PricingPage } from './pages/PricingPage';
import { TemplateEditor } from './pages/TemplateEditor';
import { OptimizationHub } from './pages/OptimizationHub';
import { GitHubPage } from './pages/GitHub';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/github" element={<GitHubPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/resume-fix-lab" element={<OptimizationHub />} />
                    <Route path="/optimization-hub" element={<Navigate to="/resume-fix-lab" replace />} />
                    <Route path="/rewrite" element={<Navigate to="/resume-fix-lab" replace />} />
                    <Route path="/editor/:id" element={<TemplateEditor />} />
                    <Route path="/editor" element={<TemplateEditor />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
