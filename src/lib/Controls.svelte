<script lang="ts">
	import '../app.css';
	import { colorKuColors } from './colors.js';
	import Timer from './Timer.svelte';
	import type { GamePhase, InputMode, Difficulty } from '$lib';

	export let gamePhase: GamePhase;
	export let inputMode: InputMode;
	export let errorCell: { row: number; col: number } | null = null;
	export let colorKuMode: boolean = false;
	export let difficulty: Difficulty = 'basic';
	export let gridSize: string = '600px';
	export let highlightedNumber: number | null = null;
	export let selectedCellCandidates: Set<number> = new Set(); // Renamed from selectedCellNotes for consistency
	export let numberCounts: { [key: number]: number } = {};
	export let isGameCompleted: boolean = false;

	// Timer props for competition mode
	export let isTimerRunning: boolean = false;
	export let timerStartTime: number | null = null;
	export let timerFinalTime: number | null = null;

	// Callback props instead of event dispatcher
	export let onStartGame: () => void;
	export let onStartManualGame: () => void;
	export let onStartCompetitionGame: () => void;
	export let onHandleDelete: () => void;
	export let onUndo: () => void;
	export let onHandleInput: (num: number) => void;
	export let onGeneratePuzzle: () => void;
	export let onGetHint: () => void;
	export let onShare: () => void;
	export let onNewGame: () => void;

	let startMode: 'normal' | 'manual' | 'competition' = 'normal';

	let isNoteMode = inputMode === 'note';

	$: isNoteMode = inputMode === 'note';

	function toggleNoteMode() {
		inputMode = isNoteMode ? 'normal' : 'note';
	}

	function startGame() {
		if (startMode === 'normal') {
			onStartGame();
		} else if (startMode === 'manual') {
			onStartManualGame();
		} else if (startMode === 'competition') {
			onStartCompetitionGame();
		}
	}

	function handleDelete() {
		onHandleDelete();
	}

	function undo() {
		onUndo();
	}

	function handleInput(num: number) {
		onHandleInput(num);
	}

	function generatePuzzle() {
		onGeneratePuzzle();
	}

	function getHint() {
		onGetHint();
	}

	function share() {
		onShare();
	}
</script>

<div class="card control-bar" style="width: {gridSize}">
	<div class="flex items-center gap-lg flex-wrap actions-row">
		{#if gamePhase === 'competition'}
			<Timer
				isRunning={isTimerRunning}
				startTime={timerStartTime}
				finalTime={timerFinalTime}
				compact={true}
			/>
		{/if}

		{#if gamePhase === 'configuring'}
			<div class="control-group generate-group">
				<button class="btn generate-button flex-1" on:click={generatePuzzle}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
						<path d="M3 3v5h5" />
						<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
						<path d="M21 21v-5h-5" />
					</svg>
					<span>Generate</span>
				</button>
				<select
					bind:value={difficulty}
					class="select-compact difficulty-compact"
				>
					<option value="trivial">Trivial</option>
					<option value="basic">Basic</option>
					<option value="intermediate">Intermediate</option>
					<option value="tough">Tough</option>
					<option value="diabolical">Diabolical</option>
					<option value="extreme">Extreme</option>
					<option value="master">Master</option>
					<option value="grandmaster">Grandmaster</option>
				</select>
			</div>
			<div class="control-group start-group">
				<button class="btn start-button flex-1" on:click={startGame}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polygon points="5,3 19,12 5,21"></polygon>
					</svg>
					<span>Start</span>
				</button>
				<select
					bind:value={startMode}
					class="select-compact start-mode-compact"
				>
					<option value="normal">Normal</option>
					<option value="manual">Manual</option>
					<option value="competition">Competition</option>
				</select>
			</div>
			<button class="btn btn--icon" on:click={handleDelete} aria-label="Delete">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 6h18" />
					<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
					<path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" />
					<line x1="10" y1="11" x2="10" y2="17" />
					<line x1="14" y1="11" x2="14" y2="17" />
				</svg>
			</button>
			<button
				class="btn btn--info share-button"
				on:click={share}
				aria-label="Share puzzle"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="18" cy="5" r="3" />
					<circle cx="6" cy="12" r="3" />
					<circle cx="18" cy="19" r="3" />
					<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
					<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
				</svg>
				<span>Share</span>
			</button>
		{:else if isGameCompleted}
			<!-- Game completed - show New Game button and limited options -->
			<button class="btn btn--new-game" on:click={onNewGame}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
					<path d="M3 3v5h5" />
					<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
					<path d="M21 21v-5h-5" />
				</svg>
				<span>New Game</span>
			</button>
			{#if gamePhase === 'competition'}
				<button
					class="btn btn--info share-button"
					on:click={share}
					aria-label="Share result"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="18" cy="5" r="3" />
						<circle cx="6" cy="12" r="3" />
						<circle cx="18" cy="19" r="3" />
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
						<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
					</svg>
					<span>Share</span>
				</button>
			{/if}
		{:else}
			<!-- Game in progress - show normal controls -->
			<div class="toggle-container">
				<span class="toggle-label" class:active={!isNoteMode}>Normal</span>
				<button
					class="toggle-switch"
					class:active={isNoteMode}
					class:disabled={errorCell && gamePhase === 'solving'}
					disabled={errorCell !== null && gamePhase === 'solving'}
					on:click={toggleNoteMode}
					aria-label="Toggle note mode"
					role="switch"
					aria-checked={isNoteMode}
				>
					<span class="toggle-slider"></span>
				</button>
				<span class="toggle-label" class:active={isNoteMode}>Note</span>
			</div>
			<button
				class="btn"
				class:btn--error={errorCell && gamePhase === 'solving'}
				on:click={undo}
			>
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
			<button
				class="btn btn--warning hint-button"
				class:disabled={errorCell && gamePhase === 'solving'}
				disabled={errorCell !== null && gamePhase === 'solving'}
				on:click={getHint}
				aria-label="Get hint"
				title="Get hint"
				style:display={gamePhase === 'competition' ? 'none' : 'inline-flex'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M9 21h6" />
					<path
						d="M12 17c-3.314 0-6-2.686-6-6 0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6z"
					/>
					<path d="M10 19h4" />
				</svg>
			</button>
		{/if}

		<!-- ColorKu Mode Toggle - Available in all phases -->
		<button
			class="btn colorku-button"
			class:active={colorKuMode}
			on:click={() => (colorKuMode = !colorKuMode)}
			aria-label="Toggle ColorKu mode"
		>
			<span>ColorKu</span>
		</button>
	</div>

	<div class="number-grid number-palette">
		{#each Array(9) as _, i}
			{#if (numberCounts[i + 1] || 0) < 9}
				<button
					class="number-button"
					class:disabled={(errorCell && gamePhase === 'solving') ||
						isGameCompleted}
					class:highlighted={highlightedNumber === i + 1 && !isGameCompleted}
					class:note-highlighted={selectedCellCandidates.has(i + 1) &&
						!isGameCompleted}
					class:dulled={colorKuMode &&
						selectedCellCandidates.size > 0 &&
						!selectedCellCandidates.has(i + 1)}
					disabled={(errorCell !== null && gamePhase === 'solving') ||
						isGameCompleted}
					on:click={() => handleInput(i + 1)}
				>
					{#if colorKuMode}
						<div
							class="palette-color-circle"
							class:dulled={selectedCellCandidates.size > 0 &&
								!selectedCellCandidates.has(i + 1)}
							style="background-color: {colorKuColors[i + 1]}"
						></div>
					{:else}
						{i + 1}
					{/if}
				</button>
			{:else}
				<div class="number-button-placeholder"></div>
			{/if}
		{/each}
	</div>
</div>

<style>
	/* Component-specific styles that extend the design system */
	.control-bar {
		width: 100%;
		margin-top: var(--space-xl);
		flex-shrink: 0; /* Prevent shrinking on mobile */
		padding: var(--space-lg); /* Add proper padding */
		box-sizing: border-box; /* Include padding in width calculation */
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.control-bar {
			margin-top: var(--space-md);
			padding: var(--space-md); /* Smaller padding on mobile */
		}
	}

	/* Small screen adjustments for very tight spaces */
	@media (max-height: 600px) {
		.control-bar {
			margin-top: var(--space-xs);
			padding: var(--space-sm); /* Even smaller padding on small screens */
		}
	}

	.actions-row {
		margin-bottom: var(--space-lg);
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.actions-row {
			margin-bottom: var(--space-md);
		}
	}

	/* Add top margin to number grid for spacing */
	.number-palette {
		margin-top: var(--space-md);
	}

	/* Specific overrides for compact selects */
	.difficulty-compact {
		min-width: 80px;
	}

	.start-mode-compact {
		min-width: 100px;
	}
	/* Number button customizations */
	.number-button {
		padding: var(--space-lg) 0;
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-thin);
		font-family: inherit;
		border: none;
		background-color: var(--color-medium);
		color: var(--color-dark);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Small screen adjustments for number buttons */
	@media (max-height: 600px) {
		.number-button {
			padding: var(--space-sm) 0;
			font-size: var(--font-size-xl);
		}
	}

	.number-button:hover {
		background-color: var(--color-medium-hover);
		color: var(--color-text);
	}

	.number-button.highlighted {
		color: var(--color-highlight-text);
		font-weight: var(--font-weight-light);
		background-color: var(--color-highlight);
	}

	.number-button.highlighted:hover {
		background-color: var(--color-highlight-hover);
		color: var(--color-highlight-hover-text);
	}

	.number-button.note-highlighted {
		background-color: var(--color-note-highlight);
		border: 2px solid var(--color-note-border);
		color: var(--color-note-text);
	}

	.number-button.note-highlighted:hover {
		background-color: var(--color-note-hover);
		color: var(--color-note-hover-text);
	}

	.number-button.highlighted.note-highlighted {
		background-color: var(--color-highlight);
		border: 2px solid var(--color-highlight-text);
		color: var(--color-highlight-text);
	}

	.number-button.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.number-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.number-button:disabled:hover {
		background-color: var(--color-medium);
		color: var(--color-dark);
	}

	.number-button.dulled {
		opacity: 0.65;
		transition: opacity var(--transition-fast);
	}

	.number-button-placeholder {
		grid-column: span 1;
	}

	/* ColorKu button customizations */
	.colorku-button {
		background-color: var(--color-light);
		border-color: var(--color-medium);
		transition: all var(--transition-fast);
	}

	.colorku-button:hover {
		background-color: var(--color-light-hover);
		border-color: var(--color-medium-hover);
	}

	.colorku-button.active {
		background-color: var(--color-success);
		border-color: var(--color-success);
		color: var(--color-white);
	}

	.colorku-button.active:hover {
		background-color: var(--color-success-hover);
		border-color: var(--color-success-hover);
	}

	/* Color circle styling */
	.palette-color-circle {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-full);
		border: 2px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all var(--transition-fast);
	}

	.palette-color-circle.dulled {
		opacity: 0.7;
		filter: grayscale(15%);
	}

	.number-button:hover .palette-color-circle {
		border-color: rgba(0, 0, 0, 0.3);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		transform: scale(1.05);
	}

	/* Mobile-specific adjustments */
	@media (max-width: 768px) {
		.actions-row {
			gap: var(--space-lg);
			padding: var(--space-sm);
		}

		.actions-row :global(.btn) {
			padding: var(--space-lg);
		}

		.number-button {
			padding: var(--space-md) 0;
			font-size: 2rem;
			line-height: 1.2;
			background-color: transparent;
		}

		.palette-color-circle {
			width: 1.75rem;
			height: 1.75rem;
		}
	}
</style>
