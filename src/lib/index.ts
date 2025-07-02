// place files you want to import through the `$lib` alias in this folder.

// Export sudoku solver and types for use throughout the application
export { default as sudoku } from './sudoku/sudoku';
export { getTechniqueDifficulty, difficultyToCategory } from './sudoku/sudoku';
export type { Square, Digit, Row, Column, Unit, Grid, Values, Candidates } from './sudoku/sudoku';
export type { ComprehensiveHint, ErrorHint, MissingCandidateHint, SingleCellHint, NakedSetHint, HiddenSetHint, IntersectionRemovalHint } from './sudoku/sudoku';
import type { Square, Digit } from './sudoku/sudoku';

// Define shared UI types that work with the sudoku solver types
export type CellData = {
	value: number | null;
	candidates: Set<number>; // Renamed from 'notes' to match sudoku terminology
	isInitial: boolean;
};

export type GamePhase = 'configuring' | 'solving' | 'manual' | 'competition';
export type InputMode = 'normal' | 'note'; // Keep 'note' as UI term while using 'candidates' internally
export type Difficulty = 'easy' | 'medium' | 'hard';

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
export function squareToCoordinates(square: Square): { row: number; col: number } {
	const rows = 'ABCDEFGHI';
	const cols = '123456789';
	return {
		row: rows.indexOf(square[0]),
		col: cols.indexOf(square[1])
	};
}