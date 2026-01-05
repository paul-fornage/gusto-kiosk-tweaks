/**
 * PIN Entry Page Handler
 * Enables keyboard numpad shortcuts for PIN entry
 */

import { simulateClick } from '../lib/utils.js';

const SELECTORS = {
  numpadBtn: (id: string) => `[data-testid="${id}"]`
} as const;

/**
 * Handles numpad keyboard shortcuts
 */
function handleKeydown(event: KeyboardEvent): void {
  const { key } = event;

  let testId: string | null = null;
  if (key >= '0' && key <= '9') {
    testId = `numpad-${key}`;
  } else if (key === 'Backspace') {
    testId = 'numpad-backspace';
  }

  if (testId) {
    const btn = document.querySelector<HTMLButtonElement>(SELECTORS.numpadBtn(testId));
    if (btn) {
      event.preventDefault();
      simulateClick(btn);
    }
  }
}

/**
 * Setup function called when PIN entry page is detected
 */
export function setup(): void {
  document.addEventListener('keydown', handleKeydown);
}

/**
 * Cleanup function called when leaving the page
 */
export function cleanup(): void {
  document.removeEventListener('keydown', handleKeydown);
}