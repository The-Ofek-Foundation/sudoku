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
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
					class="copy-button" 
					class:success={copySuccess}
					on:click={copyToClipboard}
				>
					{#if copySuccess}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20,6 9,17 4,12"></polyline>
						</svg>
						Copied!
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		box-sizing: border-box;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		animation: modalSlideIn 0.3s ease-out;
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
		padding: 1.5rem 1.5rem 1rem 1.5rem;
		border-bottom: 1px solid #e9ecef;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #212529;
	}

	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #6c757d;
		border-radius: 6px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background-color: #f8f9fa;
		color: #495057;
	}

	.modal-body {
		padding: 1rem 1.5rem 1.5rem 1.5rem;
	}

	.share-text-container {
		margin-bottom: 1.5rem;
	}

	.share-text-container label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #495057;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.9rem;
		line-height: 1.4;
		resize: vertical;
		min-height: 100px;
		background-color: #f8f9fa;
		color: #495057;
		box-sizing: border-box;
	}

	textarea:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
	}

	.copy-button {
		width: 100%;
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
	}

	.copy-button:hover {
		background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
	}

	.copy-button.success {
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		animation: successPulse 0.3s ease-out;
	}

	@keyframes successPulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.modal-backdrop {
			padding: 0.5rem;
		}

		.modal-header {
			padding: 1rem 1rem 0.75rem 1rem;
		}

		.modal-header h2 {
			font-size: 1.25rem;
		}

		.modal-body {
			padding: 0.75rem 1rem 1rem 1rem;
		}

		textarea {
			font-size: 0.85rem;
			min-height: 80px;
		}

		.copy-button {
			padding: 0.625rem 0.75rem;
			font-size: 0.9rem;
		}
	}
</style>
