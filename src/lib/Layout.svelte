<script>
  let { children } = $props();
  
  let sidebarOpen = $state(true);
</script>

<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-text">PureDraft</span>
      </div>
    </div>
    
    <nav class="sidebar-nav">
      <a href="/" class="nav-item active">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 3L4 9v12h5v-7h6v7h5V9z"/>
        </svg>
        <span>首页</span>
      </a>
    </nav>
  </aside>
  
  <main class="main-content">
    {@render children()}
  </main>
</div>

<style>
  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  .sidebar {
    width: 240px;
    background-color: var(--bg-base);
    padding: var(--space-24);
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--bg-surface-hover);
  }
  
  .sidebar-header {
    margin-bottom: var(--space-32);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    color: var(--brand-green);
  }
  
  .logo-text {
    font-family: var(--font-title);
    font-size: var(--text-feature);
    font-weight: var(--weight-bold);
    color: var(--text-base);
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: var(--space-12);
    border-radius: var(--radius-full-pill);
    color: var(--text-secondary);
    font-family: var(--font-ui);
    font-size: var(--text-caption);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-button);
    transition: all var(--transition-fast);
  }
  
  .nav-item:hover {
    color: var(--text-base);
    background-color: var(--bg-surface-hover);
  }
  
  .nav-item.active {
    color: var(--text-base);
    background-color: var(--bg-surface-hover);
  }
  
  .main-content {
    flex: 1;
    overflow: hidden;
    background-color: var(--bg-base);
  }
</style>
