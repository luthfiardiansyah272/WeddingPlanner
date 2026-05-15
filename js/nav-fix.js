(function () {
  function scrubNavLinks() {
    var navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
    Array.prototype.slice.call(navLinks.childNodes).forEach(function (n) {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.remove();
    });
    Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('>') !== -1 || href.indexOf('??') !== -1) {
        a.remove();
        return;
      }
      Array.prototype.slice.call(a.childNodes).forEach(function (n) {
        if (n.nodeType === Node.TEXT_NODE && n.textContent.indexOf('`n') !== -1) n.remove();
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scrubNavLinks);
  } else {
    scrubNavLinks();
  }
})();
