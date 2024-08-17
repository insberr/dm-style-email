import {markMessagesAsRead, Message, MessagePart} from "../googleAPI.ts";
import {useState} from "react";
import {Card, CardActions, CardContent, Collapse} from "@mui/material";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import AutoResizeIframe from "../AutoResizeIframe.tsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton, {IconButtonProps} from "@mui/material/IconButton";
import {styled} from "@mui/material/styles";
import {useEffect} from "preact/hooks";
import Typography from "@mui/material/Typography";

interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

const msgidstomarkread: string[] = [];
export function markReadYesYesYes(access_token: string) {
    console.log(msgidstomarkread);
    if (msgidstomarkread.length === 0) {
        console.warn(`No message found for ${msgidstomarkread} to mark read`);
        return;
    }

    markMessagesAsRead(access_token, 'me', msgidstomarkread)
        .catch(error => console.log(error));
}

function MessageCardTemplate(props: { children: any; message: Message; }) {
    const [expanded, setExpanded] = useState<boolean>(false);

    const setMessageAsRead = (messageId: string) => {
        msgidstomarkread.push(messageId);
        setExpanded(false);
    };
    const setMessageAsUnRead = (_messageId: string) => {

    };

    useEffect(() => {
        setExpanded(props.message.labelIds.includes('UNREAD'));
    }, [props.message]);

    return <Card sx={{ mt: 3 }}>
        <CardContent>
            <Typography variant='h6'>
                {props.message.payload.headers
                    .find(header => header.name === "Subject")?.value}
            </Typography>

            <Chip label={props.message.payload.headers
                .find(header => header.name === "Date")?.value} variant="outlined" color="info" size="small" icon={<ExpandMoreIcon />} />
        </CardContent>
        <Divider />
        <CardActions disableSpacing>
            {props.message.labelIds.includes('UNREAD') ?
                <Chip label='Unread' onClick={() => setMessageAsRead(props.message.id)}/> :
                <Chip variant="outlined" label='Read' onClick={() => setMessageAsUnRead(props.message.id)}/>
            }

            <ExpandMore
                expand={expanded}
                onClick={() => { setExpanded(!expanded) }}
                aria-expanded={expanded}
                aria-label="show more"
            >
                <ExpandMoreIcon />
            </ExpandMore>
        </CardActions>

        <Divider/>
        <Collapse in={expanded} timeout="auto">
            <CardContent>
                {props.children}
            </CardContent>
        </Collapse>
        <Divider/>
        <CardActions disableSpacing>
            {props.message.labelIds.includes('UNREAD') ?
                <Chip label='Unread' onClick={() => setMessageAsRead(props.message.id)}/> :
                <Chip variant="outlined" label='Read' onClick={() => setMessageAsUnRead(props.message.id)}/>
            }
        </CardActions>
    </Card>;
}

function fixGoogleBase64Encoding(value: string): string {
    return value
        .replace(/-/g, '+')
        .replace(/_/g, '/')
}

export default function MessageCard(props: { key: string | number; message: Message }) {
    const payload = props.message.payload;

    if (payload.parts === undefined) {
        if (payload.body === undefined) {
            console.error("No parts???: ", props.message);

            return <MessageCardTemplate message={props.message}>
                Unable to render content: {JSON.stringify(props.message.payload, null, 2)}
            </MessageCardTemplate>
        }

        const messageHTML = fixGoogleBase64Encoding(
            (props.message.payload.body as { size: number, data: string }).data
        );

        return <MessageCardTemplate message={props.message}>
            <AutoResizeIframe src={messageHTML} />
        </MessageCardTemplate>
    }
    
    let messagePartsHTML: MessagePart[] = [];
    let messagePartsAttachments: MessagePart[] = [];
    
    messagePartsHTML = payload.parts.filter(
        (part: any) => part.mimeType === "text/html"
    );

    if (messagePartsHTML.length === 0) {
        console.log(payload.parts)
        const altParts = payload.parts.filter(
            (part: any) => part.mimeType === "multipart/alternative"
        );

        messagePartsHTML = altParts.flatMap((part: any) => {
            return part.parts.filter(
                (partInside: any) => partInside.mimeType === "text/html"
            );
        });
        
        messagePartsAttachments = payload.parts.filter(
            (part: any) => part.mimeType !== "multipart/alternative"
        );
        
        console.log("Alt attach, ", messagePartsAttachments);
        
        // return <MessageCardTemplate message={props.message}>
        //     Unable to render content: {JSON.stringify(payload, null, 2)}
        // </MessageCardTemplate>
    }
    
    if (messagePartsHTML.length === 0) {
        return <MessageCardTemplate message={props.message}>
            Unable to render content: {JSON.stringify(payload, null, 2)}
        </MessageCardTemplate>
    }

    const messageHTML = fixGoogleBase64Encoding(messagePartsHTML[0].body.data);

    return <MessageCardTemplate message={props.message}>
        { messagePartsAttachments.length > 0 ?
            <div>Attachments Included: {
                messagePartsAttachments.map(attachmentPart => 
                    <div>{attachmentPart.filename}</div>
                )
            }
            </div>
            : null
        }
        <AutoResizeIframe src={messageHTML}/>
    </MessageCardTemplate>
}