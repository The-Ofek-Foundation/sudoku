// Board helper utilities

import type { CellData } from '$lib';
import { forEachCell, findCells } from './traversal.js';
import { hasValue } from './predicates.js';

/**
 * Get count of each number on the board
 */
export function getNumberCounts(board: CellData[][]): {
	[key: number]: number;
} {
	const counts: { [key: number]: number } = {};
	for (let i = 1; i <= 9; i++) {
		counts[i] = 0;
	}

	forEachCell(board, (cell) => {
		if (cell.value !== null) {
			counts[cell.value]++;
		}
	});

	return counts;
}

/**
 * Finds cells with the same number value
 */
export function getCellsWithSameNumber(
	board: CellData[][],
	targetNumber: number,
): { row: number; col: number }[] {
	return findCells(board, hasValue(targetNumber)).map(({ row, col }) => ({ row, col }));
}

/**
 * Checks if a placement is correct according to the solution
 */
export function isCorrectPlacement(
	solution: { [key: string]: string } | null,
	row: number,
	col: number,
	num: number,
): boolean {
	if (!solution) return true; // If no solution stored, can't verify

	// Convert row/col to sudoku library format (A1-I9)
	const rows = 'ABCDEFGHI';
	const cols = '123456789';
	const square = rows[row] + cols[col];

	return solution[square] === num.toString();
}
