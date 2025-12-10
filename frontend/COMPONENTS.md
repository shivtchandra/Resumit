# ATS Emulator V2 - Frontend Component Guide

## 🎨 Design System

### Colors
```css
--color-bg-dark: #0f1419        /* Main background */
--color-bg-elevated: #1a1f2e    /* Elevated surfaces */
--color-bg-card: #1e2433        /* Card backgrounds */
--color-accent-cyan: #00d9ff    /* Primary brand */
--color-accent-amber: #ffb84d   /* Warnings */
--color-accent-green: #10b981   /* Success */
--color-accent-red: #ff4757     /* Errors */
```

### Typography
- **Headings**: Space Grotesk
- **Body**: Inter
- **Code**: JetBrains Mono

---

## 📦 Component Library

### Analysis Components

#### ScoreGauge
Circular progress indicator with color-coded scoring.

```tsx
<ScoreGauge 
  score={85} 
  label="ATS Friendliness"
  subLabel="Overall compatibility"
/>
```

**Props**:
- `score: number` - Score value (0-100)
- `label: string` - Main label
- `subLabel?: string` - Optional subtitle
- `color?: string` - Custom color (auto-calculated if not provided)

#### VendorBadge
ATS vendor compatibility status indicator.

```tsx
<VendorBadge 
  vendor="Workday"
  status="pass"
  issues={[]}
/>
```

**Props**:
- `vendor: string` - Vendor name
- `status: 'pass' | 'warning' | 'fail'` - Compatibility status
- `issues?: string[]` - List of issues

#### IssueCard
Expandable card showing resume issues with fix suggestions.

```tsx
<IssueCard issue={{
  severity: 'critical',
  type: 'missing_contact',
  title: 'Missing Contact Information',
  description: 'No email found',
  fix_suggestions: ['Add email address']
}} />
```

### Template Components

#### TemplateCard
Template display card with preview and actions.

```tsx
<TemplateCard 
  template={templateData}
  onPreview={(id) => console.log(id)}
  onSelect={(id) => console.log(id)}
/>
```

### Resume Components

#### ResumeViewer
PDF/DOCX viewer with download and open options.

```tsx
<ResumeViewer 
  resumeUrl="https://example.com/resume.pdf"
  filename="resume.pdf"
  fileType="pdf"
/>
```

**Features**:
- PDF embed with fallback
- DOCX download handling
- Open in new tab
- Download button

### Upload Components

#### UploadConsole
File upload with drag-and-drop support.

```tsx
<UploadConsole 
  onFileSelect={(file) => console.log(file)}
/>
```

**Features**:
- Drag-and-drop
- File type validation
- Progress indicator
- Visual feedback

### Layout Components

#### PageLayout
Consistent page structure.

```tsx
<PageLayout 
  header={<Navbar />}
  maxWidth="2xl"
>
  {children}
</PageLayout>
```

#### SplitView
Side-by-side layout for analysis views.

```tsx
<SplitView 
  left={<ResumeViewer />}
  right={<AnalysisResults />}
  leftWidth="40%"
  rightWidth="60%"
/>
```

#### Navbar
Main navigation with logo and links.

```tsx
<Navbar />
```

#### Footer
Footer with links and social icons.

```tsx
<Footer />
```

### UI Components

#### LoadingSpinner
Simple loading indicator.

```tsx
<LoadingSpinner 
  message="Loading..."
  size="md"
/>
```

#### LoadingSkeleton
Skeleton placeholder for loading states.

```tsx
<LoadingSkeleton 
  count={3}
  height="80px"
/>
```

#### LoadingOverlay
Full-screen loading overlay.

```tsx
<LoadingOverlay message="Processing..." />
```

#### ErrorBoundary
Error boundary for graceful error handling.

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### Toast
Toast notification system.

```tsx
const { toasts, success, error, info, removeToast } = useToast();

// Show toast
success('Analysis complete!');
error('Upload failed');
info('Processing...');

// Render toasts
{toasts.map(toast => (
  <Toast 
    key={toast.id}
    message={toast.message}
    type={toast.type}
    onClose={() => removeToast(toast.id)}
  />
))}
```

---

## 🔌 API Integration

### Using the API Client

```tsx
import { analyzeResume, getTemplates, rewriteSection } from '@/services/api';

// Analyze resume
const result = await analyzeResume(file, jobDescription, targetRole, targetATS);

// Get templates
const { templates, count } = await getTemplates({ role: 'software-engineer' });

// Rewrite section
const rewritten = await rewriteSection({
  section: 'summary',
  content: 'Original text',
  job_description: 'Job description',
});
```

---

## 🎯 Best Practices

### Component Structure
```tsx
interface ComponentProps {
  // Props definition
}

export const Component = ({ prop1, prop2 }: ComponentProps) => {
  // Component logic
  
  return (
    <div style={{ color: 'var(--color-text-primary)' }}>
      {/* Use CSS variables for colors */}
    </div>
  );
};
```

### Styling
- Use CSS variables from design system
- Inline styles for dynamic colors
- Tailwind classes for layout
- Consistent spacing and sizing

### Error Handling
```tsx
try {
  const result = await apiCall();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

### Loading States
```tsx
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return <LoadingSpinner />;
}
```

---

## 📱 Responsive Design

All components are mobile-responsive using Tailwind breakpoints:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+
- `2xl:` - 1536px+

---

## ♿ Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus indicators

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

For more details, see the main README.md and implementation_plan.md.
