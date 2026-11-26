/*
 * Hide Blocked Messages for Discord
 *
 * When you block someone, Discord still shows a bar in chat:
 *   "1 blocked message — Show message"
 * This script finds those bars and hides them completely, so it looks
 * like the messages were never there.
 *
 * Discord's class names have random endings that change between updates
 * (e.g. "blockedSystemMessage_a1b2c3"), so we match on the start of the
 * name only. If Discord renames things, update the selectors below.
 */

// The "N blocked messages — Show message" bar.
const BLOCKED_BAR_SELECTOR = '[class*="blockedSystemMessage"]';

// The list that holds every message in the current channel.
const MESSAGE_LIST_SELECTOR = 'ol[data-list-id="chat-messages"]';

// The attribute styles.css uses to hide an element.
const HIDDEN_ATTRIBUTE = 'data-hidden-blocked-message';

/**
 * Hide one blocked-message bar.
 *
 * The bar sits inside a wrapper that is a direct child of the message list.
 * We hide that whole wrapper, so no empty gap is left behind.
 */
function hideBlockedBar(bar) {
  const messageList = bar.closest(MESSAGE_LIST_SELECTOR);

  // Not inside a normal chat list (some other view): just hide the bar.
  if (!messageList) {
    bar.setAttribute(HIDDEN_ATTRIBUTE, '');
    return;
  }

  // Walk up until we reach the element directly inside the message list.
  let wrapper = bar;
  while (wrapper.parentElement !== messageList) {
    wrapper = wrapper.parentElement;
  }

  wrapper.setAttribute(HIDDEN_ATTRIBUTE, '');
}

/**
 * Find and hide every blocked-message bar inside `root`
 * (including `root` itself).
 */
function hideBlockedMessagesIn(root) {
  if (root.matches(BLOCKED_BAR_SELECTOR)) {
    hideBlockedBar(root);
  }

  root.querySelectorAll(BLOCKED_BAR_SELECTOR).forEach(hideBlockedBar);
}

/**
 * Discord loads messages as you scroll and switch channels, so we watch the
 * page for new elements and check each one as it appears.
 *
 * MutationObserver callbacks run before the browser paints, so the bar is
 * hidden before you ever see it.
 */
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) {
        hideBlockedMessagesIn(node);
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Handle anything that was already on the page before we started watching.
hideBlockedMessagesIn(document.documentElement);
