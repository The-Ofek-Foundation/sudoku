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
		type CellData,
		type GamePhase,
		type InputMode,
		type Difficulty,
	} from '$lib';
	import {
		createKeyboardHandler,
		type KeyboardHandlerContext,
	} from '$lib/utils/keyboardHandler.js';
	import { getChallengeFromUrl, type PuzzleShare } from '$lib/share.js';
	import { gameStore } from '$lib/store/gameStore.svelte';

	// Sudoku solver from https://github.com/einaregilsson/sudoku.js
	// The library has been modified to be used as an ES module.

	// Derived state from GameStore
	const board = $derived(gameStore.board);
	const selectedCell = $derived(gameStore.selectedCell);
	const gamePhase = $derived(gameStore.gamePhase);
	const inputMode = $derived(gameStore.inputMode);
	const difficulty = $derived(gameStore.difficulty);
	const highlightedNumber = $derived(gameStore.highlightedNumber);
	const errorCell = $derived(gameStore.errorCell);
	const isGameCompleted = $derived(gameStore.isGameCompleted);
	const timerStartTime = $derived(gameStore.timerStartTime);
	const timerFinalTime = $derived(gameStore.timerFinalTime);
	const isTimerRunning = $derived(gameStore.isTimerRunning);
	const colorKuMode = $derived(gameStore.colorKuMode);
	const gameMode = $derived(gameStore.gameMode);

	const currentHint = $derived(gameStore.currentHint);
	const showingHint = $derived(gameStore.showingHint);
	const highlightedSquares = $derived(gameStore.highlightedSquares);

	const showShareModal = $derived(gameStore.showShareModal);
	const shareText = $derived(gameStore.shareText);
	const shareUrl = $derived(gameStore.shareUrl);
	const showCongratulationsModal = $derived(gameStore.showCongratulationsModal);
	const errorMessage = $derived(gameStore.errorMessage);

	let gridSize = $state('600px'); // Default size
	let cyclingNumber: number | null = null; // Current number when cycling with Tab
	// Note: cyclingNumber is also in store, but +page.svelte uses it for local keyboard handling?
	// GameStore has cyclingNumber.
	// Let's use store's cyclingNumber.
	// const cyclingNumber = $derived(gameStore.cyclingNumber);
	// But wait, cyclingNumber in store is state.

	// Calculate control panel width to match grid with borders (3px on each side = 6px total)
	const controlPanelWidth = $derived(`calc(${gridSize} + 6px)`);

	let hintDisplayRef = $state<HintDisplay>(); // Reference to HintDisplay component

	// Share/Challenge state
	// Share/Challenge state
	let challengeData = $state<PuzzleShare | null>(null);
	let showChallengeStart = $state(false);

	// Helper function to create context for game phase handlers
	// Delegate functions to GameStore
	function updateHighlightedNumber(row: number, col: number) {
		gameStore.updateHighlightedNumber(row, col);
	}

	function isPuzzleComplete() {
		return gameStore.isPuzzleComplete();
	}

	function startCycling() {
		gameStore.startCycling();
	}

	function cycleToNextNumber() {
		gameStore.cycleToNextNumber();
	}

	function placeCyclingNumber() {
		gameStore.placeCyclingNumber();
	}

	function cycleToNextCellWithSameNumber() {
		gameStore.cycleToNextCellWithSameNumber();
	}

	function handleInput(num: number) {
		gameStore.handleInput(num);
	}

	function handleDelete() {
		gameStore.handleDelete();
	}

	function startSelectedGameMode() {
		// gameStore doesn't have startSelectedGameMode yet?
		// It has startGame, startManualGame, startCompetitionGame.
		// And gameMode state.
		// I should implement this logic here or add it to store.
		// Logic:
		switch (gameStore.gameMode) {
			case 'solving':
				gameStore.startGame();
				break;
			case 'manual':
				gameStore.startManualGame();
				break;
			case 'competition':
				gameStore.startCompetitionGame();
				break;
		}
	}

	function cycleGameMode() {
		// gameStore doesn't have cycleGameMode.
		// I can implement it here by setting gameStore.gameMode.
		const modes: Array<'solving' | 'manual' | 'competition'> = [
			'solving',
			'manual',
			'competition',
		];
		const currentIndex = modes.indexOf(gameStore.gameMode);
		const nextIndex = (currentIndex + 1) % modes.length;
		gameStore.gameMode = modes[nextIndex];
	}

	function startGame() {
		gameStore.startGame();
	}

	function startManualGame() {
		gameStore.startManualGame();
	}

	function startCompetitionGame() {
		gameStore.startCompetitionGame();
	}

	function saveToHistory() {
		gameStore.saveToHistory();
	}

	function generatePuzzle() {
		gameStore.generatePuzzle();
	}

	function getHint() {
		gameStore.getHint();
	}

	function closeHint() {
		gameStore.closeHint();
	}

	function handleHighlight(data: any) {
		gameStore.handleHighlight(data);
	}

	function handleClearHighlights() {
		gameStore.handleClearHighlights();
	}

	function handleApplyHint() {
		gameStore.handleApplyHint();
	}

	function undo() {
		gameStore.undo();
	}

	function showShareModalForCompletion() {
		gameStore.showShareModalForCompletion();
	}

	function showShareModalForConfiguration() {
		gameStore.showShareModalForConfiguration();
	}

	function closeShareModal() {
		gameStore.closeShareModal();
	}

	function closeCongratulationsModal() {
		gameStore.closeCongratulationsModal();
	}

	function startNewGame() {
		gameStore.startNewGame();
	}

	function loadChallengeBoard(puzzleData: PuzzleShare) {
		gameStore.loadChallengeBoard(puzzleData);
	}

	function startChallengeFromUrl() {
		if (!challengeData) return;
		const success = gameStore.startChallengeFromUrl(
			challengeData,
			replaceState,
		);
		if (success) {
			showChallengeStart = false;
			challengeData = null;
		} else {
			showChallengeStart = false;
		}
	}

	function handleMainClick(event: MouseEvent) {
		// Only deselect if clicking on the main element itself (not its children)
		if (event.target === event.currentTarget) {
			gameStore.selectedCell = null;
			gameStore.highlightedNumber = null;
			gameStore.cyclingNumber = null;
		}
	}

	function handleMainKeydown(event: KeyboardEvent) {
		// Handle the same deselection behavior for keyboard accessibility
		if (event.key === 'Enter' || event.key === ' ') {
			if (event.target === event.currentTarget) {
				gameStore.selectedCell = null;
				gameStore.highlightedNumber = null;
				gameStore.cyclingNumber = null;
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
			cyclingNumber: gameStore.cyclingNumber, // Use store directly for non-derived state
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
				gameStore.cyclingNumber = num;
			},
			setColorKuMode: (mode) => {
				gameStore.colorKuMode = mode;
			},
			setInputMode: (mode) => {
				gameStore.inputMode = mode;
			},
			setDifficulty: (diff) => {
				gameStore.difficulty = diff;
			},
			setSelectedCell: (cell) => {
				gameStore.selectedCell = cell;
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
		onclick={handleMainClick}
		onkeydown={handleMainKeydown}
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
					bind:board={gameStore.board}
					bind:selectedCell={gameStore.selectedCell}
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
						bind:inputMode={gameStore.inputMode}
						bind:colorKuMode={gameStore.colorKuMode}
						bind:difficulty={gameStore.difficulty}
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
						numberCounts={gameStore.numberCounts}
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
