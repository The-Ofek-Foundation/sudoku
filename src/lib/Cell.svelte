<script lang="ts">
  export let value: number | null = null;
</script>

<div class="cell">
  {#if value}
    <span class="value">{value}</span>
  {/if}
</div>

<style>
  .cell {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #ccc;
    box-sizing: border-box;
    position: relative;
  }

  .value {
    font-size: 3em; /* Increased from 2.5em */
  }
</style>
