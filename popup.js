import { loadReport, renderReport, saveReport} from './report.js'

const taskNameInput = document.getElementById("taskName")
const addTaskBtn = document.getElementById("addTask")
const taskList = document.getElementById("taskList")
const endDayBtn = document.getElementById('endDayBtn')
const resetTasksBtn = document.getElementById('resetTasksBtn')
const actions = document.getElementById('taskActions')
const reportBtn = document.getElementById('reportBtn')
const mainBtn = document.getElementById('mainBtn')
const reportView = document.getElementById('reportView')
const mainView = document.getElementById('mainView')

let tasks = {}


// Load tasks and report from storage
function loadTasks() {
  chrome.storage.local.get(['tasks'], data => {
    tasks = data.tasks || {}
    renderTasks()
  })
}


// Save tasks and report to storage
const saveTasksState = () => {
  chrome.storage.local.set({ tasks })
}


function saveAndRenderTasks() {
  saveTasksState()
  renderTasks()
}


function addTask(name) {
  const id = Date.now().toString()
  tasks[id] = {
    name,
    total: 0,
    start: null,
    running: false,
  }
  saveAndRenderTasks()
}


// Toggle task state (start/pause)
function toggleTask(id) {
  const now = Date.now()

  for (const otherId in tasks) {
    const t = tasks[otherId]
    if (otherId === id) {
      if (!t.running) {
        t.start = now
        t.running = true
      } else {
        t.total += now - t.start
        t.start = null
        t.running = false
      }
    } else if (t.running) {
      t.total += now - t.start
      t.start = null
      t.running = false
    }
  }

  saveAndRenderTasks()
}


// Inline edit task name
function editTaskName(id, nameSpan) {
  const task = tasks[id]
  const input = document.createElement('input')
  input.type = 'text'
  input.value = task.name
  input.className = 'inline-edit-input'

  nameSpan.replaceWith(input)
  input.focus()

  function save() {
    const newName = input.value.trim()
    if (newName) {
      task.name = newName
    }
    saveAndRenderTasks()
  }

  input.addEventListener('blur', save)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.blur()
    } else if (e.key === 'Escape') {
      saveAndRenderTasks() // Cancela edição
    }
  })
}


// Inline edit task time
function editTaskTime(id, timeSpan) {
  const task = tasks[id]
  const input = document.createElement('input')
  input.type = 'text'
  input.value = new Date(task.total + (task.running ? Date.now() - task.start : 0)).toISOString().substr(11, 8)
  input.className = 'inline-edit-input-time'

  timeSpan.replaceWith(input)
  input.focus()

  function save() {
    const newTime = input.value.trim()
    const parts = newTime.split(":")
    if (parts.length === 3) {
      const [h, m, s] = parts.map(Number)
      if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
        const ms = ((h * 3600) + (m * 60) + s) * 1000
        task.total = ms
        if (task.running) task.start = Date.now()
      }
    }
    saveAndRenderTasks()
  }

  input.addEventListener('blur', save)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.blur()
    } else if (e.key === 'Escape') {
      saveAndRenderTasks() // Cancela edição
    }
  })
}


// Render tasks in the list
function renderTasks() {
  taskList.innerHTML = ""

  if (Object.keys(tasks).length === 0) {
    const emptyMsg = document.createElement("p")
    emptyMsg.textContent = "Nenhum ítem adicionado"
    emptyMsg.className = "empty-message"
    actions.style.display = 'none'
    taskList.appendChild(emptyMsg)
    return
  }

  actions.style.display = 'flex'

  for (const id in tasks) {
    const task = tasks[id]
    const li = document.createElement("li")

    const nameSpan = document.createElement("span")
    nameSpan.textContent = task.name
    nameSpan.className = "task-name"

    const timeSpan = document.createElement("span")
    timeSpan.className = "task-time"
    timeSpan.addEventListener('click', () => editTaskTime(id, timeSpan))

    const buttonsDiv = document.createElement("div")
    buttonsDiv.className = "task-buttons"

    // Play / Pause
    const playPauseBtn = document.createElement("button")
    playPauseBtn.innerHTML = task.running ? "✋" : "🚀"
    playPauseBtn.title = task.running ? "Pausar" : "Iniciar"
    playPauseBtn.onclick = () => toggleTask(id)

    // Edit
    const editBtn = document.createElement("button")
    editBtn.innerHTML = "✏️"
    editBtn.title = "Editar"
    editBtn.onclick = () => editTaskName(id, nameSpan)

    // Delete
    const deleteBtn = document.createElement("button")
    deleteBtn.innerHTML = "🗑️"
    deleteBtn.title = "Deletar"
    deleteBtn.onclick = () => {
      const confirmDelete = confirm(`Tem certeza que deseja deletar "${task.name}"?`)
      if (confirmDelete) {
        delete tasks[id]
        saveAndRenderTasks()
      }
    }

    buttonsDiv.append(timeSpan, playPauseBtn, editBtn, deleteBtn)

    li.appendChild(nameSpan)
    li.appendChild(buttonsDiv)
    taskList.appendChild(li)

    function updateTime() {
      const elapsed = task.total + (task.running ? Date.now() - task.start : 0)
      timeSpan.textContent = new Date(elapsed).toISOString().substr(11, 8)
    }

    updateTime()
    if (task.running) {
      const interval = setInterval(() => {
        if (!tasks[id] || !tasks[id].running) return clearInterval(interval)
        updateTime()
      }, 1000)
    }
  }
}

// Stop timer for a specific task
const stopTimer = id => {
  const task = tasks[id]
  if (!task) return

  if (task.running) {
    task.total += Date.now() - task.start
    task.start = null
    task.running = false
    tasks[id] = { ...task }
  }
}


taskNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTaskBtn.click()
  }
})


// Add task button
addTaskBtn.addEventListener("click", () => {
  const name = taskNameInput.value.trim()
  if (!name) return
  const exists = Object.values(tasks).some(task => task.name === name)
  if (exists) {
    alert("Já existe uma tarefa com esse nome.")
    return
  }
  addTask(name)
  taskNameInput.value = ""
})


// Report button
reportBtn.addEventListener('click', () => {
  showView('report');
  renderReport();
});


// Main button
mainBtn.addEventListener('click', () => {
  showView('main');
})


// Show/hide views
function showView(view) {
  mainView.style.display = view === 'main' ? 'block' : 'none';
  reportView.style.display = view === 'report' ? 'block' : 'none';
  reportBtn.style.display = view === 'main' ? 'block' : 'none';
  mainBtn.style.display = view === 'report' ? 'block' : 'none';
}


// Finish day button
endDayBtn.addEventListener('click', () => {
  Object.keys(tasks).forEach(id => stopTimer(id))
  saveReport(Object.values(tasks))
  saveAndRenderTasks()
})


// Reset time button
resetTasksBtn.addEventListener('click', () => {
  if (!confirm('Zerar tempo de todas as tasks?')) return
  Object.values(tasks).forEach(task => {
    stopTimer(task)
    task.total = 0
    task.start = null
    task.running = false
  })
  saveAndRenderTasks()
})


loadTasks()
loadReport()
