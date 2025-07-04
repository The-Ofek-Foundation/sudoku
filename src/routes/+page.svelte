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
		createKeyboardHandler,
		type KeyboardHandlerContext,
	} from '$lib/utils/keyboardHandler.js';
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
		forEachCell,
		setCellValue,
		setCellCandidates,
		isEmpty,
		isFilled,
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
	let gameMode: 'solving' | 'manual' | 'competition' = 'solving'; // Track selected game mode
	let isGameCompleted: boolean = false;
	let gridSize = '600px'; // Default size
	let cyclingNumber: number | null = null; // Current number when cycling with Tab

	// Calculate control panel width to match grid with borders (3px on each side = 6px total)
	$: controlPanelWidth = `calc(${gridSize} + 6px)`;

	// Hint system state
	let currentHint: SudokuHint | null = null;
	let showingHint: boolean = false;
	let highlightedSquares:
		| {
				squares?: string[];
				unit?: { type: 'row' | 'column' | 'box'; index: number };
				highlightType: 'primary' | 'secondary' | 'elimination';
		  }[]
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

	// Helper function to initialize board for game phases
	function initializeBoardForGamePhase(
		gameMode: 'solving' | 'manual' | 'competition',
	) {
		forEachCell(board, (cell, row, col) => {
			if (cell.value !== null) {
				cell.isInitial = true;
			} else {
				if (gameMode === 'manual') {
					// In manual mode, start with all numbers available as candidates
					setCellCandidates(
						board,
						row,
						col,
						new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
					);
				} else {
					// In solving and competition modes, calculate valid candidates
					setCellCandidates(
						board,
						row,
						col,
						getPossibleNumbers(board, row, col),
					);
				}
			}
		});
		saveToHistory();
	}

	function startSelectedGameMode() {
		switch (gameMode) {
			case 'solving':
				startGame();
				break;
			case 'manual':
				startManualGame();
				break;
			case 'competition':
				startCompetitionGame();
				break;
		}
	}

	function cycleGameMode() {
		const modes: Array<'solving' | 'manual' | 'competition'> = [
			'solving',
			'manual',
			'competition',
		];
		const currentIndex = modes.indexOf(gameMode);
		const nextIndex = (currentIndex + 1) % modes.length;
		gameMode = modes[nextIndex];
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

		initializeBoardForGamePhase('solving');
	}

	function startManualGame() {
		errorMessage = null;
		solution = null; // No solution checking in manual mode
		gamePhase = 'manual';

		initializeBoardForGamePhase('manual');
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

		initializeBoardForGamePhase('competition');
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

		forEachCell(board, (cell, row, col) => {
			const square = rows[row] + cols[col];
			if (generatedPuzzle[square]) {
				setCellValue(board, row, col, parseInt(generatedPuzzle[square]));
			}
		});

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
		squares?: string[];
		unit?: { type: 'row' | 'column' | 'box'; index: number };
		candidateEliminations?: { square: string; digits: string[] }[];
		highlightType: 'primary' | 'secondary' | 'elimination';
	}) {
		if (!highlightedSquares) {
			highlightedSquares = [data];
		} else {
			// Remove any existing highlight of the same type
			highlightedSquares = highlightedSquares.filter(
				(h) => h.highlightType !== data.highlightType,
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

		initializeBoardForGamePhase('competition');

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

	function handleMainClick(event: MouseEvent) {
		// Only deselect if clicking on the main element itself (not its children)
		if (event.target === event.currentTarget) {
			selectedCell = null;
			highlightedNumber = null;
			cyclingNumber = null;
		}
	}

	function handleMainKeydown(event: KeyboardEvent) {
		// Handle the same deselection behavior for keyboard accessibility
		if (event.key === 'Enter' || event.key === ' ') {
			if (event.target === event.currentTarget) {
				selectedCell = null;
				highlightedNumber = null;
				cyclingNumber = null;
			}
		}
	}

	onMount(() => {
		// Check if this is a shared challenge
		challengeData = getChallengeFromUrl();
		if (challengeData) {
			showChallengeStart = true;
		}

		// Create keyboard handler with dynamic context
		const getKeyboardContext = (): KeyboardHandlerContext => ({
			// Game state
			gamePhase,
			selectedCell,
			cyclingNumber,
			colorKuMode,
			inputMode,
			difficulty,
			gameMode,
			showingHint,
			board,

			// Action callbacks
			handleInput,
			handleDelete,
			cycleToNextCellWithSameNumber,
			cycleToNextNumber,
			placeCyclingNumber,
			undo,
			generatePuzzle,
			startGame,
			startManualGame,
			startSelectedGameMode,
			cycleGameMode,
			showShareModalForConfiguration,
			getHint,
			closeHint,
			updateHighlightedNumber,

			// State setters
			setCyclingNumber: (num) => {
				cyclingNumber = num;
			},
			setColorKuMode: (mode) => {
				colorKuMode = mode;
			},
			setInputMode: (mode) => {
				inputMode = mode;
			},
			setDifficulty: (diff) => {
				difficulty = diff;
			},
			setSelectedCell: (cell) => {
				selectedCell = cell;
			},

			// External references
			hintDisplayRef,
		});

		const handleKeyDown = createKeyboardHandler(getKeyboardContext);

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<main>
	<a href="#game-content" class="skip-link">Skip to main content</a>

	<div
		class="click-area"
		on:click={handleMainClick}
		on:keydown={handleMainKeydown}
		role="button"
		tabindex="-1"
	>
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
	</div>

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
		padding: 0;
		box-sizing: border-box;
	}

	.click-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 100vh;
		min-height: 100dvh;
		padding: var(--space-xl);
		padding-bottom: max(
			var(--space-xl),
			env(safe-area-inset-bottom)
		); /* Account for mobile safe areas */
		box-sizing: border-box;
		gap: var(--space-xl);
		/* Remove default button styles for accessibility wrapper */
		background: none;
		border: none;
		outline: none;
		font-family: inherit;
		color: inherit;
		text-align: inherit;
		cursor: default;
	}

	/* Mobile-specific adjustments */
	@media (max-width: 768px) {
		.click-area {
			padding: var(--space-md);
			padding-bottom: max(var(--space-md), env(safe-area-inset-bottom));
			gap: var(--space-md);
		}
	}

	/* Small screen height adjustments */
	@media (max-height: 600px) {
		.click-area {
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
