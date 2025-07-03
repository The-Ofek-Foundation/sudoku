<script lang="ts">
	import SudokuGrid from '$lib/SudokuGrid.svelte';
	import Controls from '$lib/Controls.svelte';
	import HintDisplay from '$lib/HintDisplay.svelte';
	import ShareModal from '$lib/ShareModal.svelte';
	import ChallengeStart from '$lib/ChallengeStart.svelte';
	import CongratulationsModal from '$lib/CongratulationsModal.svelte';
	import '../app.css';
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import {
		sudoku,
		type CellData,
		type GamePhase,
		type InputMode,
		type Difficulty,
		coordinatesToSquare,
		squareToCoordinates,
	} from '$lib';
	import type { SudokuHint, Values } from '$lib/sudoku/sudoku';
	import {
		encodePuzzle,
		generateShareText,
		createShareableUrl,
		getChallengeFromUrl,
		type PuzzleShare,
	} from '$lib/share.js';
	import {
		validateBoardSimple,
		boardToString,
		getPossibleNumbers,
		updateCandidatesAfterPlacement,
		isPuzzleComplete as checkPuzzleComplete,
		createEmptyBoard,
		getNumberCounts,
		boardToValues,
		boardToCandidates,
		getInitialPuzzle,
		getCellsWithSameNumber,
		isCorrectPlacement,
		type SimpleValidationResult,
	} from '$lib/utils/boardUtils.js';
	import { gamePhaseManager, type GamePhaseContext } from '$lib/gamePhases';

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
	let isGameCompleted: boolean = false;
	let gridSize = '600px'; // Default size
	let cyclingNumber: number | null = null; // Current number when cycling with Tab

	// Calculate control panel width to match grid with borders (3px on each side = 6px total)
	$: controlPanelWidth = `calc(${gridSize} + 6px)`;

	// Hint system state
	let currentHint: SudokuHint | null = null;
	let showingHint: boolean = false;
	let highlightedSquares:
		| { squares: string[]; type: 'primary' | 'secondary' | 'elimination' }[]
		| null = null;
	let hintDisplayRef: HintDisplay; // Reference to HintDisplay component

	// Timer state for competition mode
	let timerStartTime: number | null = null;
	let timerFinalTime: number | null = null;
	let isTimerRunning: boolean = false;

	// Share/Challenge state
	let showShareModal: boolean = false;
	let shareText: string = '';
	let shareUrl: string = '';
	let challengeData: PuzzleShare | null = null;
	let showChallengeStart: boolean = false;
	let showCongratulationsModal: boolean = false;

	let board: CellData[][] = createEmptyBoard();

	// Helper function to create context for game phase handlers
	function createGameContext(): GamePhaseContext {
		return {
			board,
			selectedCell,
			inputMode,
			solution,
			errorCell,
			saveToHistory,
			updateCandidatesAfterPlacement,
			isCorrectPlacement,
			isPuzzleComplete,
			checkPuzzleComplete,
			onGameCompleted: () => {
				isGameCompleted = true;
				showCongratulationsModal = true;
			},
			onError: (error) => {
				errorCell = error;
			},
			onTimerComplete: (finalTime) => {
				isTimerRunning = false;
				timerFinalTime = finalTime;
			},
			timerStartTime,
			isTimerRunning,
		};
	}

	function updateHighlightedNumber(row: number, col: number) {
		const cellValue = board[row][col].value;
		if (cellValue !== null) {
			// Cell has a value, highlight that number
			highlightedNumber = cellValue;
			cyclingNumber = null; // Reset cycling for cells with values
		} else if (
			(gamePhase === 'solving' ||
				gamePhase === 'manual' ||
				gamePhase === 'competition') &&
			board[row][col].candidates.size > 0
		) {
			// Cell has no value but has candidates during solving/manual/competition phase
			// Check if we should preserve the current highlighted number
			if (highlightedNumber !== null) {
				// Keep current highlighted number if it's valid for this cell
				if (
					inputMode === 'note' ||
					board[row][col].candidates.has(highlightedNumber)
				) {
					// In note mode, all numbers are valid, or the highlighted number is a valid candidate
					// Keep the current highlighted number and set it as cycling number
					cyclingNumber = highlightedNumber;
					return;
				}
			}
			// If no valid highlighted number, auto-start cycling with the first available number
			highlightedNumber = null;
			startCycling();
		} else {
			// Cell is empty with no candidates, or we're in config phase
			highlightedNumber = null;
			cyclingNumber = null;
		}
	}

	function isPuzzleComplete(): boolean {
		const context = createGameContext();
		return gamePhaseManager.validateCompletion(gamePhase, context);
	}

	function getAvailableNumbersForCycling(): number[] {
		if (
			!selectedCell ||
			(gamePhase !== 'solving' &&
				gamePhase !== 'manual' &&
				gamePhase !== 'competition')
		)
			return [];

		const { row, col } = selectedCell;
		const cell = board[row][col];

		// Only cycle for empty cells
		if (cell.value !== null) return [];

		if (inputMode === 'normal') {
			// In solving, manual, and competition mode, cycle through numbers that have candidates
			return Array.from(cell.candidates).sort();
		} else {
			// In note mode, cycle through all numbers 1-9 for all modes
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

	function cycleToNextCellWithSameNumber() {
		if (!selectedCell) return;

		const currentValue = board[selectedCell.row][selectedCell.col].value;
		if (currentValue === null) return; // Only cycle for cells with values

		const cellsWithSameNumber = getCellsWithSameNumber(board, currentValue);
		if (cellsWithSameNumber.length <= 1) return; // No other cells to cycle to

		// Find current cell index in the list
		const currentIndex = cellsWithSameNumber.findIndex(
			(cell) =>
				cell.row === selectedCell!.row && cell.col === selectedCell!.col,
		);

		if (currentIndex === -1) return; // Current cell not found (shouldn't happen)

		// Move to next cell (wrap around to beginning if at end)
		const nextIndex = (currentIndex + 1) % cellsWithSameNumber.length;
		const nextCell = cellsWithSameNumber[nextIndex];

		selectedCell = { row: nextCell.row, col: nextCell.col };
		updateHighlightedNumber(nextCell.row, nextCell.col);
	}

	function handleInput(num: number) {
		// Always highlight the selected number
		highlightedNumber = num;

		// If there's an error, don't allow any input until undo is pressed (only in solving mode)
		if (errorCell && gamePhaseManager.supportsErrorChecking(gamePhase)) return;

		if (!selectedCell) return;

		const handler = gamePhaseManager.getHandler(gamePhase);
		const context = createGameContext();

		const result =
			inputMode === 'normal'
				? handler.handleNormalInput(context, num)
				: handler.handleNoteInput(context, num);

		// Apply the results
		board = result.board;

		if (result.errorCell !== undefined) {
			errorCell = result.errorCell;
		}

		if (result.timerStopped) {
			isTimerRunning = false;
			if (result.finalTime) {
				timerFinalTime = result.finalTime;
			}
		}

		if (result.gameCompleted) {
			isGameCompleted = true;
			showCongratulationsModal = true;
		}
	}

	function handleDelete() {
		if (!selectedCell || !gamePhaseManager.canDeleteCells(gamePhase)) return;

		const handler = gamePhaseManager.getHandler(gamePhase);
		if (!handler.handleDelete) return;

		const result = handler.handleDelete(createGameContext());
		board = result.board;
	}

	function startGame() {
		const validation = validateBoardSimple(board);

		if (!validation.isValid) {
			errorMessage = validation.errorMessage || 'Invalid puzzle configuration';
			return;
		}

		errorMessage = null;
		solution = validation.solution!; // We know it's not null since validation passed
		gamePhase = 'solving';

		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				if (board[i][j].value !== null) {
					board[i][j].isInitial = true;
				} else {
					board[i][j].candidates = getPossibleNumbers(board, i, j);
				}
			}
		}
		saveToHistory();
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

	function startCompetitionGame() {
		const validation = validateBoardSimple(board);

		if (!validation.isValid) {
			errorMessage = validation.errorMessage || 'Invalid puzzle configuration';
			return;
		}

		errorMessage = null;
		solution = validation.solution!; // We know it's not null since validation passed
		gamePhase = 'competition';

		// Start the timer
		timerStartTime = Date.now();
		timerFinalTime = null;
		isTimerRunning = true;

		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				if (board[i][j].value !== null) {
					board[i][j].isInitial = true;
				} else {
					board[i][j].candidates = getPossibleNumbers(board, i, j);
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
		board = createEmptyBoard();

		// Generate a new puzzle using the sudoku library
		const generatedPuzzle = sudoku.generate(difficulty) as {
			[key: string]: string;
		};

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

	function getHint() {
		// Only available in phases that support hints
		if (!gamePhaseManager.supportsHints(gamePhase)) return;

		// Close any existing hint first
		closeHint();

		const currentValues = boardToValues(board);

		let hint: SudokuHint | null = null;
		const currentCandidates = boardToCandidates(board);

		if (gamePhase === 'solving') {
			// In solving mode, we have the original puzzle for verification
			const initialPuzzle = getInitialPuzzle(board);
			hint = sudoku.getHint(initialPuzzle, currentValues, currentCandidates);
		} else {
			// In manual mode, we can't verify against a solution, so we create a minimal puzzle
			// and let the hint system work with what we have
			hint = sudoku.getHint(currentValues, currentValues, currentCandidates);
		}

		if (hint) {
			currentHint = hint;
			showingHint = true;
			// Clear selection and highlighted number when showing hint
			selectedCell = null;
			highlightedNumber = null;
			cyclingNumber = null;
		}
	}

	function closeHint() {
		showingHint = false;
		currentHint = null;
		highlightedSquares = null;
	}

	function handleHighlight(data: {
		squares: string[];
		type: 'primary' | 'secondary' | 'elimination';
	}) {
		if (!highlightedSquares) {
			highlightedSquares = [data];
		} else {
			// Remove any existing highlight of the same type
			highlightedSquares = highlightedSquares.filter(
				(h) => h.type !== data.type,
			);
			// Add the new highlight
			highlightedSquares.push(data);
			// Trigger reactivity
			highlightedSquares = highlightedSquares;
		}
	}

	function handleClearHighlights() {
		highlightedSquares = null;
	}

	function handleApplyHint() {
		if (!currentHint) return;

		saveToHistory();

		if (currentHint.type === 'error') {
			// Fix incorrect value
			const { row, col } = squareToCoordinates(currentHint.square);
			board[row][col].value = parseInt(currentHint.correctValue);
			// Clear error state
			errorCell = null;
		} else if (currentHint.type === 'missing_candidate') {
			// Add missing candidate
			const { row, col } = squareToCoordinates(currentHint.square);
			board[row][col].candidates.add(parseInt(currentHint.missingDigit));
		} else if (currentHint.type === 'single_cell') {
			// Place the digit
			const { row, col } = squareToCoordinates(currentHint.square);
			board[row][col].value = parseInt(currentHint.digit);
			board[row][col].candidates.clear();

			// In solving mode, update notes in related cells
			if (gamePhase === 'solving') {
				updateCandidatesAfterPlacement(
					board,
					row,
					col,
					parseInt(currentHint.digit),
				);
			}
		} else if (
			currentHint.type === 'naked_set' ||
			currentHint.type === 'hidden_set'
		) {
			// Remove candidates
			for (const square of currentHint.eliminationCells || []) {
				const { row, col } = squareToCoordinates(square);
				for (const digit of currentHint.eliminationDigits || []) {
					board[row][col].candidates.delete(parseInt(digit));
				}
			}
		} else if (currentHint.type === 'intersection_removal') {
			// Remove candidates from elimination cells
			for (const square of currentHint.eliminationCells || []) {
				const { row, col } = squareToCoordinates(square);
				board[row][col].candidates.delete(parseInt(currentHint.digit));
			}
		}

		// Trigger reactivity
		board = board;

		// If puzzle is complete and not in competition mode, show congratulations
		if (
			(gamePhase === 'solving' || gamePhase === 'manual') &&
			isPuzzleComplete()
		) {
			isGameCompleted = true;
			showCongratulationsModal = true;
		}

		// Close hint display
		closeHint();
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

	// Sharing and Challenge Functions
	function showShareModalForCompletion() {
		const encoded = encodePuzzle(
			board,
			difficulty,
			timerFinalTime || undefined,
			colorKuMode,
		);
		shareText = generateShareText(timerFinalTime || undefined, difficulty);
		shareUrl = createShareableUrl(encoded);
		showShareModal = true;
	}

	function showShareModalForConfiguration() {
		// Validate the puzzle first
		const validation = validateBoardSimple(board);

		if (!validation.isValid) {
			errorMessage = validation.errorMessage || 'Invalid puzzle configuration';
			return;
		}

		// Clear any existing error message
		errorMessage = null;

		// Generate share data
		const encoded = encodePuzzle(board, difficulty, undefined, colorKuMode);
		shareText = generateShareText(undefined, difficulty);
		shareUrl = createShareableUrl(encoded);
		showShareModal = true;
	}

	function closeShareModal() {
		showShareModal = false;
	}

	function closeCongratulationsModal() {
		showCongratulationsModal = false;
	}

	function startNewGame() {
		// Reset to configuration mode with blank board
		gamePhase = 'configuring';
		showCongratulationsModal = false;
		isGameCompleted = false;
		selectedCell = null;
		highlightedNumber = null;
		cyclingNumber = null;
		errorMessage = null;
		errorCell = null;
		solution = null;
		history = [];
		showingHint = false;
		currentHint = null;
		highlightedSquares = null;

		// Clear the board
		board = createEmptyBoard();
	}

	function loadChallengeBoard(puzzleData: PuzzleShare) {
		// Clear the current board
		board = createEmptyBoard();

		// Load the puzzle configuration
		for (let i = 0; i < 81; i++) {
			const row = Math.floor(i / 9);
			const col = i % 9;
			const char = puzzleData.puzzle[i];

			if (char !== '.') {
				const value = parseInt(char);
				if (value >= 1 && value <= 9) {
					board[row][col].value = value;
					board[row][col].isInitial = true;
				}
			}
		}

		// Set difficulty if provided
		if (puzzleData.difficulty) {
			difficulty = puzzleData.difficulty as Difficulty;
		}

		// Set colorKu mode if provided (default to false if not specified)
		colorKuMode = puzzleData.colorKuMode || false;

		// Trigger reactivity
		board = board;
		errorMessage = null;
	}

	function startChallengeFromUrl() {
		if (!challengeData) return;

		// Load the challenge board first
		loadChallengeBoard(challengeData);

		// Now that the board is loaded, validate it and start competition mode
		const validation = validateBoardSimple(board);

		if (!validation.isValid) {
			errorMessage = validation.errorMessage || 'Invalid puzzle configuration';
			showChallengeStart = false; // Show the main interface
			return;
		}

		errorMessage = null;
		solution = validation.solution!; // We know it's not null since validation passed
		gamePhase = 'competition';

		// Start the timer
		timerStartTime = Date.now();
		timerFinalTime = null;
		isTimerRunning = true;

		// Initialize candidates for empty cells
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				if (board[i][j].value === null) {
					board[i][j].candidates = getPossibleNumbers(board, i, j);
				}
			}
		}
		saveToHistory();

		// Hide challenge start screen
		showChallengeStart = false;

		// Clear challenge data and URL
		challengeData = null;
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.delete('challenge');
			replaceState(url, {});
		}
	}

	onMount(() => {
		// Check if this is a shared challenge
		challengeData = getChallengeFromUrl();
		if (challengeData) {
			showChallengeStart = true;
		}

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
					} else if (
						gamePhase === 'solving' ||
						gamePhase === 'manual' ||
						gamePhase === 'competition'
					) {
						// Cell is empty and we're in solving, manual, or competition phase - cycle through available numbers
						cycleToNextNumber();
					}
				}
			} else if (event.key === 'Enter') {
				event.preventDefault(); // Prevent default enter behavior

				// Place/toggle the cycling number
				if (
					selectedCell &&
					(gamePhase === 'solving' ||
						gamePhase === 'manual' ||
						gamePhase === 'competition') &&
					cyclingNumber !== null
				) {
					const { row, col } = selectedCell;
					if (board[row][col].value === null) {
						placeCyclingNumber();
					}
				}
			} else if (event.key.toLowerCase() === 'c' && !event.ctrlKey) {
				// Toggle ColorKu mode (available in all phases, but not when Ctrl is pressed)
				colorKuMode = !colorKuMode;
			} else if (event.key.toLowerCase() === 'z' && event.ctrlKey) {
				// Ctrl+Z for undo (available in all phases that support undo)
				if (
					gamePhase === 'solving' ||
					gamePhase === 'manual' ||
					gamePhase === 'competition'
				) {
					undo();
				}
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
				} else if (event.key.toLowerCase() === 'x') {
					// Share current configuration
					showShareModalForConfiguration();
				}
			} else if (
				gamePhase === 'solving' ||
				gamePhase === 'manual' ||
				gamePhase === 'competition'
			) {
				// Solving, manual, and competition phase hotkeys
				if (event.key.toLowerCase() === 'n') {
					// Toggle normal/note mode
					inputMode = inputMode === 'normal' ? 'note' : 'normal';
				} else if (event.key.toLowerCase() === 'u') {
					undo();
				} else if (
					event.key.toLowerCase() === 'h' &&
					gamePhase !== 'competition'
				) {
					// Get hint or advance hint stage if already showing (not in competition mode)
					if (showingHint && hintDisplayRef) {
						// Advance to next hint stage
						hintDisplayRef.advanceStage();
					} else {
						// Get new hint
						getHint();
					}
				} else if (event.key === 'Escape' && showingHint) {
					// Close hint
					closeHint();
				}
			}

			// Navigation keys - Arrow keys always available, WASD only in solving, manual, and competition phase
			const isArrowKey = [
				'ArrowUp',
				'ArrowDown',
				'ArrowLeft',
				'ArrowRight',
			].includes(event.key);
			const isWASD = ['w', 'a', 's', 'd'].includes(event.key.toLowerCase());

			if (
				isArrowKey ||
				(isWASD &&
					(gamePhase === 'solving' ||
						gamePhase === 'manual' ||
						gamePhase === 'competition'))
			) {
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
	<a href="#game-content" class="skip-link">Skip to main content</a>

	{#if showChallengeStart && challengeData}
		<ChallengeStart
			shareText={generateShareText(
				challengeData.completionTime,
				challengeData.difficulty,
			)}
			difficulty={challengeData.difficulty}
			challengerTime={challengeData.completionTime}
			colorKuMode={challengeData.colorKuMode}
			onStartChallenge={startChallengeFromUrl}
		/>
	{:else}
		<div id="game-content">
			<SudokuGrid
				bind:board
				bind:selectedCell
				{gamePhase}
				{errorCell}
				{highlightedNumber}
				{colorKuMode}
				{highlightedSquares}
				{showingHint}
				bind:gridSize
				onCellSelected={(data) => updateHighlightedNumber(data.row, data.col)}
			/>

			{#if errorMessage}
				<div class="error-message">{errorMessage}</div>
			{/if}

			{#if showingHint && currentHint}
				<HintDisplay
					bind:this={hintDisplayRef}
					gridSize={controlPanelWidth}
					{colorKuMode}
					hint={currentHint}
					onClose={closeHint}
					onHighlight={handleHighlight}
					onClearHighlights={handleClearHighlights}
					onApplyHint={handleApplyHint}
				/>
			{:else}
				<Controls
					bind:inputMode
					bind:colorKuMode
					bind:difficulty
					{gamePhase}
					{errorCell}
					gridSize={controlPanelWidth}
					{highlightedNumber}
					{isGameCompleted}
					selectedCellCandidates={selectedCell &&
					(gamePhase === 'solving' ||
						gamePhase === 'manual' ||
						gamePhase === 'competition') &&
					board[selectedCell.row][selectedCell.col].value === null
						? board[selectedCell.row][selectedCell.col].candidates
						: new Set()}
					numberCounts={getNumberCounts(board)}
					{isTimerRunning}
					{timerStartTime}
					{timerFinalTime}
					onStartGame={startGame}
					onStartManualGame={startManualGame}
					onStartCompetitionGame={startCompetitionGame}
					onHandleDelete={handleDelete}
					onUndo={undo}
					onGeneratePuzzle={generatePuzzle}
					onHandleInput={handleInput}
					onGetHint={getHint}
					onShare={gamePhase === 'competition' && isGameCompleted
						? showShareModalForCompletion
						: showShareModalForConfiguration}
					onNewGame={startNewGame}
				/>
			{/if}
		</div>
	{/if}

	<ShareModal
		isOpen={showShareModal}
		{shareText}
		{shareUrl}
		onClose={closeShareModal}
	/>

	<CongratulationsModal
		isOpen={showCongratulationsModal}
		onClose={closeCongratulationsModal}
		onNewGame={startNewGame}
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
		padding: var(--space-xl);
		padding-bottom: max(
			var(--space-xl),
			env(safe-area-inset-bottom)
		); /* Account for mobile safe areas */
		box-sizing: border-box;
		gap: var(--space-xl);
	}

	/* Mobile-specific adjustments */
	@media (max-width: 768px) {
		main {
			padding: var(--space-md);
			padding-bottom: max(var(--space-md), env(safe-area-inset-bottom));
			gap: var(--space-md);
		}
	}

	/* Small screen height adjustments */
	@media (max-height: 600px) {
		main {
			padding: var(--space-xs);
			padding-bottom: max(var(--space-xs), env(safe-area-inset-bottom));
			gap: var(--space-xs);
		}
	}

	.error-message {
		color: var(--color-danger);
		margin-top: var(--space-xl);
		text-align: center;
		font-size: var(--font-size-sm);
	}

	/* Small screen adjustments for error message */
	@media (max-height: 600px) {
		.error-message {
			margin-top: var(--space-xs);
			font-size: var(--font-size-xs);
		}
	}
</style>
