// Generic hint application utility
// This module provides a clean way to apply hints without type-specific logic

import type { SudokuHint } from '$lib/sudoku/sudoku';
import type { CellData } from '$lib';
import { squareToCoordinates } from '$lib';
import { updateCandidatesAfterPlacement } from './boardUtils.js';

/**
 * Helper function to remove candidates from elimination cells
 */
function removeCandidatesFromCells(
	board: CellData[][],
	eliminationCells: string[],
	digits: string[],
): void {
	for (const square of eliminationCells) {
		const { row, col } = squareToCoordinates(square);
		for (const digit of digits) {
			board[row][col].candidates.delete(parseInt(digit));
		}
	}
}

/**
 * Gets the digits to eliminate for a given hint type
 */
function getEliminationDigits(hint: SudokuHint): string[] {
	switch (hint.type) {
		case 'naked_set':
		case 'hidden_set':
			return hint.eliminationDigits || [];
		case 'intersection_removal':
		case 'x_wing':
		case 'simple_coloring':
			return [hint.digit];
		case 'chute_remote_pairs':
			return [hint.absentDigit];
		case 'y_wing':
			return [hint.candidateC];
		default:
			return [];
	}
}

/**
 * Applies a hint to the board in a generic way
 * Returns the modified board (for functional programming style)
 */
export function applyHint(
	board: CellData[][],
	hint: SudokuHint,
	gamePhase: 'solving' | 'manual' | 'competition' | 'configuring',
): CellData[][] {
	// Create a deep copy of the board to avoid mutations
	const newBoard = board.map((row) =>
		row.map((cell) => ({
			...cell,
			candidates: new Set(cell.candidates),
		})),
	);

	// Apply the hint based on its type and properties
	switch (hint.type) {
		case 'error':
			// Fix incorrect value
			const { row: errorRow, col: errorCol } = squareToCoordinates(hint.square);
			newBoard[errorRow][errorCol].value = parseInt(hint.correctValue);
			break;

		case 'missing_candidate':
			// Add missing candidate
			const { row: candidateRow, col: candidateCol } = squareToCoordinates(
				hint.square,
			);
			newBoard[candidateRow][candidateCol].candidates.add(
				parseInt(hint.missingDigit),
			);
			break;

		case 'single_cell':
			// Place the digit and clear candidates
			const { row: singleRow, col: singleCol } = squareToCoordinates(
				hint.square,
			);
			newBoard[singleRow][singleCol].value = parseInt(hint.digit);
			newBoard[singleRow][singleCol].candidates.clear();

			// In solving mode, update notes in related cells
			if (gamePhase === 'solving') {
				updateCandidatesAfterPlacement(
					newBoard,
					singleRow,
					singleCol,
					parseInt(hint.digit),
				);
			}
			break;

		case 'naked_set':
		case 'hidden_set':
		case 'intersection_removal':
		case 'x_wing':
		case 'chute_remote_pairs':
		case 'simple_coloring':
		case 'y_wing':
			// All these hint types remove candidates from elimination cells
			const eliminationCells = hint.eliminationCells || [];
			const digitsToRemove = getEliminationDigits(hint);
			removeCandidatesFromCells(newBoard, eliminationCells, digitsToRemove);
			break;

		default:
			// Unknown hint type - return board unchanged
			console.warn('Unknown hint type:', hint);
			break;
	}

	return newBoard;
}

/**
 * Gets a list of elimination actions from a hint for display purposes
 */
export function getHintEliminationSummary(hint: SudokuHint): {
	type: 'place_value' | 'add_candidate' | 'remove_candidates';
	details: string;
} | null {
	switch (hint.type) {
		case 'error':
			return {
				type: 'place_value',
				details: `Place ${hint.correctValue} in ${hint.square}`,
			};

		case 'missing_candidate':
			return {
				type: 'add_candidate',
				details: `Add candidate ${hint.missingDigit} to ${hint.square}`,
			};

		case 'single_cell':
			return {
				type: 'place_value',
				details: `Place ${hint.digit} in ${hint.square}`,
			};

		case 'naked_set':
		case 'hidden_set':
		case 'intersection_removal':
		case 'x_wing':
		case 'chute_remote_pairs':
		case 'simple_coloring':
		case 'y_wing':
			if (hint.eliminationCells && hint.eliminationCells.length > 0) {
				const digitsToRemove = getEliminationDigits(hint);
				return {
					type: 'remove_candidates',
					details: `Remove ${digitsToRemove.join(', ')} from ${hint.eliminationCells.length} cells`,
				};
			}
			break;
	}

	return null;
}
