<script lang="ts">
	import Cell from '$lib/Cell.svelte';
	import { onMount } from 'svelte';
	import type { GamePhase } from '$lib';
	import { coordinatesToSquare } from '$lib';

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
		| {
				squares?: string[];
				unit?: { type: 'row' | 'column' | 'box'; index: number };
				candidateEliminations?: { square: string; digits: string[] }[];
				highlightType: 'primary' | 'secondary' | 'elimination';
		  }[]
		| null = null;
	export let showingHint: boolean = false; // New prop to indicate if hint is showing

	// Pre-compute all cell highlights and candidate eliminations reactively
	$: cellHighlights = (() => {
		// Force reactivity - accessing highlightedSquares ensures this runs when it changes
		if (highlightedSquares) {
			/* dependency tracking */
		}
		const highlights: Record<
			string,
			Array<'primary' | 'secondary' | 'elimination'>
		> = {};
		const candidateEliminations: Record<string, string[]> = {};

		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				const key = `${i}-${j}`;
				highlights[key] = getCellHighlightTypes(i, j);
				candidateEliminations[key] = getCellCandidateEliminations(i, j);
			}
		}
		return { highlights, candidateEliminations };
	})();

	let gridContainer: HTMLElement;

	function selectCell(row: number, col: number) {
		selectedCell = { row, col };
		onCellSelected({ row, col });
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
			// Check if this cell is directly highlighted via squares array
			if (highlight.squares && highlight.squares.includes(square)) {
				types.push(highlight.highlightType);
			}
			// Check if this cell is part of a highlighted unit
			else if (highlight.unit) {
				const { type, index } = highlight.unit;
				let isInUnit = false;

				if (type === 'row' && row === index) {
					isInUnit = true;
				} else if (type === 'column' && col === index) {
					isInUnit = true;
				} else if (type === 'box') {
					const boxRow = Math.floor(index / 3);
					const boxCol = index % 3;
					const cellBoxRow = Math.floor(row / 3);
					const cellBoxCol = Math.floor(col / 3);
					isInUnit = boxRow === cellBoxRow && boxCol === cellBoxCol;
				}

				if (isInUnit) {
					types.push(highlight.highlightType);
				}
			}
		}

		return types;
	}

	// Helper function to get candidate eliminations for a cell
	function getCellCandidateEliminations(row: number, col: number): string[] {
		if (!highlightedSquares) return [];

		const square = coordinatesToSquare(row, col);
		const eliminations: string[] = [];

		for (const highlight of highlightedSquares) {
			if (highlight.candidateEliminations) {
				for (const elimination of highlight.candidateEliminations) {
					if (elimination.square === square) {
						eliminations.push(...elimination.digits);
					}
				}
			}
		}

		// Remove duplicates
		return [...new Set(eliminations)];
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

	// Compute unit overlays for cleaner unit highlighting
	$: unitOverlays = (() => {
		if (!highlightedSquares) return [];

		return highlightedSquares
			.filter((h) => h.unit)
			.map((h) => ({
				...h.unit!,
				highlightType: h.highlightType,
			}));
	})();

	// Function to get CSS positioning for unit overlays
	function getUnitOverlayStyle(overlay: {
		type: 'row' | 'column' | 'box';
		index: number;
	}): string {
		if (overlay.type === 'row') {
			const top = (overlay.index / 9) * 100;
			const height = 100 / 9;
			return `top: ${top}%; left: 0%; width: 100%; height: ${height}%;`;
		} else if (overlay.type === 'column') {
			const left = (overlay.index / 9) * 100;
			const width = 100 / 9;
			return `top: 0%; left: ${left}%; width: ${width}%; height: 100%;`;
		} else {
			// box
			const boxRow = Math.floor(overlay.index / 3);
			const boxCol = overlay.index % 3;
			const top = (boxRow / 3) * 100;
			const left = (boxCol / 3) * 100;
			const width = 100 / 3;
			const height = 100 / 3;
			return `top: ${top}%; left: ${left}%; width: ${width}%; height: ${height}%;`;
		}
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
						hintHighlight={cellHighlights.highlights[`${i}-${j}`]}
						eliminationCandidates={cellHighlights.candidateEliminations[
							`${i}-${j}`
						]}
					/>
				</button>
			{/each}
		{/each}

		<!-- Unit-level highlighting overlays -->
		{#each unitOverlays as overlay}
			<div
				class="unit-overlay unit-{overlay.type} unit-highlight-{overlay.highlightType}"
				style={getUnitOverlayStyle(overlay)}
			></div>
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
		position: relative; /* Added for unit overlays */
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

	/* Unit overlay styles */
	.unit-overlay {
		position: absolute;
		pointer-events: none; /* Allow clicks to pass through */
		border-radius: var(--radius-xs);
		z-index: 1; /* Above cells but below individual cell highlights */
		transition: all var(--transition-fast);
		box-sizing: border-box;
	}

	/* Unit highlight styles based on type - more transparent */
	.unit-highlight-primary {
		background: linear-gradient(
			135deg,
			rgba(33, 150, 243, 0.15),
			rgba(33, 150, 243, 0.25)
		);
		border: 2px solid rgba(33, 150, 243, 0.6);
		box-shadow: 0 0 8px rgba(33, 150, 243, 0.3);
		animation: unitHintPulse 2s ease-in-out infinite;
	}

	.unit-highlight-secondary {
		background: linear-gradient(
			135deg,
			rgba(156, 39, 176, 0.12),
			rgba(156, 39, 176, 0.2)
		);
		border: 2px solid rgba(156, 39, 176, 0.5);
		box-shadow: 0 0 8px rgba(156, 39, 176, 0.25);
	}

	.unit-highlight-elimination {
		background: linear-gradient(
			135deg,
			rgba(255, 152, 0, 0.15),
			rgba(255, 152, 0, 0.25)
		);
		border: 2px solid rgba(255, 152, 0, 0.6);
		box-shadow: 0 0 8px rgba(255, 152, 0, 0.3);
		animation: unitEliminationPulse 1.5s ease-in-out infinite;
	}

	/* Special styles for different unit types */
	.unit-row,
	.unit-column {
		/* Rows and columns get slightly thicker borders and minimal rounding */
		border-width: 2px;
		border-radius: 2px;
	}

	.unit-box {
		/* Boxes get slightly more rounded corners and thicker borders */
		border-radius: 4px;
		border-width: 2px;
	}

	@keyframes unitHintPulse {
		0%,
		100% {
			box-shadow: 0 0 8px rgba(33, 150, 243, 0.3);
			opacity: 0.7;
		}
		50% {
			box-shadow: 0 0 16px rgba(33, 150, 243, 0.5);
			opacity: 0.9;
		}
	}

	@keyframes unitEliminationPulse {
		0%,
		100% {
			box-shadow: 0 0 8px rgba(255, 152, 0, 0.3);
			opacity: 0.7;
		}
		50% {
			box-shadow: 0 0 12px rgba(255, 152, 0, 0.5);
			opacity: 0.9;
		}
	}
</style>
