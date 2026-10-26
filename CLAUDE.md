# CLAUDE.md

macOS fork of [rafaelmardojai/firefox-gnome-theme](https://github.com/rafaelmardojai/firefox-gnome-theme). Installed as the `chrome/` folder of a Firefox profile.

## Where changes go

| File | For |
|---|---|
| `customChrome.css` | Browser UI. Loaded last by `userChrome.css`. |
| `customContent.css` | Firefox's own pages (`about:newtab`, `about:preferences`). Loaded last by `userContent.css`. |
| `configuration/user.js` | Template prefs. `scripts/install.sh` merges them into the profile's `user.js`. Add a new pref here **and** to the profile's `user.js`. |
| `theme/` | Upstream. Edit only when an override can't do it. |

- One commit per change.
- Dark-only values: `@media (prefers-color-scheme: dark)`.

## CSS pitfalls

- To beat a theme rule, match its selector. Example: the theme sets `--tab-min-height` on `#tabbrowser-tabs`, so a `:root` override loses.
- `:has()` can't be nested. The invalid selector silently drops the whole rule.
- Popups such as `#tab-preview-panel` are native windows. Hiding their content leaves an empty frame with a shadow; use `-moz-window-opacity: 0`.

## Verifying a change

CSS loads only at startup: quit and relaunch Firefox after every edit.

Check both:

1. **Computed style** via Marionette: is the rule applied, which rule wins.
2. **Screenshot and pixel sample**: how it actually looks.

- Screenshot: `screencapture -x -o -l <CGWindowID>` (2× on Retina).
- Window ID: Quartz `CGWindowListCopyWindowInfo` (owner `Firefox`, layer 0) via `uv run --with pyobjc-framework-Quartz`.
- Pixels: `uv run --with pillow`.

## Marionette

```sh
open -a Firefox --args --marionette -remote-allow-system-access   # port 2828
```

Without `-remote-allow-system-access`, the chrome context is refused.

Client: save to the scratch dir as `mn.py`. Run `python3 mn.py script.js [content]` or `python3 mn.py quit`.

```python
import socket, json, sys
s = socket.create_connection(("127.0.0.1", 2828)); n = 0
def recv():
    h = b""
    while not h.endswith(b":"): h += s.recv(1)
    b, size = b"", int(h[:-1])
    while len(b) < size: b += s.recv(size - len(b))
    return json.loads(b)
def cmd(name, params=None):
    global n; n += 1
    m = json.dumps([0, n, name, params or {}]).encode()
    s.sendall(str(len(m)).encode() + b":" + m)
    r = recv()
    if r[2]: raise RuntimeError(r[2])
    return r[3]
recv(); cmd("WebDriver:NewSession")
ctx = sys.argv[2] if len(sys.argv) > 2 else "chrome"
cmd("Marionette:SetContext", {"value": ctx})
if ctx == "content":  # pick the tab to inspect
    for h in cmd("WebDriver:GetWindowHandles"):
        cmd("WebDriver:SwitchToWindow", {"handle": h})
        if cmd("WebDriver:GetCurrentURL")["value"].startswith("about:newtab"): break
if sys.argv[1] == "quit":
    cmd("Marionette:Quit", {"flags": ["eAttemptQuit"]}); sys.exit()
print(json.dumps(cmd("WebDriver:ExecuteScript", {"script": open(sys.argv[1]).read(), "args": []}).get("value")))
```

- Scripts: chrome globals (`gBrowser`, `gURLBar`, `Services`, `SidebarController`, `InspectorUtils`). Async: `return (async () => { ... })();`.
- Forced hover: `InspectorUtils.addPseudoClassLock(el, ":hover")`. The first computed-style read can be stale; read again.
- Light/dark: `Services.prefs.setIntPref("ui.systemUsesDarkTheme", 0)`, then `clearUserPref` when done.
- Quit with `mn.py quit`; AppleScript quit fails while Marionette runs.
- `about:newtab` stays empty under Marionette. Fix: while Firefox is closed, add `user_pref("remote.prefs.recommended", false);` to `prefs.js`; remove it afterwards.
- Never leave Marionette running. Finish with a normal launch and confirm port 2828 is closed.

## The user's tabs

`browser.startup.page` is default, so a restart does **not** restore tabs.

- Before quitting, list the open tabs: `sessionstore-backups/recovery.jsonlz4` (mozlz4: 8-byte header + lz4 block, `uv run --with lz4`).
- Real sites open (not only new/blank tabs): ask the user before restarting.
- Marionette launch: run `SessionStore.restoreLastSession()` in chrome.
- Normal launch: while Firefox is closed, append `user_pref("browser.sessionstore.resume_session_once", true);` to `prefs.js`.
- Edit `prefs.js` only while Firefox is closed.
- After relaunching, compare the tab list with the one taken before.
