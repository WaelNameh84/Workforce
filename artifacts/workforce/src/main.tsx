import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';
import { SettingsProvider } from '@/contexts/settings-context';
import { UpdatePrompt } from '@/components/update-prompt';

import './index.css';

// Attach JWT token from localStorage to every API request
setAuthTokenGetter(() => localStorage.getItem('token'));

// Prevent browser drag ghost image on long-press+drag (native app feel)
document.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });

createRoot(document.getElementById('root')!).render(
  <SettingsProvider>
    <App />
    <UpdatePrompt />
  </SettingsProvider>
);
