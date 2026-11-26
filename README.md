# Hide Blocked Messages for Discord

A tiny Chrome extension (Chrome 105 or newer) for Discord in the browser. When you've blocked
someone, Discord still shows a **"1 blocked message — Show message"** bar in
chat. This extension hides that bar completely, so it's as if the messages
don't exist.

## Install

1. Download or clone this folder.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose this folder.
5. Open (or refresh) <https://discord.com/app>.

## Files

| File            | What it does                                                     |
| --------------- | ---------------------------------------------------------------- |
| `manifest.json` | Tells Chrome to add `styles.css` to discord.com.                 |
| `styles.css`    | Two CSS rules that hide the blocked-message bars.                |

## Is it safe?

Yes. The extension contains no JavaScript at all, only CSS that changes how
the page looks. It asks for no permissions, can't read your messages or
account, sends nothing anywhere, and only runs on discord.com.

## If it stops working

Discord sometimes renames the classes in its page. Open DevTools on
Discord (`F12`), right-click a blocked-message bar → **Inspect**, and find
its class name. Then update `blockedSystemMessage` in `styles.css` and click the reload icon for the extension on
`chrome://extensions`.

## Limits

- Only the "blocked message" bars in chat are hidden. Replies that quote a
  blocked user ("Replying to a blocked message") still show.
- Works on discord.com in the browser, not the Discord desktop app.
