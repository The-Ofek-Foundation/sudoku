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
		font-size: min(6vmin, 4rem); /* Increased from 4.5vmin and 3rem */
		transition: color 0.2s ease;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		max-width: min(8vmin, 60px);
		max-height: min(8vmin, 60px);
	}

	/* Mobile-specific font sizing */
	@media (max-width: 768px) {
		.value {
			font-size: min(6.5vmin, 3.5rem); /* Increased from 5vmin and 2.5rem */
			max-width: min(10vmin, 50px);
			max-height: min(10vmin, 50px);
		}
	}

	.value.highlighted {
		color: #1976d2; /* Blue color for highlighted numbers */
	}

	.color-circle {
		width: min(6vmin, 40px);
		height: min(6vmin, 40px);
		border-radius: 50%;
		transition: all 0.2s ease;
		border: 2px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* Mobile-specific color circle sizing */
	@media (max-width: 768px) {
		.color-circle {
			width: min(7vmin, 35px);
			height: min(7vmin, 35px);
		}
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
		gap: 0.5px;
	}

	.note-cell {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: min(2.2vmin, 1.1rem); /* Larger font size for notes */
		color: #adb5bd; /* Lighter gray for notes */
		transition: color 0.2s ease;
		padding: 0;
		margin: 0;
		line-height: 1;
	}

	/* Mobile-specific note sizing */
	@media (max-width: 768px) {
		.note-cell {
			font-size: min(2.8vmin, 1rem);
		}
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
		width: min(2vmin, 12px);
		height: min(2vmin, 12px);
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	/* Mobile-specific note color circle sizing */
	@media (max-width: 768px) {
		.note-color-circle {
			width: min(2.5vmin, 10px);
			height: min(2.5vmin, 10px);
		}
	}

	.note-cell.highlighted .note-color-circle {
		border: 2px solid #1976d2;
		box-shadow: 0 0 4px rgba(25, 118, 210, 0.4);
		transform: scale(1.1);
	}
</style>
