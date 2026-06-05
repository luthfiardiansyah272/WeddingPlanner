(function () {
  function scrubNavLinks() {
    var navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
    
    // Hapus text nodes kosong atau whitespace
    Array.prototype.slice.call(navLinks.childNodes).forEach(function (n) {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.remove();
    });
    
    // Hapus link yang invalid (mengandung > atau ??)
    Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('>') !== -1 || href.indexOf('??') !== -1) {
        a.remove();
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scrubNavLinks);
  } else {
    scrubNavLinks();
  }
})();
