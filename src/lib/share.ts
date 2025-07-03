// Utility functions for sharing puzzles

export interface PuzzleShare {
	puzzle: string; // 81-character string representing the initial puzzle
	difficulty?: string;
	completionTime?: number; // Time in milliseconds
	colorKuMode?: boolean; // Whether ColorKu mode was enabled
}

/**
 * Encode a puzzle configuration into a shareable string
 */
export function encodePuzzle(
	board: any[][],
	difficulty?: string,
	completionTime?: number,
	colorKuMode?: boolean,
): string {
	// Convert board to 81-character string (dots for empty cells)
	// For completion sharing, use only initial cells; for configuration sharing, use all cells with values
	const puzzleString = board
		.flat()
		.map((cell) => {
			if (completionTime) {
				// This is a completion share - only include initial cells
				return cell.isInitial && cell.value ? cell.value.toString() : '.';
			} else {
				// This is a configuration share - include all cells with values
				return cell.value ? cell.value.toString() : '.';
			}
		})
		.join('');

	console.log('Encoding puzzle string:', puzzleString); // Debug log

	const shareData: PuzzleShare = {
		puzzle: puzzleString,
		difficulty,
		completionTime,
		colorKuMode,
	};

	// Convert to base64 for URL sharing
	const jsonString = JSON.stringify(shareData);
	return btoa(jsonString)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

/**
 * Decode a shared puzzle string back to puzzle configuration
 */
export function decodePuzzle(encoded: string): PuzzleShare | null {
	try {
		// Restore base64 padding and characters
		const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

		const jsonString = atob(padded);
		const shareData: PuzzleShare = JSON.parse(jsonString);

		// Validate the puzzle string
		if (!shareData.puzzle || shareData.puzzle.length !== 81) {
			return null;
		}

		return shareData;
	} catch (error) {
		console.error('Failed to decode puzzle:', error);
		return null;
	}
}

/**
 * Generate shareable text based on completion status
 */
export function generateShareText(
	completionTime?: number,
	difficulty?: string,
): string {
	if (completionTime) {
		const minutes = Math.floor(completionTime / 60000);
		const seconds = Math.floor((completionTime % 60000) / 1000);
		const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

		return `🧩 I just solved this ${difficulty || ''} Sudoku puzzle in ${timeStr}! How fast can you solve it?`;
	} else {
		return `🧩 Try to solve this ${difficulty || ''} Sudoku puzzle! How fast can you do it?`;
	}
}

/**
 * Create a shareable URL for the current page with puzzle data
 */
export function createShareableUrl(encoded: string): string {
	const baseUrl = window.location.origin + window.location.pathname;
	return `${baseUrl}?challenge=${encoded}`;
}

/**
 * Parse challenge from current URL
 */
export function getChallengeFromUrl(): PuzzleShare | null {
	if (typeof window === 'undefined') return null;

	const urlParams = new URLSearchParams(window.location.search);
	const challenge = urlParams.get('challenge');

	if (!challenge) return null;

	return decodePuzzle(challenge);
}
