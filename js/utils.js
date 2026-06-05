// ===== SHARED UTILITIES =====

// Loading State Management
function showLoading(show = true) {
  let loader = document.getElementById('app-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.innerHTML = `
      <style>
        #app-loader {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.8);
          z-index: 999;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
        }
        #app-loader.active { display: flex; }
        #app-loader .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid var(--primary-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="spinner"></div>
    `;
    document.body.appendChild(loader);
  }
  loader.classList.toggle('active', show);
}

// Toast Notifications
function showToast(msg, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <style>
      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: var(--shadow-hover);
        max-width: 320px;
        word-wrap: break-word;
      }
      .toast-info { background: var(--primary-light); color: var(--primary-dark); }
      .toast-success { background: #d4e4d1; color: #7a9b6b; }
      .toast-error { background: #f4d4d4; color: var(--danger); }
      .toast-warning { background: #ead5bf; color: #a68566; }
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
    ${msg}
  `;
  document.body.appendChild(toast);
  if (duration > 0) {
    setTimeout(() => toast.remove(), duration);
  }
  return toast;
}

// Error Handler
function handleError(error, fallbackMsg = 'Terjadi kesalahan') {
  console.error(error);
  const msg = error?.message || error || fallbackMsg;
  showToast(msg, 'error');
  showLoading(false);
}

// Format Currency
function formatCurrency(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

// Format Date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Calculate Days Until
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Countdown Display
function countdownDisplay(days) {
  if (days === null || days === undefined) return 'N/A';
  if (days < 0) return 'Acara telah berlangsung';
  if (days === 0) return '🎉 Hari ini!';
  if (days === 1) return 'Besok';
  return `${days} hari lagi`;
}

// Local Storage Helpers
const Store = {
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  get(key, def = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : def;
    } catch (e) {
      console.error('Storage error:', e);
      return def;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  }
};

// Debounce Helper
function debounce(fn, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Element Query Helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const $id = (id) => document.getElementById(id);
const $el = (tag, attrs = {}, html = '') => {
  const el = document.createElement(tag);
  Object.assign(el, attrs);
  if (html) el.innerHTML = html;
  return el;
};

// Safe JSON Parse
function safeJSON(str, def = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return def;
  }
}

// Export for use in modules
export {
  showLoading,
  showToast,
  handleError,
  formatCurrency,
  formatDate,
  daysUntil,
  countdownDisplay,
  Store,
  debounce,
  $,
  $$,
  $id,
  $el,
  safeJSON
};
