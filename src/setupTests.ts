import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('$app/navigation', () => ({
	replaceState: vi.fn(),
	goto: vi.fn(),
}));
