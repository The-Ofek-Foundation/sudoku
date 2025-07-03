<script lang="ts">
	export let isOpen: boolean = false;
	export let onClose: () => void;
	export let onNewGame: () => void;

	// Array of encouraging messages
	const congratsMessages = [
		"Great work! You make that look easy.",
		"Fantastic! You're a sudoku master!",
		"Brilliant solving! That was impressive.",
		"Outstanding work! You've got real skill.",
		"Excellent job! Your logic is spot on.",
		"Amazing! You solved it like a pro.",
		"Superb! Your sudoku skills are top-notch.",
		"Incredible! You're getting really good at this.",
		"Well done! That was beautifully solved.",
		"Perfect! You nailed that puzzle."
	];

	// Get a random congratulations message
	function getRandomMessage() {
		return congratsMessages[Math.floor(Math.random() * congratsMessages.length)];
	}

	let currentMessage = getRandomMessage();

	// Generate a new message each time the modal opens
	$: if (isOpen) {
		currentMessage = getRandomMessage();
	}
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={onClose} on:keydown role="button" tabindex="0">
		<div class="modal-content" on:click|stopPropagation on:keydown role="button" tabindex="0">
			<div class="celebration-icon">🎉</div>
			
			<h2>Puzzle Solved!</h2>
			
			<p class="congrats-message">{currentMessage}</p>
			
			<p class="suggestion">
				Ready for a challenge? Try 
				<strong>Competition Mode</strong> next time to test your speed!
			</p>
			
			<div class="modal-actions">
				<button class="new-game-button" on:click={onNewGame}>
					New Game
				</button>
				<button class="continue-button" on:click={onClose}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		backdrop-filter: blur(3px);
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.celebration-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		animation: bounce 0.6s ease-in-out infinite alternate;
	}

	@keyframes bounce {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(-5px);
		}
	}

	h2 {
		color: #2d5016;
		margin-bottom: 1rem;
		font-size: 1.8rem;
		font-weight: 700;
	}

	.congrats-message {
		font-size: 1.1rem;
		color: #333;
		margin-bottom: 1.5rem;
		font-weight: 500;
		line-height: 1.4;
	}

	.suggestion {
		color: #666;
		margin-bottom: 2rem;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.suggestion strong {
		color: #2d5016;
		font-weight: 600;
	}

	.modal-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.new-game-button, .continue-button {
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 25px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new-game-button {
		background: linear-gradient(135deg, #4a7c59 0%, #2d5016 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(45, 80, 22, 0.3);
	}

	.new-game-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(45, 80, 22, 0.4);
	}

	.continue-button {
		background: transparent;
		color: #666;
		border: 2px solid #ddd;
	}

	.continue-button:hover {
		background: #f5f5f5;
		border-color: #ccc;
		transform: translateY(-1px);
	}

	.new-game-button:active, .continue-button:active {
		transform: translateY(0);
	}

	/* Dark theme support */
	@media (prefers-color-scheme: dark) {
		.modal-content {
			background: #1a1a1a;
			color: #fff;
		}

		h2 {
			color: #7fb069;
		}

		.congrats-message {
			color: #e0e0e0;
		}

		.suggestion {
			color: #b0b0b0;
		}

		.suggestion strong {
			color: #7fb069;
		}

		.continue-button {
			color: #b0b0b0;
			border-color: #444;
		}

		.continue-button:hover {
			background: #333;
			border-color: #555;
		}
	}
</style>
