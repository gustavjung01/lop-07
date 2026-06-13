import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Lop7App from './app/Lop7App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lop7App />
  </StrictMode>,
);


