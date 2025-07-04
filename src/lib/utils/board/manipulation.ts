// Board manipulation utilities

import type { CellData } from '$lib';

/**
 * Set a value in a specific cell
 */
export function setCellValue(
	board: CellData[][],
	row: number,
	col: number,
	value: number | null,
	isInitial: boolean = false
): void {
	board[row][col].value = value;
	if (isInitial) {
		board[row][col].isInitial = true;
	}
}

/**
 * Set candidates in a specific cell
 */
export function setCellCandidates(
	board: CellData[][],
	row: number,
	col: number,
	candidates: Set<number>
): void {
	board[row][col].candidates = new Set(candidates);
}

/**
 * Create an empty board
 */
export function createEmptyBoard(): CellData[][] {
	return Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => ({
					value: null,
					candidates: new Set<number>(),
					isInitial: false,
				})),
		);
}
