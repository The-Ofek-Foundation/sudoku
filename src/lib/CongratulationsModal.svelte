<script lang="ts">
	export let isOpen: boolean = false;
	export let onClose: () => void;
	export let onNewGame: () => void;

	// Array of encouraging messages
	const congratsMessages = [
		'Great work! You make that look easy.',
		"Fantastic! You're a sudoku master!",
		'Brilliant solving! That was impressive.',
		"Outstanding work! You've got real skill.",
		'Excellent job! Your logic is spot on.',
		'Amazing! You solved it like a pro.',
		'Superb! Your sudoku skills are top-notch.',
		"Incredible! You're getting really good at this.",
		'Well done! That was beautifully solved.',
		'Perfect! You nailed that puzzle.',
	];

	// Get a random congratulations message
	function getRandomMessage() {
		return congratsMessages[
			Math.floor(Math.random() * congratsMessages.length)
		];
	}

	let currentMessage = getRandomMessage();

	// Generate a new message each time the modal opens
	$: if (isOpen) {
		currentMessage = getRandomMessage();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="modal-overlay"
		on:click={onClose}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<div
			class="modal-content"
			on:click|stopPropagation
			on:keydown={handleKeydown}
			role="button"
			tabindex="0"
		>
			<div class="celebration-icon">🎉</div>

			<h2>Puzzle Solved!</h2>

			<p class="congrats-message">{currentMessage}</p>

			<p class="suggestion">
				Ready for a challenge? Try
				<strong>Competition Mode</strong> next time to test your speed!
			</p>

			<div class="modal-actions">
				<button class="btn btn-success new-game-button" on:click={onNewGame}>
					New Game
				</button>
				<button class="btn btn-outline continue-button" on:click={onClose}>
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
		background-color: var(--color-shadow-strong);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: var(--z-modal);
		backdrop-filter: blur(3px);
	}

	.modal-content {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-3xl);
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: var(--shadow-lg);
		animation: slideIn var(--transition-smooth);
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
		font-size: var(--font-size-3xl);
		margin-bottom: var(--space-xl);
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
		color: var(--color-new-game);
		margin-bottom: var(--space-xl);
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-bold);
	}

	.congrats-message {
		font-size: var(--font-size-xl);
		color: var(--color-text);
		margin-bottom: var(--space-3xl);
		font-weight: var(--font-weight-normal);
		line-height: 1.4;
	}

	.suggestion {
		color: var(--color-text-muted);
		margin-bottom: var(--space-3xl);
		font-size: var(--font-size-md);
		line-height: 1.5;
	}

	.suggestion strong {
		color: var(--color-new-game);
		font-weight: var(--font-weight-bold);
	}

	.modal-actions {
		display: flex;
		justify-content: center;
		gap: var(--space-xl);
	}

	.new-game-button {
		background: var(--gradient-new-game) !important;
		border-radius: 25px !important;
	}

	.new-game-button:hover {
		background: var(--gradient-new-game-hover) !important;
	}

	.continue-button {
		border-radius: 25px !important;
	}
</style>
