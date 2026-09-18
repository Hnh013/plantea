import { useEffect } from 'react';
import legacyMarkup from './legacyMarkup';
import './styles.css';

export default function App() {
  useEffect(() => {
    const root = document.getElementById('legacy-root');
    if (!root) return;
    root.innerHTML = legacyMarkup.replace('<script src="app.js"></script>', '');
    const script = document.createElement('script');
    script.src = '/planner.js';
    script.defer = true;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  return <div id="legacy-root" />;
}
