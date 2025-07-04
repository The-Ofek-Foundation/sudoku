// Board format conversion utilities

import type { CellData } from '$lib';

/**
 * Convert board to string format for sudoku solver
 */
export function boardToString(board: CellData[][]): string {
	return board.flat().map(cell => cell.value?.toString() || '.').join('');
}

/**
 * Converts board to Values format for hint detection
 */
export function boardToValues(board: CellData[][]): Record<string, string> {
	const values: Record<string, string> = {};
	const rows = 'ABCDEFGHI';
	const cols = '123456789';

	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			const square = rows[i] + cols[j];
			if (board[i][j].value !== null) {
				values[square] = board[i][j].value!.toString();
			}
		}
	}

	return values;
}

/**
 * Converts board candidates to Candidates format for hint detection
 */
export function boardToCandidates(
	board: CellData[][],
): Record<string, Set<string>> {
	const candidates: Record<string, Set<string>> = {};
	const rows = 'ABCDEFGHI';
	const cols = '123456789';

	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			const square = rows[i] + cols[j];
			if (board[i][j].value === null && board[i][j].candidates.size > 0) {
				// Convert number set to string set for hint system
				candidates[square] = new Set(
					Array.from(board[i][j].candidates).map((n) => n.toString()),
				);
			}
		}
	}

	return candidates;
}

/**
 * Gets the initial puzzle (clues) for hint detection
 */
export function getInitialPuzzle(board: CellData[][]): Record<string, string> {
	const values: Record<string, string> = {};
	const rows = 'ABCDEFGHI';
	const cols = '123456789';

	for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			const square = rows[i] + cols[j];
			if (board[i][j].isInitial && board[i][j].value !== null) {
				values[square] = board[i][j].value!.toString();
			}
		}
	}

	return values;
}

/**
 * Loads a puzzle from string format into the board
 */
export function loadPuzzleFromString(
	board: CellData[][],
	puzzleString: string,
): void {
	for (let i = 0; i < 81; i++) {
		const row = Math.floor(i / 9);
		const col = i % 9;
		const char = puzzleString[i];

		if (char !== '.') {
			const value = parseInt(char);
			if (value >= 1 && value <= 9) {
				board[row][col].value = value;
				board[row][col].isInitial = true;
			}
		}
	}
}
