<script lang="ts">
	import { colorKuColors } from './colors.js';
	import type { GamePhase } from '$lib';

	export let value: number | null = null;
	export let candidates: Set<number> = new Set(); // Renamed from 'notes' to match professional terminology
	export let gamePhase: GamePhase = 'configuring';
	export let highlightedNumber: number | null = null;
	export let colorKuMode: boolean = false;
	export let hintHighlight: Array<
		'primary' | 'secondary' | 'elimination'
	> | null = null;

	function getColorForNumber(num: number): string {
		return colorKuColors[num] || '#000000';
	}

	function shouldDullNote(noteNumber: number): boolean {
		return (
			colorKuMode &&
			highlightedNumber !== null &&
			highlightedNumber !== noteNumber
		);
	}
</script>

<div
	class="cell"
	class:hint-primary={hintHighlight && hintHighlight.includes('primary')}
	class:hint-secondary={hintHighlight && hintHighlight.includes('secondary')}
	class:hint-elimination={hintHighlight &&
		hintHighlight.includes('elimination')}
>
	{#if value}
		{#if colorKuMode}
			<div
				class="color-circle"
				class:highlighted={highlightedNumber === value}
				style="background-color: {colorKuColors[value]}"
			></div>
		{:else}
			<span class="value" class:highlighted={highlightedNumber === value}
				>{value}</span
			>
		{/if}
	{:else if gamePhase === 'solving' || gamePhase === 'manual' || gamePhase === 'competition'}
		<div class="notes-grid">
			{#each Array(9) as _, i}
				<div
					class="note-cell"
					class:highlighted={highlightedNumber === i + 1}
					class:dulled={shouldDullNote(i + 1)}
				>
					{#if candidates.has(i + 1)}
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
		border: 1px solid var(--color-border);
		box-sizing: border-box;
		position: relative;
	}

	.value {
		font-size: min(6vmin, 4rem); /* Increased from 4.5vmin and 3rem */
		font-weight: 100; /* Very thin font weight */
		font-family: inherit; /* Use the same font as the rest of the app */
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
			font-weight: 100; /* Keep very thin on mobile */
			font-family: inherit; /* Consistent font on mobile */
			max-width: min(10vmin, 50px);
			max-height: min(10vmin, 50px);
		}
	}

	.value.highlighted {
		color: var(--color-highlight-text); /* Blue color for highlighted numbers */
		font-weight: var(
			--font-weight-light
		); /* Increase font weight when highlighted */
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
		border: 3px solid var(--color-highlight-text);
		box-shadow: var(--shadow-hint-primary);
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
		font-weight: var(
			--font-weight-light
		); /* Medium font weight for better visibility */
		font-family: inherit; /* Use the same font as the rest of the app */
		color: var(--color-text-muted); /* Lighter gray for notes */
		transition: color var(--transition-fast);
		padding: 0;
		margin: 0;
		line-height: 1;
	}

	/* Mobile-specific note sizing */
	@media (max-width: 768px) {
		.note-cell {
			font-size: min(2.8vmin, 1rem);
			font-weight: 300; /* Keep medium weight on mobile */
			font-family: inherit; /* Consistent font on mobile */
		}
	}

	.note-cell.highlighted {
		color: var(--color-highlight-text); /* Blue color for highlighted notes */
		font-weight: var(
			--font-weight-normal
		); /* Medium-bold font weight when highlighted */
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
		border: 2px solid var(--color-highlight-text);
		box-shadow: var(--shadow-hint-primary);
		transform: scale(1.1);
	}

	/* Hint highlighting styles */
	.cell.hint-primary {
		background: var(--gradient-highlight);
		border: 2px solid var(--color-primary);
		box-shadow: var(--shadow-hint-primary);
		animation: hintPulse 2s ease-in-out infinite;
	}

	.cell.hint-secondary {
		background: var(--gradient-note);
		border: 2px solid var(--color-note-border);
		box-shadow: var(--shadow-hint-secondary);
	}

	.cell.hint-elimination {
		background: var(--gradient-elimination);
		border: 2px solid var(--color-elimination-border);
		box-shadow: var(--shadow-hint-elimination);
		animation: eliminationPulse 1.5s ease-in-out infinite;
	}

	/* Combinations for multiple highlight types */
	.cell.hint-primary.hint-secondary {
		background: var(--gradient-highlight-note);
		border: 2px solid var(--color-note-text); /* Blend of primary and secondary colors */
		box-shadow: var(--shadow-hint-primary), var(--shadow-hint-secondary);
		animation: hintPulse 2s ease-in-out infinite;
	}

	.cell.hint-primary.hint-elimination {
		background: var(--gradient-highlight-elimination);
		border: 2px solid var(--color-elimination-text); /* Blend of primary and elimination colors */
		box-shadow: var(--shadow-hint-primary), var(--shadow-hint-elimination);
		animation:
			hintPulse 2s ease-in-out infinite,
			eliminationPulse 1.5s ease-in-out infinite;
	}

	.cell.hint-secondary.hint-elimination {
		background: var(--gradient-note-elimination);
		border: 2px solid #ff6f00; /* Blend of secondary and elimination colors */
		box-shadow: var(--shadow-hint-secondary), var(--shadow-hint-elimination);
		animation: eliminationPulse 1.5s ease-in-out infinite;
	}

	.cell.hint-primary.hint-secondary.hint-elimination {
		background: var(--gradient-all-hints);
		border: 2px solid #e65100; /* Blend of all three colors */
		box-shadow:
			var(--shadow-hint-primary), var(--shadow-hint-secondary),
			var(--shadow-hint-elimination);
		animation:
			hintPulse 2s ease-in-out infinite,
			eliminationPulse 1.5s ease-in-out infinite;
	}

	@keyframes hintPulse {
		0%,
		100% {
			box-shadow: var(--shadow-hint-primary);
		}
		50% {
			box-shadow: var(--shadow-hint-primary-strong);
		}
	}

	@keyframes eliminationPulse {
		0%,
		100% {
			box-shadow: var(--shadow-hint-elimination);
		}
		50% {
			box-shadow: var(--shadow-hint-elimination-strong);
		}
	}
</style>
