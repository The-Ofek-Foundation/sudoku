<script lang="ts">
	import { createShareableUrl } from './share.js';

	export let isOpen: boolean = false;
	export let shareText: string = '';
	export let shareUrl: string = '';
	export let onClose: () => void;

	let copySuccess: boolean = false;
	let copyTimeout: ReturnType<typeof setTimeout>;

	async function copyToClipboard() {
		try {
			const fullText = `${shareText}\n\n${shareUrl}`;
			await navigator.clipboard.writeText(fullText);
			copySuccess = true;

			// Clear the success message after 2 seconds
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			// Fallback: select the text for manual copying
			const textArea = document.createElement('textarea');
			textArea.value = `${shareText}\n\n${shareUrl}`;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copySuccess = true;

			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copySuccess = false;
			}, 2000);
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
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
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div class="modal-content">
			<div class="modal-header">
				<h2 id="modal-title">Share Your Challenge</h2>
				<button class="close-button" on:click={onClose} aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<div class="share-text-container">
					<label for="share-text">Share this with your friends:</label>
					<textarea
						id="share-text"
						readonly
						value="{shareText}

{shareUrl}"
						rows="4"
					></textarea>
				</div>

				<button
					class="btn btn-success copy-button"
					class:success={copySuccess}
					on:click={copyToClipboard}
				>
					{#if copySuccess}
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
						>
							<polyline points="20,6 9,17 4,12"></polyline>
						</svg>
						Copied!
					{:else}
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
						>
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
							></path>
						</svg>
						Copy to Clipboard
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: var(--color-shadow-strong);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-modal);
		padding: var(--space-xl);
		box-sizing: border-box;
	}

	.modal-content {
		background: var(--color-surface);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		animation: modalSlideIn var(--transition-smooth);
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: scale(0.9) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3xl) var(--space-3xl) var(--space-xl) var(--space-3xl);
		border-bottom: 1px solid var(--color-border);
	}

	.modal-header h2 {
		margin: 0;
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text);
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-md);
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		transition: var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background-color: var(--color-light);
		color: var(--color-dark);
	}

	.modal-body {
		padding: var(--space-xl) var(--space-3xl) var(--space-3xl) var(--space-3xl);
	}

	.share-text-container {
		margin-bottom: var(--space-3xl);
	}

	.share-text-container label {
		display: block;
		margin-bottom: var(--space-md);
		font-weight: var(--font-weight-normal);
		color: var(--color-dark);
	}

	textarea {
		width: 100%;
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: var(--font-size-sm);
		line-height: 1.4;
		resize: vertical;
		min-height: 100px;
		background-color: var(--color-light);
		color: var(--color-dark);
		box-sizing: border-box;
	}

	textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-shadow);
	}

	.copy-button {
		width: 100%;
		gap: var(--space-md);
	}

	.copy-button.success {
		animation: successPulse var(--transition-smooth);
	}

	@keyframes successPulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.modal-backdrop {
			padding: var(--space-md);
		}

		.modal-header {
			padding: var(--space-xl) var(--space-xl) var(--space-lg) var(--space-xl);
		}

		.modal-header h2 {
			font-size: var(--font-size-xl);
		}

		.modal-body {
			padding: var(--space-lg) var(--space-xl) var(--space-xl) var(--space-xl);
		}

		textarea {
			font-size: var(--font-size-xs);
			min-height: 80px;
		}
	}
</style>
