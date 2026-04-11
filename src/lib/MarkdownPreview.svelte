<script>
  import { marked } from 'marked';
  
  let { content = '' } = $props();
  
  // 使用 $effect 确保响应式更新
  let htmlContent = $state('');
  
  $effect(() => {
    try {
      htmlContent = marked.parse(content || '');
    } catch (error) {
      console.error('Markdown parsing error:', error);
      htmlContent = '<p>Error parsing markdown</p>';
    }
  });
</script>

<div class="preview-container">
  <div class="markdown-preview">{@html htmlContent}</div>
</div>

<style>
  .preview-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: var(--space-24);
    background-color: var(--bg-base);
  }
  
  .markdown-preview {
    max-width: 900px;
    margin: 0 auto;
  }
  
  .markdown-preview :global(h1) {
    font-size: var(--text-section);
    font-weight: var(--weight-bold);
    margin-bottom: var(--space-24);
    padding-bottom: var(--space-16);
    border-bottom: 1px solid var(--border-button);
  }
  
  .markdown-preview :global(h2) {
    font-size: var(--text-feature);
    font-weight: var(--weight-semibold);
    margin-top: var(--space-32);
    margin-bottom: var(--space-16);
  }
  
  .markdown-preview :global(p) {
    margin-bottom: var(--space-16);
    line-height: 1.5;
    color: var(--text-secondary);
  }
  
  .markdown-preview :global(a) {
    color: var(--brand-green);
  }
  
  .markdown-preview :global(code) {
    font-family: var(--font-mono);
    font-size: var(--text-body);
    background-color: var(--bg-surface-hover);
    padding: var(--space-4) var(--space-8);
    border-radius: var(--radius-standard);
    color: var(--text-base);
  }
  
  .markdown-preview :global(pre) {
    background-color: var(--bg-surface);
    padding: var(--space-16);
    border-radius: var(--radius-comfortable);
    overflow-x: auto;
    margin-bottom: var(--space-16);
  }
  
  .markdown-preview :global(pre code) {
    background: transparent;
    padding: 0;
  }
  
  .markdown-preview :global(blockquote) {
    border-left: 4px solid var(--brand-green);
    margin: var(--space-16) 0;
    padding: var(--space-8) var(--space-16);
    background-color: var(--bg-surface-hover);
    border-radius: var(--radius-standard);
    color: var(--text-secondary);
  }
  
  .markdown-preview :global(ul),
  .markdown-preview :global(ol) {
    margin-bottom: var(--space-16);
  }
  
  .markdown-preview :global(li) {
    color: var(--text-secondary);
  }
  
  .markdown-preview :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--space-16);
  }
  
  .markdown-preview :global(img) {
    max-width: 100%;
    border-radius: var(--radius-standard);
    margin: var(--space-16) 0;
  }
  
  .markdown-preview :global(hr) {
    border: none;
    border-top: 1px solid var(--border-separator);
    margin: var(--space-24) 0;
  }
</style>
