const taskNameInput = document.getElementById("taskName");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");

let tasks = {};

function loadTasks() {
  chrome.storage.local.get("tasks", (data) => {
    tasks = data.tasks || {};
    renderTasks();
  });
}

function saveTasks() {
  chrome.storage.local.set({ tasks });
}

function saveAndRender() {
  saveTasks();
  renderTasks();
}

function addTask(name) {
  const id = Date.now().toString();
  tasks[id] = {
    name,
    total: 0,
    start: null,
    running: false,
  };
  saveAndRender();
}

function toggleTask(id) {
  const now = Date.now();

  for (const otherId in tasks) {
    const t = tasks[otherId];
    if (otherId === id) {
      if (!t.running) {
        t.start = now;
        t.running = true;
      } else {
        t.total += now - t.start;
        t.start = null;
        t.running = false;
      }
    } else if (t.running) {
      t.total += now - t.start;
      t.start = null;
      t.running = false;
    }
  }

  saveAndRender();
}

function startInlineEdit(id, nameSpan) {
  const task = tasks[id];
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.name;
  input.className = 'inline-edit-input';

  nameSpan.replaceWith(input);
  input.focus();

  function save() {
    const newName = input.value.trim();
    if (newName) {
      task.name = newName;
    }
    saveAndRender();
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.blur();
    } else if (e.key === 'Escape') {
      saveAndRender(); // Cancela edição
    }
  });
}

function startInlineTimeEdit(id, timeSpan) {
  const task = tasks[id];
  const input = document.createElement('input');
  input.type = 'text';
  input.value = new Date(task.total + (task.running ? Date.now() - task.start : 0)).toISOString().substr(11, 8);
  input.className = 'inline-edit-input-time';

  timeSpan.replaceWith(input);
  input.focus();

  function save() {
    const newTime = input.value.trim();
    const parts = newTime.split(":");
    if (parts.length === 3) {
      const [h, m, s] = parts.map(Number);
      if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
        const ms = ((h * 3600) + (m * 60) + s) * 1000;
        task.total = ms;
        if (task.running) task.start = Date.now();
      }
    }
    saveAndRender();
  }

  // input.addEventListener('input', () => {
  //   let value = input.value.replace(/\D/g, ''); // Remove não números
  //   if (value.length > 6) value = value.slice(0, 6);
  //   while (value.length < 6) value = '0' + value; // Preenche à esquerda
  //   input.value = value.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3');
  // });

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.blur();
    } else if (e.key === 'Escape') {
      saveAndRender(); // Cancela edição
    }
  });
}


function renderTasks() {
  taskList.innerHTML = "";

  for (const id in tasks) {
    const task = tasks[id];
    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = task.name;
    nameSpan.className = "task-name";

    const timeSpan = document.createElement("span");
    timeSpan.className = "task-time";
    timeSpan.addEventListener('click', () => startInlineTimeEdit(id, timeSpan));

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "task-buttons";

    // Play / Pause
    const playPauseBtn = document.createElement("button");
    playPauseBtn.innerHTML = task.running ? "✋" : "🚀";
    playPauseBtn.title = task.running ? "Pausar" : "Iniciar";
    playPauseBtn.onclick = () => toggleTask(id);

    // Edit
    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✏️";
    editBtn.title = "Editar";
    editBtn.onclick = () => startInlineEdit(id, nameSpan);

    // Delete
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Deletar";
    deleteBtn.onclick = () => {
      const confirmDelete = confirm(`Tem certeza que deseja deletar "${task.name}"?`);
      if (confirmDelete) {
        delete tasks[id];
        saveAndRender();
      }
    };

    buttonsDiv.append(timeSpan, playPauseBtn, editBtn, deleteBtn);

    li.appendChild(nameSpan);
    // li.appendChild(timeSpan);
    li.appendChild(buttonsDiv);
    taskList.appendChild(li);

    function updateTime() {
      const elapsed = task.total + (task.running ? Date.now() - task.start : 0);
      timeSpan.textContent = new Date(elapsed).toISOString().substr(11, 8);
    }

    updateTime();
    if (task.running) {
      const interval = setInterval(() => {
        if (!tasks[id] || !tasks[id].running) return clearInterval(interval);
        updateTime();
      }, 1000);
    }
  }
}

addTaskBtn.addEventListener("click", () => {
  const name = taskNameInput.value.trim();
  if (name) {
    addTask(name);
    taskNameInput.value = "";
  }
});

taskNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTaskBtn.click();
  }
});

loadTasks();
