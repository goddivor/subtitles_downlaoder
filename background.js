// Stockage des sous-titres détectés par onglet
const subtitlesMap = new Map();

// Extensions de fichiers de sous-titres à détecter
const SUBTITLE_EXTENSIONS = ['.vtt', '.srt', '.ass', '.ssa', '.sub', '.sbv', '.txt'];

// Fonction pour vérifier si l'URL est un sous-titre
function isSubtitleUrl(url) {
  const lowerUrl = url.toLowerCase();
  return SUBTITLE_EXTENSIONS.some(ext => lowerUrl.includes(ext));
}

// Fonction pour extraire le nom du fichier depuis l'URL
function extractFilename(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return decodeURIComponent(filename) || 'subtitle';
  } catch (e) {
    return 'subtitle';
  }
}

// Écouter toutes les requêtes web
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { url, tabId, type } = details;

    // Vérifier si c'est une requête de sous-titre
    if (isSubtitleUrl(url)) {
      console.log('Sous-titre détecté:', url);

      // Initialiser le tableau pour cet onglet si nécessaire
      if (!subtitlesMap.has(tabId)) {
        subtitlesMap.set(tabId, []);
      }

      const subtitles = subtitlesMap.get(tabId);

      // Vérifier si ce sous-titre n'est pas déjà dans la liste
      const exists = subtitles.some(sub => sub.url === url);
      if (!exists) {
        subtitles.push({
          url: url,
          filename: extractFilename(url),
          timestamp: Date.now(),
          type: type
        });

        // Limiter à 100 sous-titres par onglet pour éviter la surcharge mémoire
        if (subtitles.length > 100) {
          subtitles.shift();
        }

        // Notifier le popup si ouvert
        chrome.runtime.sendMessage({
          action: 'subtitleDetected',
          tabId: tabId,
          subtitle: subtitles[subtitles.length - 1]
        }).catch(() => {
          // Ignorer l'erreur si le popup n'est pas ouvert
        });
      }
    }
  },
  { urls: ["<all_urls>"] }
);

// Nettoyer les données quand un onglet est fermé
chrome.tabs.onRemoved.addListener((tabId) => {
  subtitlesMap.delete(tabId);
});

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSubtitles') {
    const tabId = request.tabId;
    const subtitles = subtitlesMap.get(tabId) || [];
    sendResponse({ subtitles: subtitles });
  } else if (request.action === 'clearSubtitles') {
    const tabId = request.tabId;
    subtitlesMap.delete(tabId);
    sendResponse({ success: true });
  } else if (request.action === 'downloadSubtitle') {
    // Télécharger un sous-titre
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    return true; // Nécessaire pour réponse asynchrone
  } else if (request.action === 'downloadAll') {
    // Télécharger tous les sous-titres
    const urls = request.urls;
    const filenames = request.filenames;

    let completed = 0;
    let errors = [];

    urls.forEach((url, index) => {
      chrome.downloads.download({
        url: url,
        filename: filenames[index],
        saveAs: false
      }, (downloadId) => {
        completed++;
        if (chrome.runtime.lastError) {
          errors.push(chrome.runtime.lastError.message);
        }

        if (completed === urls.length) {
          sendResponse({
            success: errors.length === 0,
            downloaded: completed - errors.length,
            errors: errors
          });
        }
      });
    });

    return true; // Nécessaire pour réponse asynchrone
  }
});

console.log('Subtitle Downloader: Background script chargé');
