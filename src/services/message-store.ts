import type { ChatMessage } from "../types";

const DB_NAME = "openclaw-messages";
const DB_VERSION = 1;
const STORE_NAME = "messages";

interface MessageRecord {
  key: string;
  gatewayUrl: string;
  agentId: string;
  message: ChatMessage;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("agentKey", ["gatewayUrl", "agentId"], {
          unique: false,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function recordKey(
  gatewayUrl: string,
  agentId: string,
  messageId: string,
): string {
  return `${gatewayUrl}::${agentId}::${messageId}`;
}

export async function loadMessages(
  gatewayUrl: string,
  agentId: string,
): Promise<ChatMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("agentKey");
    const req = index.getAll(IDBKeyRange.only([gatewayUrl, agentId]));
    req.onsuccess = () => {
      const records = req.result as MessageRecord[];
      records.sort((a, b) => a.timestamp - b.timestamp);
      resolve(records.map((r) => r.message));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveMessage(
  gatewayUrl: string,
  agentId: string,
  msg: ChatMessage,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: MessageRecord = {
      key: recordKey(gatewayUrl, agentId, msg.id),
      gatewayUrl,
      agentId,
      message: { ...msg, streaming: undefined },
      timestamp: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearMessages(
  gatewayUrl: string,
  agentId: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("agentKey");
    const req = index.openCursor(IDBKeyRange.only([gatewayUrl, agentId]));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function pruneOldMessages(maxPerAgent: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("agentKey");
    const req = index.openCursor();
    const groups = new Map<string, MessageRecord[]>();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const record = cursor.value as MessageRecord;
        const groupKey = `${record.gatewayUrl}::${record.agentId}`;
        const group = groups.get(groupKey) || [];
        group.push(record);
        groups.set(groupKey, group);
        cursor.continue();
      } else {
        for (const group of groups.values()) {
          if (group.length > maxPerAgent) {
            group.sort((a, b) => a.timestamp - b.timestamp);
            const toDelete = group.slice(0, group.length - maxPerAgent);
            for (const record of toDelete) {
              store.delete(record.key);
            }
          }
        }
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}
