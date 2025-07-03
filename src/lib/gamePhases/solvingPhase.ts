// Solving phase handler

import { BasePhaseHandler } from './basePhase';
import type { GamePhaseContext, GamePhaseResult } from './types';

export class SolvingPhaseHandler extends BasePhaseHandler {
	handleNormalInput(context: GamePhaseContext, num: number): GamePhaseResult {
		const {
			board,
			selectedCell,
			saveToHistory,
			solution,
			isCorrectPlacement,
			updateCandidatesAfterPlacement,
			isPuzzleComplete,
			onGameCompleted,
			onError,
		} = context;

		if (!selectedCell) {
			return { board };
		}

		const { row, col } = selectedCell;
		const cell = board[row][col];

		// Don't allow modifying initial cells or cells that already have values
		if (cell.isInitial || cell.value !== null) {
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

		// Check if the placement is correct
		if (!isCorrectPlacement(solution, row, col, num)) {
			onError({ row, col });
			return {
				board: newBoard,
				errorCell: { row, col },
			};
		}

		// Automatically update candidates in related cells only if correct
		updateCandidatesAfterPlacement(newBoard, row, col, num);

		// Check if puzzle is complete
		const gameCompleted = isPuzzleComplete();
		if (gameCompleted) {
			onGameCompleted();
		}

		return {
			board: newBoard,
			gameCompleted,
			errorCell: null, // Clear any previous error
		};
	}

	canDeleteCells(): boolean {
		return false;
	}

	supportsHints(): boolean {
		return true;
	}

	supportsErrorChecking(): boolean {
		return true;
	}

	validateCompletion(context: GamePhaseContext): boolean {
		return this.defaultValidateCompletion(context);
	}
}
