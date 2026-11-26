# Publishing to the Chrome Web Store

Once the extension is on the Web Store, everyone who installs it from there
gets your fixes **automatically**. Nobody has to download anything again or
touch any code.

## First time: publish it

### 1. Make a developer account (one time, $5)

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account and pay the one-time $5 fee.

### 2. Make the ZIP to upload

1. Open the `extension` folder.
2. Select **everything inside it** (`manifest.json`, `styles.css`,
   `content.js`, `popup.html`, `popup.js`, and the `icons` folder).
3. Right-click → **Compress** (Mac) or **Send to → Compressed (zipped)
   folder** (Windows).

Zip the files *inside* the folder, not the folder itself, so `manifest.json`
ends up at the top of the ZIP.

### 3. Take a screenshot

The store needs at least one screenshot, **1280×800** pixels. Take one of
Discord in Chrome with the extension on (for example, the popup open next to
a chat). Don't show other people's private messages.

### 4. Upload and fill in the listing

In the Developer Dashboard click **New item** and upload the ZIP. Then fill in
the tabs. You can copy-paste the text below.

**Store listing**

- **Description:**

  > Hides messages from people you've blocked on Discord, completely.
  >
  > Discord normally still shows a "1 blocked message — Show message" bar in
  > chat, and a "Replying to a blocked message" line above replies. This
  > extension removes both, so it's as if blocked users' messages don't exist.
  >
  > If a Discord update ever makes a blocked message show up again, click the
  > extension icon → Fix it → click the message. Done.
  >
  > • Works on discord.com in Chrome
  > • No tracking, no data collection, nothing sent anywhere
  > • Only one permission: storage, to remember your fixes
  >
  > Not made by or affiliated with Discord.

- **Category:** Communication (or the closest match)
- **Language:** English

**Privacy practices**

- **Single purpose:**
  > Hides messages from users the person has blocked on Discord.
- **Why "storage" is needed:**
  > Saves the fixes the user makes with the "Fix it" button, so they keep
  > working after the page is reloaded.
- **Why it runs on discord.com:**
  > The extension only changes how Discord's chat page looks, to hide
  > blocked messages.
- **Remote code:** No, it doesn't use remote code.
- **Data usage:** tick **none** of the data types, and tick all three
  confirmation boxes (it doesn't sell, transfer or misuse data).
- **Privacy policy URL:** (the repo must be public for this link to work)
  `https://github.com/subaraxi/Block/blob/main/PRIVACY.md`

### 5. Submit for review

Click **Submit for review**. Google usually reviews it within a few days.
When it's approved, put the store link in `README.md` under **Install**.

## Every time after: update it

When Discord renames something and the extension stops hiding a blocked
message:

1. Update the names in `extension/styles.css` (or ask Claude to).
2. Raise the `"version"` number in `extension/manifest.json`, e.g.
   `1.3.0` → `1.3.1`. The store refuses an upload with the same number.
3. Make a new ZIP (step 2 above).
4. In the Developer Dashboard open the extension → **Package** → **Upload new
   package**, then **Submit for review**.

After it's approved, Chrome updates everyone's copy automatically, usually
within a few hours.
