const autoSaveCheckbox = document.getElementById('autoSaveReport');
const autoSaveIntervalInput = document.getElementById('autoSaveInterval');
const maxDaysReportInput = document.getElementById('maxDaysReport');

function notifyBackground() {
  chrome.runtime.sendMessage({ type: 'settings-updated' });
}

// Mostrar/ocultar o campo de intervalo
autoSaveCheckbox.addEventListener('change', () => {
  document.getElementById('autoSaveIntervalGroup').style.display = autoSaveCheckbox.checked ? 'block' : 'none';
  chrome.storage.local.set({ autoSaveReport: autoSaveCheckbox.checked }, notifyBackground);
});

// Salvar ao digitar/alterar
autoSaveIntervalInput.addEventListener('input', () => {
  autoSaveIntervalInput.value = autoSaveIntervalInput.value.replace(/\D/g, '')
  chrome.storage.local.set({ autoSaveInterval: Number(autoSaveIntervalInput.value) }, notifyBackground);
});
maxDaysReportInput.addEventListener('input', () => {
  maxDaysReportInput.value = maxDaysReportInput.value.replace(/\D/g, '')
  chrome.storage.local.set({ maxDaysReport: Number(maxDaysReportInput.value) }, notifyBackground);
});

// Carregar valores salvos ao abrir
chrome.storage.local.get(['autoSaveReport', 'autoSaveInterval', 'maxDaysReport'], data => {
  if (typeof data.autoSaveReport === 'boolean') {
    autoSaveCheckbox.checked = data.autoSaveReport;
    document.getElementById('autoSaveIntervalGroup').style.display = data.autoSaveReport ? 'block' : 'none';
  }
  if (typeof data.autoSaveInterval === 'number') {
    autoSaveIntervalInput.value = data.autoSaveInterval;
  }
  if (typeof data.maxDaysReport === 'number') {
    maxDaysReportInput.value = data.maxDaysReport;
  }
});
