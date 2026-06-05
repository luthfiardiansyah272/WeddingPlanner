(function () {
  function fixNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixNav);
  } else {
    fixNav();
  }
})();
