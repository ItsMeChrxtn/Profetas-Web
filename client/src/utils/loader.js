import '../styles/loader.css';

// Minimum time the mushroom loader stays on screen for save/update/delete actions.
export const MIN_LOADER_MS = 5000;

const MUSHROOM_SVG = `
<svg viewBox="0 0 120 120" width="110" height="110" aria-hidden="true">
  <path d="M10 62 C10 28 34 10 60 10 C86 10 110 28 110 62 Z" fill="#c0392b"/>
  <path d="M10 62 Q60 72 110 62 Q108 70 100 72 L20 72 Q12 70 10 62 Z" fill="#a93226"/>
  <circle cx="38" cy="36" r="9" fill="#fff"/>
  <circle cx="68" cy="26" r="7" fill="#fff"/>
  <circle cx="88" cy="46" r="8" fill="#fff"/>
  <circle cx="58" cy="52" r="5" fill="#fff"/>
  <circle cx="24" cy="54" r="4" fill="#fff"/>
  <path d="M40 70 L80 70 Q84 96 76 108 Q60 114 44 108 Q36 96 40 70 Z" fill="#f5e6c8"/>
  <circle cx="52" cy="86" r="3.5" fill="#7B1E2B"/>
  <circle cx="68" cy="86" r="3.5" fill="#7B1E2B"/>
  <path d="M54 95 Q60 100 66 95" stroke="#7B1E2B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`;

let overlay = null;
let activeCount = 0;

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'mushroom-loader';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="mushroom-loader__box">
      <div class="mushroom-loader__mushroom">${MUSHROOM_SVG}</div>
      <div class="mushroom-loader__shadow"></div>
      <p class="mushroom-loader__text">Please wait<span>.</span><span>.</span><span>.</span></p>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

export function showLoader() {
  activeCount += 1;
  ensureOverlay().classList.add('is-visible');
}

export function hideLoader() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0 && overlay) overlay.classList.remove('is-visible');
}

// Runs the task with the mushroom loader visible for at least MIN_LOADER_MS.
export async function withLoader(task) {
  showLoader();
  const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADER_MS));
  try {
    const [result] = await Promise.all([task(), minDelay]);
    return result;
  } catch (err) {
    await minDelay;
    throw err;
  } finally {
    hideLoader();
  }
}
