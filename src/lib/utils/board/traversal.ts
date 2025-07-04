// Board traversal utilities

import type { CellData } from '$lib';
import type { CellCallback, CellPredicate } from './types.js';

/**
 * Traverse all cells in the board and execute a callback for each
 */
export function forEachCell(board: CellData[][], callback: CellCallback): void {
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			callback(board[row][col], row, col, board);
		}
	}
}

/**
 * Find all cells that match a predicate
 */
export function findCells(
	board: CellData[][],
	predicate: CellPredicate,
): Array<{ row: number; col: number; cell: CellData }> {
	const results: Array<{ row: number; col: number; cell: CellData }> = [];

	forEachCell(board, (cell, row, col) => {
		if (predicate(cell, row, col, board)) {
			results.push({ row, col, cell });
		}
	});

	return results;
}

/**
 * Count cells that match a predicate
 */
export function countCells(
	board: CellData[][],
	predicate: CellPredicate,
): number {
	let count = 0;
	forEachCell(board, (cell, row, col) => {
		if (predicate(cell, row, col, board)) {
			count++;
		}
	});
	return count;
}

/**
 * Check if all cells match a predicate
 */
export function allCells(
	board: CellData[][],
	predicate: CellPredicate,
): boolean {
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			if (!predicate(board[row][col], row, col, board)) {
				return false;
			}
		}
	}
	return true;
}

/**
 * Transform each cell and return a new 2D array
 */
export function mapCells<T>(
	board: CellData[][],
	mapper: CellCallback<T>,
): T[][] {
	const result: T[][] = [];

	for (let row = 0; row < 9; row++) {
		result[row] = [];
		for (let col = 0; col < 9; col++) {
			result[row][col] = mapper(board[row][col], row, col, board);
		}
	}

	return result;
}
