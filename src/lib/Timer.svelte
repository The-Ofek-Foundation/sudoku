<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let isRunning: boolean = false;
	export let startTime: number | null = null;
	export let finalTime: number | null = null;
	export let compact: boolean = false; // New prop for compact mode

	let currentTime = 0;
	let interval: ReturnType<typeof setInterval> | null = null;

	$: {
		if (isRunning && startTime && !finalTime) {
			if (!interval) {
				interval = setInterval(() => {
					currentTime = Date.now() - startTime!;
				}, 10); // Update every 10ms for smooth display
			}
		} else {
			if (interval) {
				clearInterval(interval);
				interval = null;
			}
		}
	}

	$: displayTime = finalTime || currentTime;

	function formatTime(timeMs: number): string {
		const totalSeconds = Math.floor(timeMs / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		const centiseconds = Math.floor((timeMs % 1000) / 10);

		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
	}

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

<div class="timer" class:final={finalTime !== null} class:compact>
	<div class="timer-icon">
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
			<circle cx="12" cy="12" r="10" />
			<polyline points="12,6 12,12 16,14" />
		</svg>
	</div>
	<div class="timer-display">
		{formatTime(displayTime)}
	</div>
</div>

<style>
	.timer {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg) var(--space-xl);
		background: var(--gradient-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md), var(--shadow-inset);
		font-family: 'Courier New', monospace;
		transition: var(--transition-smooth);
	}

	.timer.final {
		background: var(--gradient-success);
		border-color: var(--color-success);
		color: var(--color-white);
		animation: celebration 0.6s ease-out;
	}

	@keyframes celebration {
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

	.timer-icon {
		display: flex;
		align-items: center;
		opacity: 0.8;
	}

	.timer-display {
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		letter-spacing: 0.05em;
		min-width: 120px;
		text-align: center;
	}

	.timer.compact {
		padding: var(--space-md) var(--space-lg);
		background: var(--gradient-toggle);
		border: 1px solid var(--color-medium);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-sm);
	}

	.timer.compact.final {
		background: var(--gradient-success);
		border-color: var(--color-success);
		color: var(--color-white);
	}

	.timer.compact .timer-display {
		font-size: var(--font-size-lg);
		min-width: 80px;
	}

	.timer.compact .timer-icon svg {
		width: 16px;
		height: 16px;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.timer {
			padding: var(--space-md) var(--space-lg);
		}

		.timer-display {
			font-size: var(--font-size-xl);
			min-width: 100px;
		}
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.timer {
			padding: var(--space-sm) var(--space-md);
		}

		.timer-display {
			font-size: var(--font-size-lg);
			min-width: 90px;
		}
	}
</style>
