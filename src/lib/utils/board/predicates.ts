// Cell predicate functions

import type { CellPredicate } from './types.js';

/**
 * Predicate to check if a cell is empty
 */
export const isEmpty: CellPredicate = (cell) => cell.value === null;

/**
 * Predicate to check if a cell is filled
 */
export const isFilled: CellPredicate = (cell) => cell.value !== null;

/**
 * Predicate to check if a cell is an initial/given cell
 */
export const isInitial: CellPredicate = (cell) => cell.isInitial;

/**
 * Creates a predicate to check if a cell has a specific value
 */
export function hasValue(value: number): CellPredicate {
	return (cell) => cell.value === value;
}
