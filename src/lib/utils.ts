/**
 * Shared utilities for Gusto Kiosk Tweaks
 */

// Storage keys
export const STORAGE_KEY_PROJECT = 'gusto_default_project_name';
export const STORAGE_KEY_USER = 'gusto_default_user_name';

// CSS class names
export const ANIMATION_CLASS = 'gusto-tweak-click-fx';
export const DEFAULT_BUTTON_CLASS = 'gusto-tweak-default-btn';
export const USER_DEFAULT_BUTTON_CLASS = 'gusto-tweak-user-default-btn';

/**
 * Injects CSS styles into the page
 */
export function injectStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .${ANIMATION_CLASS} {
      transition: transform 0.15s ease, filter 0.15s ease !important;
      transform: scale(0.95) !important;
      filter: brightness(0.9) !important;
      background-color: rgba(0, 0, 0, 0.05) !important;
      cursor: pointer !important;
    }
    .${DEFAULT_BUTTON_CLASS} {
      margin-left: 1rem;
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }
    .${DEFAULT_BUTTON_CLASS}:hover {
      background: #e0e0e0;
    }
    .${USER_DEFAULT_BUTTON_CLASS} {
      margin-left: auto;
      margin-right: 1rem;
      padding: 0.4rem 0.8rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s ease;
      white-space: nowrap;
    }
    .${USER_DEFAULT_BUTTON_CLASS}:hover {
      background: #e0e0e0;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Simulates a human-like click with visual feedback
 * @param element - The HTML element to click
 */
export function simulateClick(element: HTMLElement | null): void {
  if (!element) return;

  // Visual feedback
  element.classList.add(ANIMATION_CLASS);
  setTimeout(() => element.classList.remove(ANIMATION_CLASS), 200);

  // Dispatch events for React/Vue
  (['mousedown', 'mouseup', 'click'] as const).forEach((eventType) => {
    element.dispatchEvent(
      new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        buttons: 1
      })
    );
  });
}

/**
 * Helper to find a button by its text content (case-insensitive)
 * Avoids fragile class names
 */
export function findButtonByText(text: string): HTMLButtonElement | undefined {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(btn => (btn.textContent || '').toLowerCase().includes(text.toLowerCase()));
}

/**
 * Helper to find the close button via ARIA label
 * Robust against class name changes
 */
export function findCloseButton(): HTMLButtonElement | null {
  return document.querySelector('button[aria-label="Close"]');
}
