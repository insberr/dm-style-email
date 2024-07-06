import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import {useState} from "preact/compat";
import {Box, Button, Card, CardContent, Container} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AutoResizeIframe from "./AutoResizeIframe.tsx";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

export function App() {
    const [messages, setMessages] = useState<any | null>(JSON.parse(localStorage.getItem('messagesData') || "null"));

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

            let messagesData = [];

            for (let message of messages.data.messages) {
                messagesData.push(await getEmailMessage(tokenResponse.access_token, message.id));
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
        return await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages`,  {
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
        return await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${id}`,  {
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

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
        <Container>
            <Button variant="contained" onClick={() => googleLogin()}>
                Sign in with Google 🚀 (Re-sync the last top 100 emails)
            </Button>
            <Box>
                {messages && messages.filter((msg: any) => {
                    // return msg.data.payload.parts?.length > 2;
                    // return true;
                    return msg.data.labelIds.includes('UNREAD') &&
                    msg.data.payload.headers.filter((header: any) => {
                        return header.name === "From" && header.value.toLowerCase().includes('')
                    }).length > 0
                }).sort((a: any, b:any) => {
                    return a.data.internalDate - b.data.internalDate;
                }).map((message: any, index: number) => {
                    // console.log("using message: ", message);
                    if (message.data.payload.parts === undefined) {
                        if (message.data.payload.body === undefined) {
                            console.log("No parts???: ")
                            console.log(message);
                            return <div>No parts for msg: {message.data.payload.id}</div>;
                        }
                        // return <div className="card" key={index} dangerouslySetInnerHTML={{
                        //     __html: atob(message.data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                        // }}></div>
                        return <Card mt={3} key={message.id}>
                            <CardContent>
                                <AutoResizeIframe src={message.data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')} />
                            </CardContent>
                        </Card>
                    }
                    const msgHTML = message.data.payload.parts.filter((part: any) => part.mimeType === "text/html")
                    if (msgHTML.length === 0) return <div>No parts with html for msg: {message.data.payload.id}</div>;
                    // console.log(msgHTML[0].body.data)
                    return <Card mt={3} key={index}>
                        <CardContent>
                            {/*<div dangerouslySetInnerHTML={{*/}
                            {/*    __html: atob(msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/'))*/}
                            {/*}}></div>*/}
                            {/*<iframe onLoad={(e) => {*/}
                            {/*    */}
                            {/*    if (e.currentTarget.contentDocument && e.currentTarget.contentDocument.body.scrollWidth) //ie5+ syntax*/}
                            {/*        e.currentTarget.width = e.currentTarget.contentWindow?.document.body.scrollWidth.toString() || "50%";*/}
                            {/*    else if (e.currentTarget.contentDocument && e.currentTarget.contentDocument.body.scrollWidth) //ns6+ & opera syntax*/}
                            {/*        e.currentTarget.width = (e.currentTarget.contentDocument.body.scrollWidth + 35).toString();*/}
                            {/*    else (e.currentTarget.contentDocument && e.currentTarget.contentDocument.body.offsetWidth) //standards compliant syntax – ie8*/}
                            {/*    e.currentTarget.width = ((e.currentTarget.contentDocument?.body.offsetWidth || 100) + 35).toString();*/}

                            {/*    e.currentTarget.height = ((e.currentTarget.contentDocument?.body.scrollHeight || 100) + 35).toString();*/}

                            {/*}} style="height:200px;width:100%;border:none;overflow:hidden;" src={`data:text/html;base64,${msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')}`}>*/}
                            {/*    The “iframe” tag is not supported by your browser.*/}
                            {/*</iframe>*/}
                            {/*<AutoResizeIframe src={`data:text/html;base64,${msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')}`} />*/}
                            <AutoResizeIframe src={msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')} />
                        </CardContent>
                    </Card>
                })}
            </Box>
        </Container>
        </ThemeProvider>
    )
}
