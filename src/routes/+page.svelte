<script lang="ts">
	import SudokuGrid from '$lib/SudokuGrid.svelte';
	import Controls from '$lib/Controls.svelte';
	import '../app.css';
	import { onMount } from 'svelte';
	import { sudoku, type CellData, type GamePhase, type InputMode, type Difficulty, coordinatesToSquare, squareToCoordinates } from '$lib';

	// Sudoku solver from https://github.com/einaregilsson/sudoku.js
	// The library has been modified to be used as an ES module.

	let selectedCell: { row: number; col: number } | null = null;
	let gamePhase: GamePhase = 'configuring';
	let inputMode: InputMode = 'normal';
	let errorMessage: string | null = null;
	let history: CellData[][][] = [];
	let solution: { [key: string]: string } | null = null;
	let errorCell: { row: number; col: number } | null = null;
	let highlightedNumber: number | null = null;
	let colorKuMode: boolean = false;
	let difficulty: Difficulty = 'easy';
	let gridSize = '600px'; // Default size
	let cyclingNumber: number | null = null; // Current number when cycling with Tab

	let board: CellData[][] = Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => ({
					value: null,
					candidates: new Set<number>(),
					isInitial: false,
				})),
		);

	function updateHighlightedNumber(row: number, col: number) {
		const cellValue = board[row][col].value;
		if (cellValue !== null) {
			// Cell has a value, highlight that number
			highlightedNumber = cellValue;
			cyclingNumber = null; // Reset cycling for cells with values
		} else if ((gamePhase === 'solving' || gamePhase === 'manual') && board[row][col].candidates.size > 0) {
			// Cell has no value but has candidates during solving/manual phase - auto-start cycling
			highlightedNumber = null;
			startCycling(); // Automatically start cycling with the first available number
		} else {
			// Cell is empty with no candidates, or we're in config phase
			highlightedNumber = null;
			cyclingNumber = null;
		}
	}

	function getAvailableNumbersForCycling(): number[] {
		if (!selectedCell || (gamePhase !== 'solving' && gamePhase !== 'manual')) return [];
		
		const { row, col } = selectedCell;
		const cell = board[row][col];
		
		// Only cycle for empty cells
		if (cell.value !== null) return [];
		
		if (inputMode === 'normal') {
			// In both solving and manual mode, cycle through numbers that have candidates
			return Array.from(cell.candidates).sort();
		} else {
			// In note mode, cycle through all numbers 1-9 for both modes
			return [1, 2, 3, 4, 5, 6, 7, 8, 9];
		}
	}

	function startCycling() {
		const availableNumbers = getAvailableNumbersForCycling();
		if (availableNumbers.length === 0) return;
		
		// Start with the smallest available number
		cyclingNumber = availableNumbers[0];
		highlightedNumber = cyclingNumber;
	}

	function cycleToNextNumber() {
		const availableNumbers = getAvailableNumbersForCycling();
		if (availableNumbers.length === 0) return;
		
		if (cyclingNumber === null) {
			startCycling();
			return;
		}
		
		const currentIndex = availableNumbers.indexOf(cyclingNumber);
		const nextIndex = (currentIndex + 1) % availableNumbers.length;
		cyclingNumber = availableNumbers[nextIndex];
		highlightedNumber = cyclingNumber;
	}

	function placeCyclingNumber() {
		if (cyclingNumber === null || !selectedCell) return;
		
		handleInput(cyclingNumber);
		// Don't reset cycling - keep the same number highlighted for consecutive placements
	}

	function getCellsWithSameNumber(targetNumber: number): { row: number; col: number }[] {
		const cellsWithNumber: { row: number; col: number }[] = [];
		
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (board[row][col].value === targetNumber) {
					cellsWithNumber.push({ row, col });
				}
			}
		}
		
		return cellsWithNumber;
	}

	function cycleToNextCellWithSameNumber() {
		if (!selectedCell) return;
		
		const currentValue = board[selectedCell.row][selectedCell.col].value;
		if (currentValue === null) return; // Only cycle for cells with values
		
		const cellsWithSameNumber = getCellsWithSameNumber(currentValue);
		if (cellsWithSameNumber.length <= 1) return; // No other cells to cycle to
		
		// Find current cell index in the list
		const currentIndex = cellsWithSameNumber.findIndex(
			cell => cell.row === selectedCell!.row && cell.col === selectedCell!.col
		);
		
		if (currentIndex === -1) return; // Current cell not found (shouldn't happen)
		
		// Move to next cell (wrap around to beginning if at end)
		const nextIndex = (currentIndex + 1) % cellsWithSameNumber.length;
		const nextCell = cellsWithSameNumber[nextIndex];
		
		selectedCell = { row: nextCell.row, col: nextCell.col };
		updateHighlightedNumber(nextCell.row, nextCell.col);
	}

	function getNumberCounts(): { [key: number]: number } {
		const counts: { [key: number]: number } = {};
		for (let i = 1; i <= 9; i++) {
			counts[i] = 0;
		}
		
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				const value = board[row][col].value;
				if (value !== null) {
					counts[value]++;
				}
			}
		}
		
		return counts;
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
		// Remove the placed number from candidates in the same row, column, and 3x3 subgrid
		const subgridRow = Math.floor(row / 3) * 3;
		const subgridCol = Math.floor(col / 3) * 3;

		for (let i = 0; i < 9; i++) {
			// Remove from same row
			if (i !== col && !board[row][i].isInitial) {
				board[row][i].candidates.delete(num);
			}
			
			// Remove from same column
			if (i !== row && !board[i][col].isInitial) {
				board[i][col].candidates.delete(num);
			}
		}

		// Remove from same 3x3 subgrid
		for (let i = subgridRow; i < subgridRow + 3; i++) {
			for (let j = subgridCol; j < subgridCol + 3; j++) {
				if ((i !== row || j !== col) && !board[i][j].isInitial) {
					board[i][j].candidates.delete(num);
				}
			}
		}
	}

	function handleInput(num: number) {
		// Always highlight the selected number
		highlightedNumber = num;
		
		// If there's an error, don't allow any input until undo is pressed (only in solving mode)
		if (errorCell && gamePhase === 'solving') return;
		
		if (selectedCell) {
			const { row, col } = selectedCell;
			if (gamePhase === 'configuring') {
				board[row][col].value = num;
				// Trigger reactivity
				board = board;
			} else if (gamePhase === 'manual') {
				// Manual mode: no restrictions, no error checking, no automatic note updates
				if (inputMode === 'normal' && !board[row][col].isInitial) {
					saveToHistory();
					board[row][col].value = num;
					board[row][col].candidates.clear();
					// Trigger reactivity
					board = board;
				} else if (inputMode === 'note' && !board[row][col].isInitial) {
					saveToHistory();
					if (board[row][col].candidates.has(num)) {
						board[row][col].candidates.delete(num);
					} else {
						board[row][col].candidates.add(num);
					}
					// Trigger reactivity
					board = board;
				}
			} else if (inputMode === 'normal' && !board[row][col].isInitial) {
				// Solving mode with error checking
				// Only allow input if cell is empty
				if (board[row][col].value === null) {
					saveToHistory();
					board[row][col].value = num;
					board[row][col].candidates.clear();
					
					// Check if the placement is correct
					if (!isCorrectPlacement(row, col, num)) {
						errorCell = { row, col };
					} else {
						// Automatically update candidates in related cells only if correct
						updateNotesAfterPlacement(row, col, num);
					}
					// Trigger reactivity
					board = board;
				}
				// Keep the cell selected and number highlighted for continued placement
			} else if (inputMode === 'note' && !board[row][col].isInitial) {
				// Note mode in solving phase
				saveToHistory();
				if (board[row][col].candidates.has(num)) {
					board[row][col].candidates.delete(num);
				} else {
					board[row][col].candidates.add(num);
				}
				// Trigger reactivity
				board = board;
				// Keep the cell selected and number highlighted for continued note placement
			}
			// Keep the cell selected and number highlighted even if cell can't be modified
		}
		// If no cell is selected, just highlight the number (no change in behavior)
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
						board[i][j].candidates = getPossibleNumbers(i, j);
					}
				}
			}
			saveToHistory();
		}
	}

	function startManualGame() {
		errorMessage = null;
		solution = null; // No solution checking in manual mode
		gamePhase = 'manual';
		
		// Mark existing numbers as initial and give all empty cells all possible candidates
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				if (board[i][j].value !== null) {
					board[i][j].isInitial = true;
				} else {
					// In manual mode, start with all numbers available as candidates
					board[i][j].candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
				}
			}
		}
		saveToHistory();
	}

	function saveToHistory() {
		const newBoard = board.map((row) =>
			row.map((cell) => ({
				...cell,
				candidates: new Set(cell.candidates),
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
						candidates: new Set<number>(),
						isInitial: false,
					})),
			);

		// Generate a new puzzle using the sudoku library
		const generatedPuzzle = sudoku.generate(difficulty) as { [key: string]: string };
		
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
						candidates: new Set(cell.candidates),
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
				// Reset cycling when manually typing a number
				cyclingNumber = null;
			} else if (event.key === 'Delete' || event.key === 'Backspace') {
				handleDelete();
				} else if (event.key === 'Tab') {
				event.preventDefault(); // Prevent default tab behavior
				
				if (selectedCell) {
					const currentValue = board[selectedCell.row][selectedCell.col].value;
					
					if (currentValue !== null) {
						// Cell has a value - cycle to next cell with same number
						cycleToNextCellWithSameNumber();
					} else if (gamePhase === 'solving' || gamePhase === 'manual') {
						// Cell is empty and we're in solving or manual phase - cycle through available numbers
						cycleToNextNumber();
					}
				}
			} else if (event.key === 'Enter') {
				event.preventDefault(); // Prevent default enter behavior
				
				// Place/toggle the cycling number
				if (selectedCell && (gamePhase === 'solving' || gamePhase === 'manual') && cyclingNumber !== null) {
					const { row, col } = selectedCell;
					if (board[row][col].value === null) {
						placeCyclingNumber();
					}
				}
			} else if (event.key.toLowerCase() === 'c') {
				// Toggle ColorKu mode (available in all phases)
				colorKuMode = !colorKuMode;
			} else if (gamePhase === 'configuring') {
				// Configuration phase hotkeys
				if (event.key.toLowerCase() === 'g') {
					generatePuzzle();
				} else if (event.key.toLowerCase() === 'd') {
					// Cycle through difficulties: easy -> medium -> hard -> easy
					const difficulties = ['easy', 'medium', 'hard'] as const;
					const currentIndex = difficulties.indexOf(difficulty);
					const nextIndex = (currentIndex + 1) % difficulties.length;
					difficulty = difficulties[nextIndex];
				} else if (event.key.toLowerCase() === 's') {
					startGame();
				} else if (event.key.toLowerCase() === 'm') {
					startManualGame();
				}
			} else if (gamePhase === 'solving' || gamePhase === 'manual') {
				// Solving and manual phase hotkeys
				if (event.key.toLowerCase() === 'n') {
					// Toggle normal/note mode
					inputMode = inputMode === 'normal' ? 'note' : 'normal';
				} else if (event.key.toLowerCase() === 'u') {
					undo();
				}
			}
			
			// Navigation keys - Arrow keys always available, WASD only in solving and manual phase
			const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
			const isWASD = ['w', 'a', 's', 'd'].includes(event.key.toLowerCase());
			
			if (isArrowKey || (isWASD && (gamePhase === 'solving' || gamePhase === 'manual'))) {
				// Handle navigation keys
				event.preventDefault(); // Prevent default behavior (like scrolling)
				
				if (!selectedCell) {
					// If no cell is selected, start at the center
					selectedCell = { row: 4, col: 4 };
					updateHighlightedNumber(4, 4);
					return;
				}
				
				let newRow = selectedCell.row;
				let newCol = selectedCell.col;
				
				switch (event.key.toLowerCase()) {
					case 'arrowup':
					case 'w':
						newRow = Math.max(0, selectedCell.row - 1);
						break;
					case 'arrowdown':
					case 's':
						newRow = Math.min(8, selectedCell.row + 1);
						break;
					case 'arrowleft':
					case 'a':
						newCol = Math.max(0, selectedCell.col - 1);
						break;
					case 'arrowright':
					case 'd':
						newCol = Math.min(8, selectedCell.col + 1);
						break;
				}
				
				// Update selected cell if position changed
				if (newRow !== selectedCell.row || newCol !== selectedCell.col) {
					selectedCell = { row: newRow, col: newCol };
					updateHighlightedNumber(newRow, newCol);
				}
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
		bind:gridSize
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
		{gridSize}
		{highlightedNumber}
		selectedCellCandidates={selectedCell && (gamePhase === 'solving' || gamePhase === 'manual') && board[selectedCell.row][selectedCell.col].value === null ? board[selectedCell.row][selectedCell.col].candidates : new Set()}
		numberCounts={getNumberCounts()}
		onStartGame={startGame}
		onStartManualGame={startManualGame}
		onHandleDelete={handleDelete}
		onUndo={undo}
		onGeneratePuzzle={generatePuzzle}
		onHandleInput={handleInput}
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
		justify-content: center;
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

	/* Small screen height adjustments */
	@media (max-height: 600px) {
		main {
			padding: 0.25rem;
			padding-bottom: max(0.25rem, env(safe-area-inset-bottom));
			gap: 0.25rem;
		}
	}

	.error-message {
		color: red;
		margin-top: 1rem;
		text-align: center;
		font-size: 0.9rem;
	}

	/* Small screen adjustments for error message */
	@media (max-height: 600px) {
		.error-message {
			margin-top: 0.25rem;
			font-size: 0.8rem;
		}
	}
</style>
