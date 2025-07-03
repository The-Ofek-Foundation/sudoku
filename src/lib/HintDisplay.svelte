<script lang="ts">
	import type { ComprehensiveHint } from './sudoku/sudoku';
	import { difficultyToCategory } from '$lib';
	import { colorKuColors } from './colors.js';
	
	export let hint: ComprehensiveHint;
	export let gridSize: string;
	export let colorKuMode: boolean = false;
	
	// Callback props instead of createEventDispatcher
	export let onClose: () => void;
	export let onHighlight: (data: { squares: string[]; type: 'primary' | 'secondary' | 'elimination' }) => void;
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
	$: buttonText = stage === 1 ? 'Show Location' : stage === 2 ? 'Show Solution' : 'Apply Hint';
	
	// Reactive description text - pass stage as parameter to make dependency explicit
	$: stageDescription = getStageDescription(stage);
	
	// Helper function to get technique display name
	function getTechniqueDisplayName(technique: string): string {
		const names: Record<string, string> = {
			'incorrect_value': 'Incorrect Value',
			'missing_candidate': 'Missing Candidate',
			'last_remaining_in_box': 'Last Remaining in Box',
			'last_remaining_in_row': 'Last Remaining in Column', // Flipped for UI display
			'last_remaining_in_column': 'Last Remaining in Row', // Flipped for UI display
			'naked_single': 'Naked Single',
			'naked_pairs': 'Naked Pairs',
			'naked_triples': 'Naked Triples',
			'naked_quads': 'Naked Quads',
			'hidden_pairs': 'Hidden Pairs',
			'hidden_triples': 'Hidden Triples',
			'hidden_quads': 'Hidden Quads',
			'pointing_pairs': 'Pointing Pairs',
			'box_line_reduction': 'Box/Line Reduction'
		};
		return names[technique] || technique;
	}
	
	// Helper function to get technique difficulty category
	function getTechniqueDifficultyCategory(): 'beginner' | 'easy' | 'medium' | 'hard' {
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
		return squares.slice(0, -1).map(formatSquare).join(', ') + ', and ' + formatSquare(squares[squares.length - 1]);
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
			return digits.map(d => formatDigit(d)).join(', ');
		}

		if (digits.length <= 2) {
			return digits.join(' and ');
		}

		return digits.slice(0, -1).join(', ') + ', and ' + digits[digits.length - 1];
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
		return getDigitWordPlural().charAt(0).toUpperCase() + getDigitWordPlural().slice(1);
	}
	
	// Stage progression functions
	function showLocation() {
		stage = 2;
		// Highlight the relevant squares
		if (hint.type === 'error' || hint.type === 'missing_candidate') {
			onHighlight({ squares: [hint.square], type: 'primary' });
		} else if (hint.type === 'single_cell') {
			// For "last remaining" techniques, highlight the entire unit first
			if (hint.technique.includes('last_remaining') && hint.unit) {
				onHighlight({ squares: hint.unit, type: 'secondary' });
			} else {
				// For naked singles, just highlight the cell
				onHighlight({ squares: [hint.square], type: 'primary' });
			}
		} else if (hint.type === 'naked_set' || hint.type === 'hidden_set') {
			// For sets, highlight the containing unit to show context
			if (hint.unit) {
				onHighlight({ squares: hint.unit, type: 'secondary' });
				onHighlight({ squares: hint.squares, type: 'primary' });
			} else {
				onHighlight({ squares: hint.squares, type: 'primary' });
			}
		} else if (hint.type === 'intersection_removal') {
			// For intersection removal, highlight both units to show the context
			if (hint.primaryUnit && hint.secondaryUnit) {
				if (hint.technique === 'pointing_pairs') {
					// Pointing pairs: highlight only the specific cells where the digit is constrained
					// Show the box as context and the pointing cells as primary
					onHighlight({ squares: hint.primaryUnit, type: 'secondary' });
					onHighlight({ squares: hint.squares, type: 'primary' });
				} else if (hint.technique === 'box_line_reduction') {
					// Box/line reduction: digit in row/column restricted to box  
					// For stage 2, show both the line and the box to provide full context
					onHighlight({ squares: hint.primaryUnit, type: 'primary' }); // The line
					onHighlight({ squares: hint.secondaryUnit, type: 'secondary' }); // The box
				} else {
					// Fallback
					onHighlight({ squares: hint.primaryUnit, type: 'primary' });
					onHighlight({ squares: hint.secondaryUnit, type: 'secondary' });
				}
			} else {
				onHighlight({ squares: hint.squares, type: 'primary' });
			}
		}
	}
	
	function showSolution() {
		stage = 3;
		// Highlight all relevant squares with different types
		if (hint.type === 'error' || hint.type === 'missing_candidate') {
			onHighlight({ squares: [hint.square], type: 'primary' });
		} else if (hint.type === 'single_cell') {
			// For "last remaining" techniques, now highlight the specific cell as primary
			// and keep the unit as secondary
			if (hint.technique.includes('last_remaining') && hint.unit) {
				onHighlight({ squares: hint.unit, type: 'secondary' });
				onHighlight({ squares: [hint.square], type: 'primary' });
			} else {
				// For naked singles, just highlight the cell
				onHighlight({ squares: [hint.square], type: 'primary' });
			}
		} else if (hint.type === 'naked_set' || hint.type === 'hidden_set') {
			// Show the containing unit, the set cells, and elimination cells
			if (hint.unit) {
				onHighlight({ squares: hint.unit, type: 'secondary' });
			}
			onHighlight({ squares: hint.squares, type: 'primary' });
			if (hint.eliminationCells.length > 0) {
				onHighlight({ squares: hint.eliminationCells, type: 'elimination' });
			}
		} else if (hint.type === 'intersection_removal') {
			// Show the units, the intersection, and elimination cells
			if (hint.primaryUnit && hint.secondaryUnit) {
				if (hint.technique === 'pointing_pairs') {
					// Pointing pairs: show both units as context, intersection as primary
					onHighlight({ squares: hint.primaryUnit, type: 'secondary' });
					onHighlight({ squares: hint.secondaryUnit, type: 'secondary' });
					onHighlight({ squares: hint.squares, type: 'primary' }); // The intersection
				} else if (hint.technique === 'box_line_reduction') {
					// Box/line reduction: show line as primary, box as secondary, intersection highlighted within line
					onHighlight({ squares: hint.primaryUnit, type: 'primary' }); // The line
					onHighlight({ squares: hint.secondaryUnit, type: 'secondary' }); // The box
					// Don't separately highlight intersection since it's part of the primary line
				} else {
					// Fallback
					onHighlight({ squares: hint.primaryUnit, type: 'secondary' });
					onHighlight({ squares: hint.secondaryUnit, type: 'secondary' });
					onHighlight({ squares: hint.squares, type: 'primary' }); // The intersection
				}
			} else {
				onHighlight({ squares: hint.squares, type: 'primary' });
			}
			if (hint.eliminationCells.length > 0) {
				onHighlight({ squares: hint.eliminationCells, type: 'elimination' });
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

<div class="hint-display" style="max-width: {gridSize}">
	<div class="hint-header">
		<div class="hint-title">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hint-icon">
				<path d="M9 21h6"/>
				<path d="M12 17c-3.314 0-6-2.686-6-6 0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6z"/>
				<path d="M10 19h4"/>
			</svg>
			<span class="technique-name">{getTechniqueDisplayName(hint.technique)}</span>
			<div class="difficulty-badge difficulty-{getTechniqueDifficultyCategory()}">
				{getTechniqueDifficultyCategory()}
			</div>
		</div>
		<button class="close-button" on:click={closeHint} aria-label="Close hint">
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"/>
				<line x1="6" y1="6" x2="18" y2="18"/>
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
						<span class="action-value">{@html formatDigit(hint.correctValue)}</span>
					</div>
				{:else if hint.type === 'missing_candidate'}
					<div class="action-item">
						<span class="action-type add">➕ Add candidate:</span>
						<span class="action-value">{@html formatDigit(hint.missingDigit)}</span>
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
							<span class="action-value">{@html formatDigits(hint.eliminationDigits)}</span>
						</div>
						<div class="action-item">
							<span class="action-type from">📍 From cells:</span>
							<span class="action-value">{formatSquares(hint.eliminationCells)}</span>
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
							<span class="action-value">{formatSquares(hint.eliminationCells)}</span>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
	
	<div class="hint-actions">
		<button class="action-button primary" on:click={handleAction}>
			{buttonText}
		</button>
		
		{#if stage > 1}
			<button class="action-button secondary" on:click={closeHint}>
				Cancel
			</button>
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
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 1px solid #e9ecef;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		width: 100%;
		box-sizing: border-box;
		margin-top: 1rem;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
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
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e9ecef;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}
	
	.hint-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.hint-icon {
		color: #28a745;
		flex-shrink: 0;
	}
	
	.technique-name {
		font-weight: 600;
		font-size: 1.1rem;
		color: #212529;
	}
	
	.difficulty-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.difficulty-beginner {
		background-color: #d4edda;
		color: #155724;
	}
	
	.difficulty-easy {
		background-color: #cce7ff;
		color: #0056b3;
	}
	
	.difficulty-medium {
		background-color: #fff3cd;
		color: #856404;
	}
	
	.difficulty-hard {
		background-color: #f8d7da;
		color: #721c24;
	}
	
	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		color: #6c757d;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.close-button:hover {
		background-color: #e9ecef;
		color: #495057;
	}
	
	.hint-body {
		padding: 1.25rem;
	}
	
	.hint-description {
		font-size: 1rem;
		line-height: 1.5;
		color: #495057;
		margin-bottom: 1rem;
	}
	
	.hint-details {
		background-color: #f8f9fa;
		border-radius: 8px;
		padding: 1rem;
		border-left: 4px solid #28a745;
	}
	
	.action-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	
	.action-item:last-child {
		margin-bottom: 0;
	}
	
	.action-type {
		font-weight: 600;
		min-width: 140px;
	}
	
	.action-type.error {
		color: #dc3545;
	}
	
	.action-type.add {
		color: #28a745;
	}
	
	.action-type.place {
		color: #007bff;
	}
	
	.action-type.remove {
		color: #fd7e14;
	}
	
	.action-type.from {
		color: #6f42c1;
	}
	
	.action-value {
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		background-color: #e9ecef;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.hint-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background-color: #f8f9fa;
		border-top: 1px solid #e9ecef;
		gap: 0.75rem;
	}
	
	.action-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}
	
	.action-button.primary {
		background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
	}
	
	.action-button.primary:hover {
		background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
		transform: translateY(-1px);
	}
	
	.action-button.secondary {
		background-color: #6c757d;
		color: white;
	}
	
	.action-button.secondary:hover {
		background-color: #545b62;
	}
	
	.stage-indicators {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	.stage-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #dee2e6;
		transition: background-color 0.3s;
	}
	
	.stage-dot.active {
		background-color: #007bff;
	}
	
	/* Mobile adjustments */
	@media (max-width: 768px) {
		.hint-display {
			margin-top: 0.5rem;
		}
		
		.hint-header {
			padding: 0.75rem 1rem;
		}
		
		.technique-name {
			font-size: 1rem;
		}
		
		.hint-body {
			padding: 1rem;
		}
		
		.hint-actions {
			padding: 0.75rem 1rem;
			flex-wrap: wrap;
		}
		
		.action-button {
			padding: 0.5rem 1rem;
			font-size: 0.9rem;
		}
		
		.action-type {
			min-width: 120px;
			font-size: 0.9rem;
		}
	}
	
	/* Small screen adjustments */
	@media (max-height: 600px) {
		.hint-display {
			margin-top: 0.25rem;
		}
		
		.hint-header {
			padding: 0.5rem 0.75rem;
		}
		
		.hint-body {
			padding: 0.75rem;
		}
		
		.hint-actions {
			padding: 0.5rem 0.75rem;
		}
		
		.action-button {
			padding: 0.375rem 0.75rem;
			font-size: 0.8rem;
		}
	}
</style>
