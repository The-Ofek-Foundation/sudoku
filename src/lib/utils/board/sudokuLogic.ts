// Sudoku-specific logic utilities

import type { CellData } from '$lib';
import { forEachCell, allCells } from './traversal.js';
import { isFilled } from './predicates.js';

/**
 * Get possible numbers for a cell based on sudoku rules
 */
export function getPossibleNumbers(
	board: CellData[][],
	row: number,
	col: number
): Set<number> {
	const possible = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]);

	// Remove numbers in the same row
	for (let i = 0; i < 9; i++) {
		if (board[row][i].value !== null) {
			possible.delete(board[row][i].value!);
		}
	}

	// Remove numbers in the same column
	for (let i = 0; i < 9; i++) {
		if (board[i][col].value !== null) {
			possible.delete(board[i][col].value!);
		}
	}

	// Remove numbers in the same 3x3 subgrid
	const subgridRow = Math.floor(row / 3) * 3;
	const subgridCol = Math.floor(col / 3) * 3;

	for (let i = subgridRow; i < subgridRow + 3; i++) {
		for (let j = subgridCol; j < subgridCol + 3; j++) {
			if (board[i][j].value !== null) {
				possible.delete(board[i][j].value!);
			}
		}
	}

	return possible;
}

/**
 * Update candidates after placing a number
 */
export function updateCandidatesAfterPlacement(
	board: CellData[][],
	row: number,
	col: number,
	num: number
): void {
	const subgridRow = Math.floor(row / 3) * 3;
	const subgridCol = Math.floor(col / 3) * 3;

	// Remove from same row and column
	for (let i = 0; i < 9; i++) {
		// Remove from same row
		if (i !== col && !board[row][i].isInitial) {
			board[row][i].candidates.delete(num);
		}

		// Remove from same column
		if (i !== row && !board[i][col].isInitial) {
			board[i][col].candidates.delete(num);
		}
	}

	// Remove from same 3x3 subgrid
	for (let i = subgridRow; i < subgridRow + 3; i++) {
		for (let j = subgridCol; j < subgridCol + 3; j++) {
			if ((i !== row || j !== col) && !board[i][j].isInitial) {
				board[i][j].candidates.delete(num);
			}
		}
	}
}

/**
 * Check if puzzle is complete (all cells filled)
 */
export function isPuzzleComplete(board: CellData[][]): boolean {
	return allCells(board, isFilled);
}
