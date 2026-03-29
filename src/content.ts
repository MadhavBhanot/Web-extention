let stylesInjected = false;
let floatie: HTMLDivElement | null = null;
let toast: HTMLDivElement | null = null;

function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    .highlight-saver-floatie {
      position: absolute;
      z-index: 2147483647;
      background: rgba(18, 18, 20, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #eaeaea;
      padding: 8px 16px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.2s ease, background 0.2s ease;
      transform: translateY(10px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .highlight-saver-floatie::before {
      content: "✨";
      font-size: 14px;
    }
    .highlight-saver-floatie.visible {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    .highlight-saver-floatie:hover {
      background: rgba(30, 30, 35, 0.95);
      transform: translateY(-2px) scale(1.02);
      color: #fff;
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
    
    .highlight-saver-toast {
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 99px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      z-index: 2147483647;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .highlight-saver-toast::before {
      content: "✓";
      background: rgba(255, 255, 255, 0.2);
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }
    .highlight-saver-toast.visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

function createFloatie() {
  if (floatie) return;
  floatie = document.createElement('div');
  floatie.className = 'highlight-saver-floatie';
  floatie.textContent = 'Save Highlight';
  floatie.addEventListener('mousedown', (e) => {
    e.preventDefault(); 
    e.stopPropagation();
  });
  floatie.addEventListener('click', saveCurrentHighlight);
  document.body.appendChild(floatie);
}

function createToast() {
  if (toast) return;
  toast = document.createElement('div');
  toast.className = 'highlight-saver-toast';
  toast.textContent = 'Highlight Saved!';
  document.body.appendChild(toast);
}

document.addEventListener('mouseup', (e) => {
  if (floatie && floatie.contains(e.target as Node)) return;

  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection) return;
    
    const text = selection.toString().trim();
    
    if (text.length > 0 && selection.rangeCount > 0) {
      injectStyles();
      createFloatie();
      createToast();
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const top = rect.top + window.scrollY - 46;
      const left = rect.left + window.scrollX + (rect.width / 2) - 65; 
      
      if (floatie) {
        floatie.style.top = `${Math.max(0, top)}px`;
        floatie.style.left = `${Math.max(0, left)}px`;
        
        requestAnimationFrame(() => {
          floatie!.classList.add('visible');
        });
      }
    } else {
      if (floatie) {
        floatie.classList.remove('visible');
      }
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (floatie && !floatie.contains(e.target as Node)) {
    floatie.classList.remove('visible');
  }
});

function saveCurrentHighlight(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  
  if (!text) return;

  // Build Chrome Text Fragment URL
  const baseUrl = window.location.href.split('#')[0];
  const fragUrl = `${baseUrl}#:~:text=${encodeURIComponent(text)}`;
  
  const highlight = {
    id: Date.now().toString(),
    text: text,
    url: fragUrl,
    title: document.title,
    timestamp: Date.now(),
    locked: false
  };
  
  chrome.storage.local.get({ highlights: [] }, (result) => {
    const highlights = result.highlights;
    // Add new highlight to the beginning
    highlights.unshift(highlight);
    chrome.storage.local.set({ highlights }, () => {
      floatie?.classList.remove('visible');
      selection?.removeAllRanges();
      
      toast?.classList.add('visible');
      setTimeout(() => {
        toast?.classList.remove('visible');
      }, 2500);
    });
  });
}
