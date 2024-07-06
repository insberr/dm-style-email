
export interface MessagePart {
    partId: string;
    mimeType: string;
    filename: string;
    headers: {
        name: string;
        value: string;
    }[];
    body: {
        size: number;
        data: string;
    }
}
export interface MessagePayload {
    partId: string;
    mimeType: string;
    filename: string;
    headers: {
        name: string;
        value: string;
    }[];
    body: {
        size: number;
    } | MessagePart;
    parts: MessagePart[] | undefined;
}

export interface Message {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: MessagePayload; // todo
    sizeEstimate: number,
    historyId: string,
    internalDate: string
}




const tokenClient = (window as any).tokenClient;
const gapi = (window as any).gapi;
const google = (window as any).google;

/**
 *  Sign in the user upon button click.
 */
export function googleAuthenticate() {
    tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
            throw (resp);
        }

        console.log('Successfully authenticated user: ');
        console.log(resp);

        // save login
        localStorage.setItem('token', resp.token);

        // todo await listLabels();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
}

/**
 *  Sign out the user upon button click.
 */
export function logout() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
}