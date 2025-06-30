<script lang="ts">
  export let value: number | null = null;
  export let notes: Set<number> = new Set();
  export let gamePhase: 'configuring' | 'solving' = 'configuring';
</script>

<div class="cell">
  {#if value}
    <span class="value">{value}</span>
  {:else if gamePhase === 'solving'}
    <div class="notes-grid">
      {#each Array(9) as _, i}
        <div class="note-cell">
          {#if notes.has(i + 1)}
            {i + 1}
          {/if}
        </div>
      {/each}
    </div>
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

  .notes-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 100%;
    height: 100%;
    position: absolute;
  }

  .note-cell {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.8em; /* Increased from 0.6em */
    color: #adb5bd; /* Lighter gray for notes */
  }
</style>
