// Board validation utilities

import { sudoku } from '$lib';
import type { CellData } from '$lib';
import type { BoardValidationResult, SimpleValidationResult } from './types.js';
import { boardToString } from './conversion.js';

/**
 * Validate a board and return detailed results
 */
export function validateBoard(board: CellData[][]): BoardValidationResult {
	const result: BoardValidationResult = {
		isValid: false,
		hasUniqueSolution: false,
		solution: null,
		errorMessage: null,
	};

	try {
		const puzzleString = boardToString(board);
		const solution = sudoku.solve(puzzleString);

		if (solution === false) {
			result.errorMessage = 'Invalid or unsolvable puzzle';
			return result;
		}

		result.isValid = true;
		result.solution = solution;
		result.hasUniqueSolution = sudoku.isUnique(puzzleString);

		if (!result.hasUniqueSolution) {
			result.errorMessage = 'Puzzle has multiple solutions';
		}

		return result;
	} catch (error) {
		result.errorMessage = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		return result;
	}
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
