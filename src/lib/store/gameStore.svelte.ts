import {
	createEmptyBoard,
	getNumberCounts,
	boardToValues,
	boardToCandidates,
	getInitialPuzzle,
	getCellsWithSameNumber,
	setCellValue,
	setCellCandidates,
	forEachCell,
	validateBoardSimple,
	updateCandidatesAfterPlacement,
	isCorrectPlacement,
	isPuzzleComplete as checkPuzzleComplete,
	getPossibleNumbers,
} from '$lib/utils/boardUtils';
import type { CellData, Difficulty, GamePhase, InputMode } from '$lib';
import { generateByCategory, sudoku } from '$lib';
import { gamePhaseManager } from '$lib/gamePhases';
import { applyHint } from '$lib/utils/hintApplication.js';
import type { SudokuHint } from '$lib/sudoku/sudoku';
import {
	encodePuzzle,
	generateShareText,
	createShareableUrl,
} from '$lib/share.js';

import {
	initSudoku,
	generateByCategoryFast,
} from '../sudoku/fast-sudoku/adapter.js';

export class GameStore {
	board = $state<CellData[][]>(createEmptyBoard());
	selectedCell = $state<{ row: number; col: number } | null>(null);
	gamePhase = $state<GamePhase>('configuring');
	inputMode = $state<InputMode>('normal');
	difficulty = $state<Difficulty>('basic');
	highlightedNumber = $state<number | null>(null);
	errorCell = $state<{ row: number; col: number } | null>(null);
	isGameCompleted = $state(false);
	timerStartTime = $state<number | null>(null);
	timerFinalTime = $state<number | null>(null);
	isTimerRunning = $state(false);
	colorKuMode = $state(false);
	gameMode = $state<'solving' | 'manual' | 'competition'>('solving');

	// Hint state
	currentHint = $state<SudokuHint | null>(null);
	showingHint = $state(false);
	highlightedSquares = $state<any[] | null>(null);

	// Share state
	showShareModal = $state(false);
	shareText = $state('');
	shareUrl = $state('');
	showCongratulationsModal = $state(false);
	errorMessage = $state<string | null>(null);

	// Internal state
	history: CellData[][][] = [];
	solution: { [key: string]: string } | null = null;
	cyclingNumber: number | null = null;

	private initPromise: Promise<void> | null = null;

	constructor() {
		this.init();
	}

	get numberCounts() {
		return getNumberCounts(this.board);
	}

	// --- Actions ---

	async init() {
		if (!this.initPromise) {
			console.log('Initializing Sudoku WASM...');
			this.initPromise = initSudoku();
		}
		try {
			await this.initPromise;
			console.log('Sudoku WASM initialized');
		} catch (e) {
			console.error('Failed to initialize Sudoku WASM:', e);
			this.initPromise = null; // Retry on next call
		}
	}

	generatePuzzle() {
		this.board = createEmptyBoard();

		// Use the fast generator
		console.time('generateByCategoryFast');
		const generationResult = generateByCategoryFast(this.difficulty);
		console.timeEnd('generateByCategoryFast');

		const generatedPuzzle = generationResult.puzzle;
		console.log(generatedPuzzle);
		console.log('Difficulty Score:', generationResult.actualDifficulty);

		// check difficulty

		const rows = 'ABCDEFGHI';
		const cols = '123456789';

		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				const square = rows[r] + cols[c];
				if (generatedPuzzle[square]) {
					this.board[r][c].value = parseInt(generatedPuzzle[square]);
					this.board[r][c].isInitial = true;
				}
			}
		}
		this.errorCell = null;
		this.isGameCompleted = false;
		this.errorMessage = null;
	}

	// generatePuzzle() {
	// 	this.board = createEmptyBoard();
	// 	const generationResult = generateByCategory(this.difficulty);
	// 	const generatedPuzzle = generationResult.puzzle as {
	// 		[key: string]: string;
	// 	};

	// 	const rows = 'ABCDEFGHI';
	// 	const cols = '123456789';

	// 	for (let r = 0; r < 9; r++) {
	// 		for (let c = 0; c < 9; c++) {
	// 			const square = rows[r] + cols[c];
	// 			if (generatedPuzzle[square]) {
	// 				this.board[r][c].value = parseInt(generatedPuzzle[square]);
	// 				this.board[r][c].isInitial = true;
	// 			}
	// 		}
	// 	}
	// 	this.errorCell = null;
	// 	this.isGameCompleted = false;
	// 	this.errorMessage = null;
	// }

	startGame() {
		const validation = validateBoardSimple(this.board);

		if (!validation.isValid) {
			this.errorMessage =
				validation.errorMessage || 'Invalid puzzle configuration';
			return;
		}

		this.errorMessage = null;
		this.solution = validation.solution!;
		this.gamePhase = 'solving';
		this.initializeBoardForGamePhase('solving');
	}

	startManualGame() {
		this.errorMessage = null;
		this.solution = null;
		this.gamePhase = 'manual';
		this.initializeBoardForGamePhase('manual');
	}

	startCompetitionGame() {
		const validation = validateBoardSimple(this.board);

		if (!validation.isValid) {
			this.errorMessage =
				validation.errorMessage || 'Invalid puzzle configuration';
			return;
		}

		this.errorMessage = null;
		this.solution = validation.solution!;
		this.gamePhase = 'competition';

		this.timerStartTime = Date.now();
		this.timerFinalTime = null;
		this.isTimerRunning = true;

		this.initializeBoardForGamePhase('competition');
	}

	startNewGame() {
		this.gamePhase = 'configuring';
		this.showCongratulationsModal = false;
		this.isGameCompleted = false;
		this.selectedCell = null;
		this.highlightedNumber = null;
		this.cyclingNumber = null;
		this.errorMessage = null;
		this.errorCell = null;
		this.solution = null;
		this.history = [];
		this.showingHint = false;
		this.currentHint = null;
		this.highlightedSquares = null;
		this.board = createEmptyBoard();
	}

	// --- Input Handling ---

	handleInput(num: number) {
		this.highlightedNumber = num;

		if (
			this.errorCell &&
			gamePhaseManager.supportsErrorChecking(this.gamePhase)
		)
			return;
		if (!this.selectedCell) return;

		const handler = gamePhaseManager.getHandler(this.gamePhase);
		const context = this.createGameContext();

		const result =
			this.inputMode === 'normal'
				? handler.handleNormalInput(context, num)
				: handler.handleNoteInput(context, num);

		this.board = result.board;

		if (result.errorCell !== undefined) {
			this.errorCell = result.errorCell;
		}

		if (result.timerStopped) {
			this.isTimerRunning = false;
			if (result.finalTime) {
				this.timerFinalTime = result.finalTime;
			}
		}

		if (result.gameCompleted) {
			this.isGameCompleted = true;
			if (this.gamePhase === 'competition') {
				this.showShareModalForCompletion();
			} else {
				this.showCongratulationsModal = true;
			}
		}

		if (
			this.gamePhase === 'competition' &&
			this.isPuzzleComplete() &&
			!this.isGameCompleted
		) {
			this.isGameCompleted = true;
			this.isTimerRunning = false;
			if (!this.timerFinalTime && this.timerStartTime) {
				this.timerFinalTime = Date.now() - this.timerStartTime;
			}
			this.showShareModalForCompletion();
		}
	}

	handleDelete() {
		if (!this.selectedCell || !gamePhaseManager.canDeleteCells(this.gamePhase))
			return;

		const handler = gamePhaseManager.getHandler(this.gamePhase);
		if (!handler.handleDelete) return;

		const result = handler.handleDelete(this.createGameContext());
		this.board = result.board;
	}

	undo() {
		if (this.history.length > 0) {
			const lastBoard = this.history.pop();
			if (lastBoard) {
				this.board = lastBoard.map((row) =>
					row.map((cell) => ({
						...cell,
						candidates: new Set(cell.candidates),
					})),
				);
				this.errorCell = null;
			}
		}
	}

	// --- Hints ---

	getHint() {
		if (!gamePhaseManager.supportsHints(this.gamePhase)) return;

		this.closeHint();

		const currentValues = boardToValues(this.board);
		let hint: SudokuHint | null = null;
		const currentCandidates = boardToCandidates(this.board);

		if (this.gamePhase === 'solving') {
			const initialPuzzle = getInitialPuzzle(this.board);
			hint = sudoku.getHint(initialPuzzle, currentValues, currentCandidates);
		} else {
			hint = sudoku.getHint(currentValues, currentValues, currentCandidates);
		}

		if (hint) {
			this.currentHint = hint;
			this.showingHint = true;
			this.selectedCell = null;
			this.highlightedNumber = null;
			this.cyclingNumber = null;
		}
	}

	closeHint() {
		this.showingHint = false;
		this.currentHint = null;
		this.highlightedSquares = null;
	}

	handleApplyHint() {
		if (!this.currentHint) return;

		this.saveToHistory();
		this.board = applyHint(this.board, this.currentHint, this.gamePhase);

		if (this.currentHint.type === 'error') {
			this.errorCell = null;
		}

		if (
			(this.gamePhase === 'solving' || this.gamePhase === 'manual') &&
			this.isPuzzleComplete()
		) {
			this.isGameCompleted = true;
			this.showCongratulationsModal = true;
		}

		this.closeHint();
	}

	handleHighlight(data: any) {
		if (!this.highlightedSquares) {
			this.highlightedSquares = [data];
		} else {
			this.highlightedSquares = this.highlightedSquares.filter(
				(h) => h.highlightType !== data.highlightType,
			);
			this.highlightedSquares.push(data);
		}
	}

	handleClearHighlights() {
		this.highlightedSquares = null;
	}

	// --- Sharing ---

	showShareModalForCompletion() {
		const encoded = encodePuzzle(
			this.board,
			this.difficulty,
			this.timerFinalTime || undefined,
			this.colorKuMode,
		);
		this.shareText = generateShareText(
			this.timerFinalTime || undefined,
			this.difficulty,
		);
		this.shareUrl = createShareableUrl(encoded);
		this.showShareModal = true;
	}

	showShareModalForConfiguration() {
		const validation = validateBoardSimple(this.board);
		if (!validation.isValid) {
			this.errorMessage =
				validation.errorMessage || 'Invalid puzzle configuration';
			return;
		}
		this.errorMessage = null;
		const encoded = encodePuzzle(
			this.board,
			this.difficulty,
			undefined,
			this.colorKuMode,
		);
		this.shareText = generateShareText(undefined, this.difficulty);
		this.shareUrl = createShareableUrl(encoded);
		this.showShareModal = true;
	}

	closeShareModal() {
		this.showShareModal = false;
	}

	closeCongratulationsModal() {
		this.showCongratulationsModal = false;
	}

	// --- Challenge ---

	loadChallengeBoard(puzzleData: any) {
		this.board = createEmptyBoard();
		for (let i = 0; i < 81; i++) {
			const row = Math.floor(i / 9);
			const col = i % 9;
			const char = puzzleData.puzzle[i];
			if (char !== '.') {
				const value = parseInt(char);
				if (value >= 1 && value <= 9) {
					this.board[row][col].value = value;
					this.board[row][col].isInitial = true;
				}
			}
		}
		if (puzzleData.difficulty) {
			this.difficulty = puzzleData.difficulty;
		}
		this.colorKuMode = puzzleData.colorKuMode || false;
		this.errorMessage = null;
	}

	startChallengeFromUrl(challengeData: any, replaceState: any) {
		if (!challengeData) return;

		this.loadChallengeBoard(challengeData);

		const validation = validateBoardSimple(this.board);
		if (!validation.isValid) {
			this.errorMessage =
				validation.errorMessage || 'Invalid puzzle configuration';
			return false; // Indicate failure
		}

		this.errorMessage = null;
		this.solution = validation.solution!;
		this.gamePhase = 'competition';
		this.timerStartTime = Date.now();
		this.timerFinalTime = null;
		this.isTimerRunning = true;

		this.initializeBoardForGamePhase('competition');

		// URL handling should be done by the caller or passed in callback
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.delete('challenge');
			replaceState(url, {});
		}
		return true; // Indicate success
	}

	// --- Helpers ---

	createGameContext() {
		return {
			board: this.board,
			selectedCell: this.selectedCell,
			inputMode: this.inputMode,
			solution: this.solution,
			errorCell: this.errorCell,
			saveToHistory: () => this.saveToHistory(),
			updateCandidatesAfterPlacement: updateCandidatesAfterPlacement,
			isCorrectPlacement: isCorrectPlacement,
			isPuzzleComplete: () => this.isPuzzleComplete(),
			checkPuzzleComplete: checkPuzzleComplete,
			onGameCompleted: () => {
				this.isGameCompleted = true;
				this.showCongratulationsModal = true;
			},
			onError: (error: { row: number; col: number }) => {
				this.errorCell = error;
			},
			onTimerComplete: (finalTime: number) => {
				this.isTimerRunning = false;
				this.timerFinalTime = finalTime;
			},
			timerStartTime: this.timerStartTime,
			isTimerRunning: this.isTimerRunning,
		};
	}

	saveToHistory() {
		const newBoard = this.board.map((row) =>
			row.map((cell) => ({
				...cell,
				candidates: new Set(cell.candidates),
			})),
		);
		this.history.push(newBoard);
	}

	initializeBoardForGamePhase(gameMode: 'solving' | 'manual' | 'competition') {
		forEachCell(this.board, (cell, row, col) => {
			if (cell.value !== null) {
				cell.isInitial = true;
			} else {
				if (gameMode === 'manual') {
					setCellCandidates(
						this.board,
						row,
						col,
						new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]),
					);
				} else {
					setCellCandidates(
						this.board,
						row,
						col,
						getPossibleNumbers(this.board, row, col),
					);
				}
			}
		});
		this.saveToHistory();
	}

	isPuzzleComplete() {
		return gamePhaseManager.validateCompletion(this.gamePhase, {
			...this.createGameContext(),
			isPuzzleComplete: () => false, // Break recursion
		});
	}

	updateHighlightedNumber(row: number, col: number) {
		const cellValue = this.board[row][col].value;
		if (cellValue !== null) {
			this.highlightedNumber = cellValue;
			this.cyclingNumber = null;
		} else if (
			(this.gamePhase === 'solving' ||
				this.gamePhase === 'manual' ||
				this.gamePhase === 'competition') &&
			this.board[row][col].candidates.size > 0
		) {
			if (this.highlightedNumber !== null) {
				if (
					this.inputMode === 'note' ||
					this.board[row][col].candidates.has(this.highlightedNumber)
				) {
					this.cyclingNumber = this.highlightedNumber;
					return;
				}
			}
			this.highlightedNumber = null;
			this.startCycling();
		} else {
			this.highlightedNumber = null;
			this.cyclingNumber = null;
		}
	}

	getAvailableNumbersForCycling(): number[] {
		if (
			!this.selectedCell ||
			(this.gamePhase !== 'solving' &&
				this.gamePhase !== 'manual' &&
				this.gamePhase !== 'competition')
		)
			return [];

		const { row, col } = this.selectedCell;
		const cell = this.board[row][col];

		// Only cycle for empty cells
		if (cell.value !== null) return [];

		if (this.inputMode === 'normal') {
			// In solving, manual, and competition mode, cycle through numbers that have candidates
			return Array.from(cell.candidates).sort();
		} else {
			// In note mode, cycle through all numbers 1-9 for all modes
			return [1, 2, 3, 4, 5, 6, 7, 8, 9];
		}
	}

	startCycling() {
		const availableNumbers = this.getAvailableNumbersForCycling();
		if (availableNumbers.length === 0) return;

		// Start with the smallest available number
		this.cyclingNumber = availableNumbers[0];
		this.highlightedNumber = this.cyclingNumber;
	}

	cycleToNextNumber() {
		const availableNumbers = this.getAvailableNumbersForCycling();
		if (availableNumbers.length === 0) return;

		if (this.cyclingNumber === null) {
			this.startCycling();
			return;
		}

		const currentIndex = availableNumbers.indexOf(this.cyclingNumber);
		const nextIndex = (currentIndex + 1) % availableNumbers.length;
		this.cyclingNumber = availableNumbers[nextIndex];
		this.highlightedNumber = this.cyclingNumber;
	}

	placeCyclingNumber() {
		if (this.cyclingNumber === null || !this.selectedCell) return;

		this.handleInput(this.cyclingNumber);
		// Don't reset cycling - keep the same number highlighted for consecutive placements
	}

	cycleToNextCellWithSameNumber() {
		if (!this.selectedCell) return;

		const currentValue =
			this.board[this.selectedCell.row][this.selectedCell.col].value;
		if (currentValue === null) return; // Only cycle for cells with values

		const cellsWithSameNumber = getCellsWithSameNumber(
			this.board,
			currentValue,
		);
		if (cellsWithSameNumber.length <= 1) return; // No other cells to cycle to

		// Find current cell index in the list
		const currentIndex = cellsWithSameNumber.findIndex(
			(cell) =>
				cell.row === this.selectedCell!.row &&
				cell.col === this.selectedCell!.col,
		);

		if (currentIndex === -1) return; // Current cell not found (shouldn't happen)

		// Move to next cell (wrap around to beginning if at end)
		const nextIndex = (currentIndex + 1) % cellsWithSameNumber.length;
		const nextCell = cellsWithSameNumber[nextIndex];

		this.selectedCell = { row: nextCell.row, col: nextCell.col };
		this.updateHighlightedNumber(nextCell.row, nextCell.col);
	}
}

export const gameStore = new GameStore();
