import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthPage } from '../src/features/auth/AuthPage';
import '../src/shared/styles/tokens.css';

createRoot(document.getElementById('root')!).render(<AuthPage />);
