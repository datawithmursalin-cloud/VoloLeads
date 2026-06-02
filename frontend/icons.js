(function () {
  const paths = {
    'arrow-down': '<path d="M12 5v12m0 0 5-5m-5 5-5-5"/>',
    'arrow-right': '<path d="M5 12h14m0 0-5-5m5 5-5 5"/>',
    'arrow-rotate-left': '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 1 1-5.3 8.8"/>',
    'bars': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'bolt': '<path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z"/>',
    'book-open': '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H8a4 4 0 0 0-4 4V5.5Z"/><path d="M20 2v17"/>',
    'bullseye': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    'calendar-days': '<path d="M7 2v4M17 2v4M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="2"/>',
    'car': '<path d="M5 13 7 7h10l2 6"/><path d="M5 13h14v5H5z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>',
    'chart-area': '<path d="M4 19h16"/><path d="M5 17 9 9l4 4 3-7 3 11H5Z"/>',
    'chart-bar': '<path d="M4 19h16"/><path d="M7 17V9M12 17V5M17 17v-6"/>',
    'chart-line': '<path d="M4 19h16"/><path d="m5 15 4-5 4 3 5-7"/>',
    'chart-pie': '<path d="M12 3v9h9"/><path d="M19 15a8 8 0 1 1-9-11"/>',
    'check': '<path d="m5 12 4 4L19 6"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'circle': '<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>',
    'circle-question': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.8 2.8 0 0 1 5 1.7c0 2-2.5 2.2-2.5 4"/><path d="M12 18h.01"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'comments': '<path d="M7 15H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v1"/><path d="M10 9h9a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5l-4 3v-3a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z"/>',
    'credit-card': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    'database': '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    'envelope': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    'facebook': '<path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z"/>',
    'file-contract': '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    'file-lines': '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    'handshake': '<path d="M8 12 4 9l4-4 4 4"/><path d="m16 12 4-3-4-4-4 4"/><path d="m8 12 4 4 4-4"/>',
    'headphones': '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h4v6H6a2 2 0 0 1-2-2v-4Zm16 0h-4v6h2a2 2 0 0 0 2-2v-4Z"/>',
    'headset': '<path d="M4 14v-2a8 8 0 0 1 16 0v6a3 3 0 0 1-3 3h-4"/><path d="M4 14h4v5H6a2 2 0 0 1-2-2v-3Zm16 0h-4v5h2a2 2 0 0 0 2-2v-3Z"/>',
    'home': '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/>',
    'house-signal': '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M10 17a2 2 0 0 1 4 0M8 15a5 5 0 0 1 8 0"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',
    'instagram': '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><path d="M17 7h.01"/>',
    'layer-group': '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
    'lightbulb': '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',
    'linkedin-in': '<path d="M6 9h4v12H6zM8 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 5h4v2a4 4 0 0 1 7 3v7h-4v-6c0-1.5-.7-2.5-2-2.5s-2 1-2 2.5v6h-4V9Z" transform="scale(.9) translate(-1 0)"/>',
    'list-check': '<path d="m3 7 2 2 4-4M3 17l2 2 4-4M12 7h9M12 17h9"/>',
    'lock': '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    'magnifying-glass-chart': '<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5M8 12v-3M11 12V7"/>',
    'microphone-lines': '<path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M9 22h6"/>',
    'moon': '<path d="M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10Z"/>',
    'phone': '<path d="M22 16.5v3a2 2 0 0 1-2.2 2 19 19 0 0 1-17.3-17.3A2 2 0 0 1 4.5 2h3L9 7l-2 1.5a14 14 0 0 0 8.5 8.5L17 15l5 1.5Z"/>',
    'phone-flip': '<path d="M22 16.5v3a2 2 0 0 1-2.2 2 19 19 0 0 1-17.3-17.3A2 2 0 0 1 4.5 2h3L9 7l-2 1.5a14 14 0 0 0 8.5 8.5L17 15l5 1.5Z"/>',
    'phone-volume': '<path d="M22 16.5v3a2 2 0 0 1-2.2 2 19 19 0 0 1-17.3-17.3A2 2 0 0 1 4.5 2h3L9 7l-2 1.5a14 14 0 0 0 8.5 8.5L17 15l5 1.5Z"/><path d="M15 4a6 6 0 0 1 5 5M15 8a2 2 0 0 1 2 2"/>',
    'play': '<path d="M8 5v14l11-7L8 5Z" fill="currentColor" stroke="none"/>',
    'pause': '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
    'quote-left': '<path d="M7 7h5v5H9a4 4 0 0 0-4 4v1h7v-7H9V7Zm10 0h5v5h-3a4 4 0 0 0-4 4v1h7v-7h-3V7Z"/>',
    'rocket': '<path d="M13 3c4 1 7 4 8 8l-6 6-8-8 6-6Z"/><path d="M7 17 3 21l4-1 1-3M15 9h.01"/>',
    'spinner': '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
    'star': '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    'stopwatch': '<circle cx="12" cy="13" r="8"/><path d="M12 13V8M9 2h6M12 2v3"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'tasks': '<path d="m3 7 2 2 4-4M3 17l2 2 4-4M12 7h9M12 17h9"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'users': '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6M17 14a6 6 0 0 1 5 7"/>',
    'warning': '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
    'wave-square': '<path d="M3 12h4l2-6 6 12 2-6h4"/>',
    'whatsapp': '<path d="M5 19 6.5 15A8 8 0 1 1 10 18.5L5 19Z"/><path d="M9 8c1 4 3 6 7 7"/>',
    'x-twitter': '<path d="M4 4l16 16M20 4 4 20"/><path d="M8.5 4H4l7.5 9.5M15.5 20H20l-7.5-9.5"/>',
    'xmark': '<path d="M6 6l12 12M18 6 6 18"/>'
  };

  const aliases = {
    'exclamation-triangle': 'warning',
    'facebook-f': 'facebook'
  };

  function getIconName(el) {
    for (const className of el.classList) {
      if (!className.startsWith('fa-')) continue;
      const name = className.slice(3);
      if (name === 'solid' || name === 'regular' || name === 'brands' || name === 'spin') continue;
      return aliases[name] || name;
    }
    return null;
  }

  function renderIcon(el) {
    const name = getIconName(el);
    const path = paths[name] || paths.circle;
    if (el.dataset.renderedIcon === name) return;

    el.dataset.renderedIcon = name;
    el.innerHTML = `<svg class="site-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
  }

  window.renderSiteIcons = function renderSiteIcons(root) {
    const scope = root || document;
    if (scope.matches && scope.matches('i[class*="fa-"]')) {
      renderIcon(scope);
    }
    scope.querySelectorAll('i[class*="fa-"]').forEach(renderIcon);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.renderSiteIcons());
  } else {
    window.renderSiteIcons();
  }
})();
