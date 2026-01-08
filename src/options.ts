/**
 * Options Page Script
 * Displays current default user and project settings
 */

// Storage keys (must match content.ts)
const STORAGE_KEY_USER = 'gusto_default_user_name';
const STORAGE_KEY_PROJECT = 'gusto_default_project_name';

const updateDisplay = (
    elementId: string,
    buttonId: string,
    value: string | undefined,
    placeholder: string
) => {
  const element = document.getElementById(elementId);
  const button = document.getElementById(buttonId);

  if (element) {
    if (value) {
      element.textContent = value;
      element.classList.remove('empty-text');
      button?.classList.remove('hidden');
    } else {
      element.textContent = placeholder;
      element.classList.add('empty-text');
      button?.classList.add('hidden');
    }
  }
};

// Load and display current defaults
document.addEventListener('DOMContentLoaded', () => {
  // Add delete listeners
  document.getElementById('deleteUser')?.addEventListener('click', () => {
    chrome.storage.local.remove(STORAGE_KEY_USER, () => {
      updateDisplay('defaultUser', 'deleteUser', undefined, 'No default user set');
    });
  });

  document.getElementById('deleteProject')?.addEventListener('click', () => {
    chrome.storage.local.remove(STORAGE_KEY_PROJECT, () => {
      updateDisplay('defaultProject', 'deleteProject', undefined, 'No default project set');
    });
  });

  chrome.storage.local.get([STORAGE_KEY_USER, STORAGE_KEY_PROJECT], (result) => {
    const defaultUser = result[STORAGE_KEY_USER] as string | undefined;
    const defaultProject = result[STORAGE_KEY_PROJECT] as string | undefined;

    updateDisplay('defaultUser', 'deleteUser', defaultUser, 'No default user set');
    updateDisplay('defaultProject', 'deleteProject', defaultProject, 'No default project set');
  });
});