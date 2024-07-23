import {Message} from "./googleAPI.ts";

const dbName = 'dm-style-email';
const storeName = 'messages';
let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase() {
    if (!dbPromise) {
        dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    return dbPromise;
}

// Add an array of messages to the database
export async function addMessages(messages: Message[]) {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    messages.forEach((message) => {
        store.add(message);
    });

    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

export async function deleteAllMessages() {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    store.clear();

    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

export async function deleteMessages(messageIdList: string[]) {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    store.delete(messageIdList);

    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

// Get all messages from the database
export async function getAllMessages(): Promise<Message[]> {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise<Message[]>((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Query messages by "From" header
export async function queryMessagesByFromHeader(query: string): Promise<Message[]> {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise<Message[]>((resolve, reject) => {
        request.onsuccess = () => {
            const allMessages: Message[] = request.result;
            const filteredMessages = allMessages.filter(message =>
                message.payload.headers.some(header =>
                    header.name === 'From' && header.value.includes(query)
                )
            );
            resolve(filteredMessages);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

export async function getMessageById(id: string): Promise<Message | undefined> {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    return new Promise<Message | undefined>((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}
