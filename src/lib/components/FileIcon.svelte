<script lang="ts">
  import type { FileType } from '$lib/types';

  let { fileType, size = 20 }: { fileType: FileType; size?: number } = $props();

  const iconColors: Record<string, string> = {
    markdown: 'var(--color-text-secondary)',
    javascript: '#f0db4f',
    typescript: '#3178c6',
    jsx: '#61dafb',
    tsx: '#3178c6',
    css: '#264de4',
    html: '#e44d26',
    json: '#5b5b5b',
    python: '#3776ab',
    rust: '#dea584',
    go: '#00add8',
    java: '#f89820',
    c: '#555555',
    cpp: '#f34b7d',
    shell: '#89e051',
    yaml: '#cb171e',
    toml: '#9c4221',
    xml: '#e44d26',
    txt: 'var(--color-slate)',
  };

  const iconLabels: Record<string, string> = {
    javascript: 'JS',
    typescript: 'TS',
    jsx: 'JSX',
    tsx: 'TSX',
    python: 'PY',
    rust: 'RS',
    go: 'GO',
    java: 'JV',
    c: 'C',
    cpp: 'C+',
    shell: '>_',
    css: '{}',
    json: '{}',
  };

  let color = $derived(iconColors[fileType] || 'var(--color-slate)');
  let label = $derived(iconLabels[fileType] || '');
  let isSimpleIcon = $derived(['markdown', 'yaml', 'toml', 'xml', 'txt'].includes(fileType));
  let isCodeIcon = $derived(['javascript', 'typescript', 'jsx', 'tsx', 'python', 'rust', 'go', 'java', 'c', 'cpp', 'shell'].includes(fileType));
  let isDataIcon = $derived(['css', 'json', 'html'].includes(fileType));
</script>

<svg class="file-icon" width={size} height={size} viewBox="0 0 24 24" fill="none">
  <rect x="3" y="2" width="18" height="20" rx="2" stroke={color} stroke-width="1.5"/>
  {#if isSimpleIcon}
    <line x1="7" y1="8" x2="17" y2="8" stroke={color} stroke-width="1"/>
    <line x1="7" y1="12" x2="14" y2="12" stroke={color} stroke-width="1"/>
    <line x1="7" y1="16" x2="11" y2="16" stroke={color} stroke-width="1"/>
  {:else if isCodeIcon || isDataIcon}
    <text x="50%" y="16" text-anchor="middle" font-size="9" font-weight="bold" fill={color} font-family="monospace">{label}</text>
  {:else}
    <line x1="7" y1="10" x2="17" y2="10" stroke={color} stroke-width="1"/>
    <line x1="7" y1="14" x2="14" y2="14" stroke={color} stroke-width="1"/>
  {/if}
</svg>

<style>
  .file-icon {
    flex-shrink: 0;
  }
</style>
