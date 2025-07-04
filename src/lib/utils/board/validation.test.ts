import { describe, it, expect } from 'vitest';
import { validateBoardSimple } from './validation.js';
import { createEmptyBoard, setCellValue } from './manipulation.js';

describe('Board Validation', () => {
	it('should reject puzzles with multiple solutions', () => {
		// Create a minimal puzzle that has multiple solutions
		// Using an almost empty board which will have many solutions
		const board = createEmptyBoard();
		
		// Add just a few numbers to create a puzzle with multiple solutions
		setCellValue(board, 0, 0, 1); // A1 = 1
		setCellValue(board, 0, 1, 2); // A2 = 2
		setCellValue(board, 1, 0, 3); // B1 = 3
		
		const result = validateBoardSimple(board);
		
		expect(result.isValid).toBe(false);
		expect(result.errorMessage).toBe('Puzzle has multiple solutions');
	});

	it('should accept puzzles with unique solutions', () => {
		// Create a board with a well-defined puzzle (from the tests)
		const board = createEmptyBoard();
		
		// This is a known puzzle with a unique solution
		const puzzleString = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
		
		// Convert the puzzle string to board format
		for (let i = 0; i < puzzleString.length; i++) {
			const row = Math.floor(i / 9);
			const col = i % 9;
			const char = puzzleString[i];
			
			if (char !== '.' && char !== '0') {
				setCellValue(board, row, col, parseInt(char));
			}
		}
		
		const result = validateBoardSimple(board);
		
		expect(result.isValid).toBe(true);
		expect(result.solution).toBeDefined();
		expect(result.errorMessage).toBeUndefined();
	});

	it('should reject unsolvable puzzles', () => {
		// Create an impossible puzzle (two 1s in the same row)
		const board = createEmptyBoard();
		setCellValue(board, 0, 0, 1); // A1 = 1
		setCellValue(board, 0, 1, 1); // A2 = 1 (conflict!)
		
		const result = validateBoardSimple(board);
		
		expect(result.isValid).toBe(false);
		expect(result.errorMessage).toContain('Invalid or unsolvable puzzle');
	});
});
