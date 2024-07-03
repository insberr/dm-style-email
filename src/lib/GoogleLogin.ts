
// Copied from https://github.com/QuodAI/tutorial-react-google-api-login/blob/main/src/lib/GoogleLogin.js
export const loadGoogleScript = () => {

    //loads the Google JavaScript Library
    (function () {
        const id = 'google-js';
        const src = 'https://apis.google.com/js/api.js';

        //we have at least one script (React)
        const firstJs = document.getElementsByTagName('script')[0];

        //prevent script from loading twice
        if (document.getElementById(id)) { return; }
        const js = document.createElement('script');
        js.id = id;
        js.src = src;
        // @ts-ignore
        js.onload = window.onGoogleScriptLoad;
        if (firstJs.parentNode == null) return; // I guess
        firstJs.parentNode.insertBefore(js, firstJs);
    }());

}
