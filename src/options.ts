/**
 * Options Page Script
 * Displays current default user and project settings
 */

// Storage keys (must match content.ts)
const STORAGE_KEY_USER = 'gusto_default_user_name';
const STORAGE_KEY_PROJECT = 'gusto_default_project_name';

// Load and display current defaults
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([STORAGE_KEY_USER, STORAGE_KEY_PROJECT], (result) => {
    const defaultUser = result[STORAGE_KEY_USER] as string | undefined;
    const defaultProject = result[STORAGE_KEY_PROJECT] as string | undefined;

    const userElement = document.getElementById('defaultUser');
    const projectElement = document.getElementById('defaultProject');

    if (userElement) {
      if (defaultUser) {
        userElement.textContent = defaultUser;
        userElement.classList.remove('empty-text');
      } else {
        userElement.textContent = 'No default user set';
        userElement.classList.add('empty-text');
      }
    }

    if (projectElement) {
      if (defaultProject) {
        projectElement.textContent = defaultProject;
        projectElement.classList.remove('empty-text');
      } else {
        projectElement.textContent = 'No default project set';
        projectElement.classList.add('empty-text');
      }
    }
  });
});
