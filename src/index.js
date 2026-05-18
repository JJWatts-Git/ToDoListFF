import { createClient } from '@launchdarkly/js-client-sdk';
import Observability, { LDObserve } from '@launchdarkly/observability'
import SessionReplay, { LDRecord } from '@launchdarkly/session-replay'

async function init() {
  // ── SDK Initialization ───────────────────────────────────────────────
  // A "context" is a data object representing users, devices, organizations, and
  // other entities. You'll need this later, but you can ignore it for now.
  const context = {
    kind: 'user',
    key: 'EXAMPLE_CONTEXT_KEY',
    name: 'Jordan',
    email: 'Jordan@watts.com'
  };
  // This is your client-side ID.
  const LDClient = createClient('6a0265602540fe0a7fe4af07', context);
  LDClient.start();
  

  LDClient.on('initialized', function () {
    console.log('SDK successfully initialized!');
    const flagValue = LDClient.variation('MyFirstFlag', false);
    console.log("Our first feature flag is: " + flagValue);
  });
  

  const { status } = await LDClient.waitForInitialization();
  if (status === 'complete') {
    console.log('SDK successfully initialized!');
  } else {
    console.error('Initialization failed');
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  function todayStr() {
    return new Date().toISOString().split("T")[0];
  }

  function offsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  function formatDate(str) {
    if (!str) return "";
    const d = new Date(str + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function getDueInfo(due, completed) {
    if (!due) return { label: "No due date", cls: "badge-none" };
    const today = todayStr();
    const daysUntil = Math.round((new Date(due) - new Date(today)) / 86400000);
    if (completed)       return { label: formatDate(due), cls: "badge-none" };
    if (daysUntil < 0)   return { label: `Overdue · ${formatDate(due)}`, cls: "badge-overdue" };
    if (daysUntil === 0) return { label: "Due today", cls: "badge-today" };
    if (daysUntil <= 3)  return { label: `Due in ${daysUntil}d · ${formatDate(due)}`, cls: "badge-soon" };
    return { label: formatDate(due), cls: "badge-future" };
  }

  function escHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── State ────────────────────────────────────────────────────────────
  let nextId = 5;
  let currentFilter = "all";

  let tasks = [
    { id: 1, title: "Review project proposal", due: todayStr(),     priority: "high",   completed: false },
    { id: 2, title: "Schedule team standup",   due: offsetDate(3),  priority: "medium", completed: false },
    { id: 3, title: "Send weekly report",      due: offsetDate(-1), priority: "low",    completed: false },
    { id: 4, title: "Update documentation",    due: "",             priority: "medium", completed: true  },
  ];

  // ── Render ───────────────────────────────────────────────────────────
  function getFiltered() {
    const today = todayStr();
    return tasks.filter(t => {
      if (currentFilter === "active")    return !t.completed;
      if (currentFilter === "completed") return t.completed;
      if (currentFilter === "overdue")   return !t.completed && t.due && t.due < today;
      return true;
    });
  }

  function render() {
    const list     = document.getElementById("taskList");
    const countEl  = document.getElementById("taskCount");
    const filtered = getFiltered();
    const activeCount = tasks.filter(t => !t.completed).length;

    countEl.textContent = `${activeCount} active task${activeCount !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          No tasks here yet
        </div>`;
      return;
    }

    list.innerHTML = filtered.map(t => {
      const due = getDueInfo(t.due, t.completed);
      return `
        <div class="task-item ${t.completed ? "completed" : ""}" data-id="${t.id}">
          <button class="checkbox ${t.completed ? "checked" : ""}"
            onclick="toggleTask(${t.id})"
            aria-label="${t.completed ? "Mark incomplete" : "Mark complete"}">
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4.5L4 7.5L10 1.5" stroke="white" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="task-body">
            <div class="task-title">${escHtml(t.title)}</div>
            <div class="task-meta">
              <span class="badge ${due.cls}">${due.label}</span>
              <span class="badge badge-p-${t.priority}">
                ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
              </span>
            </div>
          </div>

          <button class="delete-btn" onclick="deleteTask(${t.id})" aria-label="Delete task">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 4h11M6 4V2.5h3V4M5.5 4v7.5a.5.5 0 00.5.5h3a.5.5 0 00.5-.5V4"
                stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>`;
    }).join("");
  }

  // ── Cat Fact Toast ───────────────────────────────────────────────────
  let toastTimer = null;

  function showCatFact() {
    
    const toast  = document.getElementById("catToast");
    const textEl = document.getElementById("catToastText");

    toast.classList.add("visible");
    clearTimeout(toastTimer);

    const flagValue = LDClient.variation('MyFirstFlag', false);

    if(!flagValue) {
      textEl.textContent = "Great job completing that task! 🎉";
      toastTimer = setTimeout(hideCatFact, 5000);
    } else {
        textEl.innerHTML = '<span class="cat-toast-loading">Fetching a fact…</span>';

        fetch("https://catfact.ninja/fact")
          .then(res => {
            if (!res.ok) throw new Error("API error");
            return res.json();
          })
          .then(data => {
            textEl.textContent = data.fact;
            toastTimer = setTimeout(hideCatFact, 8000);
          })
          .catch(() => {
            textEl.textContent = "Couldn't fetch a fact right now — but great job completing that task! 🎉";
            toastTimer = setTimeout(hideCatFact, 5000);
          });
    }
  }

  function hideCatFact() {
    clearTimeout(toastTimer);
    document.getElementById("catToast").classList.remove("visible");
  }

  document.getElementById("catToastClose").addEventListener("click", hideCatFact);

  // ── Actions ──────────────────────────────────────────────────────────
  function addTask() {
    const input    = document.getElementById("taskInput");
    const dateEl   = document.getElementById("dateInput");
    const priority = document.getElementById("prioritySelect").value;
    const title    = input.value.trim();

    if (!title) { input.focus(); return; }

    tasks.unshift({ id: nextId++, title, due: dateEl.value, priority, completed: false });
    input.value  = "";
    dateEl.value = "";

    saveToStorage();
    render();
  }

  // Exposed to inline onclick handlers in rendered HTML
  window.toggleTask = function (id) {
    const task = tasks.find(t => t.id === id);
    const wasCompleted = task ? task.completed : false;
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveToStorage();
    render();
    if (!wasCompleted) showCatFact();
  };

  window.deleteTask = function (id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    render();
  };

  // ── Persistence ──────────────────────────────────────────────────────
  function saveToStorage() {
    localStorage.setItem("vanilla-todos", JSON.stringify(tasks));
    localStorage.setItem("vanilla-todos-nextid", nextId);
  }

  function loadFromStorage() {
    const saved   = localStorage.getItem("vanilla-todos");
    const savedId = localStorage.getItem("vanilla-todos-nextid");
    if (saved)   tasks  = JSON.parse(saved);
    if (savedId) nextId = parseInt(savedId, 10);
  }

  // ── Event Listeners ──────────────────────────────────────────────────
  document.getElementById("addBtn").addEventListener("click", addTask);

  document.getElementById("taskInput").addEventListener("keydown", e => {
    if (e.key === "Enter") addTask();
  });

  document.getElementById("filters").addEventListener("click", e => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });

  // ── Start ────────────────────────────────────────────────────────────
  loadFromStorage();
  render();
}

init();
