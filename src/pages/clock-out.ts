/**
 * Clocked In/Out Status Page Handler
 * Manages the page showing current clock status
 */
import { findButtonByText, findCloseButton } from '../lib/utils.js';

let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

const SELECTORS = {
    clockOutButton: 'clock out',
    breakButton: 'take a break'
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

    // Break Button: Up Arrow or 'b'
    if (key === 'arrowup' || key === 'b' || key === 'k') {
        const breakBtn = findButtonByText(SELECTORS.breakButton);
        if (breakBtn) {
            breakBtn.focus();
            e.preventDefault(); // Prevent scrolling
        } else {
            console.warn('Break button not found');
        }
    }

    // Clock Out Button: Down Arrow or 'c'
    if (key === 'arrowdown' || key === 'c' || key === 'j') {
        const clockOutBtn = findButtonByText(SELECTORS.clockOutButton);
        if (clockOutBtn) {
            clockOutBtn.focus();
            e.preventDefault(); // Prevent scrolling
        } else {
            console.warn('Clock Out button not found');
        }
    }

    // Close Popup: Escape
    if (key === 'escape') {
        const closeBtn = findCloseButton();
        if (closeBtn) {
            closeBtn.click();
            e.preventDefault();
        } else {
            console.warn('Close button not found. could be expected if popup is closed');
        }
    }
}

/**
 * Setup function called when clocked in/out page is detected
 */
export function setup(): void {
    console.log('[Gusto Tweaks] Setting up Clocked In Page Handler...');

    keyboardHandler = handleKeydown;
    document.addEventListener('keydown', keyboardHandler);
    const breakBtn = findButtonByText(SELECTORS.breakButton);
    if (breakBtn) {
        breakBtn.focus();
    } else {
        console.warn('Break button not found');
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


/**
 * Public hook to be called by the main MutationObserver in content.ts
 * Checks for popup elements appearing
 */
export function onDomChange(): void {
    // We check the entire doc to be robust, but we assume this runs only when the DOM shifts
    const mealBtn = findButtonByText('meal');

    // Auto-focus if found and not already focused
    if (mealBtn && document.activeElement !== mealBtn) {
        console.log('[Gusto Tweaks] Meal button detected, auto-focusing.');
        mealBtn.focus();
    }
}