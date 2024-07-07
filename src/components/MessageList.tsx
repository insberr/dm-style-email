import {Message} from "../googleAPI.ts";
import MessageCard from "./MessageCard.tsx";
import Stack from "@mui/material/Stack";
import {getMessageById} from "../indexedDBManager.ts";
import {useState} from "preact/compat";
import {useEffect} from "preact/hooks";

export default function MessageList(props: { messageIds: string[] | null }) {
    const [messages, setMessages] = useState<Message[] | null>(null);

    useEffect(() => {
        setMessages(null);

        const getMessagesData = async (): Promise<Message[]> => {
            if (!props.messageIds) {
                console.log("No messages found for " + props.messageIds);
                throw new Error("No messages found for " + props.messageIds);
            }

            const messagesData = await Promise.all(props.messageIds.map(async messageId => {
                return await getMessageById(messageId);
            }));

            const filteredMsgs: Message[] = messagesData.filter(msg => msg !== undefined);

            console.log("Filtered msgs: ", filteredMsgs);

            return filteredMsgs;
        }

        getMessagesData()
            .then((messagesData) => {
                setMessages(messagesData);
            })
            .catch(error => console.error(error));

    }, [props.messageIds]);

    if (!props.messageIds) return <div>No message ids provided</div>
    if (!messages) return <div>Loading...</div>;

    return <Stack spacing={2}>
        {messages.sort((a, b) => {
            if (!a || !b) return -1;
            return parseInt(a.internalDate) - parseInt(b.internalDate);
        }).map((message: Message, index: number) => {
            return <MessageCard key={index} message={message} />
        })}
    </Stack>
}