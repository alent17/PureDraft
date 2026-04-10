<script>
  let { children } = $props();
  
  let sidebarOpen = $state(true);
</script>

<div class="app-container">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.4.6-1.2.8-1.8.4-4.9-3-11.1-3.7-16.5-2-1.2.4-2.5-.2-2.9-1.4-.4-1.2.2-2.5 1.4-2.9 6.5-2.1 13.8-1.3 19.5 2.2.6.4.8 1.2.3 1.7zm2.2-4.1c-.5.8-1.5 1-2.3.5-5.6-3.4-14.1-4.4-20.6-2.3-1.4.5-2.9-.3-3.3-1.7-.5-1.4.3-2.9 1.7-3.3 7.8-2.5 17.4-1.4 24.2 2.7.8.5 1 1.5.5 2.3zm.1-4.4c-6.5-3.9-17.3-4.3-23.5-2.3-1.6.5-3.4-.4-3.9-2-.5-1.6.4-3.4 2-3.9 7.4-2.3 19.5-1.9 27.3 2.8 1.4.9 1.9 2.7 1 4.1-.8 1.4-2.6 1.9-4.1 1z"/>
        </svg>
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
