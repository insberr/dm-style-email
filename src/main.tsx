import { render } from 'preact'
import { App } from './app.tsx'
import {GoogleOAuthProvider} from "@react-oauth/google";

import './styles/index.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

render(
    <GoogleOAuthProvider clientId="485936092108-b4kvdfo5b5ttm1mp79hvc8smn73efda7.apps.googleusercontent.com">
        <App />
    </GoogleOAuthProvider>,
    document.getElementById('app')!
);
