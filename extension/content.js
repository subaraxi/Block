/*
 * styles.css hides the blocked-message bars. This file adds:
 *   Part 1: hiding "Blocked message" reply lines (CSS can't match text),
 *           and date lines left with no messages under them.
 *   Part 2: the "Fix it" tool for when a Discord update breaks the hiding.
 * Fixes are saved in Chrome's storage. Nothing is sent anywhere.
 */

// The list that holds the messages of the open channel.
const MESSAGE_LIST = 'ol[data-list-id="chat-messages"]';

// The line above a reply that shows what is being replied to.
const REPLY_LINE = '[id^="message-reply-context-"]';

// What Discord writes in a reply line when the original author is blocked.
// Other languages are learned with the "Fix it" button.
const BUILT_IN_BLOCKED_TEXTS = ['Blocked message'];

// styles.css hides anything with this attribute.
const HIDDEN_ATTRIBUTE = 'data-hidden-blocked-message';

// If a fix would hide more than this many things at once, it's almost
// certainly normal Discord content, not blocked messages, so we refuse it.
const MAX_ITEMS_PER_FIX = 15;

/*
 * A saved fix is one of two kinds:
 *
 *   { text: "Blocked message" }
 *       Hide reply lines that show exactly this text.
 *
 *   { name: "blockedSystemMessage", where: "row" }
 *       Hide things whose class name contains `name`.
 *       where = "row"   hides the whole chat row
 *       where = "reply" hides only the reply line
 *       where = "self"  hides just that element
 */

// Only simple values are accepted, so a saved fix can never turn into
// anything other than a "hide this" rule.
function isValidFix(fix) {
  if (typeof fix !== 'object' || fix === null) return false;

  if ('text' in fix) {
    return typeof fix.text === 'string' && fix.text.length > 0 && fix.text.length <= 60;
  }

  return (
    /^[A-Za-z][A-Za-z0-9]{2,}$/.test(fix.name) &&
    ['row', 'reply', 'self'].includes(fix.where)
  );
}

/* ------------------------------------------------------------------ */
/* Part 1: hiding                                                      */
/* ------------------------------------------------------------------ */

/* ---------- Fixes by name (done with CSS) ---------- */

function selectorForName(fix) {
  const hasName = `[class*="${fix.name}"]`;
  // The row/reply line itself has the name, or something inside it does.
  const itselfOrInside = `:is(${hasName}, :has(${hasName}))`;

  if (fix.where === 'row') return `${MESSAGE_LIST} > ${itselfOrInside}`;
  if (fix.where === 'reply') return `${REPLY_LINE}${itselfOrInside}`;
  return hasName;
}

// One <style> tag holds a "hide" rule for every saved name.
const nameFixesStyle = document.createElement('style');
document.documentElement.append(nameFixesStyle);

/* ---------- Reply lines by text (done with a script) ---------- */

let blockedTexts = [...BUILT_IN_BLOCKED_TEXTS];

// The "Also hide replies to blocked people" switch in the popup.
let hideWholeReplies = false;

// Does any part of `container` show exactly `text`?
function showsText(container, text) {
  for (const element of container.querySelectorAll('*')) {
    if (element.textContent.trim() === text) return true;
  }
  return false;
}

function isBlockedReplyLine(replyLine) {
  return blockedTexts.some((text) => showsText(replyLine, text));
}

function hide(element) {
  element.setAttribute(HIDDEN_ATTRIBUTE, '');
}

// The chat row (one message) that `element` is in, if any.
function rowOf(element) {
  const messageList = element.closest(MESSAGE_LIST);
  if (!messageList) return null;

  let row = element;
  while (row.parentElement !== messageList) row = row.parentElement;
  return row;
}

// Discord marks the first message of each group (the one showing the
// sender's name) with a "groupStart" class name.
const GROUP_START = '[class*="groupStart"]';

function startsNewGroup(row) {
  return row.matches(GROUP_START) || row.querySelector(GROUP_START) !== null;
}

// Hide a reply, plus the messages the same person sent right after it.
// Those don't show a name, so leaving them would make them look like they
// came from whoever posted before.
function hideReplyAndFollowUps(row) {
  hide(row);

  // If Discord stops marking groups, we can't tell where this person's
  // messages end, so we stop here rather than risk hiding someone else's.
  const messageList = row.parentElement;
  if (!messageList.querySelector(GROUP_START)) return;

  let next = row.nextElementSibling;
  while (next && next.tagName === 'LI' && !startsNewGroup(next)) {
    hide(next);
    next = next.nextElementSibling;
  }
}

// Date lines ("November 25, 2026") are dividers in the chat list.
// Discord's red "NEW" unread line is a divider too, so we only count
// dividers that contain a number (the date).
const DIVIDER = '[role="separator"]';

function isDateLine(element) {
  return element.matches(DIVIDER) && /\d/.test(element.textContent);
}

// Is any message under this date line still visible?
function hasVisibleMessages(dateLine) {
  for (let next = dateLine.nextElementSibling; next; next = next.nextElementSibling) {
    if (isDateLine(next)) return false; // Reached the next day.
    if (next.tagName === 'LI' && next.checkVisibility()) return true;
  }
  return false;
}

// Hide date lines that have no visible messages left under them, so there's
// no trace of a day that only had blocked messages.
function hideEmptyDateLines() {
  const dateLines = [...document.querySelectorAll(`${MESSAGE_LIST} > ${DIVIDER}`)].filter(isDateLine);

  // Check them all first, then hide, so hiding one can't affect the others.
  const emptyDateLines = dateLines.filter((dateLine) => !hasVisibleMessages(dateLine));
  emptyDateLines.forEach(hide);
}

// Work out from scratch what should be hidden. This runs every time the page
// changes, so if you unblock someone or turn the switch off, their messages
// (and date lines) show again.
function updatePage() {
  for (const element of document.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`)) {
    element.removeAttribute(HIDDEN_ATTRIBUTE);
  }

  for (const replyLine of document.querySelectorAll(REPLY_LINE)) {
    if (!isBlockedReplyLine(replyLine)) continue;

    const row = rowOf(replyLine);
    if (hideWholeReplies && row) {
      hideReplyAndFollowUps(row);
    } else {
      hide(replyLine);
    }
  }

  hideEmptyDateLines();
}

// Discord changes the page all the time (scrolling, new messages, switching
// channels). When it does, re-check the page once, just before the screen
// is redrawn, so nothing blocked ever flashes up.
let updateIsScheduled = false;

const pageWatcher = new MutationObserver(() => {
  if (updateIsScheduled) return;
  updateIsScheduled = true;

  requestAnimationFrame(() => {
    updateIsScheduled = false;
    updatePage();
  });
});

pageWatcher.observe(document.documentElement, {
  childList: true, // elements added or removed
  characterData: true, // text changed
  subtree: true, // anywhere on the page
});

/* ---------- Loading saved fixes and settings ---------- */

async function loadFixes() {
  const saved = await chrome.storage.sync.get({ fixes: [], hideWholeReplies: false });
  const fixes = Array.isArray(saved.fixes) ? saved.fixes : [];
  hideWholeReplies = saved.hideWholeReplies === true;
  const validFixes = fixes.filter(isValidFix);

  const nameFixes = validFixes.filter((fix) => 'name' in fix);
  nameFixesStyle.textContent = nameFixes
    .map((fix) => `${selectorForName(fix)} { display: none !important; }`)
    .join('\n');

  const textFixes = validFixes.filter((fix) => 'text' in fix);
  blockedTexts = [...BUILT_IN_BLOCKED_TEXTS, ...textFixes.map((fix) => fix.text)];
  updatePage();
}

loadFixes();

// Re-apply when fixes or settings change (also from other tabs).
chrome.storage.onChanged.addListener(loadFixes);

/* ------------------------------------------------------------------ */
/* Part 2: "Fix it" mode, where the user clicks what should be hidden  */
/* ------------------------------------------------------------------ */

// The thing we would hide if the user clicked `element`.
function whatToHide(element) {
  const replyLine = element.closest(REPLY_LINE);
  if (replyLine) return { target: replyLine, where: 'reply' };

  const row = element.matches(MESSAGE_LIST) ? null : rowOf(element);
  if (row) return { target: row, where: 'row' };

  return { target: element, where: 'self' };
}

/* ---------- Working out a fix from what was clicked ---------- */

// Discord class names look like "blockedSystemMessage_f9f2ca". The random
// ending changes with every update, so we keep only the readable start.
function readablePart(className) {
  return className.split(/[_-]/)[0];
}

// How many elements on the page carry this name.
function countOnPage(name) {
  return document.querySelectorAll(`[class*="${name}"]`).length;
}

// All usable class names inside `target`.
function namesInside(target) {
  const names = new Set();

  for (const element of [target, ...target.querySelectorAll('[class]')]) {
    for (const className of element.classList) {
      const name = readablePart(className);
      const isTemporaryState = /hover|selected|focus|active/i.test(name);

      if (isValidFix({ name, where: 'self' }) && !isTemporaryState) {
        names.add(name);
      }
    }
  }

  return [...names];
}

// Discord's internal names are English whatever language you use it in,
// so a name mentioning "blocked" or "ignored" is the best sign.
function looksBlocked(name) {
  return /block|ignore/i.test(name);
}

// The rarest name is the most specific one.
function rarest(names) {
  return [...names].sort((a, b) => countOnPage(a) - countOnPage(b))[0];
}

// Discord writes "Blocked message" (in your language) in italics.
function italicText(target) {
  for (const element of target.querySelectorAll('*')) {
    const text = element.textContent.trim();
    const isItalic = getComputedStyle(element).fontStyle === 'italic';

    if (isItalic && text) return text;
  }
  return null;
}

function chooseFix(target, where) {
  const names = namesInside(target);
  const blockedName = rarest(names.filter(looksBlocked));
  if (blockedName) return { name: blockedName, where };

  if (where === 'reply') {
    const text = italicText(target);
    if (text) return { text };
  }

  const anyName = rarest(names);
  return anyName ? { name: anyName, where } : null;
}

// How many things on the page this fix would hide.
function countHiddenBy(fix) {
  if ('text' in fix) {
    const replyLines = [...document.querySelectorAll(REPLY_LINE)];
    return replyLines.filter((line) => showsText(line, fix.text)).length;
  }
  return document.querySelectorAll(selectorForName(fix)).length;
}

async function learnFrom(clickedElement) {
  const { target, where } = whatToHide(clickedElement);
  const fix = chooseFix(target, where);
  const count = fix && isValidFix(fix) ? countHiddenBy(fix) : 0;

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
  const alreadySaved = fixes.some((saved) => JSON.stringify(saved) === JSON.stringify(fix));
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
