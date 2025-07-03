import type { GamePhase } from '$lib/index.js';

export interface KeyboardHandlerContext {
	// Game state
	gamePhase: GamePhase;
	selectedCell: { row: number; col: number } | null;
	cyclingNumber: number | null;
	colorKuMode: boolean;
	inputMode: 'normal' | 'note';
	difficulty: 'easy' | 'medium' | 'hard';
	showingHint: boolean;
	board: any[][]; // Board type would need to be imported properly

	// Action callbacks
	handleInput: (num: number) => void;
	handleDelete: () => void;
	cycleToNextCellWithSameNumber: () => void;
	cycleToNextNumber: () => void;
	placeCyclingNumber: () => void;
	undo: () => void;
	generatePuzzle: () => void;
	startGame: () => void;
	startManualGame: () => void;
	showShareModalForConfiguration: () => void;
	getHint: () => void;
	closeHint: () => void;
	updateHighlightedNumber: (row: number, col: number) => void;

	// State setters
	setCyclingNumber: (num: number | null) => void;
	setColorKuMode: (mode: boolean) => void;
	setInputMode: (mode: 'normal' | 'note') => void;
	setDifficulty: (diff: 'easy' | 'medium' | 'hard') => void;
	setSelectedCell: (cell: { row: number; col: number } | null) => void;

	// External references
	hintDisplayRef?: { advanceStage: () => void };
}

export function createKeyboardHandler(
	getContext: () => KeyboardHandlerContext,
) {
	return (event: KeyboardEvent) => {
		const context = getContext(); // Get fresh context on each keypress

		// Handle number input (1-9)
		const num = parseInt(event.key);
		if (!isNaN(num) && num >= 1 && num <= 9) {
			context.handleInput(num);
			// Reset cycling when manually typing a number
			context.setCyclingNumber(null);
			return;
		}

		// Handle delete/backspace
		if (event.key === 'Delete' || event.key === 'Backspace') {
			context.handleDelete();
			return;
		}

		// Handle Tab (cycling)
		if (event.key === 'Tab') {
			event.preventDefault(); // Prevent default tab behavior

			if (context.selectedCell) {
				const currentValue =
					context.board[context.selectedCell.row][context.selectedCell.col]
						.value;

				if (currentValue !== null) {
					// Cell has a value - cycle to next cell with same number
					context.cycleToNextCellWithSameNumber();
				} else if (
					context.gamePhase === 'solving' ||
					context.gamePhase === 'manual' ||
					context.gamePhase === 'competition'
				) {
					// Cell is empty and we're in solving, manual, or competition phase - cycle through available numbers
					context.cycleToNextNumber();
				}
			}
			return;
		}

		// Handle Enter (place cycling number)
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevent default enter behavior

			// Place/toggle the cycling number
			if (
				context.selectedCell &&
				(context.gamePhase === 'solving' ||
					context.gamePhase === 'manual' ||
					context.gamePhase === 'competition') &&
				context.cyclingNumber !== null
			) {
				const { row, col } = context.selectedCell;
				if (context.board[row][col].value === null) {
					context.placeCyclingNumber();
				}
			}
			return;
		}

		// Handle ColorKu toggle
		if (event.key.toLowerCase() === 'c' && !event.ctrlKey) {
			// Toggle ColorKu mode (available in all phases, but not when Ctrl is pressed)
			context.setColorKuMode(!context.colorKuMode);
			return;
		}

		// Handle Ctrl+Z (undo)
		if (event.key.toLowerCase() === 'z' && event.ctrlKey) {
			// Ctrl+Z for undo (available in all phases that support undo)
			if (
				context.gamePhase === 'solving' ||
				context.gamePhase === 'manual' ||
				context.gamePhase === 'competition'
			) {
				context.undo();
			}
			return;
		}

		// Handle phase-specific shortcuts
		if (context.gamePhase === 'configuring') {
			handleConfiguringPhaseShortcuts(event, context);
		} else if (
			context.gamePhase === 'solving' ||
			context.gamePhase === 'manual' ||
			context.gamePhase === 'competition'
		) {
			handleSolvingPhaseShortcuts(event, context);
		}

		// Handle navigation keys
		handleNavigationKeys(event, context);
	};
}

function handleConfiguringPhaseShortcuts(
	event: KeyboardEvent,
	context: KeyboardHandlerContext,
) {
	switch (event.key.toLowerCase()) {
		case 'g':
			context.generatePuzzle();
			break;
		case 'd':
			// Cycle through difficulties: easy -> medium -> hard -> easy
			const difficulties = ['easy', 'medium', 'hard'] as const;
			const currentIndex = difficulties.indexOf(context.difficulty);
			const nextIndex = (currentIndex + 1) % difficulties.length;
			context.setDifficulty(difficulties[nextIndex]);
			break;
		case 's':
			context.startGame();
			break;
		case 'm':
			context.startManualGame();
			break;
		case 'x':
			// Share current configuration
			context.showShareModalForConfiguration();
			break;
	}
}

function handleSolvingPhaseShortcuts(
	event: KeyboardEvent,
	context: KeyboardHandlerContext,
) {
	switch (event.key.toLowerCase()) {
		case 'n':
			// Toggle normal/note mode
			context.setInputMode(context.inputMode === 'normal' ? 'note' : 'normal');
			break;
		case 'u':
			context.undo();
			break;
		case 'h':
			if (context.gamePhase !== 'competition') {
				// Get hint or advance hint stage if already showing (not in competition mode)
				if (context.showingHint && context.hintDisplayRef) {
					// Advance to next hint stage
					context.hintDisplayRef.advanceStage();
				} else {
					// Get new hint
					context.getHint();
				}
			}
			break;
	}

	// Handle Escape (close hint)
	if (event.key === 'Escape' && context.showingHint) {
		context.closeHint();
	}
}

function handleNavigationKeys(
	event: KeyboardEvent,
	context: KeyboardHandlerContext,
) {
	// Navigation keys - Arrow keys always available, WASD only in solving, manual, and competition phase
	const isArrowKey = [
		'ArrowUp',
		'ArrowDown',
		'ArrowLeft',
		'ArrowRight',
	].includes(event.key);
	const isWASD = ['w', 'a', 's', 'd'].includes(event.key.toLowerCase());

	if (
		isArrowKey ||
		(isWASD &&
			(context.gamePhase === 'solving' ||
				context.gamePhase === 'manual' ||
				context.gamePhase === 'competition'))
	) {
		// Handle navigation keys
		event.preventDefault(); // Prevent default behavior (like scrolling)

		if (!context.selectedCell) {
			// If no cell is selected, start at the center
			context.setSelectedCell({ row: 4, col: 4 });
			context.updateHighlightedNumber(4, 4);
			return;
		}

		let newRow = context.selectedCell.row;
		let newCol = context.selectedCell.col;

		switch (event.key.toLowerCase()) {
			case 'arrowup':
			case 'w':
				newRow = Math.max(0, context.selectedCell.row - 1);
				break;
			case 'arrowdown':
			case 's':
				newRow = Math.min(8, context.selectedCell.row + 1);
				break;
			case 'arrowleft':
			case 'a':
				newCol = Math.max(0, context.selectedCell.col - 1);
				break;
			case 'arrowright':
			case 'd':
				newCol = Math.min(8, context.selectedCell.col + 1);
				break;
		}

		// Update selected cell if position changed
		if (
			newRow !== context.selectedCell.row ||
			newCol !== context.selectedCell.col
		) {
			context.setSelectedCell({ row: newRow, col: newCol });
			context.updateHighlightedNumber(newRow, newCol);
		}
	}
}
