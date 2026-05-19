import { writeFile, readFile } from "$lib/api/file";

const MAX_SLOTS_PER_TYPE = 5;
const STORAGE_PREFIX = "puredraft_save_slots:";

export interface SaveSlotMeta {
  slotId: number;
  type: "manual" | "auto";
  timestamp: number;
  description: string;
  cursor: { line: number; col: number };
  contentLength: number;
  savedPath: string;
}

interface SaveSlotStore {
  slots: SaveSlotMeta[];
  nextSlotId: number;
}

function getStorageKey(filePath: string): string {
  return STORAGE_PREFIX + filePath;
}

function loadStore(filePath: string): SaveSlotStore {
  try {
    const raw = localStorage.getItem(getStorageKey(filePath));
    if (!raw) return { slots: [], nextSlotId: 1 };
    return JSON.parse(raw) as SaveSlotStore;
  } catch {
    return { slots: [], nextSlotId: 1 };
  }
}

function saveStore(filePath: string, store: SaveSlotStore): void {
  try {
    localStorage.setItem(getStorageKey(filePath), JSON.stringify(store));
  } catch {
    // silently fail
  }
}

function hashPath(filePath: string): string {
  let h = 0;
  for (let i = 0; i < filePath.length; i++) {
    h = (Math.imul(31, h) + filePath.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function buildSlotDiskPath(filePath: string, store: SaveSlotStore, meta: SaveSlotMeta): string {
  const dir = filePath.substring(0, filePath.lastIndexOf("\\") || filePath.lastIndexOf("/"));
  const sep = filePath.includes("\\") ? "\\" : "/";
  const ext = filePath.split(".").pop() || "txt";
  return `${dir}${sep}.puredraft_saves${sep}${hashPath(filePath)}_slot${meta.slotId}_${meta.type}.${ext}`;
}

export function getSaveSlots(filePath: string): SaveSlotMeta[] {
  return loadStore(filePath).slots;
}

export async function createSaveSlot(
  type: "manual" | "auto",
  filePath: string,
  content: string,
  description: string = "",
  cursor: { line: number; col: number } = { line: 1, col: 1 },
): Promise<SaveSlotMeta | null> {
  console.log(`[SaveSlots] createSaveSlot called — type=${type}, file=${filePath}, contentLen=${content.length}`);
  const store = loadStore(filePath);
  const typeSlots = store.slots.filter((s) => s.type === type);
  console.log(`[SaveSlots] current ${type} slots before create: ${typeSlots.length}/${MAX_SLOTS_PER_TYPE}`, typeSlots.map(s => ({ id: s.slotId, ts: new Date(s.timestamp).toISOString() })));

  if (typeSlots.length >= MAX_SLOTS_PER_TYPE) {
    typeSlots.sort((a, b) => a.timestamp - b.timestamp);
    const oldest = typeSlots[0];
    console.log(`[SaveSlots] FIFO eviction — removing oldest ${type} slot #${oldest.slotId}, timestamp=${new Date(oldest.timestamp).toISOString()}, contentLen=${oldest.contentLength}`);
    store.slots = store.slots.filter((s) => s.slotId !== oldest.slotId);
  }

  const meta: SaveSlotMeta = {
    slotId: store.nextSlotId++,
    type,
    timestamp: Date.now(),
    description,
    cursor,
    contentLength: content.length,
    savedPath: "",
  };

  meta.savedPath = buildSlotDiskPath(filePath, store, meta);
  console.log(`[SaveSlots] writing slot #${meta.slotId} to disk: ${meta.savedPath}`);

  const [err] = await writeFile(meta.savedPath, content);
  if (err) {
    console.error(`[SaveSlots] writeFile failed for slot #${meta.slotId}:`, err);
    return null;
  }

  store.slots.push(meta);
  saveStore(filePath, store);
  console.log(`[SaveSlots] slot #${meta.slotId} created successfully — type=${type}, timestamp=${new Date(meta.timestamp).toISOString()}, contentLen=${meta.contentLength}`);
  return meta;
}

export async function deleteSaveSlot(
  filePath: string,
  slotId: number,
): Promise<boolean> {
  const store = loadStore(filePath);
  const idx = store.slots.findIndex((s) => s.slotId === slotId);
  if (idx < 0) {
    console.warn(`[SaveSlots] deleteSaveSlot — slot #${slotId} not found`);
    return false;
  }

  const removed = store.slots.splice(idx, 1)[0];
  saveStore(filePath, store);
  console.log(`[SaveSlots] slot #${slotId} deleted — type=${removed.type}, timestamp=${new Date(removed.timestamp).toISOString()}`);
  return true;
}

export async function loadSaveSlotContent(slotPath: string): Promise<string | null> {
  const [err, result] = await readFile(slotPath);
  if (err || !result) return null;
  return result.content;
}

export function clearAllSaveSlots(filePath: string): void {
  try {
    const key = getStorageKey(filePath);
    localStorage.removeItem(key);
    console.log(`[SaveSlots] cleared all save slots for: ${filePath}`);
  } catch {
    // silently fail
  }
}

export async function loadSaveSlot(
  filePath: string,
  slotId: number,
): Promise<{ content: string | null; meta: SaveSlotMeta | null }> {
  const store = loadStore(filePath);
  const meta = store.slots.find((s) => s.slotId === slotId);
  if (!meta) {
    console.warn(`[SaveSlots] loadSaveSlot — slot #${slotId} not found`);
    return { content: null, meta: null };
  }

  console.log(`[SaveSlots] loading slot #${slotId} — path: ${meta.savedPath}`);
  const content = await loadSaveSlotContent(meta.savedPath);
  if (content === null) {
    console.warn(`[SaveSlots] loadSaveSlot — failed to read slot #${slotId} from disk`);
  } else {
    console.log(`[SaveSlots] slot #${slotId} loaded — contentLen=${content.length}`);
  }
  return { content, meta };
}
