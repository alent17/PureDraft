<script>
  let { value = '', placeholder = '开始编写 Markdown...' } = $props();
  
  let editorRef;
  
  function handleInput(event) {
    value = event.target.value;
  }
</script>

<div class="editor-container">
  <textarea
    bind:this={editorRef}
    class="markdown-editor"
    {value}
    {placeholder}
    oninput={handleInput}
    spellcheck="false"
  ></textarea>
</div>

<style>
  .editor-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  .markdown-editor {
    width: 100%;
    height: 100%;
    padding: var(--space-24);
    font-family: var(--font-mono);
    font-size: var(--text-body);
    line-height: 1.5;
    color: var(--text-base);
    background-color: var(--bg-base);
    border: none;
    outline: none;
    resize: none;
  }
  
  .markdown-editor::placeholder {
    color: var(--text-secondary);
  }
</style>
