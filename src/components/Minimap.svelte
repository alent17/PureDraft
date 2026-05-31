<script lang="ts">
  let {
    content,
    scrollTop = 0,
    scrollHeight = 0,
    clientHeight = 0,
    onNavigate,
  }: {
    content: string;
    scrollTop?: number;
    scrollHeight?: number;
    clientHeight?: number;
    onNavigate?: (ratio: number) => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let container: HTMLDivElement | undefined = $state();
  let isDragging = $state(false);

  const MINIMAP_WIDTH = 80;
  const CHAR_WIDTH = 1.5;
  const LINE_HEIGHT = 3;

  let viewportRatio = $derived(clientHeight > 0 && scrollHeight > 0 ? clientHeight / scrollHeight : 1);
  let viewportTop = $derived(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
  let viewportHeight = $derived(Math.min(viewportRatio * 100, 100));

  let renderFrame: number | undefined;

  function render() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = content.split('\n');
    const totalHeight = lines.length * LINE_HEIGHT;

    canvas.width = MINIMAP_WIDTH;
    canvas.height = Math.max(totalHeight, 100);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-editor-bg').trim() || '#1f1f1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-editor-text').trim() || '#d4d4d4';
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.4;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const y = i * LINE_HEIGHT;
      const width = Math.min(line.length * CHAR_WIDTH, MINIMAP_WIDTH - 4);

      if (line.trim().startsWith('#')) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#60cdff';
        ctx.globalAlpha = 0.6;
      } else if (line.trim().startsWith('```')) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#b0d6ff';
        ctx.globalAlpha = 0.3;
      } else {
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.4;
      }

      if (width > 0) {
        ctx.fillRect(2, y, width, LINE_HEIGHT - 1);
      }
    }

    ctx.globalAlpha = 1;
  }

  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    navigateTo(e);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    navigateTo(e);
  }

  function handleMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  function navigateTo(e: MouseEvent) {
    if (!container || !onNavigate) return;
    const rect = container.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onNavigate(ratio);
  }

  $effect(() => {
    content;
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = requestAnimationFrame(render);
    return () => {
      if (renderFrame) cancelAnimationFrame(renderFrame);
    };
  });
</script>

<div class="minimap" bind:this={container} onmousedown={handleMouseDown} role="presentation">
  <canvas bind:this={canvas}></canvas>
  <div
    class="viewport"
    style="top: {viewportTop}%; height: {viewportHeight}%;"
  ></div>
</div>

<style>
  .minimap {
    position: relative;
    width: 80px;
    height: 100%;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
    background: var(--color-editor-bg);
    border-left: 1px solid var(--color-border-subtle);
  }

  canvas {
    display: block;
    width: 100%;
    height: auto;
  }

  .viewport {
    position: absolute;
    left: 0;
    right: 0;
    background: var(--color-accent);
    opacity: 0.15;
    pointer-events: none;
    border-radius: 2px;
    transition: top 50ms ease-out;
  }
</style>
