import { render } from 'preact'
import { App } from './app.tsx'
import './index.css'
import {GoogleOAuthProvider} from "@react-oauth/google";

render(
    <GoogleOAuthProvider clientId="485936092108-fhb67k5j109vitdila6oj4rlvo942q2l.apps.googleusercontent.com">
        <App />
    </GoogleOAuthProvider>,
    document.getElementById('app')!
);
