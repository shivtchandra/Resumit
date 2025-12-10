import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Landing } from '@/pages/Landing';
import { Templates } from '@/pages/Templates';
import { Analysis } from '@/pages/Analysis';
import { Pricing } from '@/pages/Pricing';
import { TemplateEditor } from '@/pages/TemplateEditor';

function App() {
  console.log('[APP] App component rendering');
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:id" element={<TemplateEditor />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

