import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import {useState} from "preact/compat";
import {Button, Card, CardContent, Container, Grid} from "@mui/material";
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AutoResizeIframe from "./AutoResizeIframe.tsx";
import {Message} from "./googleAPI.ts";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

export function App() {
    const [messages, setMessages] = useState<Message[] | null>(JSON.parse(localStorage.getItem('messagesData') || "null"));

    const [messagesToShow, setMessagesToShow] = useState<Message[] | null>(null);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log(tokenResponse);
            // const userInfo = await axios.get(
            //     'https://www.googleapis.com/oauth2/v3/userinfo',
            //     { headers: { Authorization: 'Bearer <tokenResponse.access_token>' } },
            // );
            //
            // console.log(userInfo);
            const messages = await listEmailMessages(tokenResponse.access_token);

            console.log(messages);

            let messagesData: Message[] = [];

            for (let message of messages.data.messages) {
                const msg = await getEmailMessage(tokenResponse.access_token, message.id);

                const msgToPush: Message = {
                    id: msg.data.id,
                    threadId: msg.data.threadId,
                    labelIds: msg.data.labelIds,
                    snippet: msg.data.snippet,
                    payload: msg.data.payload,
                    sizeEstimate: msg.data.sizeEstimate,
                    historyId: msg.data.historyId,
                    internalDate: msg.data.internalDate,
                };

                messagesData.push(msgToPush);
            }

            console.log(messagesData);
            setMessages(messagesData);
            localStorage.setItem('access_token', tokenResponse.access_token);
            localStorage.setItem('messagesData', JSON.stringify(messagesData));
        },
        onError: errorResponse => console.log(errorResponse),
        scope: 'https://mail.google.com'
    });

    const userId = 'me';
    const listEmailMessages = async (access_token: string) => {
        // GET https://gmail.googleapis.com/gmail/v1/users/{userId}/messages
        return await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
            }
        })
            .then(messages => {
                return messages;
            })
    }

    const getEmailMessage = async (access_token: string, id: string) => {
        // GET https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/{id}
        return await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${id}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
            }
        })
            .then(message => {
                return message;
            })
    }

    // let seen: Record<string, number> = {};
    // messages.map((msg: any) => {
    //     const labels: string[] = msg.data.labelIds || [];
    //     for (const label of labels) {
    //         if (seen[label] === undefined) {
    //             seen[label] = 0;
    //         }
    //         seen[label]++;
    //     }
    // })
    // console.log(seen);

    let messagesBySender: Record<string, Message[]> = {};
    for (let message of messages || []) {
        const sender = message.payload.headers
            .filter(header => header.name === 'From')[0]?.value || null;
        if (!sender) {
            console.log("No sender found for " + message.id);
            continue;
        }
        if (!messagesBySender[sender]) messagesBySender[sender] = [];

        messagesBySender[sender].push(message);
    }

    console.log(messagesBySender);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <Container>
                <Button variant="contained" onClick={() => googleLogin()}>
                    Sign in with Google 🚀 (Re-sync the last top 100 emails)
                </Button>
                <Grid container spacing={2}>
                    <Grid xs={3}>
                        {Object.entries(messagesBySender).map(([sender, messages], index: number) => {
                            return <Card key={index}>
                                <CardContent onClick={() => {
                                    setMessagesToShow(messages);
                                }}>{sender} | {messages.length}</CardContent>
                            </Card>
                        })}
                    </Grid>
                    <Grid item xs={8}>
                        {messagesToShow && messagesToShow.map((message: Message, index: number) => {
                            if (message.payload.parts === undefined) {
                                if (message.payload.body === undefined) {
                                    console.log("No parts???: ", message);
                                    return <div>No parts for msg: {message.id}</div>;
                                }
                                return <Card key={message.id}>
                                    <CardContent>
                                        <AutoResizeIframe
                                            src={message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')}/>
                                    </CardContent>
                                </Card>
                            }

                            const msgHTML = message.payload.parts
                                .filter((part: any) => part.mimeType === "text/html");

                            if (msgHTML.length === 0) return <div>No parts with html for msg: {message.id}</div>;

                            return <Card mt={3} key={index}>
                                <CardContent>
                                    <AutoResizeIframe src={msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')}/>
                                </CardContent>
                            </Card>
                        })}
                    </Grid>
                </Grid>
                {/*<Box>*/}
                {/*    {messages && messages.filter((msg: Message) => {*/}
                {/*        // return msg.data.payload.parts?.length > 2;*/}
                {/*        // return true;*/}
                {/*        return msg.labelIds.includes('UNREAD') &&*/}
                {/*        msg.payload.headers.filter((header: any) => {*/}
                {/*            return header.name === "From" && header.value.toLowerCase().includes('google')*/}
                {/*        }).length > 0*/}
                {/*    }).sort((a: Message, b:Message) => {*/}
                {/*        return parseInt(a.internalDate) - parseInt(b.internalDate);*/}
                {/*    }).map((message: Message, index: number) => {*/}
                {/*        // console.log("using message: ", message);*/}
                {/*        if (message.payload.parts === undefined) {*/}
                {/*            if (message.payload.body === undefined) {*/}
                {/*                console.log("No parts???: ")*/}
                {/*                console.log(message);*/}
                {/*                return <div>No parts for msg: {message.id}</div>;*/}
                {/*            }*/}
                {/*            // return <div className="card" key={index} dangerouslySetInnerHTML={{*/}
                {/*            //     __html: atob(message.data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))*/}
                {/*            // }}></div>*/}
                {/*            return <Card mt={3} key={message.id}>*/}
                {/*                <CardContent>*/}
                {/*                    <AutoResizeIframe src={message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')} />*/}
                {/*                </CardContent>*/}
                {/*            </Card>*/}
                {/*        }*/}
                {/*        const msgHTML = message.payload.parts.filter((part: any) => part.mimeType === "text/html")*/}
                {/*        if (msgHTML.length === 0) return <div>No parts with html for msg: {message.id}</div>;*/}
                {/*        // console.log(msgHTML[0].body.data)*/}
                {/*        return <Card mt={3} key={index}>*/}
                {/*            <CardContent>*/}
                {/*                /!*<div dangerouslySetInnerHTML={{*!/*/}
                {/*                /!*    __html: atob(msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/'))*!/*/}
                {/*                /!*}}></div>*!/*/}
                {/*                /!*<iframe onLoad={(e) => {*!/*/}
                {/*                /!*    *!/*/}
                {/*                /!*    if (e.currentTarget.contentDocument && e.currentTarget.contentDocument.body.scrollWidth) //ie5+ syntax*!/*/}
                {/*                /!*        e.currentTarget.width = e.currentTarget.contentWindow?.document.body.scrollWidth.toString() || "50%";*!/*/}
                {/*                /!*    else if (e.currentTarget.contentDocument && e.currentTarget.contentDocument.body.scrollWidth) //ns6+ & opera syntax*!/*/}
                {/*                /!*        e.currentTarget.width = (e.currentTarget.contentDocument.body.scrollWidth + 35).toString();*!/*/}
                {/*                /!*    else (e.currentTarget.contentDocument && e.currentTarget.contentDocument.body.offsetWidth) //standards compliant syntax – ie8*!/*/}
                {/*                /!*    e.currentTarget.width = ((e.currentTarget.contentDocument?.body.offsetWidth || 100) + 35).toString();*!/*/}

                {/*                /!*    e.currentTarget.height = ((e.currentTarget.contentDocument?.body.scrollHeight || 100) + 35).toString();*!/*/}

                {/*                /!*}} style="height:200px;width:100%;border:none;overflow:hidden;" src={`data:text/html;base64,${msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')}`}>*!/*/}
                {/*                /!*    The “iframe” tag is not supported by your browser.*!/*/}
                {/*                /!*</iframe>*!/*/}
                {/*                /!*<AutoResizeIframe src={`data:text/html;base64,${msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')}`} />*!/*/}
                {/*                <AutoResizeIframe src={msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')} />*/}
                {/*            </CardContent>*/}
                {/*        </Card>*/}
                {/*    })}*/}
                {/*</Box>*/}
            </Container>
        </ThemeProvider>
    )
}
