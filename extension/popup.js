/*
 * The small window that opens when you click the extension icon.
 *
 * "Fix it"        asks the Discord tab (content.js) to start "Fix it" mode.
 * "Undo my fixes" deletes every fix the user has saved.
 */

const fixItButton = document.getElementById('fix-it');
const undoButton = document.getElementById('undo');
const statusText = document.getElementById('status');

async function showFixCount() {
  const { fixes } = await chrome.storage.sync.get({ fixes: [] });

  undoButton.disabled = fixes.length === 0;
  undoButton.textContent =
    fixes.length === 0 ? 'Undo my fixes' : `Undo my fixes (${fixes.length})`;
}

fixItButton.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'start-picking' });
    window.close(); // Get out of the way so the user can click the message.
  } catch {
    // content.js only runs on Discord, so there was no one to answer.
    statusText.textContent =
      'Open Discord in this tab first. If it is already open, refresh the page.';
  }
});

undoButton.addEventListener('click', async () => {
  await chrome.storage.sync.set({ fixes: [] });
  statusText.textContent = 'All your fixes were removed.';
  showFixCount();
});

showFixCount();
