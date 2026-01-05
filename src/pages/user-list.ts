/**
 * User List Page Handler
 * Manages the user search and selection screen
 */

import { simulateClick, STORAGE_KEY_USER, USER_DEFAULT_BUTTON_CLASS } from '../lib/utils.js';

const SELECTORS = {
  searchInput: 'input[placeholder="Search"]',
  userList: 'ul[role="list"]',
  resultItemCandidate: 'li'
} as const;

let cachedDefaultUser: string | undefined;
let listObserver: MutationObserver | null = null;

/**
 * Finds visible user list items
 */
function getVisibleResultItems(): HTMLLIElement[] {
  const userList = document.querySelector<HTMLUListElement>(SELECTORS.userList);
  if (!userList) {
    console.warn('getVisibleResultItems: User list container not found in DOM.');
    return [];
  }

  return Array.from(userList.querySelectorAll<HTMLLIElement>(SELECTORS.resultItemCandidate))
      .filter(li => {
        if (!li.querySelector('img')) {
          console.warn('User list item missing image: ', li, "skipping");
          return false;
        }
        return true;
      });
}

/**
 * Extracts the user's name from a list item element
 */
function getUserNameFromListItem(listItem: HTMLLIElement): string {
  const nameAndButtonDiv = listItem.querySelector<HTMLDivElement>('div[style*="font-size: 2rem"]');
  let nameDiv: HTMLDivElement | null = null;
  if(nameAndButtonDiv){
    nameDiv = nameAndButtonDiv?.querySelector<HTMLDivElement>('div');
  }
  const nameDivText: string | undefined = nameDiv?.textContent;
  // console.log('nameDivText: ', nameDivText);

  if (nameDivText) return nameDivText.trim();

  const img = listItem.querySelector<HTMLImageElement>('img');
  console.warn('User list item missing name: ', listItem, "using image alt text instead");
  if (img) return img.alt.trim();
  console.warn('User list item missing name and alt text: ', listItem, "using blank name.");
  return '';
}

/**
 * Updates the visual state of a button
 */
function updateButtonState(button: HTMLButtonElement, isDefault: boolean): void {
  if (!button) {
    console.error('updateButtonState: Attempted to update a null button.');
    return;
  }

  if (isDefault) {
    button.textContent = 'Default';
    button.style.background = '#d4edda';
    button.style.borderColor = '#c3e6cb';
  } else {
    button.textContent = 'Set as default';
    button.style.background = '#f5f5f5';
    button.style.borderColor = '#ccc';
  }
}

/**
 * Updates all buttons except an optional skipped one
 */
function refreshAllButtons(skipButton?: HTMLButtonElement): void {
  const userList = document.querySelector<HTMLUListElement>(SELECTORS.userList);
  if (!userList) {
    console.warn('refreshAllButtons: User list not found, cannot refresh buttons.');
    return;
  }

  const listItems = userList.querySelectorAll<HTMLLIElement>(SELECTORS.resultItemCandidate);
  listItems.forEach(listItem => {
    const button = listItem.querySelector<HTMLButtonElement>(`.${USER_DEFAULT_BUTTON_CLASS}`);

    if (!button) {
      console.warn('refreshAllButtons: Button not found in list item, skipping update for this item.', listItem);
      return;
    }

    if (button === skipButton) {
      console.log('refreshAllButtons: Explicitly skipping button update as requested.', button);
      return;
    }
    const userName = getUserNameFromListItem(listItem);
    const isDefault: boolean = userName === cachedDefaultUser;
    // console.log(`Updating button state for user: ${userName} is default: ${isDefault}`);
    updateButtonState(button, isDefault);
  });
}

/**
 * Adds a "Set as default" button to a user list item
 */
function addUserDefaultButton(listItem: HTMLLIElement): void {
  if ((listItem.dataset.gustoUserDefaultButtonAdded as string | undefined)) {
    return;
  }

  const userName = getUserNameFromListItem(listItem);
  if (!userName) {
    console.error('addUserDefaultButton: Failed to resolve username for list item:', listItem);
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = USER_DEFAULT_BUTTON_CLASS;

  // Initialize state from cache
  updateButtonState(button, userName === cachedDefaultUser);

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log(`User clicked "Set as default" for: ${userName}`);

    // Optimistic update
    cachedDefaultUser = userName;
    chrome.storage.local.set({ [STORAGE_KEY_USER]: userName }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save default user to storage:', chrome.runtime.lastError);
      } else {
        console.log('Successfully saved default user to storage:', userName);
      }
    });

    // Immediate visual feedback for the clicked button
    button.textContent = 'Default saved!';
    button.style.background = '#d4edda';
    button.style.borderColor = '#c3e6cb';

    // Update all other buttons immediately
    refreshAllButtons(button);

    // TODO AI REVIEW: wtf is this why would this be a special case?
    //  what exactly makes the operation of these buttons so different if you click 2 in less than exactly 2000 ms?
    setTimeout(() => {
      // Check if it's still the default (in case user clicked another one rapidly)
      if (cachedDefaultUser === userName) {
        updateButtonState(button, true);
      } else {
        console.log('Button state update check failed: cached user changed in the interim.', { cached: cachedDefaultUser, current: userName });
      }
    }, 2000);
  });

  const nameContainer = listItem.querySelector<HTMLDivElement>('div[style*="font-size: 2rem"]');
  if (nameContainer && nameContainer.parentElement) {
    if (!nameContainer.style.display || nameContainer.style.display === 'block') {
      nameContainer.style.display = 'flex';
      nameContainer.style.alignItems = 'center';
    }
    nameContainer.appendChild(button);
    listItem.dataset.gustoUserDefaultButtonAdded = 'true';
    console.log(`Added default button for user: ${userName}`);
  } else {
    console.error('addUserDefaultButton: Name container not found, cannot append button for:', userName);
  }
}

/**
 * Auto-fills the search input if a default user is configured
 */
function tryAutofill(input: HTMLInputElement): void {
  if (document.activeElement === input) {
    console.log('tryAutofill: Input is focused, skipping autofill.');
    return;
  }

  if (input.value.trim() !== '') {
    console.log('tryAutofill: Input is not empty, skipping autofill.');
    return;
  }

  if (!cachedDefaultUser) {
    console.log('tryAutofill: No default user cached, skipping.');
    return;
  }

  console.log(`Autofilling search input with default user: ${cachedDefaultUser}`);
  input.value = cachedDefaultUser;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

/**
 * Handles Enter key on search bar - auto-clicks exact match
 */
function handleSearchEnter(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return; // Not an error, just standard event filtering

  const activeElement = document.activeElement;
  if (!activeElement || !activeElement.matches(SELECTORS.searchInput)) {
    console.log('handleSearchEnter: Enter pressed, but search input is not focused.');
    return;
  }

  console.log('Enter pressed in search input. Checking for single result...');

  // Wait for UI to update
  setTimeout(() => {
    const results = getVisibleResultItems();
    console.log(`Found ${results.length} visible results after Enter key.`);

    if (results.length === 1) {
      const item = results[0];
      const itemText = (item.textContent || '').toLowerCase();
      const searchText = ((activeElement as HTMLInputElement).value || '').trim().toLowerCase();

      if (searchText.length > 0 && itemText.includes(searchText)) {
        console.log('Exact match found, simulating click on result.');
        simulateClick(item);
        event.preventDefault();
      } else {
        console.warn('Single result found but text did not match search criteria.', { itemText, searchText });
      }
    } else {
      console.log('Did not find exactly one result, skipping auto-click.');
    }
  }, 300);
}

/**
 * Setup function called when user list page is detected
 */
export function setup(): void {
  console.log('Setting up User List Page Handler...');

  // Fetch default user once
  chrome.storage.local.get([STORAGE_KEY_USER], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error fetching default user from storage:', chrome.runtime.lastError);
      return;
    }

    cachedDefaultUser = result[STORAGE_KEY_USER] as string | undefined;
    console.log('Loaded default user from storage:', cachedDefaultUser);

    // Auto-fill search if default user is set and input exists
    const input = document.querySelector<HTMLInputElement>(SELECTORS.searchInput);
    if (input) {
      tryAutofill(input);
    } else {
      console.warn('Search input not found during setup.');
    }

    // Refresh buttons now that we have the default user (in case items rendered before storage returned)
    console.log('Refreshing all buttons now that default user is loaded.');
    refreshAllButtons();
  });

  // Add default buttons to all visible user items
  const visibleItems = getVisibleResultItems();
  console.log(`Found ${visibleItems.length} visible items during initial setup.`);
  visibleItems.forEach(item => addUserDefaultButton(item));

  // Initialize MutationObserver to watch for list changes (search filtering)
  const userList = document.querySelector<HTMLUListElement>(SELECTORS.userList);
  if (userList) {
    listObserver = new MutationObserver((mutations) => {
      // Check if nodes were actually added to avoid running on removals only
      const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);

      if (hasAddedNodes) {
        console.log('Detected list update via MutationObserver, re-applying buttons...');
        // We can safely re-run this because addUserDefaultButton checks the dataset guard
        getVisibleResultItems().forEach(addUserDefaultButton);
      }
    });

    listObserver.observe(userList, { childList: true });
    console.log('MutationObserver attached to user list.');
  } else {
    console.warn('User list not found during setup, cannot attach MutationObserver.');
  }

  // Register event listeners
  document.addEventListener('keydown', handleSearchEnter);
}

/**
 * Cleanup function called when leaving the page
 */
export function cleanup(): void {
  console.log('Cleaning up User List Page Handler...');
  document.removeEventListener('keydown', handleSearchEnter);

  if (listObserver) {
    listObserver.disconnect();
    listObserver = null;
    console.log('MutationObserver disconnected.');
  }
}