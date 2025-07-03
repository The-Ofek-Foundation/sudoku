// Board utility functions for validation and manipulation

import { sudoku } from '$lib';
import type { CellData } from '$lib';

/**
 * Result of board validation
 */
export interface BoardValidationResult {
	isValid: boolean;
	hasUniqueSolution: boolean;
	solution: { [key: string]: string } | null;
	errorMessage: string | null;
}

// Simplified validation result for cleaner usage
export interface SimpleValidationResult {
	isValid: boolean;
	errorMessage?: string;
	solution?: { [key: string]: string };
}

/**
 * Convert board to sudoku string format
 */
export function boardToString(board: CellData[][]): string {
	return board
		.map((row) => row.map((cell) => cell.value || '.').join(''))
		.join('');
}

/**
 * Validate a board for solvability and uniqueness
 */
export function validateBoard(board: CellData[][]): BoardValidationResult {
	const boardStr = boardToString(board);

	// Try to solve the puzzle
	const solutionResult = sudoku.solve(boardStr);

	if (solutionResult === false) {
		return {
			isValid: false,
			hasUniqueSolution: false,
			solution: null,
			errorMessage: 'This puzzle has no solution.',
		};
	}

	// Check if solution is unique
	const isUnique = sudoku.isUnique(boardStr);

	if (!isUnique) {
		return {
			isValid: false,
			hasUniqueSolution: false,
			solution: solutionResult,
			errorMessage: 'This puzzle has multiple solutions.',
		};
	}

	return {
		isValid: true,
		hasUniqueSolution: true,
		solution: solutionResult,
		errorMessage: null,
	};
}

/**
 * Simple validation that returns only what's needed
 */
export function validateBoardSimple(
	board: CellData[][],
): SimpleValidationResult {
	const result = validateBoard(board);

	if (!result.isValid) {
		return {
			isValid: false,
			errorMessage: result.errorMessage!,
		};
	}

	return {
		isValid: true,
		solution: result.solution!,
	};
}

/**
 * Calculate possible numbers for a cell based on sudoku rules
 */
export function getPossibleNumbers(
	board: CellData[][],
	row: number,
	col: number,
): Set<number> {
	const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
	const subgridRow = Math.floor(row / 3) * 3;
	const subgridCol = Math.floor(col / 3) * 3;

	// Remove numbers that exist in the same row
	for (let i = 0; i < 9; i++) {
		if (board[row][i].value !== null) {
			possible.delete(board[row][i].value!);
		}
	}

	// Remove numbers that exist in the same column
	for (let i = 0; i < 9; i++) {
		if (board[i][col].value !== null) {
			possible.delete(board[i][col].value!);
		}
	}

	// Remove numbers that exist in the same 3x3 subgrid
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
	num: number,
): void {
	const subgridRow = Math.floor(row / 3) * 3;
	const subgridCol = Math.floor(col / 3) * 3;

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
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			if (board[row][col].value === null) {
				return false;
			}
		}
	}
	return true;
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

	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			const value = board[row][col].value;
			if (value !== null) {
				counts[value]++;
			}
		}
	}

	return counts;
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

/**
 * Finds cells with the same number value
 */
export function getCellsWithSameNumber(
	board: CellData[][],
	targetNumber: number,
): { row: number; col: number }[] {
	const cellsWithNumber: { row: number; col: number }[] = [];

	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			if (board[row][col].value === targetNumber) {
				cellsWithNumber.push({ row, col });
			}
		}
	}

	return cellsWithNumber;
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
