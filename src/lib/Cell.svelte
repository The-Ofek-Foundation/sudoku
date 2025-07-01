<script lang="ts">
	import { colorKuColors } from './colors.js';

	export let value: number | null = null;
	export let notes: Set<number> = new Set();
	export let gamePhase: 'configuring' | 'solving' = 'configuring';
	export let highlightedNumber: number | null = null;
	export let colorKuMode: boolean = false;

	function getColorForNumber(num: number): string {
		return colorKuColors[num] || '#000000';
	}

	function shouldDullNote(noteNumber: number): boolean {
		return colorKuMode && highlightedNumber !== null && highlightedNumber !== noteNumber;
	}
</script>

<div class="cell">
	{#if value}
		{#if colorKuMode}
			<div 
				class="color-circle" 
				class:highlighted={highlightedNumber === value}
				style="background-color: {colorKuColors[value]}"
			></div>
		{:else}
			<span class="value" class:highlighted={highlightedNumber === value}>{value}</span>
		{/if}
	{:else if gamePhase === 'solving'}
		<div class="notes-grid">
			{#each Array(9) as _, i}
				<div class="note-cell" class:highlighted={highlightedNumber === i + 1} class:dulled={shouldDullNote(i + 1)}>
					{#if notes.has(i + 1)}
						{#if colorKuMode}
							<div 
								class="note-color-circle"
								style="background-color: {getColorForNumber(i + 1)}"
							></div>
						{:else}
							{i + 1}
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.cell {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid #ccc;
		box-sizing: border-box;
		position: relative;
	}

	.value {
		font-size: 3em; /* Increased from 2.5em */
		transition: color 0.2s ease;
	}

	.value.highlighted {
		color: #1976d2; /* Blue color for highlighted numbers */
	}

	.color-circle {
		width: 60%;
		height: 60%;
		border-radius: 50%;
		transition: all 0.2s ease;
		border: 2px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.color-circle.highlighted {
		border: 3px solid #1976d2;
		box-shadow: 0 0 8px rgba(25, 118, 210, 0.5);
		transform: scale(1.1);
	}

	.notes-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 90%;
		height: 90%;
		position: absolute;
		gap: 1px;
	}

	.note-cell {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.1em; /* Increased from 0.8em */
		color: #adb5bd; /* Lighter gray for notes */
		transition: color 0.2s ease;
		padding: 0;
		margin: 0;
		line-height: 1;
	}

	.note-cell.highlighted {
		color: #1976d2; /* Blue color for highlighted notes */
		font-weight: 600;
	}

	.note-cell.dulled {
		opacity: 0.65;
		transition: opacity 0.2s ease;
	}

	.note-cell.dulled .note-color-circle {
		opacity: 0.7;
		filter: grayscale(15%);
	}

	.note-color-circle {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.note-cell.highlighted .note-color-circle {
		border: 2px solid #1976d2;
		box-shadow: 0 0 4px rgba(25, 118, 210, 0.4);
		transform: scale(1.1);
	}
</style>
