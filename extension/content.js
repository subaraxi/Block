/*
 * Hide Blocked Messages for Discord: the "Fix it" tool
 *
 * styles.css does the normal hiding. But Discord sometimes renames things
 * in its page, and then styles.css stops matching. Instead of editing code,
 * the user can:
 *   1. Click the extension icon, then "Fix it"
 *   2. Click the blocked message that is still showing
 * We work out the name Discord now uses for it, save it, and hide it from
 * then on. Saved fixes stay on this computer (and in Chrome sync); nothing
 * is sent anywhere.
 */

// The list that holds the messages of the open channel.
const MESSAGE_LIST = 'ol[data-list-id="chat-messages"]';

// The line above a reply that shows what is being replied to.
const REPLY_LINE = '[id^="message-reply-context-"]';

// If a fix would hide more than this many things at once, it's almost
// certainly normal Discord content, not blocked messages, so we refuse it.
const MAX_ITEMS_PER_FIX = 15;

/* ------------------------------------------------------------------ */
/* Part 1: hide everything the user has taught us                      */
/* ------------------------------------------------------------------ */

// A saved fix looks like { name: "blockedSystemMessage", where: "row" }
//   where = "row"   hides the whole chat row that contains the name
//   where = "reply" hides only the reply line that contains the name
//   where = "self"  hides just the element with the name

function selectorForFix(fix) {
  const hasName = `[class*="${fix.name}"]`;
  // The row/reply line itself has the name, or something inside it does.
  const itselfOrInside = `:is(${hasName}, :has(${hasName}))`;

  if (fix.where === 'row') return `${MESSAGE_LIST} > ${itselfOrInside}`;
  if (fix.where === 'reply') return `${REPLY_LINE}${itselfOrInside}`;
  return hasName;
}

// Only letters and digits are allowed in a name, so a saved fix can never
// turn into anything other than a simple "hide this" rule.
function isValidFix(fix) {
  return (
    typeof fix === 'object' &&
    /^[A-Za-z][A-Za-z0-9]{2,}$/.test(fix.name) &&
    ['row', 'reply', 'self'].includes(fix.where)
  );
}

// One <style> tag holds a "hide" rule for every saved fix.
const fixesStyle = document.createElement('style');
document.documentElement.append(fixesStyle);

async function loadFixes() {
  const { fixes } = await chrome.storage.sync.get({ fixes: [] });

  fixesStyle.textContent = fixes
    .filter(isValidFix)
    .map((fix) => `${selectorForFix(fix)} { display: none !important; }`)
    .join('\n');
}

loadFixes();

// Re-apply when fixes are added or undone (also from other tabs).
chrome.storage.onChanged.addListener(loadFixes);

/* ------------------------------------------------------------------ */
/* Part 2: "Fix it" mode, where the user clicks what should be hidden  */
/* ------------------------------------------------------------------ */

// The thing we would hide if the user clicked `element`.
function whatToHide(element) {
  const replyLine = element.closest(REPLY_LINE);
  if (replyLine) return { target: replyLine, where: 'reply' };

  const messageList = element.closest(MESSAGE_LIST);
  if (messageList && messageList !== element) {
    let row = element;
    while (row.parentElement !== messageList) row = row.parentElement;
    return { target: row, where: 'row' };
  }

  return { target: element, where: 'self' };
}

// Discord class names look like "blockedSystemMessage_f9f2ca". The random
// ending changes with every update, so we keep only the readable start.
function readablePart(className) {
  return className.split(/[_-]/)[0];
}

// How many elements on the page carry this name.
function countOnPage(name) {
  return document.querySelectorAll(`[class*="${name}"]`).length;
}

// Pick the name inside `target` that best identifies a blocked message.
function findBestName(target) {
  const elements = [target, ...target.querySelectorAll('[class]')];
  const names = new Set();

  for (const element of elements) {
    for (const className of element.classList) {
      const name = readablePart(className);
      const isTemporaryState = /hover|selected|focus|active/i.test(name);

      if (isValidFix({ name, where: 'self' }) && !isTemporaryState) {
        names.add(name);
      }
    }
  }

  // Discord's internal names are English (whatever language you use it in),
  // so a name mentioning "blocked" or "ignored" is the best sign.
  const allNames = [...names];
  const hintedNames = allNames.filter((name) => /block|ignore/i.test(name));
  const candidates = hintedNames.length > 0 ? hintedNames : allNames;

  // The rarest name is the most specific one.
  candidates.sort((a, b) => countOnPage(a) - countOnPage(b));
  return candidates[0];
}

async function learnFrom(clickedElement) {
  const { target, where } = whatToHide(clickedElement);
  const name = findBestName(target);

  if (!name) {
    alert("Sorry, couldn't recognise that. Try clicking right on the blocked message.");
    return;
  }

  const fix = { name, where };
  const count = document.querySelectorAll(selectorForFix(fix)).length;

  if (count === 0) {
    alert("Sorry, couldn't recognise that. Try clicking right on the blocked message.");
    return;
  }

  if (count > MAX_ITEMS_PER_FIX) {
    alert(
      `That would hide ${count} things, so it looks like normal Discord content.\n` +
        'Nothing was changed. Try clicking right on the blocked message.'
    );
    return;
  }

  const plural = count === 1 ? 'item' : 'items';
  if (!confirm(`Hide this from now on?\n\nThis hides ${count} ${plural} on this page.`)) {
    return;
  }

  const { fixes } = await chrome.storage.sync.get({ fixes: [] });
  const alreadySaved = fixes.some((f) => f.name === fix.name && f.where === fix.where);
  if (!alreadySaved) {
    await chrome.storage.sync.set({ fixes: [...fixes, fix] });
  }
}

/* ---------- The on-screen helpers shown while picking ---------- */

// A box drawn around whatever would be hidden.
const highlightBox = document.createElement('div');
highlightBox.style.cssText =
  'position: fixed; z-index: 2147483647; pointer-events: none;' +
  'border: 2px solid #f23f43; background: rgba(242, 63, 67, 0.15); border-radius: 4px;';

// A message at the top of the screen telling the user what to do.
const instructions = document.createElement('div');
instructions.textContent = 'Click the blocked message you want to hide. Press Esc to cancel.';
instructions.style.cssText =
  'position: fixed; z-index: 2147483647; pointer-events: none; top: 12px; left: 50%;' +
  'transform: translateX(-50%); padding: 10px 16px; border-radius: 8px;' +
  'background: #111214; color: #fff; font: 14px/1.4 sans-serif;' +
  'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);';

/* ---------- Turning "Fix it" mode on and off ---------- */

let isPicking = false;

function onMouseMove(event) {
  const { target } = whatToHide(event.target);
  const box = target.getBoundingClientRect();

  highlightBox.style.top = `${box.top}px`;
  highlightBox.style.left = `${box.left}px`;
  highlightBox.style.width = `${box.width}px`;
  highlightBox.style.height = `${box.height}px`;
}

// While picking, stop clicks from reaching Discord (so e.g. "Show message"
// doesn't open), and use the click to learn instead.
function onClick(event) {
  event.preventDefault();
  event.stopPropagation();

  if (event.type === 'click') {
    stopPicking();
    learnFrom(event.target);
  }
}

function onKeyDown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    stopPicking();
  }
}

const CLICK_EVENTS = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];

function startPicking() {
  if (isPicking) return;
  isPicking = true;

  document.documentElement.append(highlightBox, instructions);
  window.addEventListener('mousemove', onMouseMove, true);
  window.addEventListener('keydown', onKeyDown, true);
  CLICK_EVENTS.forEach((type) => window.addEventListener(type, onClick, true));
}

function stopPicking() {
  isPicking = false;

  highlightBox.remove();
  instructions.remove();
  window.removeEventListener('mousemove', onMouseMove, true);
  window.removeEventListener('keydown', onKeyDown, true);
  CLICK_EVENTS.forEach((type) => window.removeEventListener(type, onClick, true));
}

// The popup (popup.js) sends this message when the user clicks "Fix it".
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'start-picking') startPicking();
});
