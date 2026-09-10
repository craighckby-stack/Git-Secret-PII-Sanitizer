import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function renderApplication(): void {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    const errorMessage = 'Failed to find the root element with id "root".';
    console.error(errorMessage);

    const fallbackContainer = document.createElement('div');
    fallbackContainer.id = 'root-fallback-error';
    fallbackContainer.setAttribute('role', 'alert');
    fallbackContainer.style.cssText = 'padding: 2rem; color: #dc2626; font-family: system-ui, sans-serif; text-align: center;';
    fallbackContainer.textContent = errorMessage;
    document.body.appendChild(fallbackContainer);

    throw new Error(errorMessage);
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

renderApplication();