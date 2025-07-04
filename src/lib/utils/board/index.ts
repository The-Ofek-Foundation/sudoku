// Board utilities - main export file
// This file maintains backward compatibility while providing a clean modular structure

// Re-export all types
export type {
	BoardValidationResult,
	SimpleValidationResult,
	CellCallback,
	CellPredicate,
} from './types.js';

// Re-export traversal functions
export {
	forEachCell,
	findCells,
	countCells,
	allCells,
	mapCells,
} from './traversal.js';

// Re-export predicates
export {
	isEmpty,
	isFilled,
	isInitial,
	hasValue,
} from './predicates.js';

// Re-export manipulation functions
export {
	setCellValue,
	setCellCandidates,
	createEmptyBoard,
} from './manipulation.js';

// Re-export validation functions
export {
	validateBoard,
	validateBoardSimple,
} from './validation.js';

// Re-export conversion functions
export {
	boardToString,
	boardToValues,
	boardToCandidates,
	getInitialPuzzle,
	loadPuzzleFromString,
} from './conversion.js';

// Re-export sudoku logic functions
export {
	getPossibleNumbers,
	updateCandidatesAfterPlacement,
	isPuzzleComplete,
} from './sudokuLogic.js';

// Re-export helper functions
export {
	getNumberCounts,
	getCellsWithSameNumber,
	isCorrectPlacement,
} from './helpers.js';

// Additional type-only exports that might be needed
import type { CellData } from '$lib';
export type { CellData };
