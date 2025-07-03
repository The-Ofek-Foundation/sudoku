<script lang="ts">
	export let shareText: string;
	export let difficulty: string | undefined;
	export let challengerTime: number | undefined;
	export let colorKuMode: boolean | undefined;
	export let onStartChallenge: () => void;

	function formatTime(timeMs: number): string {
		const minutes = Math.floor(timeMs / 60000);
		const seconds = Math.floor((timeMs % 60000) / 1000);
		return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
	}
</script>

<div class="challenge-container">
	<div class="challenge-card">
		<div class="challenge-header">
			<h1>🧩 Sudoku Challenge</h1>
			<div class="challenge-badges">
				<div class="challenge-badge difficulty">
					{difficulty
						? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
						: 'Custom'} Puzzle
				</div>
				{#if colorKuMode}
					<div class="challenge-badge colorku">🌈 ColorKu Mode</div>
				{/if}
			</div>
		</div>

		<div class="challenge-body">
			<p class="challenge-message">{shareText}</p>

			{#if challengerTime}
				<div class="time-to-beat">
					<div class="time-label">Time to beat:</div>
					<div class="time-value">{formatTime(challengerTime)}</div>
				</div>
			{/if}

			<button
				class="btn btn-success start-challenge-button"
				on:click={onStartChallenge}
			>
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
					<polygon points="5,3 19,12 5,21"></polygon>
				</svg>
				Start Challenge
			</button>
		</div>

		<div class="challenge-footer">
			<p>Good luck! 🍀</p>
		</div>
	</div>
</div>

<style>
	.challenge-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: var(--space-3xl);
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		box-sizing: border-box;
	}

	.challenge-card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		max-width: 500px;
		width: 100%;
		padding: var(--space-3xl);
		text-align: center;
		animation: cardSlideIn 0.6s ease-out;
	}

	@keyframes cardSlideIn {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.challenge-header {
		margin-bottom: var(--space-3xl);
	}

	.challenge-header h1 {
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-bold);
		margin: 0 0 var(--space-xl) 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1.2;
	}

	.challenge-badges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		justify-content: center;
	}

	.challenge-badge {
		display: inline-block;
		padding: var(--space-md) var(--space-xl);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.challenge-badge.difficulty {
		background: var(--gradient-warning);
		color: var(--color-white);
		box-shadow: var(--shadow-button);
	}

	.challenge-badge.colorku {
		background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%);
		color: var(--color-white);
		box-shadow: var(--shadow-button);
	}

	.challenge-body {
		margin-bottom: var(--space-3xl);
	}

	.challenge-message {
		font-size: var(--font-size-xl);
		color: var(--color-dark);
		line-height: 1.6;
		margin-bottom: var(--space-3xl);
		font-weight: var(--font-weight-normal);
	}

	.time-to-beat {
		background: var(--color-highlight);
		border-radius: var(--radius-md);
		padding: var(--space-xl);
		margin-bottom: var(--space-3xl);
		border: 2px solid var(--color-highlight-hover);
	}

	.time-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-normal);
		margin-bottom: var(--space-xs);
	}

	.time-value {
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-highlight-text);
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.start-challenge-button {
		width: 100%;
		font-size: var(--font-size-xl) !important;
		gap: var(--space-lg) !important;
		background: var(--gradient-success) !important;
	}

	.start-challenge-button:hover {
		background: var(--gradient-success-hover) !important;
	}

	.challenge-footer {
		border-top: 1px solid var(--color-border);
		padding-top: var(--space-xl);
		margin-top: var(--space-xl);
	}

	.challenge-footer p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-normal);
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.challenge-container {
			padding: var(--space-xl);
		}

		.challenge-card {
			padding: var(--space-3xl);
		}

		.challenge-header h1 {
			font-size: var(--font-size-3xl);
		}

		.challenge-message {
			font-size: var(--font-size-lg);
		}

		.time-value {
			font-size: var(--font-size-2xl);
		}

		.start-challenge-button {
			font-size: var(--font-size-xl) !important;
		}
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.challenge-container {
			padding: var(--space-md);
		}

		.challenge-card {
			padding: var(--space-xl);
		}

		.challenge-header h1 {
			font-size: var(--font-size-2xl);
			margin-bottom: var(--space-md);
		}

		.challenge-body {
			margin-bottom: var(--space-xl);
		}

		.time-to-beat {
			padding: var(--space-lg);
			margin-bottom: var(--space-xl);
		}
	}
</style>
