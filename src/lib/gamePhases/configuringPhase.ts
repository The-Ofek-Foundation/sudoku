// Configuration phase handler

import { BasePhaseHandler } from './basePhase';
import type { GamePhaseContext, GamePhaseResult } from './types';

export class ConfiguringPhaseHandler extends BasePhaseHandler {
	handleNormalInput(context: GamePhaseContext, num: number): GamePhaseResult {
		const { board, selectedCell } = context;

		if (!selectedCell) {
			return { board };
		}

		const { row, col } = selectedCell;
		const newBoard = [...board];
		newBoard[row][col] = { ...newBoard[row][col], value: num };

		return { board: newBoard };
	}

	handleNoteInput(context: GamePhaseContext, num: number): GamePhaseResult {
		// Notes not supported in configuration phase
		return { board: context.board };
	}

	handleDelete(context: GamePhaseContext): GamePhaseResult {
		return this.deleteValue(context);
	}

	canDeleteCells(): boolean {
		return true;
	}

	supportsHints(): boolean {
		return false;
	}

	supportsErrorChecking(): boolean {
		return false;
	}

	validateCompletion(context: GamePhaseContext): boolean {
		return this.defaultValidateCompletion(context);
	}
}
