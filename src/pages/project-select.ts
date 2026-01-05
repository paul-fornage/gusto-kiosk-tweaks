/**
 * Project Selection Page Handler
 * Manages project selection and clock-in functionality
 */

import { STORAGE_KEY_PROJECT, DEFAULT_BUTTON_CLASS } from '../lib/utils.js';

const SELECTORS = {
  projectSelect: 'select',
  clockInButton: 'button'
} as const;

/**
 * Gets the text content of the selected option
 */
function getSelectedProjectName(selectElement: HTMLSelectElement): string {
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  return selectedOption ? selectedOption.textContent?.trim() || '' : '';
}

/**
 * Finds an option by its text content
 */
function findOptionByName(selectElement: HTMLSelectElement, projectName: string): HTMLOptionElement | undefined {
  return Array.from(selectElement.options).find(
    option => option.textContent?.trim() === projectName
  );
}

/**
 * Applies the default project if one is stored
 */
function applyDefaultProject(selectElement: HTMLSelectElement): void {
  if ((selectElement.dataset.gustoDefaultApplied as string | undefined)) return;

  chrome.storage.local.get([STORAGE_KEY_PROJECT], (result) => {
    const defaultProject = result[STORAGE_KEY_PROJECT] as string | undefined;
    if (!defaultProject) return;

    const matchingOption = findOptionByName(selectElement, defaultProject);
    if (matchingOption) {
      selectElement.value = matchingOption.value;
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      selectElement.dataset.gustoDefaultApplied = 'true';
    }
  });
}

/**
 * Adds a "Set as default" button next to the project selector
 */
function addDefaultButton(selectElement: HTMLSelectElement): void {
  if ((selectElement.dataset.gustoDefaultButtonAdded as string | undefined)) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = DEFAULT_BUTTON_CLASS;
  button.textContent = 'Set as default';
  button.style.width = '80%';
  button.style.marginLeft = 'auto';
  button.style.marginRight = 'auto';
  button.style.marginTop = '1rem';
  button.style.marginBottom = '1rem';
  button.style.display = 'block';
  button.style.alignSelf = 'center';


  const updateButtonState = () => {
    const projectName = getSelectedProjectName(selectElement);

    chrome.storage.local.get([STORAGE_KEY_PROJECT], (result) => {
      const defaultProject = result[STORAGE_KEY_PROJECT] as string | undefined;

      if (projectName && defaultProject && projectName === defaultProject) {
        button.textContent = 'Current default';
        button.disabled = true;
      } else {
        button.textContent = 'Set as default';
        button.disabled = false;
      }
    });
  };

  selectElement.addEventListener('change', updateButtonState);

  button.addEventListener('click', () => {
    const projectName = getSelectedProjectName(selectElement);
    if (projectName) {
      chrome.storage.local.set({ [STORAGE_KEY_PROJECT]: projectName });
      button.textContent = 'Default saved!';
      setTimeout(() => {
        button.textContent = 'Set as default';
      }, 2000);
    }
  });

  const outer_container = selectElement.parentElement?.parentElement;

  if (outer_container) {
    outer_container.appendChild(button);
    selectElement.dataset.gustoDefaultButtonAdded = 'true';
  } else {
    console.warn('addDefaultButton: Failed to find outer container for select element:', selectElement);
  }
}

/**
 * Focuses the clock-in button for easier Enter key usage
 */
function focusClockInButton(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(SELECTORS.clockInButton));
  const clockInBtn = buttons.find(btn => /clock\s+in/i.test(btn.textContent || ''));

  if (clockInBtn && document.activeElement !== clockInBtn) {
    clockInBtn.focus();
  }
}

/**
 * Setup function called when project selection page is detected
 */
export function setup(): void {
  const selectElement = document.querySelector<HTMLSelectElement>(SELECTORS.projectSelect);
  if (selectElement) {
    applyDefaultProject(selectElement);
    addDefaultButton(selectElement);
  }

  focusClockInButton();
}

/**
 * Cleanup function called when leaving the page
 */
export function cleanup(): void {
  // No cleanup needed
}
