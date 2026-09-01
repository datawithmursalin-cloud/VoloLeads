'use client';

import { useEffect } from 'react';

const scriptPromises = new Map();

function loadScript(source) {
  if (scriptPromises.has(source)) return scriptPromises.get(source);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = false;
    script.dataset.vololeadsRuntime = source;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  scriptPromises.set(source, promise);
  return promise;
}

export default function LegacyRuntime({ bodyClass }) {
  useEffect(() => {
    const previousBodyClass = document.body.className;
    document.body.className = bodyClass || '';
    window.__VOLOLEADS_MANAGED_BY_NEXT__ = true;

    let active = true;
    loadScript('/legacy-runtime/icons.js')
      .then(() => loadScript('/legacy-runtime/app.js'))
      .then(() => {
        if (active && window.initializeVoloLeadsPage) {
          window.initializeVoloLeadsPage();
        }
      })
      .catch(error => console.error('VoloLeads runtime failed to load', error));

    return () => {
      active = false;
      document.body.className = previousBodyClass;
    };
  }, [bodyClass]);

  return null;
}
