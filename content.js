// Content script pour Subtitle Downloader
// Ce script s'exécute dans le contexte de la page web

console.log('Subtitle Downloader: Content script chargé');

// Fonction pour observer les requêtes XHR/Fetch (optionnel, le background script gère déjà)
// Cette partie peut être utilisée pour des fonctionnalités futures

// Observer les mutations DOM pour détecter les éléments vidéo
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeName === 'VIDEO') {
        console.log('Élément vidéo détecté:', node);
        // Vous pouvez ajouter des fonctionnalités ici si nécessaire
      }
    });
  });
});

// Démarrer l'observation du DOM
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Écouter les messages du background ou du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'active' });
  }
});

// Intercepter les requêtes fetch (méthode alternative)
// Note: webRequest API dans le background est plus fiable
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];

  // Vous pouvez analyser l'URL ici si nécessaire
  if (typeof url === 'string') {
    // Le background script gère déjà la détection
  }

  return originalFetch.apply(this, args);
};

// Intercepter XMLHttpRequest (méthode alternative)
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
  // Vous pouvez analyser l'URL ici si nécessaire
  if (typeof url === 'string') {
    // Le background script gère déjà la détection
  }

  return originalOpen.apply(this, arguments);
};
