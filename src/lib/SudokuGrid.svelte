<script lang="ts">
	import Cell from '$lib/Cell.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let board: any[][];
	export let selectedCell: { row: number; col: number } | null;
	export let gamePhase: 'configuring' | 'solving' | 'manual';
	export let errorCell: { row: number; col: number } | null = null;
	export let highlightedNumber: number | null = null;
	export let colorKuMode: boolean = false;
	export let gridSize: string = '600px';

	let gridContainer: HTMLElement;

	function selectCell(row: number, col: number) {
		selectedCell = { row, col };
		dispatch('cellSelected', { row, col });
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

	function calculateOptimalGridSize() {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		
		// Estimate the height needed for controls panel and padding more accurately
		// For mobile (max-height: 600px): Controls ~100px, Padding ~20px
		// For desktop: Controls ~140px, Padding ~80px
		let controlsHeight, paddingHeight;
		
		if (viewportHeight <= 600) {
			// Small screen mode
			controlsHeight = 100;
			paddingHeight = 20;
		} else if (viewportWidth <= 768) {
			// Mobile mode
			controlsHeight = 120;
			paddingHeight = 40;
		} else {
			// Desktop mode
			controlsHeight = 140;
			paddingHeight = 80;
		}
		
		const availableHeight = viewportHeight - controlsHeight - paddingHeight;
		
		// Account for horizontal padding
		const horizontalPadding = viewportWidth <= 768 ? 16 : 32;
		const availableWidth = viewportWidth - horizontalPadding;
		
		// Choose the smaller dimension and ensure it doesn't exceed our max size
		const maxSize = Math.min(availableHeight, availableWidth, 600);
		
		// Ensure minimum size for usability
		const minSize = 240;
		const optimalSize = Math.max(minSize, maxSize);
		
		gridSize = `${optimalSize}px`;
	}

	onMount(() => {
		calculateOptimalGridSize();
		
		const handleResize = () => {
			calculateOptimalGridSize();
		};
		
		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<div class="grid-container" bind:this={gridContainer}>
	<div class="grid" style="width: {gridSize}; height: {gridSize}">
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
					class:error={errorCell && errorCell.row === i && errorCell.col === j}
					on:click={() => selectCell(i, j)}
				>
					<Cell 
						value={cell.value} 
						notes={cell.notes} 
						{gamePhase} 
						{highlightedNumber}
						{colorKuMode}
					/>
				</button>
			{/each}
		{/each}
	</div>
</div>

<style>
	.grid-container {
		flex-grow: 0;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		grid-template-rows: repeat(9, 1fr);
		border: 3px solid #343a40;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		overflow: hidden;
		transition: width 0.3s ease, height 0.3s ease;
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
	.cell-wrapper.error {
		background-color: #ffebee;
		border: 2px solid #f44336 !important;
		animation: error-pulse 0.5s ease-in-out;
	}
	@keyframes error-pulse {
		0% { background-color: #ffcdd2; }
		50% { background-color: #ffebee; }
		100% { background-color: #ffebee; }
	}
	.right-border {
		border-right: 2px solid #343a40;
	}
	.bottom-border {
		border-bottom: 2px solid #343a40;
	}
</style>
