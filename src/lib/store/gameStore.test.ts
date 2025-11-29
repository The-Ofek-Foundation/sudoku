import { describe, it, expect } from 'vitest';
import { GameStore } from './gameStore.svelte';

describe('GameStore', () => {
	it('initializes with default state', () => {
		const store = new GameStore();
		expect(store.gamePhase).toBe('configuring');
		expect(store.board).toBeDefined();
		// Check board is empty
		const hasValue = store.board.some((row) =>
			row.some((cell) => cell.value !== null),
		);
		expect(hasValue).toBe(false);
	});

	it('generates puzzle when requested', () => {
		const store = new GameStore();
		store.generatePuzzle();

		// Check board has values
		const hasValue = store.board.some((row) =>
			row.some((cell) => cell.value !== null),
		);
		expect(hasValue).toBe(true);
	}, 10000);

	it('handles input correctly', () => {
		const store = new GameStore();
		store.generatePuzzle();
		store.startGame();

		// Find an empty cell
		let targetCell = { row: 0, col: 0 };
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (store.board[r][c].value === null) {
					targetCell = { row: r, col: c };
					break;
				}
			}
		}

		store.selectedCell = targetCell;
		store.handleInput(5);

		expect(store.board[targetCell.row][targetCell.col].value).toBe(5);
	}, 15000);
});
