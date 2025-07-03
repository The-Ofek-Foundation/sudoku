// Game phase manager - factory and coordinator

import type { GamePhase } from '$lib';
import type { GamePhaseHandler, GamePhaseContext } from './types';
import { ConfiguringPhaseHandler } from './configuringPhase';
import { ManualPhaseHandler } from './manualPhase';
import { SolvingPhaseHandler } from './solvingPhase';
import { CompetitionPhaseHandler } from './competitionPhase';

export class GamePhaseManager {
	private handlers: Record<GamePhase, GamePhaseHandler> = {
		configuring: new ConfiguringPhaseHandler(),
		manual: new ManualPhaseHandler(),
		solving: new SolvingPhaseHandler(),
		competition: new CompetitionPhaseHandler(),
	};

	getHandler(phase: GamePhase): GamePhaseHandler {
		return this.handlers[phase];
	}

	canDeleteCells(phase: GamePhase): boolean {
		return this.handlers[phase].canDeleteCells();
	}

	supportsHints(phase: GamePhase): boolean {
		return this.handlers[phase].supportsHints();
	}

	supportsErrorChecking(phase: GamePhase): boolean {
		return this.handlers[phase].supportsErrorChecking();
	}

	validateCompletion(phase: GamePhase, context: GamePhaseContext): boolean {
		return this.handlers[phase].validateCompletion(context);
	}
}

// Export types for convenience
export type {
	GamePhaseHandler,
	GamePhaseContext,
	GamePhaseResult,
} from './types';

// Create a singleton instance
export const gamePhaseManager = new GamePhaseManager();
