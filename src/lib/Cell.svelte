<script lang="ts">
	export let value: number | null = null;
	export let notes: Set<number> = new Set();
	export let gamePhase: 'configuring' | 'solving' = 'configuring';
	export let highlightedNumber: number | null = null;
</script>

<div class="cell">
	{#if value}
		<span class="value" class:highlighted={highlightedNumber === value}>{value}</span>
	{:else if gamePhase === 'solving'}
		<div class="notes-grid">
			{#each Array(9) as _, i}
				<div class="note-cell" class:highlighted={highlightedNumber === i + 1}>
					{#if notes.has(i + 1)}
						{i + 1}
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
</style>
