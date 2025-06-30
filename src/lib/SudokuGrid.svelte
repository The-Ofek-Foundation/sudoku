<script lang="ts">
	import Cell from '$lib/Cell.svelte';

	export let board: any[][];
	export let selectedCell: { row: number; col: number } | null;
	export let gamePhase: 'configuring' | 'solving';

	function selectCell(row: number, col: number) {
		selectedCell = { row, col };
	}

	function isHighlighted(row: number, col: number) {
		if (!selectedCell) return false;

		const { row: selectedRow, col: selectedCol } = selectedCell;

		if (row === selectedRow || col === selectedCol) {
			return true;
		}

		const startRow = Math.floor(selectedRow / 3) * 3;
		const startCol = Math.floor(selectedCol / 3) * 3;
		return (
			row >= startRow &&
			row < startRow + 3 &&
			col >= startCol &&
			col < startCol + 3
		);
	}
</script>

<div class="grid-container">
	<div class="grid">
		{#each board as row, i}
			{#each row as cell, j}
				<button
					class="cell-wrapper"
					class:right-border={(j + 1) % 3 === 0 && j < 8}
					class:bottom-border={(i + 1) % 3 === 0 && i < 8}
					class:selected={selectedCell &&
						selectedCell.row === i &&
						selectedCell.col === j}
					class:highlighted={isHighlighted(i, j)}
					on:click={() => selectCell(i, j)}
				>
					<Cell value={cell.value} notes={cell.notes} {gamePhase} />
				</button>
			{/each}
		{/each}
	</div>
</div>

<style>
	.grid-container {
		flex-grow: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		grid-template-rows: repeat(9, 1fr);
		width: 95vmin;
		height: 95vmin;
		max-width: 600px;
		max-height: 600px;
		border: 3px solid #343a40;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		overflow: hidden;
	}
	.cell-wrapper {
		position: relative;
		cursor: pointer;
		transition: background-color 0.1s ease-in-out;
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		outline: none;
	}
	.cell-wrapper.highlighted {
		background-color: #e8e8f2;
	}
	.cell-wrapper.selected {
		background-color: #d8d8e8;
	}
	.right-border {
		border-right: 2px solid #343a40;
	}
	.bottom-border {
		border-bottom: 2px solid #343a40;
	}
</style>
