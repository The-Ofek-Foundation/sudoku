// Game phase strategy types and interfaces

import type { CellData, InputMode } from '$lib';

export interface GamePhaseContext {
	board: CellData[][];
	selectedCell: { row: number; col: number } | null;
	inputMode: InputMode;
	solution: { [key: string]: string } | null;
	errorCell: { row: number; col: number } | null;
	saveToHistory: () => void;
	updateCandidatesAfterPlacement: (
		board: CellData[][],
		row: number,
		col: number,
		num: number,
	) => void;
	isCorrectPlacement: (
		solution: { [key: string]: string } | null,
		row: number,
		col: number,
		num: number,
	) => boolean;
	isPuzzleComplete: () => boolean;
	checkPuzzleComplete: (board: CellData[][]) => boolean;
	onGameCompleted: () => void;
	onError: (errorCell: { row: number; col: number }) => void;
	onTimerComplete?: (finalTime: number) => void;
	timerStartTime?: number | null;
	isTimerRunning?: boolean;
}

export interface GamePhaseResult {
	board: CellData[][];
	errorCell?: { row: number; col: number } | null;
	gameCompleted?: boolean;
	timerStopped?: boolean;
	finalTime?: number;
}

export interface GamePhaseHandler {
	handleNormalInput(context: GamePhaseContext, num: number): GamePhaseResult;
	handleNoteInput(context: GamePhaseContext, num: number): GamePhaseResult;
	handleDelete?(context: GamePhaseContext): GamePhaseResult;
	canDeleteCells(): boolean;
	supportsHints(): boolean;
	supportsErrorChecking(): boolean;
	validateCompletion(context: GamePhaseContext): boolean;
}
