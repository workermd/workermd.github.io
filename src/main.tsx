import { createRoot } from 'react-dom/client';
import { MaxUI } from '@maxhub/max-ui';
import '@maxhub/max-ui/dist/styles.css';
import App from './App.tsx';

const Root = () => (
    <MaxUI>
        <App />
    </MaxUI>
);

const container = document.getElementById('root');

if (!container) {
    throw new Error('Root container #root not found in index.html');
}

createRoot(container).render(<Root />);
