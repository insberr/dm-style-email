import axios from 'axios';

const unreadOnlyDefault = true;


export interface MessageIdList {
    messages: { id: string; threadId: string; }[];
    nextPageToken: string;
    resultSizeEstimate: number;
}

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
    } | {
        size: number;
        data: string;
    };
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



export async function listEmailMessages(
    access_token: string,
    userId: string,
    nextBatch?: string | null,
    options?: {
        allMail?: boolean
        maxResults?: number
    }
): Promise<{ data: MessageIdList }> {
    // GET https://gmail.googleapis.com/gmail/v1/users/{userId}/messages
    const maxResults = options?.maxResults || 200;
    const unreadOnly = (options?.allMail || !unreadOnlyDefault) ? '' : '&q=is%3Aunread';

    return await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages?maxResults=${maxResults}${unreadOnly}${nextBatch ? '&pageToken=' + nextBatch : ''}`,
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
            }
        })
        .then(messages => {
            return messages as { data: MessageIdList };
        })
}

export async function getEmailMessage(access_token: string, userId: string, id: string): Promise<{ data: Message }> {
    // GET https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/{id}
    return await axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${id}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
        }
    })
        .then(message => {
            return message as { data: Message };
        })
}

export async function markMessagesAsRead(access_token: string, userId: string, messageIdList: string[]) {
    // POST https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/batchModify
    await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/batchModify`,
    {
            "ids": messageIdList,
            "addLabelIds": [],
            "removeLabelIds": ["UNREAD"]
        },
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
            },
        }
    )
}

export async function markMessagesAsUnRead(access_token: string, userId: string, messageIdList: string[]) {
    // POST https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/batchModify
    await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/batchModify`,
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json'
            },
            body: {
                "ids": messageIdList,
                "addLabelIds": ["UNREAD"],
                "removeLabelIds": []
            }
        }
    )
}

export async function deleteMessages(access_token: string, userId: string, messageIdList: string[]) {
    await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/batchDelete`,
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
                Accept: 'application/json',
                "Content-Type": "application/json"
            },
            body: {
                "ids": messageIdList,
            }
        }
    )
}

export async function deleteMessage(access_token: string, userId: string, messageId: string): Promise<void> {
    await deleteMessages(access_token, userId, [messageId]);
}
