// Values for settings
let autoSaveReport = false
let autoSaveInterval = 10
let maxDaysReport = 7
let intervalId = null


chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ tasks: {} })
})

// Load settings from storage
chrome.runtime.onStartup.addListener(() => {
  cleanOldReportEntries();
  chrome.storage.local.get(['autoSaveReport', 'autoSaveInterval', 'maxDaysReport'], data => {
    autoSaveReport = typeof data.autoSaveReport === 'boolean' ? data.autoSaveReport : autoSaveReport;
    autoSaveInterval = data.autoSaveInterval;
    maxDaysReport = data.maxDaysReport;
    if (autoSaveReport) {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(saveReportSnapshot, autoSaveInterval * 60 * 1000);
    }
  });
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


function isLastDays(isoDate) {
  const now = new Date()
  const created = new Date(isoDate)
  const diff = (now - created) / (1000 * 60 * 60 * 24)
  return diff <= maxDaysReport
}


function cleanOldReportEntries() {
  chrome.storage.local.get(['report'], data => {
    if (!data.report) return
    const filteredReport = data.report.filter(entry => isLastDays(entry.date))
    chrome.storage.local.set({ report: filteredReport })
  })
}


chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settings-updated') {
    chrome.storage.local.get(['autoSaveInterval', 'maxDaysReport', 'autoSaveReport'], data => {
      autoSaveInterval = data.autoSaveInterval || autoSaveInterval
      maxDaysReport = data.maxDaysReport || maxDaysReport
      autoSaveReport = data.autoSaveReport

      // Update interval for auto-saving report
      if (intervalId) clearInterval(intervalId)
      if (autoSaveReport) {
        intervalId = setInterval(saveReportSnapshot, autoSaveInterval * 60 * 1000)
      } else {
        clearInterval(intervalId)
        intervalId = null
      }
    })
  }
})
