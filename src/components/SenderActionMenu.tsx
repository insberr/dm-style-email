import {Divider, ListItemIcon, Menu, MenuItem} from "@mui/material";
import {Delete, Drafts, Markunread} from "@mui/icons-material";
import ListItemText from "@mui/material/ListItemText";
import {markMessagesAsRead, permanentlyDeleteMessages, trashMessages} from "../googleAPI.ts";
import {addMessage, getMessageById, removeMessages} from "../indexedDBManager.ts";

export default function SenderActionMenu(props: {
    open: { mouseX: number; mouseY: number; } | null,
    handleClose: () => void,
    senderMessagesIds: string[]
}) {
    return (
            <Menu
                open={props.open !== null}
                onClose={props.handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    props.open !== null
                      ? { top: props.open.mouseY, left: props.open.mouseX }
                      : undefined
                }
                >
                <MenuItem onClick={async () => {
                    props.handleClose();

                    // FIXME: Use a damn signal for the token
                    const access_token = localStorage.getItem('access_token') || "NO TOKEN IN LOCAL STORAGE";
                    
                    await markMessagesAsRead(access_token, "me", props.senderMessagesIds);
                    
                    // fixme: there is probably a better way to update the tags field of the message
                    for (const messageId of props.senderMessagesIds) {
                        const message = await getMessageById(messageId);
                        
                        if (message === undefined) {
                            throw new Error("Message not found in indexedDb, this should never happen, how is this possible?");
                        }
                        
                        await addMessage(message);
                        
                        // todo: update the senders list somehow.
                    }
                }}>
                    <ListItemIcon>
                        <Drafts fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mark All As Read</ListItemText>
                </MenuItem>
                <MenuItem onClick={async () => {
                    props.handleClose();
                    
                    // await markMessagesAsUnread();
                }}>
                    <ListItemIcon>
                        <Markunread fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mark All As Unread</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={async () => {
                    props.handleClose();
                    
                    console.info(`Trashing ${props.senderMessagesIds.length} messages: `, props.senderMessagesIds)
                    
                    // fixme: Use a damn signal for the token
                    const access_token = localStorage.getItem('access_token');
                    
                    if (access_token === null) {
                        console.error("Unable to retrieve access token from localStorage because it is null or missing");
                        throw new Error("Unable to retrieve access token from localStorage because it is null or missing");
                    }
                    
                    console.debug("Moving messages to trash...");
                    // fixme: Use a signal for user Id
                    // gapi trash emails
                    await trashMessages(access_token, "me", props.senderMessagesIds)
                        .catch((error) => {
                            console.error("Failed to move messages to trash (gmail api)", error)
                            throw error;
                        });

                    console.debug("Removing messages to from indexedDB...");
                    // Remove from indexedDB
                    await removeMessages(props.senderMessagesIds);
                }}>
                    <ListItemIcon>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Move All To Trash</ListItemText>
                </MenuItem>
                <Divider />
                { /* TODO: use material ui warning color from theme */ }
                <MenuItem sx={{ color: '#ff7c7c' }} onClick={async () => {
                    // TODO: Alert the user
                    
                    props.handleClose();
                    
                    console.info(`Deleting ${props.senderMessagesIds.length} messages: `, props.senderMessagesIds)
                    
                    // FIXME: Use a damn signal for the token
                    const access_token = localStorage.getItem('access_token') || "NO TOKEN IN LOCAL STORAGE";
                    
                    // TODO: Use a signal for user Id
                    // Google api PERMANENTLY delete messages
                    await permanentlyDeleteMessages(access_token, "me", props.senderMessagesIds)
                        .catch((error) => console.error("Failed to permanently delete messages (gmail api)", error));
                    
                    // Remove from indexedDB
                    await removeMessages(props.senderMessagesIds);
                }}>
                    <ListItemIcon>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Permanently Delete All (Cannot Undo)</ListItemText>
                </MenuItem>
            </Menu>
    );
}
