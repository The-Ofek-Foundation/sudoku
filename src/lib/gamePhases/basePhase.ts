// Base phase handler with shared logic

import type {
	GamePhaseHandler,
	GamePhaseContext,
	GamePhaseResult,
} from './types';

export abstract class BasePhaseHandler implements GamePhaseHandler {
	abstract handleNormalInput(
		context: GamePhaseContext,
		num: number,
	): GamePhaseResult;
	abstract canDeleteCells(): boolean;
	abstract supportsHints(): boolean;
	abstract supportsErrorChecking(): boolean;
	abstract validateCompletion(context: GamePhaseContext): boolean;

	/**
	 * Default completion validation (just check all cells filled)
	 * Can be overridden by phases that need additional validation
	 */
	protected defaultValidateCompletion(context: GamePhaseContext): boolean {
		return context.checkPuzzleComplete(context.board);
	}

	/**
	 * Shared note input logic for phases that support notes
	 * Can be overridden by phases that don't support notes
	 */
	handleNoteInput(context: GamePhaseContext, num: number): GamePhaseResult {
		const { board, selectedCell, saveToHistory } = context;

		if (!selectedCell) {
			return { board };
		}

		const { row, col } = selectedCell;
		const cell = board[row][col];

		// Don't allow modifying initial cells
		if (cell.isInitial) {
			return { board };
		}

		saveToHistory();

		const newBoard = board.map((boardRow, r) =>
			boardRow.map((boardCell, c) => {
				if (r === row && c === col) {
					const newCandidates = new Set(boardCell.candidates);
					if (newCandidates.has(num)) {
						newCandidates.delete(num);
					} else {
						newCandidates.add(num);
					}
					return {
						...boardCell,
						candidates: newCandidates,
					};
				}
				return boardCell;
			}),
		);

		return { board: newBoard };
	}

	/**
	 * Default delete implementation (no deletion allowed)
	 * Can be overridden by phases that support deletion
	 */
	handleDelete?(context: GamePhaseContext): GamePhaseResult {
		return { board: context.board };
	}

	/**
	 * Shared delete logic for phases that support deleting cell values
	 * Clears the value of the selected cell if it's not initial
	 */
	protected deleteValue(context: GamePhaseContext): GamePhaseResult {
		const { board, selectedCell } = context;

		if (!selectedCell) {
			return { board };
		}

		const { row, col } = selectedCell;
		const cell = board[row][col];

		// Don't allow deleting initial cells
		if (cell.isInitial) {
			return { board };
		}

		const newBoard = board.map((boardRow, r) =>
			boardRow.map((boardCell, c) => {
				if (r === row && c === col) {
					return {
						...boardCell,
						value: null,
					};
				}
				return boardCell;
			}),
		);

		return { board: newBoard };
	}
}
