// Competition phase handler

import { BasePhaseHandler } from './basePhase';
import type { GamePhaseContext, GamePhaseResult } from './types';

export class CompetitionPhaseHandler extends BasePhaseHandler {
	handleNormalInput(context: GamePhaseContext, num: number): GamePhaseResult {
		const {
			board,
			selectedCell,
			saveToHistory,
			updateCandidatesAfterPlacement,
			isPuzzleComplete,
			onGameCompleted,
			onTimerComplete,
			timerStartTime,
			isTimerRunning,
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

		// Always update candidates in related cells (no error checking in competition mode)
		updateCandidatesAfterPlacement(newBoard, row, col, num);

		// Check if puzzle is complete
		const gameCompleted = isPuzzleComplete();
		let timerStopped = false;
		let finalTime: number | undefined;

		if (gameCompleted && isTimerRunning && timerStartTime && onTimerComplete) {
			// Stop timer and record final time
			timerStopped = true;
			finalTime = Date.now() - timerStartTime;
			onTimerComplete(finalTime);
			onGameCompleted();
		}

		return {
			board: newBoard,
			gameCompleted,
			timerStopped,
			finalTime,
		};
	}

	canDeleteCells(): boolean {
		return false;
	}

	supportsHints(): boolean {
		return false; // No hints in competition mode
	}

	supportsErrorChecking(): boolean {
		return false; // No error checking in competition mode
	}

	validateCompletion(context: GamePhaseContext): boolean {
		// First check if all cells are filled
		if (!context.checkPuzzleComplete(context.board)) {
			return false;
		}

		// In competition mode, also verify the solution is correct
		const { board, solution, isCorrectPlacement } = context;
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				const cellValue = board[row][col].value;
				if (
					cellValue === null ||
					!isCorrectPlacement(solution, row, col, cellValue)
				) {
					return false;
				}
			}
		}
		return true;
	}
}
