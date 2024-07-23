import { Menu as MenuIcon } from '@mui/icons-material';
import {SwipeableDrawer, IconButton } from '@mui/material';
import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import {useMemo, useState} from "preact/compat";
import {Badge, Box, Button, Grid} from "@mui/material";
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {getEmailMessage, listEmailMessages, Message} from "./googleAPI.ts";
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MessageList from "./components/MessageList.tsx";
import {addMessages, deleteAllMessages, getAllMessages} from './indexedDBManager.ts'
import {markReadYesYesYes} from "./components/MessageCard.tsx";

export interface SenderSummary {
    fullSenderString: string;
    sender: string;
    names: string[],
    unreadCount: number;
    messageIds: string[];
}

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

export function App() {
    // const [messages, setMessages] = useState<Message[] | null>(null);
    // const [messagesToShow, setMessagesToShow] = useState<string[] | null>(null);
    // const [messagesBySender, setMessagesBySender] = useState<Record<string, SenderSummary> | null>(null);
    const [selectedSenderIndex, setSelectedSenderIndex] = useState<number>(0);
    const [syncing, setSyncing] = useState<boolean>(false);
    const [nextBatch, setNextBatch] = useState<string | null>(localStorage.getItem('nextPage'));
    const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [senders, setSenders] = useState<SenderSummary[]>([]);

    // FIXME: Probably store this information in the database so we dont have to compute it here
    useMemo(() => {
        console.log("Initializing messages by sender");

        getAllMessages().then(allMessages => {
            let messagesBySenderTemp: Record<string, SenderSummary> = {};

            for (let message_1 of allMessages) {
                const sender = message_1.payload.headers
                    .filter(header => header.name === 'From')[0]?.value || null;

                if (!sender) {
                    console.log("No sender found for " + message_1.id);
                    continue;
                }

                let senderName = sender.replace(/ <.+>/g, '');
                let senderAddresses = sender.match(/<.+>/g);

                // If there is no name on the account, then the address becomes the name so this swaps them
                if (!senderAddresses || senderAddresses.length === 0) {
                    senderAddresses = [senderName];
                }

                if (senderAddresses.length > 1) {
                    console.warn("There should not be multiple sender addresses: ", message_1.id);
                }

                const senderAddress = senderAddresses[0];

                if (!messagesBySenderTemp[senderAddress]) messagesBySenderTemp[senderAddress] = {
                    fullSenderString: sender,
                    sender: senderAddress,
                    names: [],
                    unreadCount: 0,
                    messageIds: []
                };

                if (message_1.labelIds.includes("UNREAD")) {
                    messagesBySenderTemp[senderAddress].unreadCount++;
                }

                if (!messagesBySenderTemp[senderAddress].names.includes(senderName)) {
                    messagesBySenderTemp[senderAddress].names.push(senderName);
                }

                messagesBySenderTemp[senderAddress].messageIds.push(message_1.id);
            }

            console.log("Messages by sender: ", messagesBySenderTemp);
            // setMessagesBySender(messagesBySenderTemp);
            // setMessagesToShow(Object.values(messagesBySenderTemp)[0].messageIds);

            const done = Object.values(messagesBySenderTemp)
                .sort((aSender, bSender) => {
                    const aUnreads = aSender.unreadCount;
                    const bUnreads = bSender.unreadCount;
                    return bUnreads - aUnreads;
                });

            // setSelectedSenderIndex(done[0].sender);

            setSenders(done);
        });
    }, [nextBatch]);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log(tokenResponse);

            localStorage.setItem('access_token', tokenResponse.access_token);
            setToken(tokenResponse.access_token);

            const userInfo = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
            );
            console.log(userInfo);
        },
        onError: errorResponse => console.log(errorResponse),
        scope: 'https://mail.google.com'
    });

    async function syncEmails() {
        if (!token) {
            console.error("No token");
            return;
        }

        if (!nextBatch) {
            deleteAllMessages().catch(error => console.log(error));
            setSenders([]);
        }

        const messages: { id: string; threadId: string; }[] = [];
        const response = await listEmailMessages(token, 'me', nextBatch);
        messages.push(...response.data.messages);

        // FIXME: Make it so if the message id is already in the database that we dont re-request for it
        //      But still re-sync existing values once in a while

        console.log(messages);

        let messagesData: Message[] = [];

        setSyncing(true);

        const chunkedMessages = [];
        for (let i = 0; i < messages.length; i += 10) {
            chunkedMessages.push(messages.slice(i, i + 10));
        }

        for (let chunkedMessage of chunkedMessages) {
            await Promise.all(chunkedMessage.map(async message => {
                console.debug("Getting message ", message.id);

                const msg = await getEmailMessage(token, 'me', message.id);

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
            })).catch(error => console.log(error));
        }

        setSyncing(false);

        // console.log(messagesData);
        // setMessages(messagesData);

        if (response.data.nextPageToken === undefined || response.data.nextPageToken === null) {
            setNextBatch(null);
            localStorage.removeItem('nextPage');
        } else {
            setNextBatch(response.data.nextPageToken);
            localStorage.setItem('nextPage', response.data.nextPageToken);
        }

        // try {
        //     localStorage.setItem('messagesData', JSON.stringify(messagesData));
        // } catch (error) {
        //     console.error(error);
        // }

        await addMessages(messagesData).catch(error => console.log(error));
    }

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [smallScreenEmailViewOpen, setSmallScreenEmailViewOpen] = useState(false);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setDrawerOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            DM Email
                        </Typography>
                        {syncing &&
                            <Typography>
                                Syncing Emails...
                            </Typography>
                        }
                    </Toolbar>
                </AppBar>
                <SwipeableDrawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(!drawerOpen)}
                >
                    <Box role="presentation" onClick={() => setDrawerOpen(!drawerOpen)} onKeyDown={() => setDrawerOpen(!drawerOpen)}>
                        <List>
                            <ListItemButton
                                onClick={() => {
                                    if (token) markReadYesYesYes(token);
                                }}
                            >
                                Save
                            </ListItemButton>
                            <ListItemButton variant="contained" onClick={() => syncEmails()}>
                                Sync next 200
                            </ListItemButton>
                            <ListItemButton variant="contained" onClick={() => googleLogin()}>
                                Sign in with Google
                            </ListItemButton>
                        </List>
                    </Box>
                </SwipeableDrawer>
                <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Grid item
                          xs={12}
                          md={3}
                          sx={{
                              borderRight: '1px solid #333',
                              overflowY: 'auto',
                              height: '100vh',
                              paddingBottom: '100px'
                          }}>
                            <List>
                                {senders
                                    .map((sender, index: number) => {
                                        return <ListItemButton
                                            key={`sender-button-${index}`}
                                            selected={selectedSenderIndex === index}
                                            onClick={() => {
                                                setSelectedSenderIndex(index);
                                                setSmallScreenEmailViewOpen(true);
                                                // setMessagesToShow(sender.messageIds);
                                            }}>

                                                <ListItemText primary={sender.names.join(', ')} secondary={sender.sender} />
                                            <Badge badgeContent={sender.unreadCount } color="primary" />
                                        </ListItemButton>
                                    })
                                }
                            </List>
                    </Grid>
                    <Grid item
                          xs={12}
                          md={9}
                          sx={{
                              overflowY: 'auto',
                              height: '100vh',
                              padding: 2,
                              paddingBottom: '100px'
                          }}>
                        <Box sx={{
                            display: {
                                sm: 'block',
                                md: 'none',
                            }
                        }}>
                            <SwipeableDrawer
                                sx={{ display: 'block' }}
                                anchor="right"
                                open={smallScreenEmailViewOpen}
                                onClose={() => setSmallScreenEmailViewOpen(!smallScreenEmailViewOpen)}
                                disableDiscovery={false}
                                disableSwipeToOpen={false}

                            >
                                <Button onClick={() => setSmallScreenEmailViewOpen(false)}>{'<'} Back</Button>
                                <MessageList messageIds={
                                    senders[selectedSenderIndex]?.messageIds || null
                                } />
                            </SwipeableDrawer>
                        </Box>
                        <Box sx={{
                            display: {
                                sm: 'none',
                                md: 'block'
                            }
                        }}>
                            <MessageList messageIds={
                                senders[selectedSenderIndex]?.messageIds || null
                            } />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    )
}
