<script lang="ts">
	import Cell from '$lib/Cell.svelte';
	import { onMount } from 'svelte';
	import type { GamePhase } from '$lib';

	// Callback props instead of createEventDispatcher
	export let onCellSelected: (data: { row: number; col: number }) => void;

	export let board: any[][];
	export let selectedCell: { row: number; col: number } | null;
	export let gamePhase: GamePhase;
	export let errorCell: { row: number; col: number } | null = null;
	export let highlightedNumber: number | null = null;
	export let colorKuMode: boolean = false;
	export let gridSize: string = '600px';
	export let highlightedSquares:
		| { squares: string[]; type: 'primary' | 'secondary' | 'elimination' }[]
		| null = null;
	export let showingHint: boolean = false; // New prop to indicate if hint is showing

	// Pre-compute all cell highlights reactively
	$: cellHighlights = (() => {
		// Force reactivity - accessing highlightedSquares ensures this runs when it changes
		if (highlightedSquares) {
			/* dependency tracking */
		}
		const highlights: Record<
			string,
			Array<'primary' | 'secondary' | 'elimination'>
		> = {};
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				highlights[`${i}-${j}`] = getCellHighlightTypes(i, j);
			}
		}
		return highlights;
	})();

	let gridContainer: HTMLElement;

	function selectCell(row: number, col: number) {
		selectedCell = { row, col };
		onCellSelected({ row, col });
	}

	// Helper function to convert row/col to square notation
	function coordinatesToSquare(row: number, col: number): string {
		const rows = 'ABCDEFGHI';
		const cols = '123456789';
		return rows[row] + cols[col];
	}

	// Helper function to get highlight types for a cell (can be multiple)
	function getCellHighlightTypes(
		row: number,
		col: number,
	): Array<'primary' | 'secondary' | 'elimination'> {
		if (!highlightedSquares) return [];

		const square = coordinatesToSquare(row, col);
		const types: Array<'primary' | 'secondary' | 'elimination'> = [];

		for (const highlight of highlightedSquares) {
			if (highlight.squares.includes(square)) {
				types.push(highlight.type);
			}
		}

		return types;
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
		// Check if we're in a browser environment
		if (typeof window === 'undefined') {
			gridSize = '600px'; // Default size for SSR
			return;
		}

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Estimate the height needed for controls/hints panel and padding more accurately
		// Updated calculations based on real-world measurements
		let controlsHeight, paddingHeight;

		if (viewportHeight <= 600) {
			// Small screen mode
			controlsHeight = showingHint ? 200 : 130; // Increased for hints
			paddingHeight = 40;
		} else if (viewportWidth <= 768) {
			// Mobile mode
			controlsHeight = showingHint ? 240 : 150;
			paddingHeight = 60;
		} else {
			// Desktop mode
			controlsHeight = showingHint ? 280 : 180; // More generous for hints
			paddingHeight = 100;
		}

		const availableHeight = viewportHeight - controlsHeight - paddingHeight;

		// Account for horizontal padding
		const horizontalPadding = viewportWidth <= 768 ? 16 : 32;
		const availableWidth = viewportWidth - horizontalPadding;

		// Choose the smaller dimension and ensure it doesn't exceed our max size
		const maxSize = Math.min(availableHeight, availableWidth, 600);

		// Ensure minimum size for usability
		const minSize = 180; // Reduced further for very small screens
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

	// Recalculate grid size when hint state changes
	$: if (typeof showingHint !== 'undefined') {
		calculateOptimalGridSize();
	}
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
						candidates={cell.candidates}
						{gamePhase}
						{highlightedNumber}
						{colorKuMode}
						hintHighlight={cellHighlights[`${i}-${j}`]}
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
		border: 3px solid var(--color-dark);
		box-shadow: var(--shadow-md);
		border-radius: var(--radius-sm);
		overflow: hidden;
		transition:
			width var(--transition-smooth),
			height var(--transition-smooth);
		box-sizing: border-box;
	}
	.cell-wrapper {
		position: relative;
		cursor: pointer;
		transition: background-color var(--transition-fast);
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		outline: none;
	}
	.cell-wrapper.highlighted {
		background-color: var(--color-light-hover);
	}
	.cell-wrapper.selected {
		background-color: var(--color-medium);
	}
	.cell-wrapper.error {
		background-color: var(--color-error);
		border: 2px solid var(--color-error-border) !important;
		animation: error-pulse 0.5s ease-in-out;
	}
	@keyframes error-pulse {
		0% {
			background-color: var(--color-error-pulse);
		}
		50% {
			background-color: var(--color-error);
		}
		100% {
			background-color: var(--color-error);
		}
	}
	.right-border {
		border-right: 2px solid var(--color-dark);
	}
	.bottom-border {
		border-bottom: 2px solid var(--color-dark);
	}
</style>
