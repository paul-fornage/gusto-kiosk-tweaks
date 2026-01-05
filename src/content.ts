/**
 * Main Content Script - Page Router
 * Detects which page is active and loads the appropriate handler
 */

import { injectStyles } from './lib/utils.js';
import * as userListPage from './pages/user-list.js';
import * as pinEntryPage from './pages/pin-entry.js';
import * as projectSelectPage from './pages/project-select.js';
import * as clockOutPage from './pages/clock-out';
import * as returnFromBreakPage from './pages/return-from-break';

interface PageHandler {
  setup?: () => void;
  cleanup?: () => void;
  onDomChange?: () => void;
}

interface PageDefinition {
  name: string;
  detect: () => boolean;
  handler: PageHandler;
}

(function () {
  'use strict';

  // Inject global styles
  injectStyles();

  // Page definitions with robust detection logic
  const PAGES: Record<string, PageDefinition> = {
    USER_LIST: {
      name: 'user-list',
      detect: () => {
        // Unique: Has search input with "Search" placeholder AND user list
        return document.querySelector('input[placeholder="Search"]') !== null &&
               document.querySelector('ul[role="list"]') !== null;
      },
      handler: userListPage
    },
    PIN_ENTRY: {
      name: 'pin-entry',
      detect: () => {
        // Unique: Has numpad buttons with data-testid
        return document.querySelector('[data-testid^="numpad-"]') !== null;
      },
      handler: pinEntryPage
    },
    PROJECT_SELECT: {
      name: 'project-select',
      detect: () => {
        // Unique: Has select element (for projects) and "Clock in" button
        const hasSelect = document.querySelector('select') !== null;
        const buttons = Array.from(document.querySelectorAll('button'));
        const hasClockIn = buttons.some(btn => /clock\s+in/i.test(btn.textContent || ''));
        return hasSelect && hasClockIn;
      },
      handler: projectSelectPage
    },
    CLOCK_OUT: {
      name: 'clock-out',
      detect: () => {
        // Unique: Shows clock status with distinctive background color
        // Look for "You're clocked in" or "Good morning" heading with specific styling
        const headings = Array.from(document.querySelectorAll('h1'));
        const hasClockStatus = headings.some(h =>
          /you're clocked in/i.test(h.textContent || '')
        );
        // Also check for the distinctive teal or white background on main container
        const mainDiv = document.querySelector('[style*="--backgroundColor"]');
        return hasClockStatus && mainDiv !== null;
      },
      handler: clockOutPage
    },
    RETURN_FROM_BREAK: {
      name: 'return-from-break',
      detect: () => {
        // Unique: Has "You're on an unpaid meal break" or similar heading
        // and distinctive buttons "End break and clock in" / "End break and clock out"
        const headings = Array.from(document.querySelectorAll('h1'));
        const hasBreakHeading = headings.some(h =>
          /you're on.*break/i.test(h.textContent || '')
        );
        const buttons = Array.from(document.querySelectorAll('button'));
        const hasEndBreakButtons = buttons.some(btn =>
          /end break and clock/i.test(btn.textContent || '')
        );
        return hasBreakHeading && hasEndBreakButtons;
      },
      handler: returnFromBreakPage
    }
  };

  let currentPage: PageDefinition | null = null;

  /**
   * Detects which page is currently active
   * @returns Page definition or null if no match
   */
  function detectCurrentPage(): PageDefinition | null {
    // Check pages in priority order (most specific first)
    let pages: PageDefinition[] = [];
    for (const page of Object.values(PAGES)) {
      if (page.detect()) {
        pages.push(page);
      }
    }
    if (pages.length === 0) {
      return null;
    }  else if (pages.length === 1) {
      return pages[0];
    } else {
      console.error("Multiple pages fulfilled criteria. " +
          "cannot determine which to use. Pages:",
          pages.map(p => p.name));
      return null;
    }
  }

  /**
   * Handles page change by cleaning up old page and setting up new one
   */
  function handlePageChange(newPage: PageDefinition | null): void {
    // Cleanup old page
    if (currentPage?.handler.cleanup) {
      currentPage.handler.cleanup();
    }

    // Setup new page
    if (newPage) {
      console.log(`[Gusto Tweaks] Detected page: ${newPage.name}`);

      if (newPage.handler.setup) {
        newPage.handler.setup();
      }
    }

    currentPage = newPage;
  }

  /**
   * Checks if page has changed and handles transition
   */
  function checkPageChange(): void {
    const detectedPage = detectCurrentPage();

    // Only trigger change if page actually changed
    if (detectedPage !== currentPage) {
      handlePageChange(detectedPage);
    } else if (currentPage?.handler.onDomChange) {
      currentPage.handler.onDomChange();
    }
  }

  // Use MutationObserver to watch for DOM changes
  // This is efficient and doesn't require polling
  const observer = new MutationObserver(() => {
    checkPageChange();
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial page detection
  checkPageChange();

})();
