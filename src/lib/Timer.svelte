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
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="10"/>
			<polyline points="12,6 12,12 16,14"/>
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
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 2px solid #e9ecef;
		border-radius: 12px;
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
		font-family: 'Courier New', monospace;
		transition: all 0.3s ease;
	}

	.timer.final {
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		border-color: #28a745;
		color: white;
		animation: celebration 0.6s ease-out;
	}

	@keyframes celebration {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	.timer-icon {
		display: flex;
		align-items: center;
		opacity: 0.8;
	}

	.timer-display {
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		min-width: 120px;
		text-align: center;
	}

	.timer.compact {
		padding: 0.5rem 0.75rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border: 1px solid #dee2e6;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.timer.compact.final {
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		border-color: #28a745;
		color: white;
	}

	.timer.compact .timer-display {
		font-size: 1rem;
		min-width: 80px;
	}

	.timer.compact .timer-icon svg {
		width: 16px;
		height: 16px;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.timer {
			padding: 0.5rem 0.75rem;
		}
		
		.timer-display {
			font-size: 1.25rem;
			min-width: 100px;
		}
	}

	/* Small screen adjustments */
	@media (max-height: 600px) {
		.timer {
			padding: 0.375rem 0.5rem;
		}
		
		.timer-display {
			font-size: 1rem;
			min-width: 90px;
		}
	}
</style>
