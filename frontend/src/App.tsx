import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Landing } from './pages/Landing';
import { Templates } from './pages/Templates';
import { Analysis } from './pages/Analysis';
import { PricingPage } from './pages/PricingPage';
import { TemplateEditor } from './pages/TemplateEditor';
import { OptimizationHub } from './pages/OptimizationHub';
import { GitHubPage } from './pages/GitHub';

console.log('[APP] Module evaluating');

function App() {
    console.log('[APP] Component rendering');
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/github" element={<GitHubPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/optimization-hub" element={<OptimizationHub />} />
                    <Route path="/editor/:id" element={<TemplateEditor />} />
                    <Route path="/editor" element={<TemplateEditor />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
