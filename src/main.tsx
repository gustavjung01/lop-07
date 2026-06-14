import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './math-route.css';
import Lop7App from './app/Lop7App';

function isMathRoute() {
  if (typeof window === 'undefined') return false;
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  return search.includes('view=math') || hash.includes('math');
}

function syncMathRouteClass() {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('hhk-route-math', isMathRoute());
}

function Lop7AppWithRouteBoot() {
  useEffect(() => {
    syncMathRouteClass();

    const bootTimers = [50, 250, 650].map((delay) => window.setTimeout(syncMathRouteClass, delay));

    const handleRouteChange = () => {
      window.setTimeout(syncMathRouteClass, 50);
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      bootTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return <Lop7App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lop7AppWithRouteBoot />
  </StrictMode>,
);
