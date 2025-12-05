'use client';
import { openDB } from 'idb';

export async function initDatabase() {
    const db = await openDB('drafts', 1, {
        upgrade(db) {
            // Create "messengers" store for text drafts
            if (!db.objectStoreNames.contains('messengers')) {
                db.createObjectStore('messengers', { keyPath: 'id' });
            }

            // Create "gift_items" store for attachments
            if (!db.objectStoreNames.contains('gift_item')) {
                const giftStore = db.createObjectStore('gift_item', { keyPath: 'id' });
                giftStore.createIndex('by-messenger', 'messengerId');
            }
        }
    });
    return db;
}

export async function saveDraft(messengerId: string, text: string) {
    const db = await initDatabase();
    await db.put('messengers', { id: messengerId, text, updatedAt: Date.now() });
}

export async function getDraft(messengerId: string) {
    const db = await initDatabase();
    return await db.get('messengers', messengerId);
}

export async function saveAttachment(item: any) {
    const db = await initDatabase();
    await db.put('gift_item', item);
}

export async function getAttachments(messengerId: string) {
    const db = await initDatabase();
    return await db.getAllFromIndex('gift_item', 'by-messenger', messengerId);
}

export async function deleteAttachment(id: number) {
    const db = await initDatabase();
    await db.delete('gift_item', id);
}

export async function clearDrafts(messengerId: string) {
    const db = await initDatabase();
    const tx = db.transaction(['messengers', 'gift_item'], 'readwrite');

    // Clear text draft
    await tx.objectStore('messengers').delete(messengerId);

    // Clear attachments for this messenger
    const index = tx.objectStore('gift_item').index('by-messenger');
    let cursor = await index.openCursor(IDBKeyRange.only(messengerId));

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    await tx.done;
}
