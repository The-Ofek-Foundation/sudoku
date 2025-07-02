<script lang="ts">
	import { colorKuColors } from './colors.js';
	import type { GamePhase, InputMode, Difficulty } from '$lib';

	export let gamePhase: GamePhase;
	export let inputMode: InputMode;
	export let errorCell: { row: number; col: number } | null = null;
	export let colorKuMode: boolean = false;
	export let difficulty: Difficulty = 'easy';
	export let gridSize: string = '600px';
	export let highlightedNumber: number | null = null;
	export let selectedCellCandidates: Set<number> = new Set(); // Renamed from selectedCellNotes for consistency
	export let numberCounts: { [key: number]: number } = {};

	// Callback props instead of event dispatcher
	export let onStartGame: () => void;
	export let onStartManualGame: () => void;
	export let onHandleDelete: () => void;
	export let onUndo: () => void;
	export let onHandleInput: (num: number) => void;
	export let onGeneratePuzzle: () => void;
	export let onGetHint: () => void;

	let startMode: 'normal' | 'manual' = 'normal';

	let isNoteMode = inputMode === 'note';

	$: isNoteMode = inputMode === 'note';

	function toggleNoteMode() {
		inputMode = isNoteMode ? 'normal' : 'note';
	}

	function startGame() {
		if (startMode === 'normal') {
			onStartGame();
		} else {
			onStartManualGame();
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
</script>

<div class="control-bar" style="max-width: {gridSize}">
	<div class="actions-row">
		{#if gamePhase === 'configuring'}
			<div class="generate-group">
				<button class="action-button generate-button" on:click={generatePuzzle}>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
						<path d="M3 3v5h5"/>
						<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
						<path d="M21 21v-5h-5"/>
					</svg>
					<span>Generate</span>
				</button>
				<select bind:value={difficulty} class="difficulty-compact">
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>
			</div>
			<div class="start-group">
				<button class="action-button start-button" on:click={startGame}>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="5,3 19,12 5,21"></polygon>
					</svg>
					<span>Start</span>
				</button>
				<select bind:value={startMode} class="start-mode-compact">
					<option value="normal">Normal</option>
					<option value="manual">Manual</option>
				</select>
			</div>
			<button class="action-button icon-button" on:click={handleDelete} aria-label="Delete">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 6h18"/>
					<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
					<path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2"/>
					<line x1="10" y1="11" x2="10" y2="17"/>
					<line x1="14" y1="11" x2="14" y2="17"/>
				</svg>
			</button>
		{:else}
			<div class="note-mode-toggle">
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
			<button class="action-button" class:error={errorCell && gamePhase === 'solving'} on:click={undo}>
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
				class="action-button hint-button" 
				class:disabled={errorCell && gamePhase === 'solving'}
				disabled={errorCell !== null && gamePhase === 'solving'}
				on:click={getHint}
				aria-label="Get hint"
				title="Get hint"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 21h6"/>
					<path d="M12 17c-3.314 0-6-2.686-6-6 0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6z"/>
					<path d="M10 19h4"/>
				</svg>
			</button>
		{/if}
		
		<!-- ColorKu Mode Toggle - Available in all phases -->
		<button 
			class="action-button colorku-button" 
			class:active={colorKuMode}
			on:click={() => colorKuMode = !colorKuMode}
			aria-label="Toggle ColorKu mode"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"/>
				<path d="M8 14s1.5 2 4 2 4-2 4-2"/>
				<line x1="9" y1="9" x2="9.01" y2="9"/>
				<line x1="15" y1="9" x2="15.01" y2="9"/>
			</svg>
			<span>ColorKu</span>
		</button>
	</div>

	<div class="number-palette">
		{#each Array(9) as _, i}
			{#if gamePhase === 'configuring' || gamePhase === 'manual' || (numberCounts[i + 1] || 0) < 9}
				<button 
					class="number-button" 
					class:disabled={errorCell && gamePhase === 'solving'}
					class:highlighted={highlightedNumber === i + 1}
					class:note-highlighted={selectedCellCandidates.has(i + 1)}
					class:dulled={colorKuMode && selectedCellCandidates.size > 0 && !selectedCellCandidates.has(i + 1)}
					disabled={errorCell !== null && gamePhase === 'solving'}
					on:click={() => handleInput(i + 1)}
				>
					{#if colorKuMode}
						<div 
							class="palette-color-circle"
							class:dulled={selectedCellCandidates.size > 0 && !selectedCellCandidates.has(i + 1)}
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
	.control-bar {
		background-color: #ffffff;
		padding: 0.75rem;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		width: 100%;
		box-sizing: border-box;
		margin-top: 1rem; /* Reduced from 1rem */
		flex-shrink: 0; /* Prevent shrinking on mobile */
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.control-bar {
			padding: 0.5rem;
			margin-top: 0.5rem;
			border-radius: 8px;
		}
	}

	/* Small screen adjustments for very tight spaces */
	@media (max-height: 600px) {
		.control-bar {
			padding: 0.375rem;
			margin-top: 0.25rem;
		}
	}
	.actions-row {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem; /* Reduced from 1rem */
		flex-wrap: wrap; /* Allow wrapping on smaller screens */
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.actions-row {
			gap: 0.5rem;
			margin-bottom: 0.5rem;
		}
	}

	.generate-group {
		display: flex;
		align-items: stretch;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.start-group {
		display: flex;
		align-items: stretch;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.generate-button {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-right: none;
		flex: 1;
	}

	.start-button {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		border-right: none;
		flex: 1;
	}

	.difficulty-compact {
		padding: 0.5rem 0.75rem;
		border: 1px solid #dee2e6;
		border-left: none;
		background-color: #f8f9fa;
		color: #495057;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-top-right-radius: 8px;
		border-bottom-right-radius: 8px;
		min-width: 80px;
	}

	.start-mode-compact {
		padding: 0.5rem 0.75rem;
		border: 1px solid #dee2e6;
		border-left: none;
		background-color: #f8f9fa;
		color: #495057;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-top-right-radius: 8px;
		border-bottom-right-radius: 8px;
		min-width: 80px;
	}

	.difficulty-compact:hover {
		background-color: #e9ecef;
		border-color: #ced4da;
	}

	.difficulty-compact:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.start-mode-compact:hover {
		background-color: #e9ecef;
		border-color: #ced4da;
	}

	.start-mode-compact:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
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
		transition:
			background-color 0.2s,
			box-shadow 0.2s;
	}
	.action-button:hover {
		background-color: #f8f9fa;
		border-color: #ced4da;
	}
	.action-button.error {
		background-color: #ffebee;
		border-color: #f44336;
		color: #c62828;
		animation: error-pulse 1s ease-in-out infinite;
	}
	.action-button.error:hover {
		background-color: #ffcdd2;
		border-color: #d32f2f;
	}
	.action-button svg {
		width: 1.1em;
		height: 1.1em;
	}

	.icon-button {
		padding: 0.5rem;
		min-width: auto;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.colorku-button {
		background-color: #f8f9fa;
		border-color: #e9ecef;
		transition: all 0.2s ease;
	}

	.colorku-button:hover {
		background-color: #e9ecef;
		border-color: #ced4da;
	}

	.colorku-button.active {
		background-color: #28a745;
		border-color: #28a745;
		color: white;
	}

	.colorku-button.active:hover {
		background-color: #218838;
		border-color: #1e7e34;
	}

	.hint-button {
		background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
		border-color: #ffc107;
		color: #212529;
		transition: all 0.2s ease;
	}

	.hint-button:hover {
		background: linear-gradient(135deg, #ffb300 0%, #ff8f00 100%);
		border-color: #ffb300;
		color: #212529;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
	}

	.hint-button.disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.hint-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.hint-button:disabled:hover {
		background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
		border-color: #ffc107;
		color: #212529;
		transform: none;
		box-shadow: none;
	}
	.number-palette {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		gap: 0.375rem; /* Reduced from 1rem */
	}

	/* Mobile adjustments for number palette */
	@media (max-width: 768px) {
		.number-palette {
			gap: 0.25rem;
		}
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.number-palette {
			gap: 0.2rem;
		}
	}
	.number-button {
		padding: 0.5rem 0; /* Reduced padding */
		font-size: 1.8rem; /* Increased font size */
		font-weight: 100; /* Much thinner font weight */
		font-family: inherit; /* Use the same font as the rest of the app */
		border: none;
		background-color: #e9ecef;
		color: #495057;
		border-radius: 8px;
		cursor: pointer;
		transition:
			background-color 0.2s,
			color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Small screen adjustments for number buttons */
	@media (max-height: 600px) {
		.number-button {
			padding: 0.3rem 0;
			font-size: 1.4rem;
			font-weight: 100; /* Keep very thin weight on small screens */
			font-family: inherit; /* Consistent font on small screens */
		}
	}
	.number-button:hover {
		background-color: #ced4da;
		color: #212529;
	}
	.number-button.highlighted {
		color: #1976d2; /* Blue color for highlighted numbers */
		font-weight: 300; /* Increase font weight when highlighted */
		background-color: #e3f2fd; /* Light blue background */
	}
	.number-button.highlighted:hover {
		background-color: #bbdefb; /* Darker blue on hover when highlighted */
		color: #1565c0;
	}
	.number-button.note-highlighted {
		background-color: #f3e5f5; /* Light purple background for note highlighting */
		border: 2px solid #9c27b0; /* Purple border */
		color: #7b1fa2; /* Purple text */
	}
	.number-button.note-highlighted:hover {
		background-color: #e1bee7; /* Darker purple on hover */
		color: #6a1b9a;
	}
	/* When both highlighted and note-highlighted, prioritize the main highlight */
	.number-button.highlighted.note-highlighted {
		background-color: #e3f2fd;
		border: 2px solid #1976d2;
		color: #1976d2;
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
		background-color: #e9ecef;
		color: #495057;
	}
	.number-button.dulled {
		opacity: 0.65;
		transition: opacity 0.2s ease;
	}

	.number-button-placeholder {
		/* Empty placeholder to maintain grid layout */
		grid-column: span 1;
	}
	.note-mode-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.25rem 0.75rem;
		background-color: #f8f9fa;
		border-radius: 12px;
		border: 1px solid #e9ecef;
	}

	.toggle-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #6c757d;
		transition: color 0.3s ease;
		user-select: none;
	}

	.toggle-label.active {
		color: #495057;
		font-weight: 600;
	}

	.toggle-switch {
		position: relative;
		width: 54px;
		height: 28px;
		background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
		border: 2px solid #ced4da;
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
		display: flex;
		align-items: center;
		outline: none;
		box-shadow: 
			inset 0 2px 4px rgba(0, 0, 0, 0.1),
			0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.toggle-switch:hover {
		border-color: #adb5bd;
		box-shadow: 
			inset 0 2px 4px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.toggle-switch:focus {
		border-color: #80bdff;
		box-shadow: 
			inset 0 2px 4px rgba(0, 0, 0, 0.1),
			0 0 0 3px rgba(0, 123, 255, 0.25);
	}

	.toggle-switch.active {
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		border-color: #28a745;
		box-shadow: 
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 2px 8px rgba(40, 167, 69, 0.3);
	}

	.toggle-switch.active:hover {
		background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
		border-color: #1e7e34;
	}

	.toggle-slider {
		position: absolute;
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		left: 3px;
		transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
		box-shadow: 
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.toggle-switch.active .toggle-slider {
		transform: translateX(26px);
		background: linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%);
		box-shadow: 
			0 3px 6px rgba(0, 0, 0, 0.3),
			0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-switch.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.toggle-switch:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.palette-color-circle {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
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
		.number-button {
			padding: 0.375rem 0;
			font-size: 1.5rem;
			font-weight: 100; /* Keep very thin weight on mobile */
			font-family: inherit; /* Consistent font on mobile */
		}
		
		.palette-color-circle {
			width: 24px;
			height: 24px;
		}
		
		.actions-row {
			gap: 0.5rem;
			margin-bottom: 0.5rem;
		}
		
		.action-button {
			padding: 0.375rem 0.75rem;
			font-size: 0.8rem;
		}

		.icon-button {
			padding: 0.375rem;
		}

		.generate-button {
			padding: 0.375rem 0.5rem;
		}

		.start-button {
			padding: 0.375rem 0.5rem;
		}

		.difficulty-compact {
			padding: 0.375rem 0.5rem;
			font-size: 0.75rem;
			min-width: 70px;
		}

		.start-mode-compact {
			padding: 0.375rem 0.5rem;
			font-size: 0.75rem;
			min-width: 70px;
		}
	}
</style>
