<script lang="ts">
	import SudokuGrid from '$lib/SudokuGrid.svelte';
	import Controls from '$lib/Controls.svelte';
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
	let solution: { [key: string]: string } | null = null;
	let errorCell: { row: number; col: number } | null = null;
	let highlightedNumber: number | null = null;
	let colorKuMode: boolean = false;
	let difficulty: 'easy' | 'medium' | 'hard' = 'easy';

	let board: CellData[][] = Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => ({
					value: null,
					notes: new Set<number>(),
					isInitial: false,
				})),
		);

	function updateHighlightedNumber(row: number, col: number) {
		const cellValue = board[row][col].value;
		highlightedNumber = cellValue;
	}

	function getPossibleNumbers(row: number, col: number): Set<number> {
		const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		const subgridRow = Math.floor(row / 3) * 3;
		const subgridCol = Math.floor(col / 3) * 3;

		// Remove numbers that exist in the same row
		for (let i = 0; i < 9; i++) {
			if (board[row][i].value !== null) {
				possible.delete(board[row][i].value!);
			}
		}

		// Remove numbers that exist in the same column
		for (let i = 0; i < 9; i++) {
			if (board[i][col].value !== null) {
				possible.delete(board[i][col].value!);
			}
		}

		// Remove numbers that exist in the same 3x3 subgrid
		for (let i = subgridRow; i < subgridRow + 3; i++) {
			for (let j = subgridCol; j < subgridCol + 3; j++) {
				if (board[i][j].value !== null) {
					possible.delete(board[i][j].value!);
				}
			}
		}

		return possible;
	}

	function isCorrectPlacement(row: number, col: number, num: number): boolean {
		if (!solution) return true; // If no solution stored, can't verify
		
		// Convert row/col to sudoku library format (A1-I9)
		const rows = 'ABCDEFGHI';
		const cols = '123456789';
		const square = rows[row] + cols[col];
		
		return solution[square] === num.toString();
	}

	function updateNotesAfterPlacement(row: number, col: number, num: number) {
		// Remove the placed number from notes in the same row, column, and 3x3 subgrid
		const subgridRow = Math.floor(row / 3) * 3;
		const subgridCol = Math.floor(col / 3) * 3;

		for (let i = 0; i < 9; i++) {
			// Remove from same row
			if (i !== col && !board[row][i].isInitial) {
				board[row][i].notes.delete(num);
			}
			
			// Remove from same column
			if (i !== row && !board[i][col].isInitial) {
				board[i][col].notes.delete(num);
			}
		}

		// Remove from same 3x3 subgrid
		for (let i = subgridRow; i < subgridRow + 3; i++) {
			for (let j = subgridCol; j < subgridCol + 3; j++) {
				if ((i !== row || j !== col) && !board[i][j].isInitial) {
					board[i][j].notes.delete(num);
				}
			}
		}
	}

	function handleInput(num: number) {
		// If there's an error, don't allow any input until undo is pressed
		if (errorCell) return;
		
		if (selectedCell) {
			const { row, col } = selectedCell;
			if (gamePhase === 'configuring') {
				board[row][col].value = num;
				// Trigger reactivity
				board = board;
			} else if (inputMode === 'normal' && !board[row][col].isInitial) {
				// Only allow input if cell is empty
				if (board[row][col].value === null) {
					saveToHistory();
					board[row][col].value = num;
					board[row][col].notes.clear();
					
					// Check if the placement is correct
					if (!isCorrectPlacement(row, col, num)) {
						errorCell = { row, col };
					} else {
						// Automatically update notes in related cells only if correct
						updateNotesAfterPlacement(row, col, num);
					}
					// Trigger reactivity
					board = board;
				} else {
					// Cell already has a value - deselect it but highlight the number
					selectedCell = null;
					highlightedNumber = num;
				}
			} else if (inputMode === 'note' && !board[row][col].isInitial) {
				saveToHistory();
				if (board[row][col].notes.has(num)) {
					board[row][col].notes.delete(num);
				} else {
					board[row][col].notes.add(num);
				}
				// Trigger reactivity
				board = board;
			} else {
				// Cell is initial or can't be modified - deselect and highlight the number
				selectedCell = null;
				highlightedNumber = num;
			}
		} else {
			// No cell selected - just highlight the number
			highlightedNumber = num;
		}
	}

	function handleDelete() {
		// Only allow deletion during configuration phase
		if (selectedCell && gamePhase === 'configuring') {
			const { row, col } = selectedCell;
			board[row][col].value = null;
			// Trigger reactivity
			board = board;
		}
	}

	function startGame() {
		const boardStr = board
			.map((row) => row.map((cell) => cell.value || '.').join(''))
			.join('');

		// Sudoku solver from https://github.com/einaregilsson/sudoku.js
		// The library has been modified to be used as an ES module.
		const solutionResult = sudoku.solve(boardStr);

		if (solutionResult === false) {
			errorMessage = 'This puzzle has no solution.';
		} else if (!sudoku.isUnique(boardStr)) {
			errorMessage = 'This puzzle has multiple solutions.';
		} else {
			errorMessage = null;
			solution = solutionResult; // Store the solution for verification
			gamePhase = 'solving';
			for (let i = 0; i < 9; i++) {
				for (let j = 0; j < 9; j++) {
					if (board[i][j].value !== null) {
						board[i][j].isInitial = true;
					} else {
						board[i][j].notes = getPossibleNumbers(i, j);
					}
				}
			}
			saveToHistory();
		}
	}

	function saveToHistory() {
		const newBoard = board.map((row) =>
			row.map((cell) => ({
				...cell,
				notes: new Set(cell.notes),
			})),
		);
		history.push(newBoard);
	}

	function generatePuzzle() {
		// Clear the current board
		board = Array(9)
			.fill(null)
			.map(() =>
				Array(9)
					.fill(null)
					.map(() => ({
						value: null,
						notes: new Set<number>(),
						isInitial: false,
					})),
			);

		// Generate a new puzzle using the sudoku library
		const generatedPuzzle = sudoku.generate(difficulty);
		
		// Convert the generated puzzle to our board format
		const rows = 'ABCDEFGHI';
		const cols = '123456789';
		
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				const square = rows[i] + cols[j];
				if (generatedPuzzle[square]) {
					board[i][j].value = parseInt(generatedPuzzle[square]);
				}
			}
		}
		
		// Trigger reactivity
		board = board;
		errorMessage = null;
	}

	function undo() {
		if (history.length > 0) {
			const lastBoard = history.pop();
			if (lastBoard) {
				board = lastBoard.map((row) =>
					row.map((cell) => ({
						...cell,
						notes: new Set(cell.notes),
					})),
				);
				// Clear error state when undoing
				errorCell = null;
			}
		}
	}

	onMount(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const num = parseInt(event.key);
			if (!isNaN(num) && num >= 1 && num <= 9) {
				handleInput(num);
			} else if (event.key === 'Delete' || event.key === 'Backspace') {
				handleDelete();
			} else if (event.key === 'p') {
				const puzzle =
					'53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
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
	<SudokuGrid 
		bind:board 
		bind:selectedCell 
		{gamePhase} 
		{errorCell} 
		{highlightedNumber}
		{colorKuMode}
		on:cellSelected={(e) => updateHighlightedNumber(e.detail.row, e.detail.col)}
	/>

	{#if errorMessage}
		<div class="error-message">{errorMessage}</div>
	{/if}

	<Controls
		bind:inputMode
		bind:colorKuMode
		bind:difficulty
		{gamePhase}
		{errorCell}
		on:startGame={startGame}
		on:handleDelete={handleDelete}
		on:undo={undo}
		on:generatePuzzle={generatePuzzle}
		on:handleInput={(e) => handleInput(e.detail)}
	/>
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
		min-height: 100vh;
		min-height: 100dvh; /* Dynamic viewport height for mobile */
		padding: 1rem;
		padding-bottom: max(1rem, env(safe-area-inset-bottom)); /* Account for mobile safe areas */
		box-sizing: border-box;
		gap: 1rem;
	}

	/* Mobile-specific adjustments */
	@media (max-width: 768px) {
		main {
			padding: 0.5rem;
			padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
			gap: 0.5rem;
		}
	}

	.error-message {
		color: red;
		margin-top: 1rem;
	}
</style>
