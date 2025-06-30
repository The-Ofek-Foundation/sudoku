<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let gamePhase: 'configuring' | 'solving';
	export let inputMode: 'normal' | 'note';

	const dispatch = createEventDispatcher();

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
			<div class="toggle-switch">
				<input
					type="checkbox"
					id="note-mode"
					bind:checked={inputMode === 'note'}
					on:change={() => (inputMode = inputMode === 'note' ? 'normal' : 'note')}
				/>
				<label for="note-mode">Note Mode</label>
			</div>
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
			<button class="number-button" on:click={() => handleInput(i + 1)}
				>{i + 1}</button
			>
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
	.toggle-switch {
		display: flex;
		align-items: center;
	}
	.toggle-switch input {
		display: none;
	}
	.toggle-switch label {
		display: block;
		width: 40px;
		height: 20px;
		background-color: #ccc;
		border-radius: 10px;
		position: relative;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.toggle-switch label::after {
		content: '';
		display: block;
		width: 16px;
		height: 16px;
		background-color: #fff;
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: left 0.2s;
	}
	.toggle-switch input:checked + label {
		background-color: #4caf50;
	}
	.toggle-switch input:checked + label::after {
		left: 22px;
	}
</style>
