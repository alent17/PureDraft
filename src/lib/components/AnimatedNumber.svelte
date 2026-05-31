<script lang="ts">
  let { value, duration = 200 }: { value: number; duration?: number } = $props();

  let displayValue = $state(value);
  let direction = $state<'up' | 'down'>('up');
  let animating = $state(false);

  $effect(() => {
    if (value === displayValue) return;
    direction = value > displayValue ? 'up' : 'down';
    animating = true;
    displayValue = value;
    setTimeout(() => {
      animating = false;
    }, duration);
  });
</script>

<span class="animated-number" class:animating class:up={direction === 'up'} class:down={direction === 'down'}>
  {displayValue}
</span>

<style>
  .animated-number {
    display: inline-block;
    transition: transform 200ms ease-out, opacity 200ms ease-out;
  }

  .animated-number.animating.up {
    animation: slideUp 200ms ease-out;
  }

  .animated-number.animating.down {
    animation: slideDown 200ms ease-out;
  }

  @keyframes slideUp {
    0% {
      transform: translateY(100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideDown {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
