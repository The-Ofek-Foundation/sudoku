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
		const boardStr = board
			.map((row) => row.map((cell) => cell.value || '.').join(''))
			.join('');

		// Sudoku solver from https://github.com/einaregilsson/sudoku.js
		// The library has been modified to be used as an ES module.
		const solution = sudoku.solve(boardStr);

		if (solution === false) {
			errorMessage = 'This puzzle has no solution.';
		} else if (!sudoku.isUnique(boardStr)) {
			errorMessage = 'This puzzle has multiple solutions.';
		} else {
			errorMessage = null;
			gamePhase = 'solving';
			for (let i = 0; i < 9; i++) {
				for (let j = 0; j < 9; j++) {
					if (board[i][j].value !== null) {
						board[i][j].isInitial = true;
					} else {
						board[i][j].notes = new Set(
							Array.from({ length: 9 }, (_, i) => i + 1),
						);
					}
				}
			}
			saveToHistory();
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
	<SudokuGrid bind:board bind:selectedCell {gamePhase} />

	{#if errorMessage}
		<div class="error-message">{errorMessage}</div>
	{/if}

	<Controls
		bind:inputMode
		{gamePhase}
		on:startGame={startGame}
		on:handleDelete={handleDelete}
		on:undo={undo}
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
		justify-content: space-between;
		height: 100vh;
		padding: 1rem;
		box-sizing: border-box;
	}

	.error-message {
		color: red;
		margin-top: 1rem;
	}
</style>
