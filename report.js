let reportList = document.getElementById('reportList')
let report = []


// Load report from storage
const loadReport = () => {
  chrome.storage.local.get('report', data => {
    report = data.report || []
    renderReport(report)
  })
}


// Save report to storage
const saveReport = (tasks) => {
  const today = new Date().toLocaleDateString('en-CA')
  const namesHoje = tasks.map(t => t.name)
  report = report.filter(r => r.date !== today || !namesHoje.includes(r.name))

  const reportEntries = tasks
  .filter(t => (t.total + (t.running ? Date.now() - t.start : 0)) > 0)
  .map(t => ({
    name: t.name,
    time: parseInt((t.total + (t.running ? Date.now() - t.start : 0)) / 1000),
    date: today
  }))

  if (reportEntries.length > 0) {
    report.push(...reportEntries)
    chrome.storage.local.set({ report })
  }

  alert('Dia encerrado! As tarefas foram salvas no relatório.')
}


// Render report
const renderReport = (report) => {
  reportList.innerHTML = ''
  if (report.length === 0) {
    const emptyMsg = document.createElement("p")
    emptyMsg.textContent = "Nenhum relatório disponível"
    emptyMsg.className = "empty-message"
    reportList.appendChild(emptyMsg)
    return
  }

  // group by date
  const grouped = {}
  report
    .forEach(entry => {
      if (!grouped[entry.date]) grouped[entry.date] = []
      grouped[entry.date].push(entry)
    })

  // Sort dates from newest to oldest
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  sortedDates.forEach(date => {
    // Date title
    const dateTitle = document.createElement('h4')
    dateTitle.textContent = date.split('-').reverse().join('/')
    dateTitle.style.marginTop = '12px'
    reportList.appendChild(dateTitle)

    // List of tasks for the day
    grouped[date].forEach(entry => {
      const li = document.createElement('li')
      // Create a span for the task name
      const nameSpan = document.createElement('span')
      nameSpan.textContent = entry.name
      // Create a span for the time, bold and left-aligned
      const timeSpan = document.createElement('span')
      timeSpan.innerHTML = "Tempo gasto ➡ " + formatTime(entry.time)
      timeSpan.className = 'task-report'
      li.appendChild(nameSpan)
      li.appendChild(timeSpan)
      reportList.appendChild(li)
    })
  })
}

// Format time to HH:MM:SS
const formatTime = secs => {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h.toString().padStart(2, '0')}:${m.toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}


export {
  loadReport,
  saveReport
}