/**
 * Return From Break Page Handler
 * Manages keyboard navigation when user is on break
 */
import { findButtonByText } from '../lib/utils.js';

let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

const SELECTORS = {
    clockInButton: 'end break and clock in',
    clockOutButton: 'end break and clock out'
}

/**
 * Handles keyboard shortcuts
 */
function handleKeydown(e: KeyboardEvent): void {
    // Ignore if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
    }

    const key = e.key.toLowerCase();

    // Clock In Button: Up Arrow
    if (key === 'arrowup' || key === 'i' || key === 'k') {
        const clockInBtn = findButtonByText(SELECTORS.clockInButton);
        if (clockInBtn) {
            clockInBtn.focus();
            e.preventDefault(); // Prevent scrolling
        } else {
            console.warn('Clock in button not found');
        }
    }

    // Clock Out Button: Down Arrow
    if (key === 'arrowdown' || key === 'o' || key === 'j') {
        const clockOutBtn = findButtonByText(SELECTORS.clockOutButton);
        if (clockOutBtn) {
            clockOutBtn.focus();
            e.preventDefault(); // Prevent scrolling
        } else {
            console.warn('Clock out button not found');
        }
    }
}

/**
 * Setup function called when return from break page is detected
 */
export function setup(): void {
    console.log('[Gusto Tweaks] Setting up Return From Break Page Handler...');

    keyboardHandler = handleKeydown;
    document.addEventListener('keydown', keyboardHandler);

    // Auto-focus on the big clock in button
    const clockInBtn = findButtonByText(SELECTORS.clockInButton);
    if (clockInBtn) {
        clockInBtn.focus();
    } else {
        console.warn('Clock in button not found');
    }
}

/**
 * Cleanup function called when leaving the page
 */
export function cleanup(): void {
    if (keyboardHandler) {
        document.removeEventListener('keydown', keyboardHandler);
        keyboardHandler = null;
    }
}
