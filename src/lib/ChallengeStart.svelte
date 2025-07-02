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
					{difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : 'Custom'} Puzzle
				</div>
				{#if colorKuMode}
					<div class="challenge-badge colorku">
						🌈 ColorKu Mode
					</div>
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
			
			<button class="start-challenge-button" on:click={onStartChallenge}>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		box-sizing: border-box;
	}

	.challenge-card {
		background: white;
		border-radius: 20px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		max-width: 500px;
		width: 100%;
		padding: 2rem;
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
		margin-bottom: 2rem;
	}

	.challenge-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1.2;
	}

	.challenge-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}

	.challenge-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.challenge-badge.difficulty {
		background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
	}

	.challenge-badge.colorku {
		background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
	}

	.challenge-body {
		margin-bottom: 2rem;
	}

	.challenge-message {
		font-size: 1.1rem;
		color: #495057;
		line-height: 1.6;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.time-to-beat {
		background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 2rem;
		border: 2px solid rgba(103, 126, 234, 0.2);
	}

	.time-label {
		font-size: 0.9rem;
		color: #6c757d;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.time-value {
		font-size: 1.8rem;
		font-weight: 700;
		color: #667eea;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.start-challenge-button {
		width: 100%;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
	}

	.start-challenge-button:hover {
		background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
	}

	.start-challenge-button:active {
		transform: translateY(0);
		box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
	}

	.challenge-footer {
		border-top: 1px solid #e9ecef;
		padding-top: 1rem;
		margin-top: 1rem;
	}

	.challenge-footer p {
		margin: 0;
		color: #6c757d;
		font-size: 1rem;
		font-weight: 500;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.challenge-container {
			padding: 1rem;
		}

		.challenge-card {
			padding: 1.5rem;
		}

		.challenge-header h1 {
			font-size: 2rem;
		}

		.challenge-message {
			font-size: 1rem;
		}

		.time-value {
			font-size: 1.5rem;
		}

		.start-challenge-button {
			padding: 0.875rem 1.5rem;
			font-size: 1.1rem;
		}
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.challenge-container {
			padding: 0.5rem;
		}

		.challenge-card {
			padding: 1rem;
		}

		.challenge-header h1 {
			font-size: 1.75rem;
			margin-bottom: 0.5rem;
		}

		.challenge-body {
			margin-bottom: 1rem;
		}

		.time-to-beat {
			padding: 0.75rem;
			margin-bottom: 1rem;
		}
	}
</style>
