console.log('[DEBUG] Starting debug_imports.ts');

// 1. React Router
import { BrowserRouter } from 'react-router-dom';
console.log('[DEBUG] react-router-dom imported');

// 2. ErrorBoundary
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
console.log('[DEBUG] ErrorBoundary imported');

// 3. Landing
import { Landing } from '@/pages/Landing';
console.log('[DEBUG] Landing imported');

// 4. Templates
import { Templates } from '@/pages/Templates';
console.log('[DEBUG] Templates imported');

// 5. Analysis
import { Analysis } from '@/pages/Analysis';
console.log('[DEBUG] Analysis imported');

// 6. Pricing
import { Pricing } from '@/pages/Pricing';
console.log('[DEBUG] Pricing imported');

// 7. TemplateEditor
import { TemplateEditor } from '@/pages/TemplateEditor';
console.log('[DEBUG] TemplateEditor imported');

console.log('[DEBUG] debug_imports.ts finished');
