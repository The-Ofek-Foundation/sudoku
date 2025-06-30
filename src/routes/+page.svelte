<script lang="ts">
  import Cell from '$lib/Cell.svelte';
  import '../app.css';
  import { onMount } from 'svelte';
  import sudoku from '$lib/sudoku/sudoku.js';

  // Sudoku solver from https://github.com/einaregilsson/sudoku.js
  // The library has been modified to be used as an ES module.

  type CellData = {
    value: number | null;
    notes: Set<number>;
    isInitial: boolean;
  };

  let selectedCell: { row: number; col: number } | null = null;
  let gamePhase: 'configuring' | 'solving' = 'configuring';
  let inputMode: 'normal' | 'note' = 'normal';
  let errorMessage: string | null = null;
  let history: CellData[][][] = [];

  let board: CellData[][] = Array(9).fill(null).map(() =>
    Array(9).fill(null).map(() => ({
      value: null,
      notes: new Set<number>(),
      isInitial: false
    }))
  );

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

  function handleInput(num: number) {
    if (selectedCell) {
      const { row, col } = selectedCell;
      if (gamePhase === 'configuring') {
        board[row][col].value = num;
      } else if (inputMode === 'normal' && !board[row][col].isInitial) {
        saveToHistory();
        board[row][col].value = num;
        board[row][col].notes.clear();
      } else if (inputMode === 'note' && !board[row][col].isInitial) {
        saveToHistory();
        if (board[row][col].notes.has(num)) {
          board[row][col].notes.delete(num);
        } else {
          board[row][col].notes.add(num);
        }
      }
      // Trigger reactivity
      board = board;
    }
  }

  function handleDelete() {
    if (selectedCell && gamePhase === 'configuring') {
      const { row, col } = selectedCell;
      board[row][col].value = null;
      // Trigger reactivity
      board = board;
    }
  }

  function startGame() {
    const boardStr = board.map(row => row.map(cell => cell.value || '.').join('')).join('');
    
    // Sudoku solver from https://github.com/einaregilsson/sudoku.js
    // The library has been modified to be used as an ES module.
    const solution = sudoku.solve(boardStr);

    if (solution === false) {
      errorMessage = "This puzzle has no solution.";
    } else {
      const solutions = [];
      const currentBoard = board.map(row => row.map(cell => cell.value));

      function solve() {
        const emptyCell = findEmptyCell(currentBoard);
        if (!emptyCell) {
          solutions.push(currentBoard.map(row => row.slice()));
          return;
        }

        const [row, col] = emptyCell;
        for (let num = 1; num <= 9; num++) {
          if (isValidMove(currentBoard, row, col, num)) {
            currentBoard[row][col] = num;
            solve();
            currentBoard[row][col] = null;
            if (solutions.length > 1) {
              return;
            }
          }
        }
      }

      solve();

      if (solutions.length > 1) {
        errorMessage = "This puzzle has multiple solutions.";
      } else {
        errorMessage = null;
        gamePhase = 'solving';
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (board[i][j].value !== null) {
              board[i][j].isInitial = true;
            } else {
              board[i][j].notes = new Set(Array.from({ length: 9 }, (_, i) => i + 1));
            }
          }
        }
        saveToHistory();
      }
    }
  }

  function saveToHistory() {
    history.push(JSON.parse(JSON.stringify(board)));
  }

  function undo() {
    if (history.length > 0) {
      board = history.pop();
    }
  }

  function findEmptyCell(board: (number | null)[][]): [number, number] | null {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === null) {
          return [i, j];
        }
      }
    }
    return null;
  }

  function isValidMove(board: (number | null)[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) {
        return false;
      }
    }

    // Check column
    for (let i = 0; i < 9; i++) {
      if (board[i][col] === num) {
        return false;
      }
    }

    // Check 3x3 subgrid
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[startRow + i][startCol + j] === num) {
          return false;
        }
      }
    }

    return true;
  }


  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const num = parseInt(event.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        handleInput(num);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        handleDelete();
      } else if (event.key === 'p') {
        const puzzle = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            const char = puzzle[i * 9 + j];
            board[i][j].value = char === '.' ? null : parseInt(char);
          }
        }
        board = board;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<main>
  <div class="grid-container">
    <div class="grid">
      {#each board as row, i}
        {#each row as cell, j}
          <button
            class="cell-wrapper"
            class:right-border={(j + 1) % 3 === 0 && j < 8}
            class:bottom-border={(i + 1) % 3 === 0 && i < 8}
            class:selected={selectedCell && selectedCell.row === i && selectedCell.col === j}
            class:highlighted={isHighlighted(i, j)}
            on:click={() => selectCell(i, j)}
          >
            <Cell value={cell.value} notes={cell.notes} {gamePhase} />
          </button>
        {/each}
      {/each}
    </div>
  </div>

  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {/if}

  <div class="control-bar">
    <div class="actions-row">
      {#if gamePhase === 'configuring'}
        <button class="action-button" on:click={startGame}>
          <span>Start Game</span>
        </button>
        <button class="action-button" on:click={handleDelete}>
          <span>Delete</span>
        </button>
      {:else}
        <button class="action-button" on:click={() => inputMode = 'normal'}>
          <span>Normal</span>
        </button>
        <button class="action-button" on:click={() => inputMode = 'note'}>
          <span>Note</span>
        </button>
        <button class="action-button" on:click={undo}>
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
      {/if}
    </div>

    <div class="number-palette">
      {#each Array(9) as _, i}
        <button class="number-button" on:click={() => handleInput(i + 1)}>{i + 1}</button>
      {/each}
    </div>
  </div>
</main>

<style>
  :global(body, html) {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 100vh;
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
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    outline: none;
  }

  .cell-wrapper.highlighted {
    background-color: #e8e8f2;
  }

  .cell-wrapper.selected {
    background-color: #d8d8e8;
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
    gap: 0.375rem; /* Reduced from 1rem */
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

  .error-message {
    color: red;
    margin-top: 1rem;
  }
</style>



