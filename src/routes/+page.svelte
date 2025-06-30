<script lang="ts">
  import Cell from '$lib/Cell.svelte';
  import '../app.css';

  type CellData = {
    value: number | null;
    notes: Set<number>;
  };

  let selectedCell: { row: number; col: number } | null = null;

  const board: CellData[][] = Array(9).fill(null).map(() =>
    Array(9).fill(null).map(() => ({
      value: null,
      notes: new Set(Array.from({ length: 9 }, (_, i) => i + 1))
    }))
  );

  board[0][0].value = 5;
  board[0][0].notes.clear();

  function selectCell(row: number, col: number) {
    selectedCell = { row, col };
  }

  function isHighlighted(row: number, col: number) {
    if (!selectedCell) return false;

    const { row: selectedRow, col: selectedCol } = selectedCell;

    // Highlight the selected row and column
    if (row === selectedRow || col === selectedCol) {
      return true;
    }

    // Highlight the 3x3 subgrid
    const startRow = Math.floor(selectedRow / 3) * 3;
    const startCol = Math.floor(selectedCol / 3) * 3;
    return (
      row >= startRow &&
      row < startRow + 3 &&
      col >= startCol &&
      col < startCol + 3
    );
  }
</script>

<main>
  <div class="grid-container">
    <div class="grid">
      {#each board as row, i}
        {#each row as cell, j}
          <div
            class="cell-wrapper"
            class:right-border={(j + 1) % 3 === 0 && j < 8}
            class:bottom-border={(i + 1) % 3 === 0 && i < 8}
            class:selected={selectedCell && selectedCell.row === i && selectedCell.col === j}
            class:highlighted={isHighlighted(i, j)}
            on:click={() => selectCell(i, j)}
          >
            <Cell value={cell.value} notes={cell.notes} />
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <div class="control-bar">
    <div class="actions-row">
      <button class="action-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><polyline points="9 14 4 9 9 4"></polyline><path
            d="M20 20v-7a4 4 0 0 0-4-4H4"
          ></path></svg
        >
        <span>Undo</span>
      </button>
    </div>

    <div class="number-palette">
      {#each Array(9) as _, i}
        <button class="number-button">{i + 1}</button>
      {/each}
    </div>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    min-height: 100vh;
    padding: 1rem;
    box-sizing: border-box;
  }

  .grid-container {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(9, 1fr);
    width: 95vmin;
    height: 95vmin;
    max-width: 600px;
    max-height: 600px;
    border: 3px solid #343a40;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .cell-wrapper {
    position: relative;
    cursor: pointer;
    transition: background-color 0.1s ease-in-out;
  }

  .cell-wrapper.selected {
    background-color: #e6e6fa;
  }

  .cell-wrapper.highlighted {
    background-color: #f0f0f0;
  }

  .right-border {
    border-right: 2px solid #343a40;
  }

  .bottom-border {
    border-bottom: 2px solid #343a40;
  }

  .control-bar {
    background-color: #ffffff;
    padding: 0.75rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 600px; /* Match the grid */
    box-sizing: border-box;
    margin-top: 1rem; /* Reduced from 1rem */
  }

  .actions-row {
    display: flex;
    justify-content: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem; /* Reduced from 1rem */
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    background-color: #fff;
    color: #495057;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
  }

  .action-button:hover {
    background-color: #f8f9fa;
    border-color: #ced4da;
  }

  .action-button svg {
    width: 1.1em;
    height: 1.1em;
  }

  .number-palette {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 0.375rem; /* Reduced from 0.5rem */
  }

  .number-button {
    padding: 0.5rem 0; /* Reduced padding */
    font-size: 1.8rem; /* Increased font size */
    border: none;
    background-color: #e9ecef;
    color: #495057;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .number-button:hover {
    background-color: #ced4da;
    color: #212529;
  }
</style>

