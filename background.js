chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ tasks: {} })
})
chrome.runtime.onStartup.addListener(() => {
  cleanOldReportEntries()
})


function isLast7Days(isoDate) {
  const now = new Date()
  const created = new Date(isoDate)
  const diff = (now - created) / (1000 * 60 * 60 * 24)
  return diff <= 7
}


function saveReportSnapshot() {
  chrome.storage.local.get(['tasks', 'report'], data => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const tasks = Object.values(data.tasks) || []
    let report = data.report || []
    const today = new Date().toISOString().split('T')[0]
    const namesHoje = tasks.map(t => t.name)
    report = report.filter(r => r.date !== today || !namesHoje.includes(r.name))

    const reportEntries = tasks.map(t => ({
      name: t.name,
      time: parseInt(t.total + (t.running ? Date.now() - t.start : 0) / 1000),
      date: today
    }))
    report.push(...reportEntries)

    chrome.storage.local.set({ report })
  })
}


function cleanOldReportEntries() {
  chrome.storage.local.get(['report'], data => {
    if (!data.report) return
    const filteredReport = data.report.filter(entry => isLast7Days(entry.date))
    chrome.storage.local.set({ report: filteredReport })
  })
}

// Executa a cada 15 segundos
setInterval(saveReportSnapshot, 15 * 1000)
