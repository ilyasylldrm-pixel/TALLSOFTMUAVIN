import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { FormErrorProvider } from './context/FormErrorContext.tsx';
import './index.css';

// Sunucu oturumu düştüğünde (401) uygulamayı giriş ekranına yönlendirmek için olay yayınla.
if (typeof window !== 'undefined' && !(window as any).__muavinFetchPatched) {
  (window as any).__muavinFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  let lastExpiredAt = 0;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const resp = await originalFetch(input, init);
    if (resp.status === 401) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const path = url.startsWith('http') ? new URL(url).pathname : url;
      const sameOrigin = !url.startsWith('http') || new URL(url).origin === window.location.origin;
      const hasUser = Boolean(localStorage.getItem('muavin_active_user') || sessionStorage.getItem('muavin_active_user'));
      if (sameOrigin && path.startsWith('/api/') && !path.startsWith('/api/auth/') && hasUser && Date.now() - lastExpiredAt > 5000) {
        lastExpiredAt = Date.now();
        window.dispatchEvent(new Event('muavin:session-expired'));
      }
    }
    return resp;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FormErrorProvider>
        <App />
      </FormErrorProvider>
    </ThemeProvider>
  </StrictMode>,
);
