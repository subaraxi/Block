# Hide Blocked Messages for Discord

A Chrome extension for Discord in the browser. When you've blocked someone,
Discord still shows a **"1 blocked message — Show message"** bar in chat, and
a **"Replying to a blocked message"** line above replies to them. This
extension hides both, so it's as if their messages don't exist.

## Install

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

## Getting a newer version

Your fixes keep working, so you only need this if you want new features:
download the ZIP again, replace your old folder with the new one (same place,
same name), then click the reload icon on the extension in
`chrome://extensions`.

## Is it safe?

Yes.

- It only runs on discord.com.
- It asks for one permission, **storage**, which it uses only to remember your
  fixes.
- It doesn't read your messages or account, and it never sends anything
  anywhere. There's no tracking and no internet connection of its own.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Limits

- When someone replies to a blocked user, only the "Replying to ... Blocked
  message" line is hidden. Their reply itself still shows.
- Reply lines are recognised by their "Blocked message" text. If your Discord
  is in another language, use **Fix it** on one of those lines once.
- Works on discord.com in the browser, not the Discord desktop app.
- Not made by or affiliated with Discord.

## Files

| File                      | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `extension/manifest.json` | Tells Chrome what the extension is and where it runs.          |
| `extension/styles.css`    | The rules that hide blocked messages.                          |
| `extension/content.js`    | The "Fix it" tool, plus applying the fixes you've saved.       |
| `extension/popup.html/js` | The small window that opens when you click the icon.           |
