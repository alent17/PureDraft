import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeRatio,
  clampScrollTop,
  clampScrollLeft,
  ScrollSyncEngine,
  type ScrollState,
  type HorizontalScrollState,
} from './scrollSync';

describe('computeRatio', () => {
  it('returns 0 at the top', () => {
    expect(computeRatio(0, { scrollHeight: 2000, clientHeight: 600 })).toBe(0);
  });

  it('returns 0.5 at the middle', () => {
    expect(computeRatio(700, { scrollHeight: 2000, clientHeight: 600 })).toBe(0.5);
  });

  it('returns 1 at the bottom', () => {
    expect(computeRatio(1400, { scrollHeight: 2000, clientHeight: 600 })).toBe(1);
  });

  it('returns 0 when content fits without scrolling', () => {
    expect(computeRatio(0, { scrollHeight: 500, clientHeight: 600 })).toBe(0);
    expect(computeRatio(100, { scrollHeight: 500, clientHeight: 600 })).toBe(0);
  });

  it('clamps to 0..1 range even with out-of-bounds input', () => {
    expect(computeRatio(-100, { scrollHeight: 2000, clientHeight: 600 })).toBe(0);
    expect(computeRatio(9999, { scrollHeight: 2000, clientHeight: 600 })).toBe(1);
  });

  it('returns 0 when scrollHeight equals clientHeight', () => {
    expect(computeRatio(100, { scrollHeight: 600, clientHeight: 600 })).toBe(0);
  });
});

describe('clampScrollTop', () => {
  it('maps ratio 0 to scrollTop 0', () => {
    expect(clampScrollTop(0, { scrollTop: 0, scrollHeight: 3000, clientHeight: 600 })).toBe(0);
  });

  it('maps ratio 0.5 to middle', () => {
    expect(clampScrollTop(0.5, { scrollTop: 0, scrollHeight: 3000, clientHeight: 600 })).toBe(1200);
  });

  it('maps ratio 1 to max scroll', () => {
    expect(clampScrollTop(1, { scrollTop: 0, scrollHeight: 3000, clientHeight: 600 })).toBe(2400);
  });

  it('clamps negative ratio to 0', () => {
    expect(clampScrollTop(-0.5, { scrollTop: 0, scrollHeight: 3000, clientHeight: 600 })).toBe(0);
  });

  it('clamps over-1 ratio to max', () => {
    expect(clampScrollTop(1.5, { scrollTop: 0, scrollHeight: 3000, clientHeight: 600 })).toBe(2400);
  });

  it('returns 0 when no scrolling needed', () => {
    expect(clampScrollTop(0.5, { scrollTop: 0, scrollHeight: 400, clientHeight: 600 })).toBe(0);
  });
});

describe('clampScrollLeft', () => {
  it('maps ratio 0 to scrollLeft 0', () => {
    expect(clampScrollLeft(0, { scrollLeft: 0, scrollWidth: 2000, clientWidth: 800 })).toBe(0);
  });

  it('maps ratio 0.5 to middle', () => {
    expect(clampScrollLeft(0.5, { scrollLeft: 0, scrollWidth: 2000, clientWidth: 800 })).toBe(600);
  });

  it('maps ratio 1 to max scroll', () => {
    expect(clampScrollLeft(1, { scrollLeft: 0, scrollWidth: 2000, clientWidth: 800 })).toBe(1200);
  });

  it('returns 0 when no horizontal scroll needed', () => {
    expect(clampScrollLeft(0.5, { scrollLeft: 0, scrollWidth: 600, clientWidth: 800 })).toBe(0);
  });
});

describe('ScrollSyncEngine', () => {
  let engine: ScrollSyncEngine;

  beforeEach(() => {
    engine = new ScrollSyncEngine();
  });

  const editorState: ScrollState = { scrollTop: 700, scrollHeight: 2000, clientHeight: 600 };
  const previewState: ScrollState = { scrollTop: 0, scrollHeight: 3000, clientHeight: 600 };

  describe('enabled/disabled', () => {
    it('returns null when disabled', () => {
      engine.updateConfig({ enabled: false });
      expect(engine.onEditorScroll(editorState)).toBeNull();
      expect(engine.onPreviewScroll(previewState)).toBeNull();
    });

    it('returns a value when enabled', () => {
      const result = engine.onEditorScroll(editorState);
      expect(result).toBe(0.5);
    });

    it('isEnabled reflects config', () => {
      expect(engine.isEnabled()).toBe(true);
      engine.updateConfig({ enabled: false });
      expect(engine.isEnabled()).toBe(false);
    });
  });

  describe('ratio mapping', () => {
    it('returns correct ratio for editor scroll', () => {
      engine.reset();
      const ratio = engine.onEditorScroll(editorState);
      expect(ratio).toBeCloseTo(0.5);
    });

    it('returns correct ratio for preview scroll', () => {
      engine.reset();
      const ps: ScrollState = { scrollTop: 1200, scrollHeight: 3000, clientHeight: 600 };
      const ratio = engine.onPreviewScroll(ps);
      expect(ratio).toBeCloseTo(0.5);
    });

    it('respects custom ratio config', () => {
      engine.reset();
      engine.updateConfig({ ratio: 2 });
      const ratio = engine.onEditorScroll(editorState);
      expect(ratio).toBeCloseTo(1);
    });

    it('ratio < 1 scales down correctly', () => {
      engine.reset();
      engine.updateConfig({ ratio: 0.5 });
      const ratio = engine.onEditorScroll(editorState);
      expect(ratio).toBeCloseTo(0.25);
    });
  });

  describe('anti-loop protection', () => {
    it('returns null for same source twice in a row', () => {
      const first = engine.onEditorScroll(editorState);
      expect(first).not.toBeNull();

      const second = engine.onEditorScroll(editorState);
      expect(second).toBeNull();
    });

    it('allows opposite source after sync and reset', () => {
      engine.reset();
      engine.onEditorScroll(editorState);
      engine.reset();
      const result = engine.onPreviewScroll(previewState);
      expect(result).not.toBeNull();
    });
  });

  describe('empty content', () => {
    it('returns null when no scroll range', () => {
      engine.reset();
      const noScrollState: ScrollState = { scrollTop: 0, scrollHeight: 400, clientHeight: 600 };
      expect(engine.onEditorScroll(noScrollState)).toBeNull();
    });
  });

  describe('reset', () => {
    it('clears source lock after reset', () => {
      engine.onEditorScroll(editorState);
      expect(engine.onEditorScroll(editorState)).toBeNull();

      engine.reset();

      const result = engine.onEditorScroll(editorState);
      expect(result).not.toBeNull();
    });
  });

  describe('throttle', () => {
    it('returns non-null on first call after reset', () => {
      engine.reset();
      const result = engine.onEditorScroll(editorState);
      expect(result).not.toBeNull();
    });

    it('allows call after enabling then disabling then re-enabling', () => {
      engine.updateConfig({ enabled: false });
      expect(engine.onEditorScroll(editorState)).toBeNull();
      engine.updateConfig({ enabled: true });
      engine.reset();
      const result = engine.onEditorScroll(editorState);
      expect(result).not.toBeNull();
    });
  });

  describe('horizontal sync', () => {
    it('returns correct ratio for editor horizontal scroll', () => {
      engine.reset();
      const hState: HorizontalScrollState = { scrollLeft: 600, scrollWidth: 2000, clientWidth: 800 };
      const result = engine.onEditorScrollH(hState);
      expect(result).toBeCloseTo(0.5);
    });

    it('returns null when no horizontal scroll range', () => {
      engine.reset();
      const hState: HorizontalScrollState = { scrollLeft: 0, scrollWidth: 600, clientWidth: 800 };
      expect(engine.onEditorScrollH(hState)).toBeNull();
    });
  });

  describe('applyRatioToTarget', () => {
    it('converts ratio to absolute scrollTop on target', () => {
      const targetState: ScrollState = { scrollTop: 0, scrollHeight: 5000, clientHeight: 1000 };
      expect(engine.applyRatioToTarget(0.5, targetState)).toBe(2000);
    });
  });
});
