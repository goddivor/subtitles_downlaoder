// Éléments DOM
const subtitlesList = document.getElementById('subtitlesList');
const subtitleCount = document.getElementById('subtitleCount');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');

let currentTabId = null;
let subtitles = [];

// Initialisation
async function init() {
  // Récupérer l'onglet actif
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;

  // Charger les sous-titres
  loadSubtitles();

  // Écouter les nouveaux sous-titres détectés
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'subtitleDetected' && message.tabId === currentTabId) {
      loadSubtitles();
    }
  });
}

// Charger les sous-titres depuis le background script
async function loadSubtitles() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getSubtitles',
      tabId: currentTabId
    });

    subtitles = response.subtitles || [];
    renderSubtitles();
    updateStats();
  } catch (error) {
    console.error('Erreur lors du chargement des sous-titres:', error);
  }
}

// Afficher les sous-titres
function renderSubtitles() {
  if (subtitles.length === 0) {
    subtitlesList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
          <polyline points="17 2 12 7 7 2"/>
        </svg>
        <p>Aucun sous-titre détecté</p>
        <small>Naviguez sur un site avec des sous-titres pour les détecter</small>
      </div>
    `;
    return;
  }

  subtitlesList.innerHTML = subtitles.map((subtitle, index) => {
    const extension = getFileExtension(subtitle.filename);
    return `
      <div class="subtitle-item" data-index="${index}">
        <div class="subtitle-icon">
          ${extension.toUpperCase()}
        </div>
        <div class="subtitle-info">
          <div class="subtitle-name" title="${subtitle.filename}">
            ${subtitle.filename}
          </div>
          <div class="subtitle-url" title="${subtitle.url}">
            ${truncateUrl(subtitle.url, 50)}
          </div>
        </div>
        <div class="subtitle-actions">
          <button class="btn-download" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Télécharger
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attacher les événements de téléchargement
  document.querySelectorAll('.btn-download').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      downloadSubtitle(subtitles[index]);
    });
  });
}

// Mettre à jour les statistiques
function updateStats() {
  subtitleCount.textContent = `${subtitles.length} sous-titre(s) détecté(s)`;
  downloadAllBtn.disabled = subtitles.length === 0;
}

// Télécharger un sous-titre
async function downloadSubtitle(subtitle) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'downloadSubtitle',
      url: subtitle.url,
      filename: subtitle.filename
    });

    if (response.success) {
      console.log('Téléchargement démarré:', subtitle.filename);
    } else {
      console.error('Erreur de téléchargement:', response.error);
      alert('Erreur lors du téléchargement: ' + response.error);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du téléchargement');
  }
}

// Télécharger tous les sous-titres
async function downloadAll() {
  if (subtitles.length === 0) return;

  try {
    const urls = subtitles.map(s => s.url);
    const filenames = subtitles.map(s => s.filename);

    const response = await chrome.runtime.sendMessage({
      action: 'downloadAll',
      urls: urls,
      filenames: filenames
    });

    if (response.success) {
      alert(`${response.downloaded} sous-titre(s) téléchargé(s) avec succès !`);
    } else {
      alert(`${response.downloaded} sur ${subtitles.length} téléchargé(s). Erreurs: ${response.errors.length}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du téléchargement');
  }
}

// Effacer les sous-titres
async function clearSubtitles() {
  try {
    await chrome.runtime.sendMessage({
      action: 'clearSubtitles',
      tabId: currentTabId
    });

    subtitles = [];
    renderSubtitles();
    updateStats();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Utilitaires
function getFileExtension(filename) {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1] : 'SUB';
}

function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

// Fonction pour actualiser (recharger la page)
async function refreshPage() {
  try {
    // Recharger l'onglet actuel
    await chrome.tabs.reload(currentTabId);

    // Attendre un peu puis recharger les sous-titres
    setTimeout(() => {
      loadSubtitles();
    }, 500);
  } catch (error) {
    console.error('Erreur lors de l\'actualisation:', error);
  }
}

// Événements
downloadAllBtn.addEventListener('click', downloadAll);
refreshBtn.addEventListener('click', refreshPage);
clearBtn.addEventListener('click', clearSubtitles);

// Initialiser au chargement
init();
