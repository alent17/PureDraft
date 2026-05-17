import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSaveSlots,
  createSaveSlot,
  deleteSaveSlot,
  loadSaveSlot,
  type SaveSlotMeta,
} from './saveSlots';

describe('SaveSlots - Core functionality', () => {
  const testFilePath = 'E:\\Test\\test.md';
  const testContent = '# Test Content\n\nThis is a test file for save slots.';

  beforeEach(() => {
    const store = { slots: [] as SaveSlotMeta[], nextSlotId: 1 };
    localStorage.setItem(`puredraft_save_slots:${testFilePath}`, JSON.stringify(store));
  });

  describe('getSaveSlots', () => {
    it('returns empty array for new file', () => {
      const slots = getSaveSlots(testFilePath);
      expect(slots).toEqual([]);
    });

    it('returns existing slots', () => {
      const store = {
        slots: [
          {
            slotId: 1,
            type: 'manual' as const,
            timestamp: Date.now(),
            description: 'Test slot',
            cursor: { line: 1, col: 1 },
            contentLength: 50,
            savedPath: 'E:\\Test\\.puredraft_saves\\slot1.md',
          },
        ],
        nextSlotId: 2,
      };
      localStorage.setItem(`puredraft_save_slots:${testFilePath}`, JSON.stringify(store));

      const slots = getSaveSlots(testFilePath);
      expect(slots).toHaveLength(1);
      expect(slots[0].slotId).toBe(1);
      expect(slots[0].type).toBe('manual');
    });
  });

  describe('createSaveSlot', () => {
    it('creates a new manual save slot', async () => {
      const slot = await createSaveSlot('manual', testFilePath, testContent, 'Test save');
      
      expect(slot).not.toBeNull();
      expect(slot!.type).toBe('manual');
      expect(slot!.description).toBe('Test save');
      expect(slot!.contentLength).toBe(testContent.length);
      expect(slot!.savedPath).toContain('.puredraft_saves');
    });

    it('creates a new auto save slot', async () => {
      const slot = await createSaveSlot('auto', testFilePath, testContent, 'Auto save');
      
      expect(slot).not.toBeNull();
      expect(slot!.type).toBe('auto');
      expect(slot!.description).toBe('Auto save');
    });

    it('increments slot ID for each new slot', async () => {
      const slot1 = await createSaveSlot('manual', testFilePath, testContent, 'Slot 1');
      const slot2 = await createSaveSlot('manual', testFilePath, testContent, 'Slot 2');
      
      expect(slot1!.slotId).toBe(1);
      expect(slot2!.slotId).toBe(2);
    });

    it('enforces FIFO limit of 5 slots per type', async () => {
      for (let i = 0; i < 7; i++) {
        await createSaveSlot('manual', testFilePath, testContent, `Slot ${i + 1}`);
      }

      const slots = getSaveSlots(testFilePath).filter(s => s.type === 'manual');
      expect(slots).toHaveLength(5);
      
      const slotIds = slots.map(s => s.slotId);
      expect(slotIds).toContain(3);
      expect(slotIds).toContain(7);
      expect(slotIds).not.toContain(1);
      expect(slotIds).not.toContain(2);
    });

    it('maintains separate limits for manual and auto slots', async () => {
      for (let i = 0; i < 5; i++) {
        await createSaveSlot('manual', testFilePath, testContent, `Manual ${i + 1}`);
        await createSaveSlot('auto', testFilePath, testContent, `Auto ${i + 1}`);
      }

      const manualSlots = getSaveSlots(testFilePath).filter(s => s.type === 'manual');
      const autoSlots = getSaveSlots(testFilePath).filter(s => s.type === 'auto');

      expect(manualSlots).toHaveLength(5);
      expect(autoSlots).toHaveLength(5);
    });
  });

  describe('deleteSaveSlot', () => {
    it('removes a save slot', async () => {
      const slot = await createSaveSlot('manual', testFilePath, testContent, 'To delete');
      const slots = getSaveSlots(testFilePath);
      expect(slots).toHaveLength(1);

      const result = await deleteSaveSlot(testFilePath, slot!.slotId);
      expect(result).toBe(true);

      const remainingSlots = getSaveSlots(testFilePath);
      expect(remainingSlots).toHaveLength(0);
    });

    it('returns false for non-existent slot', async () => {
      const result = await deleteSaveSlot(testFilePath, 999);
      expect(result).toBe(false);
    });
  });

  describe('loadSaveSlot', () => {
    it('returns null for non-existent slot', async () => {
      const result = await loadSaveSlot(testFilePath, 999);
      expect(result.content).toBeNull();
      expect(result.meta).toBeNull();
    });
  });

  describe('slot metadata', () => {
    it('captures cursor position', async () => {
      const cursor = { line: 10, col: 25 };
      const slot = await createSaveSlot('manual', testFilePath, testContent, 'With cursor', cursor);
      
      expect(slot!.cursor).toEqual(cursor);
    });

    it('captures content length', async () => {
      const slot = await createSaveSlot('manual', testFilePath, testContent, 'Content check');
      
      expect(slot!.contentLength).toBe(testContent.length);
    });

    it('sets correct timestamp', async () => {
      const before = Date.now();
      const slot = await createSaveSlot('manual', testFilePath, testContent, 'Timestamp check');
      const after = Date.now();
      
      expect(slot!.timestamp).toBeGreaterThanOrEqual(before);
      expect(slot!.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
