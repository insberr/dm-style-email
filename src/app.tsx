import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import {useState} from "preact/compat";
import {Container, Box, Button, Card, CardContent, Grid} from "@mui/material";
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AutoResizeIframe from "./AutoResizeIframe.tsx";
import {Message} from "./googleAPI.ts";
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import {useEffect} from 'preact/hooks';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';


const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

export function App() {
    const [messages, setMessages] = useState<Message[] | null>(JSON.parse(localStorage.getItem('messagesData') || "null"));
    const [messagesToShow, setMessagesToShow] = useState<Message[] | null>(null);
    const [messagesBySender, setMessagesBySender] = useState<Record<string, Message[]> | null>(null);
    const [selectedSenderIndex, setSelectedSenderIndex] = useState<number>(0);

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

    useEffect(() => {
        let messagesBySenderTemp: Record<string, Message[]> = {};
        for (let message of messages || []) {
            const sender = message.payload.headers
                .filter(header => header.name === 'From')[0]?.value || null;
            if (!sender) {
                console.log("No sender found for " + message.id);
                continue;
            }
            if (!messagesBySenderTemp[sender]) messagesBySenderTemp[sender] = [];

            messagesBySenderTemp[sender].push(message);
        }

        console.log(messagesBySenderTemp);

        setMessagesBySender(messagesBySenderTemp);

        setMessagesToShow(Object.values(messagesBySenderTemp)[0]);
    }, [messages]);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
                <Box sx={{ flexGrow: 1 }}>
                    <AppBar position="static">
                        <Toolbar>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                Direct Message Style Email
                            </Typography>
                            <Button variant="contained" onClick={() => googleLogin()}>
                                Sign in with Google (Re-sync the last top 100 emails)
                            </Button>
                        </Toolbar>
                    </AppBar>
                </Box>
                <Grid container spacing={2}>
                    <Grid item sm={4}>
                        <Box>
                            <List>
                                {messagesBySender && Object.entries(messagesBySender).map(([sender, messages], index: number) => {
                                    return <ListItemButton key={index} selected={selectedSenderIndex === index} onClick={() => {
                                        setSelectedSenderIndex(index);
                                        setMessagesToShow(messages);
                                    }}>
                                        <ListItemText primary={sender.replace(/ <.+>/g, '')} secondary={sender.match(/<.+>/g)} />
                                        {messages.length}
                                    </ListItemButton>
                                })}
                            </List>
                        </Box>
                    </Grid>
                    <Grid item sm={8}>
                        <Stack spacing={2}>
                            {messagesToShow && messagesToShow.map((message: Message, index: number) => {
                                if (message.payload.parts === undefined) {
                                    if (message.payload.body === undefined) {
                                        console.log("No parts???: ", message)
                                        return <Card mt={3} key={index}>
                                            <Box sx={{p: '10px'}}>
                                                {message.labelIds.includes('UNREAD') ?
                                                    <Chip label='Unread'/> :
                                                    <Chip variant="outlined" label='Read'/>
                                                }

                                                <div>No parts for msg: {message.id}</div>
                                            </Box>
                                            <Divider/>
                                            <CardContent>
                                                Unable to render content: {JSON.stringify(message.payload, null, 2)}
                                            </CardContent>
                                        </Card>;
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

                                if (msgHTML.length === 0) {
                                    return <Card mt={3} key={index}>
                                        <Box sx={{p: '10px'}}>
                                            {message.labelIds.includes('UNREAD') ?
                                                <Chip label='Unread'/> :
                                                <Chip variant="outlined" label='Read'/>
                                            }

                                            <div>No parts with html for msg: {message.id}</div>
                                        </Box>
                                        <Divider/>
                                        <CardContent>
                                            Unable to render content: {JSON.stringify(message.payload, null, 2)}
                                        </CardContent>
                                    </Card>;
                                }

                                return <Card mt={3} key={index}>
                                    <Box sx={{ p: '10px' }}>
                                        {message.labelIds.includes('UNREAD') ?
                                            <Chip label='Unread'/> :
                                            <Chip variant="outlined" label='Read'/>
                                        }
                                    </Box>
                                    <Divider/>
                                    <CardContent>
                                        <AutoResizeIframe
                                            src={msgHTML[0].body.data.replace(/-/g, '+').replace(/_/g, '/')}/>
                                    </CardContent>
                                </Card>
                            })}
                        </Stack>
                    </Grid>
                </Grid>
        </ThemeProvider>
    )
}
