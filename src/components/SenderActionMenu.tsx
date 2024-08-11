import {Divider, ListItemIcon, Menu, MenuItem} from "@mui/material";
import {Delete, Drafts, Markunread} from "@mui/icons-material";
import ListItemText from "@mui/material/ListItemText";
import {deleteMessages} from "../googleAPI.ts";

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
                    props.handleClose
                    // await markMessagesAsRead()
                }}>
                    <ListItemIcon>
                        <Drafts fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mark All As Read</ListItemText>
                </MenuItem>
                <MenuItem onClick={async () => {
                    props.handleClose
                    // await markMessagesAsUnread()
                }}>
                    <ListItemIcon>
                        <Markunread fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mark All As Unread</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={async () => {
                    // todo: make this whole function work
                    
                    props.handleClose
                    
                    console.info(`Deleting ${props.senderMessagesIds.length} messages: `, props.senderMessagesIds)
                    
                    // fixme: Use a damn signal for the token
                    const access_token = localStorage.getItem('access_token') || "NO TOKEN IN LOCAL STORAGE";
                    
                    // fixme: everything is wrong with how this is being done.
                    //   Alert the user
                    //   Use a signal for user Id
                    // gapi Delete, not indexeddb
                    await deleteMessages(access_token, "me", props.senderMessagesIds);
                    
                    // todo: delete messages from indexed db
                }}>
                    <ListItemIcon>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete All</ListItemText>
                </MenuItem>
            </Menu>
    );
}
