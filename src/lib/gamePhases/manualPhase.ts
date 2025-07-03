// Manual phase handler

import { BasePhaseHandler } from './basePhase';
import type { GamePhaseContext, GamePhaseResult } from './types';

export class ManualPhaseHandler extends BasePhaseHandler {
	handleNormalInput(context: GamePhaseContext, num: number): GamePhaseResult {
		const {
			board,
			selectedCell,
			saveToHistory,
			isPuzzleComplete,
			onGameCompleted,
		} = context;

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
					return {
						...boardCell,
						value: num,
						candidates: new Set<number>(), // Clear candidates when placing a number
					};
				}
				return boardCell;
			}),
		);

		// Check if puzzle is complete
		const gameCompleted = isPuzzleComplete();
		if (gameCompleted) {
			onGameCompleted();
		}

		return {
			board: newBoard,
			gameCompleted,
		};
	}

	handleDelete(context: GamePhaseContext): GamePhaseResult {
		return this.deleteValue(context);
	}

	canDeleteCells(): boolean {
		return true; // Manual phase allows deletion
	}

	supportsHints(): boolean {
		return true;
	}

	supportsErrorChecking(): boolean {
		return false;
	}

	validateCompletion(context: GamePhaseContext): boolean {
		return this.defaultValidateCompletion(context);
	}
}
