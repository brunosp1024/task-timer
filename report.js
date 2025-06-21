const reportList = document.getElementById('reportList')

let report = []


// Load report from storage
const loadReport = () => {
  chrome.storage.local.get('report', data => {
    report = data.report || []
    renderReport()
  })
}


// Save report to storage
const saveReportState = () => {
  chrome.storage.local.set({ report })
}


// Save report to storage
const saveReport = (tasks) => {
  const today = new Date().toISOString().split('T')[0]
  const namesHoje = tasks.map(t => t.name)
  report = report.filter(r => r.date !== today || !namesHoje.includes(r.name))

  const reportEntries = tasks.map(t => ({
    name: t.name,
    time: parseInt(t.total / 1000),
    date: today
  }))
  report.push(...reportEntries)

  saveReportState()

  alert('Dia encerrado! As tarefas foram pausadas e salvas no relatório.')
}


// Render report
const renderReport = () => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  reportList.innerHTML = ''
  if (report.length === 0) {
    const emptyMsg = document.createElement("p")
    emptyMsg.textContent = "Nenhum relatório disponível"
    emptyMsg.className = "empty-message"
    reportList.appendChild(emptyMsg)
    return
  }

  report
    .filter(entry => new Date(entry.date).getTime() >= sevenDaysAgo)
    .forEach(entry => {
      const li = document.createElement('li')
      li.textContent = `${entry.name} - ${formatTime(entry.time)} (${entry.date.split('-').reverse().join('/')})`
      reportList.appendChild(li)
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
  renderReport,
  loadReport,
  saveReport
}