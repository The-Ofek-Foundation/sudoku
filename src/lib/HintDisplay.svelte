<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ComprehensiveHint } from './sudoku/sudoku';
	
	export let hint: ComprehensiveHint;
	export let gridSize: string;
	
	const dispatch = createEventDispatcher<{
		close: void;
		highlight: { squares: string[]; type: 'primary' | 'secondary' | 'elimination' };
		clearHighlights: void;
		applyHint: void;
	}>();
	
	let stage: 1 | 2 | 3 = 1; // Start at stage 1 (Show Technique)
	
	// Reactive button text
	$: buttonText = stage === 1 ? 'Show Location' : stage === 2 ? 'Show Solution' : 'Apply Hint';
	
	// Helper function to get technique display name
	function getTechniqueDisplayName(technique: string): string {
		const names: Record<string, string> = {
			'incorrect_value': 'Incorrect Value',
			'missing_candidate': 'Missing Candidate',
			'last_remaining_in_box': 'Last Remaining in Box',
			'last_remaining_in_row': 'Last Remaining in Row',
			'last_remaining_in_column': 'Last Remaining in Column',
			'naked_single': 'Naked Single',
			'naked_pairs': 'Naked Pairs',
			'naked_triples': 'Naked Triples',
			'naked_quads': 'Naked Quads',
			'hidden_pairs': 'Hidden Pairs',
			'hidden_triples': 'Hidden Triples',
			'hidden_quads': 'Hidden Quads'
		};
		return names[technique] || technique;
	}
	
	// Helper function to get technique difficulty
	function getTechniqueDifficulty(technique: string): 'beginner' | 'easy' | 'medium' | 'hard' {
		const difficulties: Record<string, 'beginner' | 'easy' | 'medium' | 'hard'> = {
			'incorrect_value': 'beginner',
			'missing_candidate': 'beginner',
			'last_remaining_in_box': 'beginner',
			'last_remaining_in_row': 'beginner',
			'last_remaining_in_column': 'beginner',
			'naked_single': 'easy',
			'naked_pairs': 'medium',
			'naked_triples': 'medium',
			'naked_quads': 'hard',
			'hidden_pairs': 'medium',
			'hidden_triples': 'hard',
			'hidden_quads': 'hard'
		};
		return difficulties[technique] || 'medium';
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
	
	// Stage progression functions
	function showLocation() {
		stage = 2;
		// Highlight the relevant squares
		if (hint.type === 'error' || hint.type === 'missing_candidate' || hint.type === 'single_cell') {
			dispatch('highlight', { squares: [hint.square], type: 'primary' });
		} else if (hint.type === 'naked_set' || hint.type === 'hidden_set') {
			dispatch('highlight', { squares: hint.squares, type: 'primary' });
		}
	}
	
	function showSolution() {
		stage = 3;
		// Highlight all relevant squares with different types
		if (hint.type === 'error' || hint.type === 'missing_candidate' || hint.type === 'single_cell') {
			dispatch('highlight', { squares: [hint.square], type: 'primary' });
		} else if (hint.type === 'naked_set' || hint.type === 'hidden_set') {
			dispatch('highlight', { squares: hint.squares, type: 'primary' });
			if (hint.eliminationCells.length > 0) {
				dispatch('highlight', { squares: hint.eliminationCells, type: 'elimination' });
			}
		}
	}
	
	function closeHint() {
		dispatch('clearHighlights');
		dispatch('close');
	}
	
	// Get description based on stage
	function getStageDescription(): string {
		if (stage === 1) {
			// Stage 1: Just the technique type
			const difficulty = getTechniqueDifficulty(hint.technique);
			const difficultyColors = {
				beginner: '🟢',
				easy: '🔵', 
				medium: '🟡',
				hard: '🔴'
			};
			return `A ${getTechniqueDisplayName(hint.technique)} has been found ${difficultyColors[difficulty]}`;
		} else if (stage === 2) {
			// Stage 2: Show location but not specific action
			if (hint.type === 'error') {
				return `Found an incorrect value in cell ${formatSquare(hint.square)}`;
			} else if (hint.type === 'missing_candidate') {
				return `Cell ${formatSquare(hint.square)} is missing a candidate`;
			} else if (hint.type === 'single_cell') {
				return `Cell ${formatSquare(hint.square)} can only contain one value`;
			} else if (hint.type === 'naked_set') {
				return `${getTechniqueDisplayName(hint.technique)} found in cells ${formatSquares(hint.squares)}`;
			} else if (hint.type === 'hidden_set') {
				return `${getTechniqueDisplayName(hint.technique)} found in cells ${formatSquares(hint.squares)}`;
			}
		} else {
			// Stage 3: Show full description with specific action
			return hint.description;
		}
		return '';
	}
	
	function getActionButtonText(): string {
		return stage === 1 ? 'Show Location' : stage === 2 ? 'Show Solution' : 'Apply Hint';
	}
	
	function handleAction() {
		if (stage === 1) {
			showLocation();
		} else if (stage === 2) {
			showSolution();
		} else {
			dispatch('applyHint');
		}
	}
</script>

<div class="hint-display" style="max-width: {gridSize}">
	<div class="hint-header">
		<div class="hint-title">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hint-icon">
				<path d="M9 12l2 2 4-4"/>
				<circle cx="12" cy="12" r="9"/>
			</svg>
			<span class="technique-name">{getTechniqueDisplayName(hint.technique)}</span>
			<div class="difficulty-badge difficulty-{getTechniqueDifficulty(hint.technique)}">
				{getTechniqueDifficulty(hint.technique)}
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
			{getStageDescription()}
		</div>
		
		{#if stage === 3}
			<div class="hint-details">
				{#if hint.type === 'error'}
					<div class="action-item">
						<span class="action-type error">❌ Correct value:</span>
						<span class="action-value">{hint.correctValue}</span>
					</div>
				{:else if hint.type === 'missing_candidate'}
					<div class="action-item">
						<span class="action-type add">➕ Add candidate:</span>
						<span class="action-value">{hint.missingDigit}</span>
					</div>
				{:else if hint.type === 'single_cell'}
					<div class="action-item">
						<span class="action-type place">✅ Place digit:</span>
						<span class="action-value">{hint.digit}</span>
					</div>
				{:else if hint.type === 'naked_set' || hint.type === 'hidden_set'}
					{#if hint.eliminationCells.length > 0}
						<div class="action-item">
							<span class="action-type remove">🗑️ Remove candidates:</span>
							<span class="action-value">{hint.eliminationDigits.join(', ')}</span>
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
