import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/components/client';

/**
 * Documents uploaded on the dashboard are saved as drafts so people can leave and come back.
 * The PDF is stored as base64 in chunks under drafts/{id}/chunks, because a single Firestore
 * document can't exceed 1 MB. The placed fields live on the draft document itself.
 */
export interface Draft {
  id: string;
  ownerUid: string;
  name: string;
  size: number;
  chunkCount: number;
  placedItems?: any[];
  createdAt?: any;
  updatedAt?: any;
}

export const MAX_DRAFT_BYTES = 15 * 1024 * 1024;
const CHUNK_CHARS = 700_000;
// Leave room under Firestore's 1 MB limit for the rest of the draft document.
const MAX_ITEMS_CHARS = 900_000;

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Firestore rejects undefined values; a JSON round trip drops them. */
const cleanItems = (items: any[]) => JSON.parse(JSON.stringify(items ?? []));

export const createDraft = async (ownerUid: string, file: File): Promise<string> => {
  if (file.size > MAX_DRAFT_BYTES) throw new Error('too-large');
  const base64 = await fileToBase64(file);
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += CHUNK_CHARS) chunks.push(base64.slice(i, i + CHUNK_CHARS));

  const ref = await addDoc(collection(db, 'drafts'), {
    ownerUid,
    name: file.name,
    size: file.size,
    chunkCount: chunks.length,
    placedItems: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  try {
    // A batch holds at most 10 MB of writes, so commit the chunks in groups.
    for (let i = 0; i < chunks.length; i += 8) {
      const batch = writeBatch(db);
      chunks.slice(i, i + 8).forEach((data, j) => batch.set(doc(db, 'drafts', ref.id, 'chunks', String(i + j)), { index: i + j, data }));
      await batch.commit();
    }
  } catch (err) {
    await deleteDraft(ref.id).catch(() => undefined);
    throw err;
  }
  return ref.id;
};

/** Saves the fields placed so far. Returns false if they're too large to store. */
export const saveDraftItems = async (draftId: string, items: any[]): Promise<boolean> => {
  const cleaned = cleanItems(items);
  if (JSON.stringify(cleaned).length > MAX_ITEMS_CHARS) return false;
  await updateDoc(doc(db, 'drafts', draftId), { placedItems: cleaned, updatedAt: serverTimestamp() });
  return true;
};

export const loadDraftFile = async (draft: Draft): Promise<File> => {
  const snap = await getDocs(collection(db, 'drafts', draft.id, 'chunks'));
  const parts = snap.docs.map((d) => d.data() as { index: number; data: string }).sort((a, b) => a.index - b.index);
  if (parts.length !== draft.chunkCount) throw new Error('incomplete');
  const binary = atob(parts.map((p) => p.data).join(''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], draft.name, { type: 'application/pdf' });
};

export const deleteDraft = async (draftId: string) => {
  const chunks = await getDocs(collection(db, 'drafts', draftId, 'chunks'));
  const batch = writeBatch(db);
  chunks.docs.forEach((c) => batch.delete(c.ref));
  await batch.commit();
  await deleteDoc(doc(db, 'drafts', draftId));
};

const millis = (ts: any) => (ts?.toMillis ? ts.toMillis() : Date.now());

/** The user's drafts, most recently edited first. */
export const useDrafts = (ownerUid?: string | null) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  useEffect(() => {
    if (!ownerUid) return;
    return onSnapshot(
      query(collection(db, 'drafts'), where('ownerUid', '==', ownerUid)),
      (snap) =>
        setDrafts(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Draft)
            .sort((a, b) => millis(b.updatedAt) - millis(a.updatedAt))
        ),
      (err) => console.warn('Could not load drafts:', err)
    );
  }, [ownerUid]);
  return drafts;
};

/** "2 minutes ago", "yesterday", "3 Nov". */
export const editedAgo = (ts: any) => {
  if (!ts?.toDate) return 'just now';
  const diff = (Date.now() - ts.toMillis()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 172800) return 'yesterday';
  return ts.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
