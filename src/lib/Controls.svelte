<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let gamePhase: 'configuring' | 'solving';
	export let inputMode: 'normal' | 'note';
	export let errorCell: { row: number; col: number } | null = null;

	const dispatch = createEventDispatcher();

	let isNoteMode = inputMode === 'note';

	$: isNoteMode = inputMode === 'note';

	function toggleNoteMode() {
		inputMode = isNoteMode ? 'normal' : 'note';
	}

	function startGame() {
		dispatch('startGame');
	}

	function handleDelete() {
		dispatch('handleDelete');
	}

	function undo() {
		dispatch('undo');
	}

	function handleInput(num: number) {
		dispatch('handleInput', num);
	}
</script>

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
			<div class="note-mode-toggle">
				<span class="toggle-label" class:active={!isNoteMode}>Normal</span>
				<button 
					class="toggle-switch" 
					class:active={isNoteMode}
					class:disabled={errorCell}
					disabled={errorCell !== null}
					on:click={toggleNoteMode}
					aria-label="Toggle note mode"
					role="switch"
					aria-checked={isNoteMode}
				>
					<span class="toggle-slider"></span>
				</button>
				<span class="toggle-label" class:active={isNoteMode}>Note</span>
			</div>
			<button class="action-button" class:error={errorCell} on:click={undo}>
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
			<button 
				class="number-button" 
				class:disabled={errorCell}
				disabled={errorCell !== null}
				on:click={() => handleInput(i + 1)}
			>
				{i + 1}
			</button>
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
		max-width: 600px; /* Match the grid */
		box-sizing: border-box;
		margin-top: 1rem; /* Reduced from 1rem */
	}
	.actions-row {
		display: flex;
		justify-content: flex-start;
		align-items: center;
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
		transition:
			background-color 0.2s,
			color 0.2s;
	}
	.number-button:hover {
		background-color: #ced4da;
		color: #212529;
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
</style>
