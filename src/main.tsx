import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { FormErrorProvider } from './context/FormErrorContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FormErrorProvider>
        <App />
      </FormErrorProvider>
    </ThemeProvider>
  </StrictMode>,
);
