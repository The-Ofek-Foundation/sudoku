// place files you want to import through the `$lib` alias in this folder.

// Export sudoku solver and types for use throughout the application
export { default as sudoku } from './sudoku/index';
export {
	getTechniqueDifficulty,
	difficultyToCategory,
	getHint,
	generate,
	generateWithClues,
	generateWithDifficulty,
	generateByCategory,
	evaluatePuzzleDifficulty,
	solvePuzzleWithHints,
} from './sudoku/index';
export type {
	Square,
	Digit,
	Row,
	Column,
	Unit,
	Grid,
	Values,
	Candidates,
} from './sudoku/types';
export type {
	SudokuHint,
	ErrorHint,
	MissingCandidateHint,
	SingleCellHint,
	NakedSetHint,
	HiddenSetHint,
	IntersectionRemovalHint,
} from './sudoku/hints/index';
import type { Square, Digit } from './sudoku/types';

// Define shared UI types that work with the sudoku solver types
export type CellData = {
	value: number | null;
	candidates: Set<number>; // Renamed from 'notes' to match sudoku terminology
	isInitial: boolean;
};

export type GamePhase = 'configuring' | 'solving' | 'manual' | 'competition';
export type InputMode = 'normal' | 'note'; // Keep 'note' as UI term while using 'candidates' internally
export type Difficulty =
	| 'trivial'
	| 'basic'
	| 'intermediate'
	| 'tough'
	| 'diabolical'
	| 'extreme'
	| 'master'
	| 'grandmaster';

// Export game phase management
export { gamePhaseManager } from './gamePhases/index.js';
export type {
	GamePhaseHandler,
	GamePhaseContext,
	GamePhaseResult,
} from './gamePhases/index.js';

// Export sharing utilities
export {
	encodePuzzle,
	decodePuzzle,
	generateShareText,
	createShareableUrl,
	getChallengeFromUrl,
} from './share.js';
export type { PuzzleShare } from './share.js';

// Helper function to convert between UI numbers (1-9) and sudoku solver digits ('1'-'9')
export function numberToDigit(num: number): Digit {
	return num.toString() as Digit;
}

export function digitToNumber(digit: Digit): number {
	return parseInt(digit, 10);
}

// Helper function to convert UI coordinates to sudoku square notation
export function coordinatesToSquare(row: number, col: number): Square {
	const rows = 'ABCDEFGHI';
	const cols = '123456789';
	return (rows[row] + cols[col]) as Square;
}

// Helper function to convert sudoku square notation to UI coordinates
export function squareToCoordinates(square: Square): {
	row: number;
	col: number;
} {
	const rows = 'ABCDEFGHI';
	const cols = '123456789';
	return {
		row: rows.indexOf(square[0]),
		col: cols.indexOf(square[1]),
	};
}
