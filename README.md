# Hide Blocked Messages for Discord

A Chrome extension for Discord in the browser. When you've blocked someone,
Discord still shows a **"1 blocked message — Show message"** bar in chat, and
a **"Replying to a blocked message"** line above replies to them. This
extension hides both, so it's as if their messages don't exist.

## Install

**From the Chrome Web Store (recommended):** _link coming soon_. Installing
from the store means you get fixes automatically.

**Manually:**

1. On this page, click the green **Code** button → **Download ZIP**, then unzip it.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the **`extension`** folder inside the
   unzipped folder.
4. Refresh Discord.

## Seeing a blocked message again?

Discord sometimes changes its page in an update. If a blocked message shows up
again, you can fix it in a few seconds:

1. Click the extension's icon in Chrome's toolbar (puzzle piece 🧩 → **Hide
   Blocked Messages**).
2. Click **Fix it**.
3. Click the blocked message that's still showing, then **OK**.

It stays hidden from then on. Changed your mind? Click the icon → **Undo my
fixes**.

## Is it safe?

Yes.

- It only runs on discord.com.
- It asks for one permission, **storage**, which it uses only to remember your
  fixes.
- It doesn't read your messages or account, and it never sends anything
  anywhere. There's no tracking and no internet connection of its own.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Limits

- When someone replies to a blocked user, only the "Replying to a blocked
  message" line is hidden. Their reply itself still shows.
- Works on discord.com in the browser, not the Discord desktop app.
- Not made by or affiliated with Discord.

## Files

| File                      | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `extension/manifest.json` | Tells Chrome what the extension is and where it runs.          |
| `extension/styles.css`    | The rules that hide blocked messages.                          |
| `extension/content.js`    | The "Fix it" tool, plus applying the fixes you've saved.       |
| `extension/popup.html/js` | The small window that opens when you click the icon.           |
| `PUBLISHING.md`           | How to publish and update the extension on the Web Store.      |
