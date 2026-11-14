// Mini AI Chat - OpenRouter

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";
const MAX_FILE_SIZE = 100 * 1024; // 100 KB

// elements from the page
const keyInput = document.getElementById("api-key");
const saveKeyBtn = document.getElementById("save-key");
const forgetKeyBtn = document.getElementById("forget-key");
const keyStatus = document.getElementById("key-status");
const conversation = document.getElementById("conversation");
const statusText = document.getElementById("status");
const form = document.getElementById("chat-form");
const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("send");
const newChatBtn = document.getElementById("new-chat");
const clearHistoryBtn = document.getElementById("clear-history");
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");
const fileNameText = document.getElementById("file-name");
const removeFileBtn = document.getElementById("remove-file");

document.getElementById("model-label").textContent = MODEL;

// data kept in memory
let apiKey = "";
let messages = []; // list of { role, content }
let attachedFile = null; // { name, text }

// ---------- status messages ----------

function showStatus(text, isError) {
  statusText.textContent = "Status: " + text;
  if (isError) {
    statusText.className = "status error";
  } else {
    statusText.className = "status";
  }
}

function showKeyStatus(text, type) {
  keyStatus.textContent = text;
  keyStatus.className = "hint " + type;
}

// ---------- API key ----------

function saveKey() {
  const value = keyInput.value.trim();
  if (value === "") {
    showKeyStatus("Enter a key before saving.", "error");
    return;
  }
  apiKey = value;
  localStorage.setItem("apiKey", apiKey);
  keyInput.value = ""; // clear the field so the key is not visible
  keyInput.placeholder = "Key saved (hidden)";
  showKeyStatus("Key saved in this browser. It has not been tested yet.", "ok");
}

function forgetKey() {
  apiKey = "";
  localStorage.removeItem("apiKey");
  keyInput.value = "";
  keyInput.placeholder = "sk-or-...";
  showKeyStatus("Key removed from this browser.", "");
}

// ---------- showing messages ----------

function addMessage(role, text) {
  // remove the "No messages yet" text if it is there
  const emptyNote = document.getElementById("empty-note");
  if (emptyNote) {
    emptyNote.remove();
  }

  const box = document.createElement("div");
  box.className = "message " + role;

  const who = document.createElement("span");
  who.className = "who";
  if (role === "user") {
    who.textContent = "You";
  } else if (role === "assistant") {
    who.textContent = "Assistant";
  } else {
    who.textContent = "Error";
  }

  const body = document.createElement("span");
  body.textContent = text;

  box.appendChild(who);
  box.appendChild(body);
  conversation.appendChild(box);
  conversation.scrollTop = conversation.scrollHeight;
}

function showAllMessages() {
  conversation.innerHTML = "";
  if (messages.length === 0) {
    conversation.innerHTML =
      '<p class="empty" id="empty-note">No messages yet. Save your key and ask a question.</p>';
    return;
  }
  for (let i = 0; i < messages.length; i++) {
    addMessage(messages[i].role, messages[i].content);
  }
}

// ---------- history (bonus) ----------

function saveHistory() {
  localStorage.setItem("history", JSON.stringify(messages));
}

function loadHistory() {
  const saved = localStorage.getItem("history");
  if (saved === null) {
    return;
  }
  try {
    messages = JSON.parse(saved);
  } catch (error) {
    messages = [];
  }
}

function newChat() {
  messages = [];
  saveHistory();
  removeFile();
  showAllMessages();
  showStatus("Ready", false);
}

function clearHistory() {
  messages = [];
  localStorage.removeItem("history");
  showAllMessages();
  showStatus("Saved history cleared.", false);
}

// ---------- file (bonus) ----------

async function chooseFile() {
  const file = fileInput.files[0];
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".txt")) {
    refuseFile("Unsupported file. Please choose a .txt file.");
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    refuseFile("File too large. The maximum size is 100 KB.");
    return;
  }

  const text = await file.text();
  if (text.trim() === "") {
    refuseFile("The file is empty.");
    return;
  }

  attachedFile = { name: file.name, text: text };
  fileNameText.textContent = file.name;
  fileInfo.hidden = false;
  showStatus("File attached: " + file.name, false);
}

function refuseFile(message) {
  attachedFile = null;
  fileInput.value = "";
  fileInfo.hidden = true;
  showStatus(message, true);
}

function removeFile() {
  attachedFile = null;
  fileInput.value = "";
  fileNameText.textContent = "";
  fileInfo.hidden = true;
}

// ---------- send a question ----------

async function askOpenRouter(prompt) {
  // earlier messages + the new question
  const allMessages = messages.concat([{ role: "user", content: prompt }]);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: allMessages,
      stream: false
    })
  });

  // check the answer from the server
  if (response.status === 401 || response.status === 403) {
    throw new Error("Your API key was rejected. Check that it is a valid OpenRouter key and save it again.");
  }
  if (response.status === 429) {
    throw new Error("Rate limit reached. Free models have usage limits, so wait a moment and try again.");
  }
  if (response.status >= 500) {
    throw new Error("OpenRouter or the model provider is unavailable right now. Please try again shortly.");
  }
  if (!response.ok) {
    throw new Error("The request failed (HTTP " + response.status + ").");
  }

  const data = await response.json();
  const answer = data.choices && data.choices[0] && data.choices[0].message.content;
  if (!answer) {
    throw new Error("The model returned an empty answer. Please try again.");
  }
  return answer;
}

async function handleSend(event) {
  event.preventDefault();

  if (sendBtn.disabled) {
    return; // already waiting for an answer
  }

  const question = questionInput.value.trim();
  if (question === "") {
    showStatus("Please type a question before sending.", true);
    return;
  }
  if (apiKey === "") {
    showStatus("Please save your OpenRouter API key first.", true);
    return;
  }

  // text shown on screen and saved: only the file name
  // text sent to the model: the real file content
  let shownText = question;
  let prompt = question;
  if (attachedFile !== null) {
    shownText = "[Attached file: " + attachedFile.name + "]\n" + question;
    prompt = "The user attached a text file named \"" + attachedFile.name + "\".\n" +
      "File contents:\n---\n" + attachedFile.text + "\n---\n\nQuestion: " + question;
  }

  // waiting state
  sendBtn.disabled = true;
  newChatBtn.disabled = true;
  clearHistoryBtn.disabled = true;
  fileInput.disabled = true;
  removeFileBtn.disabled = true;
  showStatus("Thinking…", false);
  addMessage("user", shownText);
  questionInput.value = "";

  try {
    const answer = await askOpenRouter(prompt);

    messages.push({ role: "user", content: shownText });
    messages.push({ role: "assistant", content: answer });
    saveHistory();

    addMessage("assistant", answer);
    removeFile();
    showStatus("Ready", false);
    showKeyStatus("Key works: the last request succeeded.", "ok");
  } catch (error) {
    let message = error.message;
    // fetch fails with a TypeError when there is no network
    if (error instanceof TypeError) {
      message = "Network error. Check your internet connection and try again.";
    }
    addMessage("error", message);
    showStatus(message, true);
    questionInput.value = question; // so the user can try again
  } finally {
    // always runs, so Send never stays disabled
    sendBtn.disabled = false;
    newChatBtn.disabled = false;
    clearHistoryBtn.disabled = false;
    fileInput.disabled = false;
    removeFileBtn.disabled = false;
  }
}

// ---------- events ----------

saveKeyBtn.addEventListener("click", saveKey);
forgetKeyBtn.addEventListener("click", forgetKey);
form.addEventListener("submit", handleSend);
newChatBtn.addEventListener("click", newChat);
clearHistoryBtn.addEventListener("click", clearHistory);
fileInput.addEventListener("change", chooseFile);
removeFileBtn.addEventListener("click", removeFile);

// ---------- when the page opens ----------

const savedKey = localStorage.getItem("apiKey");
if (savedKey) {
  apiKey = savedKey;
  keyInput.placeholder = "Key saved (hidden)";
  showKeyStatus("Key restored from this browser. It has not been tested yet.", "ok");
}
loadHistory();
showAllMessages();
