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
 * Enum for the various states of the default button
 */
enum SaveButtonState {
  SetDefault = 'SET_DEFAULT',
  CurrentDefault = 'CURRENT_DEFAULT',
  Success = 'SUCCESS',
  Loading = 'LOADING',
  FailToSave = 'FAILED_TO_SAVE'
}

/**
 * Centralized configuration for button text and styles based on state
 */
const BUTTON_STATE_CONFIG = {
  [SaveButtonState.SetDefault]: {
    text: 'Set as default',
    disabled: false,
    html_class: 'normal-button'
  },
  [SaveButtonState.CurrentDefault]: {
    text: 'Current default',
    disabled: true,
    html_class: 'disabled-button'
  },
  [SaveButtonState.Success]: {
    text: 'Default saved!',
    disabled: true, // Prevent clicking while showing success
    html_class: 'success-button'
  },
  [SaveButtonState.Loading]: {
    text: 'Loading...',
    disabled: true,
    html_class: 'disabled-button'
  },
  [SaveButtonState.FailToSave]: {
    text: 'Failed to save',
    disabled: false, // Allow retry
    html_class: 'error-button'
  },

} as const;

/**
 * Static styles for the button structure
 */
const BUTTON_STATIC_STYLES: Partial<CSSStyleDeclaration> = {
  width: '80%',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '1rem',
  marginBottom: '1rem',
  display: 'block',
  alignSelf: 'center'
};


function applyButtonState(button: HTMLButtonElement, state: SaveButtonState): void {
  const config = BUTTON_STATE_CONFIG[state];
  button.textContent = config.text;
  button.disabled = config.disabled;
  button.className = config.html_class;
}


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
  Object.assign(button.style, BUTTON_STATIC_STYLES);
  applyButtonState(button, SaveButtonState.Loading);


  const updateButtonState = () => {
    const selectedProjectName = getSelectedProjectName(selectElement);
    let storedDefaultProjectName: string | undefined = undefined;

    chrome.storage.local.get([STORAGE_KEY_PROJECT]).then((result) => {
      storedDefaultProjectName = result[STORAGE_KEY_PROJECT] as string | undefined;
    }).catch((e) => {
      console.error('Failed to load default project from storage:', e);
    })

    const isDefaultSelected: boolean = selectedProjectName === storedDefaultProjectName;
    if (selectedProjectName && storedDefaultProjectName && isDefaultSelected) {
      applyButtonState(button, SaveButtonState.CurrentDefault);
    } else {
      applyButtonState(button, SaveButtonState.SetDefault);
    }
  };

  selectElement.addEventListener('change', updateButtonState);

  const buttonClickHandler = (()=> {
    const projectName = getSelectedProjectName(selectElement);
    if (projectName) {
      chrome.storage.local.set({ [STORAGE_KEY_PROJECT]: projectName }).then(() => {
        applyButtonState(button, SaveButtonState.Success);
      }).catch((e) => {
        console.error('Failed to save default project to storage:', e);
        applyButtonState(button, SaveButtonState.FailToSave);
      }).finally(() => {
        setTimeout(() => {
          // TODO This should be re-checked, not back to default
          applyButtonState(button, SaveButtonState.SetDefault);
        }, 2000);
      });
    }
  })

  button.addEventListener('click', () => {
    buttonClickHandler();
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
