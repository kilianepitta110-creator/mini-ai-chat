# Mini AI Chat

A small, responsive chat app built with HTML, CSS and vanilla JavaScript. It sends text questions to an LLM through [OpenRouter](https://openrouter.ai) and shows the answer. No backend, no account, no framework.

- **Live site:** NETLIFY_URL_HERE
- **Repository:** https://github.com/kilianepitta110-creator/mini-ai-chat

## Setup

1. Create a free OpenRouter API key at <https://openrouter.ai/keys> (a low credit limit such as $1 is recommended).
2. Open the live site (or open `index.html` locally, or run `python3 -m http.server`).
3. Paste your key, press **Save**, type a question, press **Send**.

Deployment: public GitHub repository connected to Netlify, no build command, publish the folder containing `index.html`.

## Model

`openrouter/free` (the free router, which picks an available free model). The app never switches to a paid model.

## localStorage usage

| Key | Contents |
| --- | --- |
| `miniAiChat.apiKey` | The visitor's own OpenRouter key |
| `miniAiChat.history` | JSON array of `{ role, content }` messages (text only) |

The key is never in the GitHub repository. It lives only in each visitor's browser, so JavaScript running on this site can read it. **Forget key** removes the stored value and clears the copy held in memory. History never contains the key or the contents of attached files (only the file name).

## Completed features

Core: key save and forget, text questions, real OpenRouter responses, "Thinking…" state with Send disabled, error handling (invalid key, network failure, unavailable service), responsive layout, keyboard focus styles.

Bonuses claimed:
- **New Chat (+2):** clears the display and the conversation context; the key is kept.
- **Chat history (+4):** messages are saved as JSON in localStorage and restored on refresh. Earlier user and assistant messages are sent with each new question so follow-ups have context. **Clear saved history** deletes them.
- **File upload (+4):** one attachment type, a small `.txt` file (max 100 KB). The file is read with `File.text()` and included in the prompt. The file name is shown, it can be removed before Send, and unsupported, empty or oversized files are rejected.

## Known limitations

- Free models have rate limits and can be unavailable or slow.
- Answers are plain text (no Markdown rendering).
- The whole history is sent each time, so very long chats may exceed a model's context window. Use New Chat.
- Only `.txt` attachments are supported (no images, no PDF). The file contents are sent with that one question only, so later follow-ups do not include them.
- The key is in localStorage, which scripts on the same site can read; use a key with a low spending limit.
- Questions and attached text are sent to OpenRouter and its model provider. Use non-sensitive data only.

## Checks performed

Automated browser checks (Chromium, with the OpenRouter response simulated), all passing: blank question rejected; missing key rejected with no request sent; key not shown after Save; "Thinking…" shown and Send disabled during a request; repeated Send clicks produce one request; answer displayed and Send re-enabled; error messages for invalid key (401), unavailable service (503) and network failure; history restored after refresh; key restored after refresh; Forget key; New Chat; follow-up sends earlier messages; `.txt` accepted, PDF / oversized / empty rejected, file removable, file contents sent to the model but not saved in history; no horizontal scroll at 375 px width and the key buttons stacked under the input.

Manual checks to complete before submission (tick only what you did): real question with a real key on the live site, offline mode, fresh private window on the Netlify URL, phone layout on a real device.

## AI usage statement

I used Claude (Anthropic) to generate a first version of the HTML, CSS and JavaScript from the assignment text, and to simplify the HTML and CSS afterwards. I read the code, traced the Send flow (`handleSend` → `askModel` → `fetch`), and tested the cases listed above. My own change: WRITE_YOUR_OWN_CHANGE_HERE.
