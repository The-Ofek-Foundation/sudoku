<script lang="ts">
	import type { SudokuHint } from './sudoku/sudoku';
	import { difficultyToCategory } from '$lib';
	import { colorKuColors } from './colors.js';
	import { getUnitType } from './sudoku/core/utils.js';
	import type { Unit } from './sudoku/types.js';

	export let hint: SudokuHint;
	export let gridSize: string;
	export let colorKuMode: boolean = false;

	// Callback props instead of createEventDispatcher
	export let onClose: () => void;
	export let onHighlight: (data: {
		squares?: string[];
		unit?: { type: 'row' | 'column' | 'box'; index: number };
		units?: { type: 'row' | 'column' | 'box'; index: number }[];
		candidateEliminations?: { square: string; digits: string[] }[];
		candidateHighlights?: {
			square: string;
			digit: string;
			color: 'on' | 'off';
		}[];
		highlightType: 'primary' | 'secondary' | 'elimination' | 'coloring';
	}) => void;
	export let onClearHighlights: () => void;
	export let onApplyHint: () => void;

	let stage: 1 | 2 | 3 = 1; // Start at stage 1 (Show Technique)

	// Export function to advance stage for external control (e.g., keyboard shortcuts)
	export function advanceStage() {
		if (stage === 1) {
			showLocation();
		} else if (stage === 2) {
			showSolution();
		} else {
			// Already at stage 3, apply the hint
			onApplyHint();
		}
	}

	// Reactive button text
	$: buttonText =
		stage === 1
			? 'Show Location'
			: stage === 2
				? 'Show Solution'
				: 'Apply Hint';

	// Reactive description text - pass stage as parameter to make dependency explicit
	$: stageDescription = getStageDescription(stage);

	// Helper function to convert unit to metadata for better highlighting
	function getUnitMetadata(
		unit: Unit,
	): { type: 'row' | 'column' | 'box'; index: number } | null {
		if (!unit || unit.length !== 9) return null;

		const unitType = getUnitType(unit);
		let index: number;

		if (unitType === 'row') {
			// Row: all squares have same first character (A-I maps to 0-8)
			index = unit[0].charCodeAt(0) - 'A'.charCodeAt(0);
		} else if (unitType === 'column') {
			// Column: all squares have same second character (1-9 maps to 0-8)
			index = parseInt(unit[0].charAt(1)) - 1;
		} else {
			// box
			// Box: calculate box index from first square
			const firstSquare = unit[0];
			const row = firstSquare.charCodeAt(0) - 'A'.charCodeAt(0);
			const col = parseInt(firstSquare.charAt(1)) - 1;
			index = Math.floor(row / 3) * 3 + Math.floor(col / 3);
		}

		return { type: unitType, index };
	}

	// Helper function to get technique display name
	function getTechniqueDisplayName(technique: string): string {
		const names: Record<string, string> = {
			incorrect_value: 'Incorrect Value',
			missing_candidate: 'Missing Candidate',
			last_remaining_in_box: 'Last Remaining in Box',
			last_remaining_in_row: 'Last Remaining in Row',
			last_remaining_in_column: 'Last Remaining in Column',
			naked_single: 'Naked Single',
			naked_pairs: 'Naked Pairs',
			naked_triples: 'Naked Triples',
			naked_quads: 'Naked Quads',
			hidden_pairs: 'Hidden Pairs',
			hidden_triples: 'Hidden Triples',
			hidden_quads: 'Hidden Quads',
			pointing_pairs: 'Pointing Pairs',
			box_line_reduction: 'Box/Line Reduction',
			x_wing: 'X-Wing',
			chute_remote_pairs: 'Chute Remote Pairs',
			simple_coloring: 'Simple Coloring',
			y_wing: 'Y-Wing',
		};
		return names[technique] || technique;
	}

	// Helper function to get technique difficulty category
	function getTechniqueDifficultyCategory():
		| 'error'
		| 'trivial'
		| 'basic'
		| 'intermediate'
		| 'tough'
		| 'diabolical'
		| 'extreme'
		| 'master'
		| 'grandmaster' {
		return difficultyToCategory(hint.difficulty);
	}

	// Helper function to convert square notation to display format
	function formatSquare(square: string): string {
		return square; // A1, B2, etc. - already readable
	}

	// Helper function to format squares list
	function formatSquares(squares: string[]): string {
		if (squares.length <= 2) {
			return squares.map(formatSquare).join(' and ');
		}
		return (
			squares.slice(0, -1).map(formatSquare).join(', ') +
			', and ' +
			formatSquare(squares[squares.length - 1])
		);
	}

	// Helper function to format a number/color for display
	function formatDigit(digit: string): string {
		if (colorKuMode) {
			const digitNum = parseInt(digit);
			return `<span style="display: inline-flex; align-items: center; width: 16px; height: 16px; border-radius: 50%; background-color: ${colorKuColors[digitNum]}; border: 1px solid rgba(0,0,0,0.3);"></span>`;
		}
		return digit;
	}

	// Helper function to format multiple digits
	function formatDigits(digits: string[]): string {
		if (colorKuMode) {
			return digits.map((d) => formatDigit(d)).join(', ');
		}

		if (digits.length <= 2) {
			return digits.join(' and ');
		}

		return (
			digits.slice(0, -1).join(', ') + ', and ' + digits[digits.length - 1]
		);
	}

	// Helper function to get the word "number" or "color"
	function getDigitWord(): string {
		return colorKuMode ? 'color' : 'number';
	}

	// Helper function to get the plural word "numbers" or "colors"
	function getDigitWordPlural(): string {
		return colorKuMode ? 'colors' : 'numbers';
	}

	function getDigitWordCapitalized(): string {
		return getDigitWord().charAt(0).toUpperCase() + getDigitWord().slice(1);
	}

	function getDigitWordPluralCapitalized(): string {
		return (
			getDigitWordPlural().charAt(0).toUpperCase() +
			getDigitWordPlural().slice(1)
		);
	}

	// Stage progression functions
	function showLocation() {
		stage = 2;
		// Highlight the relevant squares or units
		if (hint.type === 'error' || hint.type === 'missing_candidate') {
			onHighlight({ squares: [hint.square], highlightType: 'primary' });
		} else if (hint.type === 'single_cell') {
			// For "last remaining" techniques, highlight the entire unit first
			if (hint.technique.includes('last_remaining') && hint.unit) {
				const unitMeta = getUnitMetadata(hint.unit);
				if (unitMeta) {
					onHighlight({ unit: unitMeta, highlightType: 'secondary' });
				} else {
					// Fallback to individual cells
					onHighlight({ squares: hint.unit, highlightType: 'secondary' });
				}
			} else {
				// For naked singles, just highlight the cell
				onHighlight({ squares: [hint.square], highlightType: 'primary' });
			}
		} else if (hint.type === 'naked_set' || hint.type === 'hidden_set') {
			// For sets, highlight the containing unit to show context
			if (hint.unit) {
				const unitMeta = getUnitMetadata(hint.unit);
				if (unitMeta) {
					onHighlight({ unit: unitMeta, highlightType: 'secondary' });
				} else {
					onHighlight({ squares: hint.unit, highlightType: 'secondary' });
				}
				onHighlight({ squares: hint.squares, highlightType: 'primary' });
			} else {
				onHighlight({ squares: hint.squares, highlightType: 'primary' });
			}
		} else if (hint.type === 'intersection_removal') {
			// For intersection removal, highlight both units to show the context
			if (hint.primaryUnit && hint.secondaryUnit) {
				if (hint.technique === 'pointing_pairs') {
					// Pointing pairs: highlight only the specific cells where the digit is constrained
					// Show the box as context and the pointing cells as primary
					const primaryUnitMeta = getUnitMetadata(hint.primaryUnit);
					if (primaryUnitMeta) {
						onHighlight({ unit: primaryUnitMeta, highlightType: 'secondary' });
					} else {
						onHighlight({
							squares: hint.primaryUnit,
							highlightType: 'secondary',
						});
					}
					onHighlight({ squares: hint.squares, highlightType: 'primary' });
				} else if (hint.technique === 'box_line_reduction') {
					// Box/line reduction: digit in row/column restricted to box
					// For stage 2, show both the line and the box to provide full context
					const primaryUnitMeta = getUnitMetadata(hint.primaryUnit);
					const secondaryUnitMeta = getUnitMetadata(hint.secondaryUnit);
					if (primaryUnitMeta) {
						onHighlight({ unit: primaryUnitMeta, highlightType: 'primary' }); // The line
					} else {
						onHighlight({
							squares: hint.primaryUnit,
							highlightType: 'primary',
						});
					}
					if (secondaryUnitMeta) {
						onHighlight({
							unit: secondaryUnitMeta,
							highlightType: 'secondary',
						}); // The box
					} else {
						onHighlight({
							squares: hint.secondaryUnit,
							highlightType: 'secondary',
						});
					}
				} else {
					// Fallback
					const primaryUnitMeta = getUnitMetadata(hint.primaryUnit);
					const secondaryUnitMeta = getUnitMetadata(hint.secondaryUnit);
					if (primaryUnitMeta) {
						onHighlight({ unit: primaryUnitMeta, highlightType: 'primary' });
					} else {
						onHighlight({
							squares: hint.primaryUnit,
							highlightType: 'primary',
						});
					}
					if (secondaryUnitMeta) {
						onHighlight({
							unit: secondaryUnitMeta,
							highlightType: 'secondary',
						});
					} else {
						onHighlight({
							squares: hint.secondaryUnit,
							highlightType: 'secondary',
						});
					}
				}
			} else {
				onHighlight({ squares: hint.squares, highlightType: 'primary' });
			}
		} else if (hint.type === 'x_wing') {
			// For X-Wing, highlight the primary units (where the pattern occurs) as secondary
			// and the X-Wing squares as primary
			if (hint.primaryUnits && hint.primaryUnits.length === 2) {
				const unitsMeta = hint.primaryUnits
					.map((unit) => getUnitMetadata(unit))
					.filter((meta) => meta !== null);
				if (unitsMeta.length === 2) {
					onHighlight({ units: unitsMeta, highlightType: 'secondary' });
				} else {
					// Fallback to individual squares if we can't get unit metadata
					for (const unit of hint.primaryUnits) {
						onHighlight({ squares: unit, highlightType: 'secondary' });
					}
				}
			}
			onHighlight({ squares: hint.squares, highlightType: 'primary' });
		} else if (hint.type === 'chute_remote_pairs') {
			// For Chute Remote Pairs, highlight the remote pair cells as primary
			// and the relevant rows/columns that form the chute as secondary
			onHighlight({
				squares: hint.remotePairSquares,
				highlightType: 'primary',
			});

			// Highlight the chute context (rows or columns)
			if (hint.chuteType === 'horizontal') {
				// For horizontal chute, highlight the row(s) containing the remote pair cells
				const rows = hint.remotePairSquares.map((square) => ({
					type: 'row' as const,
					index: square.charCodeAt(0) - 'A'.charCodeAt(0),
				}));
				onHighlight({ units: rows, highlightType: 'secondary' });
			} else {
				// For vertical chute, highlight the column(s) containing the remote pair cells
				const columns = hint.remotePairSquares.map((square) => ({
					type: 'column' as const,
					index: parseInt(square.charAt(1)) - 1,
				}));
				onHighlight({ units: columns, highlightType: 'secondary' });
			}
		} else if (hint.type === 'simple_coloring') {
			// For Simple Coloring, highlight the candidates with colors instead of cells
			const candidateHighlights = hint.chain.map((square) => ({
				square,
				digit: hint.digit,
				color: (hint.chainColors[square] === 'color1' ? 'on' : 'off') as
					| 'on'
					| 'off',
			}));
			onHighlight({ candidateHighlights, highlightType: 'coloring' });

			// Also highlight the chain cells as primary for visual feedback until candidate highlighting is implemented
			onHighlight({ squares: hint.chain, highlightType: 'primary' });

			// For Rule 2, also highlight the conflicting unit
			if (hint.rule === 'rule_2' && hint.conflictUnit) {
				const unitMeta = getUnitMetadata(hint.conflictUnit);
				if (unitMeta) {
					onHighlight({ unit: unitMeta, highlightType: 'secondary' });
				} else {
					onHighlight({
						squares: hint.conflictUnit,
						highlightType: 'secondary',
					});
				}
			}
		} else if (hint.type === 'y_wing') {
			// Highlight the Y-Wing pattern
			onHighlight({
				squares: [hint.pivotCell, hint.pincer1Cell, hint.pincer2Cell],
				highlightType: 'primary',
			});
			// Note: Do NOT highlight elimination candidates here - only in showSolution (stage 3)
		}
	}

	function showSolution() {
		stage = 3;
		// Highlight all relevant squares with different types
		if (hint.type === 'error' || hint.type === 'missing_candidate') {
			onHighlight({ squares: [hint.square], highlightType: 'primary' });
		} else if (hint.type === 'single_cell') {
			// For "last remaining" techniques, now highlight the specific cell as primary
			// and keep the unit as secondary
			if (hint.technique.includes('last_remaining') && hint.unit) {
				const unitMeta = getUnitMetadata(hint.unit);
				if (unitMeta) {
					onHighlight({ unit: unitMeta, highlightType: 'secondary' });
				} else {
					onHighlight({ squares: hint.unit, highlightType: 'secondary' });
				}
				onHighlight({ squares: [hint.square], highlightType: 'primary' });
			} else {
				// For naked singles, just highlight the cell
				onHighlight({ squares: [hint.square], highlightType: 'primary' });
			}
		} else if (hint.type === 'naked_set' || hint.type === 'hidden_set') {
			// Show the containing unit, the set cells, and elimination cells
			if (hint.unit) {
				const unitMeta = getUnitMetadata(hint.unit);
				if (unitMeta) {
					onHighlight({ unit: unitMeta, highlightType: 'secondary' });
				} else {
					onHighlight({ squares: hint.unit, highlightType: 'secondary' });
				}
			}
			onHighlight({ squares: hint.squares, highlightType: 'primary' });
			if (hint.eliminationCells.length > 0) {
				// For sets, create candidate eliminations with specific digits
				const candidateEliminations = hint.eliminationCells.map((cell) => ({
					square: cell,
					digits: hint.eliminationDigits || [],
				}));
				onHighlight({ candidateEliminations, highlightType: 'elimination' });
			}
		} else if (hint.type === 'intersection_removal') {
			// Show the units, the intersection, and elimination cells
			if (hint.primaryUnit && hint.secondaryUnit) {
				if (hint.technique === 'pointing_pairs') {
					// Pointing pairs: show both units as context, intersection as primary
					const primaryUnitMeta = getUnitMetadata(hint.primaryUnit);
					const secondaryUnitMeta = getUnitMetadata(hint.secondaryUnit);
					if (primaryUnitMeta) {
						onHighlight({ unit: primaryUnitMeta, highlightType: 'secondary' });
					} else {
						onHighlight({
							squares: hint.primaryUnit,
							highlightType: 'secondary',
						});
					}
					if (secondaryUnitMeta) {
						onHighlight({
							unit: secondaryUnitMeta,
							highlightType: 'secondary',
						});
					} else {
						onHighlight({
							squares: hint.secondaryUnit,
							highlightType: 'secondary',
						});
					}
					onHighlight({ squares: hint.squares, highlightType: 'primary' }); // The intersection
				} else if (hint.technique === 'box_line_reduction') {
					// Box/line reduction: show line as primary, box as secondary, intersection highlighted within line
					const primaryUnitMeta = getUnitMetadata(hint.primaryUnit);
					const secondaryUnitMeta = getUnitMetadata(hint.secondaryUnit);
					if (primaryUnitMeta) {
						onHighlight({ unit: primaryUnitMeta, highlightType: 'primary' }); // The line
					} else {
						onHighlight({
							squares: hint.primaryUnit,
							highlightType: 'primary',
						});
					}
					if (secondaryUnitMeta) {
						onHighlight({
							unit: secondaryUnitMeta,
							highlightType: 'secondary',
						}); // The box
					} else {
						onHighlight({
							squares: hint.secondaryUnit,
							highlightType: 'secondary',
						});
					}
					// Don't separately highlight intersection since it's part of the primary line
				} else {
					// Fallback
					const primaryUnitMeta = getUnitMetadata(hint.primaryUnit);
					const secondaryUnitMeta = getUnitMetadata(hint.secondaryUnit);
					if (primaryUnitMeta) {
						onHighlight({ unit: primaryUnitMeta, highlightType: 'secondary' });
					} else {
						onHighlight({
							squares: hint.primaryUnit,
							highlightType: 'secondary',
						});
					}
					if (secondaryUnitMeta) {
						onHighlight({
							unit: secondaryUnitMeta,
							highlightType: 'secondary',
						});
					} else {
						onHighlight({
							squares: hint.secondaryUnit,
							highlightType: 'secondary',
						});
					}
					onHighlight({ squares: hint.squares, highlightType: 'primary' }); // The intersection
				}
			} else {
				onHighlight({ squares: hint.squares, highlightType: 'primary' });
			}
			if (hint.eliminationCells.length > 0) {
				// For intersection removal, create candidate eliminations with the specific digit
				const candidateEliminations = hint.eliminationCells.map((cell) => ({
					square: cell,
					digits: [hint.digit],
				}));
				onHighlight({ candidateEliminations, highlightType: 'elimination' });
			}
		} else if (hint.type === 'x_wing') {
			// For X-Wing stage 3, show all units involved and elimination cells
			const allUnits = [];

			// Collect primary units (the rows/columns with the X-Wing pattern)
			if (hint.primaryUnits && hint.primaryUnits.length === 2) {
				const primaryUnitsMeta = hint.primaryUnits
					.map((unit) => getUnitMetadata(unit))
					.filter((meta) => meta !== null);
				allUnits.push(...primaryUnitsMeta);
			}

			// Collect secondary units (the perpendicular rows/columns where eliminations occur)
			if (hint.secondaryUnits && hint.secondaryUnits.length === 2) {
				const secondaryUnitsMeta = hint.secondaryUnits
					.map((unit) => getUnitMetadata(unit))
					.filter((meta) => meta !== null);
				allUnits.push(...secondaryUnitsMeta);
			}

			// Highlight all units at once if we have metadata, otherwise fall back to individual squares
			if (allUnits.length > 0) {
				onHighlight({ units: allUnits, highlightType: 'secondary' });
			} else {
				// Fallback to individual squares
				if (hint.primaryUnits) {
					for (const unit of hint.primaryUnits) {
						onHighlight({ squares: unit, highlightType: 'secondary' });
					}
				}
				if (hint.secondaryUnits) {
					for (const unit of hint.secondaryUnits) {
						onHighlight({ squares: unit, highlightType: 'secondary' });
					}
				}
			}

			onHighlight({ squares: hint.squares, highlightType: 'primary' });
			if (hint.eliminationCells.length > 0) {
				// For X-Wing, create candidate eliminations with the specific digit
				const candidateEliminations = hint.eliminationCells.map((cell) => ({
					square: cell,
					digits: [hint.digit],
				}));
				onHighlight({ candidateEliminations, highlightType: 'elimination' });
			}
		} else if (hint.type === 'chute_remote_pairs') {
			// For Chute Remote Pairs stage 3, show remote pair cells and elimination cells
			onHighlight({
				squares: hint.remotePairSquares,
				highlightType: 'primary',
			});
			onHighlight({
				squares: hint.thirdBoxSquares,
				highlightType: 'secondary',
			});
			if (hint.eliminationCells.length > 0) {
				// Create candidate eliminations with the absent digit
				const candidateEliminations = hint.eliminationCells.map((cell) => ({
					square: cell,
					digits: [hint.absentDigit],
				}));
				onHighlight({ candidateEliminations, highlightType: 'elimination' });
			}
		} else if (hint.type === 'simple_coloring') {
			// For Simple Coloring stage 3, show the candidate colors and elimination cells
			const candidateHighlights = hint.chain.map((square) => ({
				square,
				digit: hint.digit,
				color: (hint.chainColors[square] === 'color1' ? 'on' : 'off') as
					| 'on'
					| 'off',
			}));
			onHighlight({ candidateHighlights, highlightType: 'coloring' });

			// Also highlight the chain cells as primary for visual feedback until candidate highlighting is implemented
			onHighlight({ squares: hint.chain, highlightType: 'primary' });

			// For Rule 2, also highlight the conflicting unit
			if (hint.rule === 'rule_2' && hint.conflictUnit) {
				const unitMeta = getUnitMetadata(hint.conflictUnit);
				if (unitMeta) {
					onHighlight({ unit: unitMeta, highlightType: 'secondary' });
				} else {
					onHighlight({
						squares: hint.conflictUnit,
						highlightType: 'secondary',
					});
				}
			}

			if (hint.eliminationCells.length > 0) {
				// Create candidate eliminations with the specific digit
				const candidateEliminations = hint.eliminationCells.map((cell) => ({
					square: cell,
					digits: [hint.digit],
				}));
				onHighlight({ candidateEliminations, highlightType: 'elimination' });
			}
		} else if (hint.type === 'y_wing') {
			// For Y-Wing stage 3, show pivot and pincer cells, then elimination cells
			onHighlight({ squares: [hint.pivotCell], highlightType: 'primary' });
			onHighlight({
				squares: [hint.pincer1Cell, hint.pincer2Cell],
				highlightType: 'secondary',
			});

			if (hint.eliminationCells.length > 0) {
				// Create candidate eliminations with candidateC
				const candidateEliminations = hint.eliminationCells.map((cell) => ({
					square: cell,
					digits: [hint.candidateC],
				}));
				onHighlight({ candidateEliminations, highlightType: 'elimination' });
			}
		}
	}

	function closeHint() {
		onClearHighlights();
		onClose();
	}

	// Get description based on stage
	function getStageDescription(currentStage: typeof stage): string {
		if (currentStage === 1) {
			// Stage 1: Explain what the technique is

			// should only explain what the technique is, not the specific hint
			switch (hint.type) {
				case 'error':
					return `An incorrect value was detected. This value violates Sudoku rules by appearing twice in the same row, column, or box.`;

				case 'missing_candidate':
					return `A cell is missing a valid candidate ${getDigitWord()}. This ${getDigitWord()} should be penciled in as a possibility based on the current board state.`;

				case 'single_cell':
					if (hint.technique === 'naked_single') {
						return `A cell has been reduced to only one possible candidate.`;
					}

					return `A ${getDigitWord()} has only one possible location remaining in a ${hint.technique.substring(hint.technique.lastIndexOf('_') + 1)}.`;

				case 'naked_set':
					return `There exist ${hint.digits.length} cells in the same ${hint.unitType} solely containing ${hint.digits.length} distinct candidates. Those ${getDigitWordPlural()} are locked to these cells only, and cannot appear elsewhere in that ${hint.unitType}.`;

				case 'hidden_set':
					return `A set of ${hint.digits.length} ${getDigitWordPlural()} can only appear in ${hint.digits.length} distinct cells within a ${hint.unitType}. Those cells must only contain those ${getDigitWordPlural()}.`;

				case 'intersection_removal':
					if (hint.technique === 'pointing_pairs') {
						return `There exists a ${getDigitWord()} in one of the boxes that is restricted to only one ${hint.secondaryUnitType}. No other ${getDigitWordPlural()} can appear in that ${hint.secondaryUnitType} outside of this box.`;
					} else {
						return `There exists a ${getDigitWord()} in a ${hint.primaryUnitType} which appears in only one box. It must exist in that ${hint.primaryUnitType}, so it can be eliminated from other cells in that box.`;
					}

				case 'x_wing':
					return `An X-Wing occurs when a ${getDigitWord()} appears in exactly two positions in each of two parallel ${hint.primaryUnitType}s, and these positions are aligned in the perpendicular direction. This forms a rectangular pattern that eliminates candidates.`;

				case 'chute_remote_pairs':
					return `A Chute Remote Pair occurs when two bi-value cells with identical candidates exist in the same chute (3 boxes in a row or column) but cannot see each other. If only one of the candidates appears in the third box, eliminations can be made.`;

				case 'simple_coloring':
					return `Simple Coloring creates chains of bi-location links for a single ${getDigitWord()}, where each link connects exactly two positions for that ${getDigitWord()} in a row, column, or box. By assigning alternating colors to linked cells, contradictions can be found that eliminate candidates.`;

				case 'y_wing':
					return `A Y-Wing is formed by three bi-value cells arranged in a Y pattern. The pivot cell can "see" both pincer cells, and together they share exactly three candidates. This pattern forces one candidate into specific positions, enabling eliminations.`;
			}
		} else if (currentStage === 2) {
			// Stage 2: Show where the technique applies with more context
			switch (hint.type) {
				case 'error':
					return `Cell ${formatSquare(hint.square)} contains ${formatDigit(hint.actualValue)}, but this creates a conflict. Look for the duplicate ${formatDigit(hint.actualValue)} in the same row, column, or box.`;

				case 'missing_candidate':
					return `Cell ${formatSquare(hint.square)} should have ${formatDigit(hint.missingDigit)} as a possible candidate. Check why this ${getDigitWord()} isn't ruled out by the current values.`;

				case 'single_cell':
					if (hint.technique === 'naked_single') {
						return `Cell ${formatSquare(hint.square)} has been reduced to only one possible candidate.`;
					}

					return `${getDigitWordCapitalized()} ${formatDigit(hint.digit)} has only one possible location remaining in a ${hint.technique.substring(hint.technique.lastIndexOf('_') + 1)}.`;

				case 'naked_set':
					return `The ${hint.digits.length} cells ${formatSquares(hint.squares)} contain ${hint.digits.length} distinct candidates, ${formatDigits(hint.digits)}. These ${getDigitWordPlural()} cannot appear elsewhere in that ${hint.unitType}.`;

				case 'hidden_set':
					return `${getDigitWordPluralCapitalized()} ${formatDigits(hint.digits)} must appear in cells ${formatSquares(hint.squares)} within this ${hint.unitType}. All other candidates can be eliminated from these cells.`;

				case 'intersection_removal':
					if (hint.technique === 'pointing_pairs') {
						const cellCount = hint.squares.length === 2 ? 'pair' : 'triple';
						return `${formatDigit(hint.digit)} in the highlighted box is restricted to only these ${hint.squares.length} cells (${formatSquares(hint.squares)}), creating a pointing ${cellCount}. No other ${formatDigit(hint.digit)} can appear in the same ${hint.secondaryUnitType} outside of this box.`;
					} else {
						return `${getDigitWordCapitalized()} ${formatDigit(hint.digit)} in the highlighted ${hint.primaryUnitType} is restricted to only one box. It must appear in that ${hint.primaryUnitType} and not in any other cells in that box.`;
					}

				case 'x_wing':
					return `${getDigitWordCapitalized()} ${formatDigit(hint.digit)} appears in exactly two positions in each of the highlighted ${hint.primaryUnitType}s. These positions form a rectangle at cells ${formatSquares(hint.squares)}, which creates the X-Wing pattern.`;

				case 'chute_remote_pairs':
					const chuteDescription =
						hint.chuteType === 'horizontal'
							? 'row of boxes'
							: 'column of boxes';
					return `Cells ${formatSquares(hint.remotePairSquares)} both contain the same candidates ${formatDigits(hint.digits)} and are in the same ${chuteDescription}. ${getDigitWordCapitalized()} ${formatDigit(hint.presentDigit)} appears in the third box, but ${formatDigit(hint.absentDigit)} does not.`;

				case 'simple_coloring':
					const ruleDescription =
						hint.rule === 'rule_2'
							? `Two cells of the same color appear in the same ${hint.conflictUnitType}`
							: `A cell can see both colors of the chain`;
					return `${getDigitWordCapitalized()} ${formatDigit(hint.digit)} forms a chain of ${hint.chain.length} linked cells. ${ruleDescription}, creating a contradiction that eliminates candidates.`;

				case 'y_wing':
					return `Cells ${formatSquare(hint.pivotCell)} (${formatDigits([hint.candidateA, hint.candidateB])}), ${formatSquare(hint.pincer1Cell)} (${formatDigits([hint.candidateA, hint.candidateC])}), and ${formatSquare(hint.pincer2Cell)} (${formatDigits([hint.candidateB, hint.candidateC])}) form a Y-Wing pattern. Since ${formatSquare(hint.pivotCell)} must be either ${formatDigit(hint.candidateA)} or ${formatDigit(hint.candidateB)}, candidate ${formatDigit(hint.candidateC)} must appear in one of the pincer cells.`;
			}
		} else {
			// Stage 3: Show the full technical description with the action
			switch (hint.type) {
				case 'error':
					return `Cell ${formatSquare(hint.square)} contains ${formatDigit(hint.actualValue)}, but the correct value is ${formatDigit(hint.correctValue)}`;

				case 'missing_candidate':
					return `Cell ${formatSquare(hint.square)} is missing candidate ${formatDigit(hint.missingDigit)}`;

				case 'single_cell':
					if (hint.technique === 'naked_single') {
						return `The only candidate remaining for cell ${formatSquare(hint.square)} is ${formatDigit(hint.digit)}.`;
					}

					return `Cell ${formatSquare(hint.square)} is the only cell in its ${hint.technique.substring(hint.technique.lastIndexOf('_') + 1)} that can contain a ${formatDigit(hint.digit)}.`;

				case 'naked_set':
					return `${getDigitWordPluralCapitalized()} ${formatDigits(hint.digits)} are restricted to cells ${formatSquares(hint.squares)} in the highlighted ${hint.unitType}. These ${getDigitWordPlural()} cannot appear in cells ${formatSquares(hint.eliminationCells)}.`;

				case 'hidden_set':
					return `${getDigitWordPluralCapitalized()} ${formatDigits(hint.digits)} must appear in cells ${formatSquares(hint.squares)} within this ${hint.unitType}. ${formatDigits(hint.eliminationDigits)} can be eliminated from these cells.`;

				case 'intersection_removal':
					if (hint.technique === 'pointing_pairs') {
						return `${getDigitWordCapitalized()} ${formatDigit(hint.digit)} must appear in either cell ${formatSquares(hint.squares)} in the highlighted box. In either case, cells ${formatSquares(hint.eliminationCells)} in the same ${hint.secondaryUnitType} cannot contain a ${formatDigit(hint.digit)}.`;
					} else {
						return `${getDigitWordCapitalized()} ${formatDigit(hint.digit)} must appear in either cell ${formatSquares(hint.squares)} in the highlighted box. In either case, cells ${formatSquares(hint.eliminationCells)} in the same box cannot contain a ${formatDigit(hint.digit)}.`;
					}

				case 'x_wing':
					return `${getDigitWordCapitalized()} ${formatDigit(hint.digit)} forms an X-Wing pattern at cells ${formatSquares(hint.squares)}. No matter how the ${getDigitWordPlural()} are placed within this rectangle, cells ${formatSquares(hint.eliminationCells)} in the affected ${hint.secondaryUnitType}s cannot contain a ${formatDigit(hint.digit)}.`;

				case 'chute_remote_pairs':
					return `Since ${formatDigit(hint.absentDigit)} cannot be placed anywhere in the third box of the chute, and the remote pair cells ${formatSquares(hint.remotePairSquares)} contain both ${formatDigits(hint.digits)}, ${formatDigit(hint.absentDigit)} can be eliminated from cells ${formatSquares(hint.eliminationCells)} that can see both remote pair cells.`;

				case 'simple_coloring':
					if (hint.rule === 'rule_2') {
						return `Two cells in the chain have the same color in the same ${hint.conflictUnitType}, which is impossible. All cells with that color must be false, so ${formatDigit(hint.digit)} can be eliminated from cells ${formatSquares(hint.eliminationCells)}.`;
					} else {
						return `Cell ${formatSquare(hint.witnessCell || '')} can see both colors of the chain, meaning ${formatDigit(hint.digit)} would conflict no matter which color is true. Therefore, ${formatDigit(hint.digit)} can be eliminated from cell ${formatSquare(hint.witnessCell || '')}.`;
					}

				case 'y_wing':
					return `The Y-Wing forces candidate ${formatDigit(hint.candidateC)} into one of the pincer cells ${formatSquare(hint.pincer1Cell)} or ${formatSquare(hint.pincer2Cell)}. Any cell that can see both pincers cannot contain ${formatDigit(hint.candidateC)}. Therefore, eliminate ${formatDigit(hint.candidateC)} from cells ${formatSquares(hint.eliminationCells)}.`;
			}
		}
		return '';
	}

	function handleAction() {
		if (stage === 1) {
			showLocation();
		} else if (stage === 2) {
			showSolution();
		} else {
			onApplyHint();
		}
	}
</script>

<div class="hint-display" style="width: {gridSize}">
	<div class="hint-header">
		<div class="hint-title">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="hint-icon"
			>
				<path d="M9 21h6" />
				<path
					d="M12 17c-3.314 0-6-2.686-6-6 0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6z"
				/>
				<path d="M10 19h4" />
			</svg>
			<span class="technique-name"
				>{getTechniqueDisplayName(hint.technique)}</span
			>
			<div
				class="difficulty-badge difficulty-{getTechniqueDifficultyCategory()}"
			>
				{getTechniqueDifficultyCategory()}
			</div>
		</div>
		<button class="close-button" on:click={closeHint} aria-label="Close hint">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	</div>

	<div class="hint-body">
		<div class="hint-description">
			{@html stageDescription}
		</div>

		{#if stage === 3}
			<div class="hint-details">
				{#if hint.type === 'error'}
					<div class="action-item">
						<span class="action-type error">❌ Correct value:</span>
						<span class="action-value"
							>{@html formatDigit(hint.correctValue)}</span
						>
					</div>
				{:else if hint.type === 'missing_candidate'}
					<div class="action-item">
						<span class="action-type add">➕ Add candidate:</span>
						<span class="action-value"
							>{@html formatDigit(hint.missingDigit)}</span
						>
					</div>
				{:else if hint.type === 'single_cell'}
					<div class="action-item">
						<span class="action-type place">✅ Place {getDigitWord()}:</span>
						<span class="action-value">{@html formatDigit(hint.digit)}</span>
					</div>
				{:else if hint.type === 'naked_set' || hint.type === 'hidden_set'}
					{#if hint.eliminationCells.length > 0}
						<div class="action-item">
							<span class="action-type remove">🗑️ Remove candidates:</span>
							<span class="action-value"
								>{@html formatDigits(hint.eliminationDigits)}</span
							>
						</div>
						<div class="action-item">
							<span class="action-type from">📍 From cells:</span>
							<span class="action-value"
								>{formatSquares(hint.eliminationCells)}</span
							>
						</div>
					{/if}
				{:else if hint.type === 'intersection_removal'}
					{#if hint.eliminationCells.length > 0}
						<div class="action-item">
							<span class="action-type remove">🗑️ Remove candidate:</span>
							<span class="action-value">{@html formatDigit(hint.digit)}</span>
						</div>
						<div class="action-item">
							<span class="action-type from">📍 From cells:</span>
							<span class="action-value"
								>{formatSquares(hint.eliminationCells)}</span
							>
						</div>
					{/if}
				{:else if hint.type === 'x_wing'}
					{#if hint.eliminationCells.length > 0}
						<div class="action-item">
							<span class="action-type remove">🗑️ Remove candidate:</span>
							<span class="action-value">{@html formatDigit(hint.digit)}</span>
						</div>
						<div class="action-item">
							<span class="action-type from">📍 From cells:</span>
							<span class="action-value"
								>{formatSquares(hint.eliminationCells)}</span
							>
						</div>
					{/if}
				{:else if hint.type === 'chute_remote_pairs'}
					{#if hint.eliminationCells.length > 0}
						<div class="action-item">
							<span class="action-type remove">🗑️ Remove candidate:</span>
							<span class="action-value"
								>{@html formatDigit(hint.absentDigit)}</span
							>
						</div>
						<div class="action-item">
							<span class="action-type from">📍 From cells:</span>
							<span class="action-value"
								>{formatSquares(hint.eliminationCells)}</span
							>
						</div>
					{/if}
				{:else if hint.type === 'simple_coloring'}
					{#if hint.eliminationCells.length > 0}
						<div class="action-item">
							<span class="action-type remove">🗑️ Remove candidate:</span>
							<span class="action-value">{@html formatDigit(hint.digit)}</span>
						</div>
						<div class="action-item">
							<span class="action-type from">📍 From cells:</span>
							<span class="action-value"
								>{formatSquares(hint.eliminationCells)}</span
							>
						</div>
					{/if}
				{:else if hint.type === 'y_wing'}
					{#if hint.eliminationCells.length > 0}
						<div class="action-item">
							<span class="action-type remove">🗑️ Remove candidate:</span>
							<span class="action-value"
								>{@html formatDigit(hint.candidateC)}</span
							>
						</div>
						<div class="action-item">
							<span class="action-type from">📍 From cells:</span>
							<span class="action-value"
								>{formatSquares(hint.eliminationCells)}</span
							>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>

	<div class="hint-actions">
		<button class="btn btn-primary" on:click={handleAction}>
			{buttonText}
		</button>

		{#if stage > 1}
			<button class="btn btn-secondary" on:click={closeHint}> Cancel </button>
		{/if}

		{#if stage === 3}
			<div class="stage-indicators">
				<div class="stage-dot active"></div>
				<div class="stage-dot active"></div>
				<div class="stage-dot active"></div>
			</div>
		{:else if stage === 2}
			<div class="stage-indicators">
				<div class="stage-dot active"></div>
				<div class="stage-dot active"></div>
				<div class="stage-dot"></div>
			</div>
		{:else}
			<div class="stage-indicators">
				<div class="stage-dot active"></div>
				<div class="stage-dot"></div>
				<div class="stage-dot"></div>
			</div>
		{/if}
	</div>
</div>

<style>
	.hint-display {
		background: var(--gradient-surface);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		width: 100%;
		box-sizing: border-box;
		margin-top: var(--space-xl);
		overflow: hidden;
		animation: slideIn var(--transition-smooth);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.hint-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-xl) var(--space-2xl);
		border-bottom: 1px solid var(--color-border);
		background: var(--gradient-toggle);
	}

	.hint-title {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
	}

	.hint-icon {
		color: var(--color-success);
		flex-shrink: 0;
	}

	.technique-name {
		font-weight: var(--font-weight-bold);
		font-size: var(--font-size-xl);
		color: var(--color-text);
	}

	.difficulty-badge {
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.difficulty-error {
		background-color: var(--color-danger);
		color: var(--color-white);
	}

	.difficulty-trivial {
		background-color: var(--color-success-lighter);
		color: var(--color-dark);
	}

	.difficulty-basic {
		background-color: var(--color-success);
		color: var(--color-white);
	}

	.difficulty-intermediate {
		background-color: var(--color-info);
		color: var(--color-white);
	}

	.difficulty-tough {
		background-color: var(--color-warning);
		color: var(--color-white);
	}

	.difficulty-diabolical {
		background-color: var(--color-warning-darker);
		color: var(--color-white);
	}

	.difficulty-extreme {
		background-color: var(--color-danger);
		color: var(--color-white);
	}

	.difficulty-master {
		background-color: var(--color-danger-darker);
		color: var(--color-white);
	}

	.difficulty-grandmaster {
		background-color: var(--color-dark);
		color: var(--color-white);
		border: 2px solid var(--color-warning);
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-md);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		transition: var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background-color: var(--color-border);
		color: var(--color-dark);
	}

	.hint-body {
		padding: var(--space-2xl);
	}

	.hint-description {
		font-size: var(--font-size-lg);
		line-height: 1.5;
		color: var(--color-dark);
		margin-bottom: var(--space-xl);
	}

	.hint-details {
		background-color: var(--color-light);
		border-radius: var(--radius-sm);
		padding: var(--space-xl);
		border-left: 4px solid var(--color-success);
	}

	.action-item {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		margin-bottom: var(--space-md);
	}

	.action-item:last-child {
		margin-bottom: 0;
	}

	.action-type {
		font-weight: var(--font-weight-bold);
		min-width: 140px;
	}

	.action-type.error {
		color: var(--color-danger);
	}

	.action-type.add {
		color: var(--color-success);
	}

	.action-type.place {
		color: var(--color-primary);
	}

	.action-type.remove {
		color: var(--color-warning);
	}

	.action-type.from {
		color: var(--color-info);
	}

	.action-value {
		font-family:
			'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas,
			'Courier New', monospace;
		background-color: var(--color-border);
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-sm);
		font-weight: var(--font-weight-normal);
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.hint-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-xl) var(--space-2xl);
		background-color: var(--color-light);
		border-top: 1px solid var(--color-border);
		gap: var(--space-lg);
	}

	.stage-indicators {
		display: flex;
		gap: var(--space-md);
		align-items: center;
	}

	.stage-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-full);
		background-color: var(--color-medium);
		transition: background-color var(--transition-smooth);
	}

	.stage-dot.active {
		background-color: var(--color-primary);
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.hint-display {
			margin-top: var(--space-md);
		}

		.hint-header {
			padding: var(--space-lg) var(--space-xl);
		}

		.technique-name {
			font-size: var(--font-size-lg);
		}

		.hint-body {
			padding: var(--space-xl);
		}

		.hint-actions {
			padding: var(--space-lg) var(--space-xl);
			flex-wrap: wrap;
		}

		.action-type {
			min-width: 120px;
			font-size: var(--font-size-sm);
		}
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.hint-display {
			margin-top: var(--space-xs);
		}

		.hint-header {
			padding: var(--space-md) var(--space-lg);
		}

		.hint-body {
			padding: var(--space-lg);
		}

		.hint-actions {
			padding: var(--space-md) var(--space-lg);
		}
	}
</style>
