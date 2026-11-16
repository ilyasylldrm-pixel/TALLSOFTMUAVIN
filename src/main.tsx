import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { FormErrorProvider } from './context/FormErrorContext.tsx';
import { centralStorageService } from './services/centralStorageService.ts';
import { startVersionWatcher } from './services/versionCheckService.ts';
import './index.css';

async function bootstrapApplication() {
  startVersionWatcher();
  await centralStorageService.initialize();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <FormErrorProvider>
          <App />
        </FormErrorProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

void bootstrapApplication();
