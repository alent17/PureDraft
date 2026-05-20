export interface ScrollState {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface HorizontalScrollState {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

export interface SyncConfig {
  enabled: boolean;
  ratio: number;
  throttleMs: number;
}

export type SyncSource = 'editor' | 'preview' | 'hover' | 'none';

const DEFAULT_CONFIG: SyncConfig = {
  enabled: true,
  ratio: 1,
  throttleMs: 0,
};

export function computeRatio(
  scrollTop: number,
  state: Pick<ScrollState, 'scrollHeight' | 'clientHeight'>,
): number {
  const maxScroll = state.scrollHeight - state.clientHeight;
  if (maxScroll <= 0) return 0;
  return Math.max(0, Math.min(1, scrollTop / maxScroll));
}

export function clampScrollTop(ratio: number, state: ScrollState): number {
  const maxScroll = state.scrollHeight - state.clientHeight;
  if (maxScroll <= 0) return 0;
  return Math.max(0, Math.min(maxScroll, ratio * maxScroll));
}

export function clampScrollLeft(ratio: number, state: HorizontalScrollState): number {
  const maxScroll = state.scrollWidth - state.clientWidth;
  if (maxScroll <= 0) return 0;
  return Math.max(0, Math.min(maxScroll, ratio * maxScroll));
}

export class ScrollSyncEngine {
  private config: SyncConfig;
  private activeSource: SyncSource = 'none';
  private lockTimer: number | null = null;

  constructor(config?: Partial<SyncConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config, throttleMs: 0 };
  }

  updateConfig(partial: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getConfig(): Readonly<SyncConfig> {
    return this.config;
  }

  reset(): void {
    this.activeSource = 'none';
    if (this.lockTimer !== null) {
      window.clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  onEditorScroll(state: ScrollState): number | null {
    if (!this.config.enabled) return null;
    if (!this.shouldSync('editor')) return null;

    const maxScroll = state.scrollHeight - state.clientHeight;
    if (maxScroll <= 0) {
      return null;
    }

    const ratio = computeRatio(state.scrollTop, state);
    const adjustedRatio = Math.min(1, ratio * this.config.ratio);

    return adjustedRatio;
  }

  onPreviewScroll(state: ScrollState): number | null {
    if (!this.config.enabled) return null;
    if (!this.shouldSync('preview')) return null;

    const maxScroll = state.scrollHeight - state.clientHeight;
    if (maxScroll <= 0) {
      return null;
    }

    const ratio = computeRatio(state.scrollTop, state);
    const adjustedRatio = Math.min(1, ratio / this.config.ratio);

    return adjustedRatio;
  }

  onHoverScroll(state: ScrollState): number | null {
    if (!this.config.enabled) return null;
    if (!this.shouldSync('hover')) return null;

    const maxScroll = state.scrollHeight - state.clientHeight;
    if (maxScroll <= 0) {
      return null;
    }

    const ratio = computeRatio(state.scrollTop, state);
    const adjustedRatio = Math.min(1, ratio / this.config.ratio);

    return adjustedRatio;
  }

  onEditorScrollH(state: HorizontalScrollState): number | null {
    if (!this.config.enabled) return null;
    if (!this.shouldSync('editor')) return null;

    const maxScroll = state.scrollWidth - state.clientWidth;
    if (maxScroll <= 0) {
      return null;
    }

    return computeRatio(state.scrollLeft, {
      scrollHeight: state.scrollWidth,
      clientHeight: state.clientWidth,
    });
  }

  onPreviewScrollH(state: HorizontalScrollState): number | null {
    if (!this.config.enabled) return null;
    if (!this.shouldSync('preview')) return null;

    const maxScroll = state.scrollWidth - state.clientWidth;
    if (maxScroll <= 0) {
      return null;
    }

    return computeRatio(state.scrollLeft, {
      scrollHeight: state.scrollWidth,
      clientHeight: state.clientWidth,
    });
  }

  applyRatioToTarget(ratio: number, targetState: ScrollState): number {
    return clampScrollTop(ratio, targetState);
  }

  applyRatioToTargetH(ratio: number, targetState: HorizontalScrollState): number {
    return clampScrollLeft(ratio, targetState);
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  private shouldSync(source: SyncSource): boolean {
    if (source === 'none') return false;

    if (this.activeSource !== 'none' && this.activeSource !== source) {
      return false;
    }

    this.activeSource = source;

    if (this.lockTimer !== null) {
      window.clearTimeout(this.lockTimer);
    }

    this.lockTimer = window.setTimeout(() => {
      this.activeSource = 'none';
      this.lockTimer = null;
    }, 50);

    return true;
  }
}
