<script lang="ts">
	import { colorKuColors } from './colors.js';
	import type { GamePhase } from '$lib';

	export let value: number | null = null;
	export let candidates: Set<number> = new Set(); // Renamed from 'notes' to match professional terminology
	export let gamePhase: GamePhase = 'configuring';
	export let highlightedNumber: number | null = null;
	export let colorKuMode: boolean = false;
	export let eliminationCandidates: string[] = []; // Specific candidates to highlight for elimination
	export let candidateHighlights: { digit: string; color: 'on' | 'off' }[] = []; // Candidates to highlight with ON/OFF colors

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

	function shouldHighlightEliminationCandidate(noteNumber: number): boolean {
		return eliminationCandidates.includes(noteNumber.toString());
	}

	function getCandidateHighlightColor(noteNumber: number): 'on' | 'off' | null {
		const highlight = candidateHighlights.find(
			(h) => h.digit === noteNumber.toString(),
		);
		return highlight ? highlight.color : null;
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
					class:elimination-highlight={shouldHighlightEliminationCandidate(
						i + 1,
					)}
					class:coloring-on={getCandidateHighlightColor(i + 1) === 'on'}
					class:coloring-off={getCandidateHighlightColor(i + 1) === 'off'}
				>
					{#if candidates.has(i + 1)}
						{#if colorKuMode}
							<div
								class="note-color-circle"
								class:elimination-highlight={shouldHighlightEliminationCandidate(
									i + 1,
								)}
								class:coloring-on={getCandidateHighlightColor(i + 1) === 'on'}
								class:coloring-off={getCandidateHighlightColor(i + 1) === 'off'}
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

	/* Note highlighting for individual candidate elimination */
	.note-cell.elimination-highlight {
		color: var(--color-elimination-text);
		font-weight: var(--font-weight-bold);
		background: rgba(255, 152, 0, 0.3);
		border: 2px solid var(--color-elimination-text);
		border-radius: var(--radius-xs);
		animation: eliminationNotePulse 1.5s ease-in-out infinite;
	}

	.note-color-circle.elimination-highlight {
		border: 3px solid var(--color-elimination-text) !important;
		box-shadow: var(--shadow-hint-elimination);
		animation: eliminationNotePulse 1.5s ease-in-out infinite;
		transform: scale(1.1);
	}

	@keyframes eliminationNotePulse {
		0%,
		100% {
			background: rgba(255, 152, 0, 0.2);
			transform: scale(1);
		}
		50% {
			background: rgba(255, 152, 0, 0.35);
			transform: scale(1.05);
		}
	}

	/* Candidate coloring highlights for Simple Coloring technique */
	.note-cell.coloring-on {
		color: white;
		font-weight: var(--font-weight-bold);
		background: rgba(220, 38, 127, 0.8); /* Pink/magenta for "ON" */
		border: 2px solid rgb(220, 38, 127);
		border-radius: var(--radius-xs);
	}

	.note-cell.coloring-off {
		color: white;
		font-weight: var(--font-weight-bold);
		background: rgba(34, 197, 94, 0.8); /* Green for "OFF" */
		border: 2px solid rgb(34, 197, 94);
		border-radius: var(--radius-xs);
	}

	.note-color-circle.coloring-on {
		border: 3px solid rgb(220, 38, 127) !important;
		box-shadow: 0 0 8px rgba(220, 38, 127, 0.6);
		transform: scale(1.2);
	}

	.note-color-circle.coloring-off {
		border: 3px solid rgb(34, 197, 94) !important;
		box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
		transform: scale(1.2);
	}
</style>
