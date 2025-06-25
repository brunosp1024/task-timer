chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ tasks: {} })
})
chrome.runtime.onStartup.addListener(() => {
  cleanOldReportEntries()
})


function saveReportSnapshot() {
  chrome.storage.local.get(['tasks', 'report'], data => {
    const tasks = Object.values(data.tasks) || []
    let report = data.report || []
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
  })
}


function isLast7Days(isoDate) {
  const now = new Date()
  const created = new Date(isoDate)
  const diff = (now - created) / (1000 * 60 * 60 * 24)
  return diff <= 7
}


function cleanOldReportEntries() {
  chrome.storage.local.get(['report'], data => {
    if (!data.report) return
    const filteredReport = data.report.filter(entry => isLast7Days(entry.date))
    chrome.storage.local.set({ report: filteredReport })
  })
}

// Runs every 30 minutes
setInterval(saveReportSnapshot, 30 * 60 * 1000)
