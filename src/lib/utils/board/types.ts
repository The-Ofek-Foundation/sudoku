// Board utility types and interfaces

import type { CellData } from '$lib';

/**
 * Result of board validation
 */
export interface BoardValidationResult {
	isValid: boolean;
	hasUniqueSolution: boolean;
	solution: { [key: string]: string } | null;
	errorMessage: string | null;
}

/**
 * Simplified validation result for cleaner usage
 */
export interface SimpleValidationResult {
	isValid: boolean;
	errorMessage?: string;
	solution?: { [key: string]: string };
}

/**
 * Callback type for board traversal functions
 */
export type CellCallback<T = void> = (
	cell: CellData,
	row: number,
	col: number,
	board: CellData[][],
) => T;

/**
 * Predicate type for filtering cells
 */
export type CellPredicate = (
	cell: CellData,
	row: number,
	col: number,
	board: CellData[][],
) => boolean;
