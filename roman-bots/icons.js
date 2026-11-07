// Lucide icons, ISC/MIT. Notices are in THIRD_PARTY_LICENSES.txt.
const paths={
  flag:'<path d="M4 22V3h16l-2 5 2 5H4"/><path d="m8 7 2 2 4-4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  fit:'<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>',
  ship:'<path d="M12 2v8M8 3h8v7M4 10h16l2 7-10 5-10-5zM2 17c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/>',
  compass:'<path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/><circle cx="12" cy="12" r="10"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>',
  tent:'<path d="m3 20 9-16 9 16Z"/><path d="m7.5 20 4.5-8 4.5 8M12 4V2"/>',
  sword:'<path d="m14.5 3 6.5 0 0 6.5L9 21l-6-6Z"/><path d="m5 13 6 6M3 21l3-3M16 8l-6 6"/>',
  bolt:'<path d="m13 2-3 8H4l7 12 3-8h6Z"/>',
  volume:'<path d="m11 5-6 4H2v6h3l6 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  muted:'<path d="m11 5-6 4H2v6h3l6 4Z"/><path d="m17 9 5 6m0-6-5 6"/>',
  hand:'<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  play:'<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>',
  pause:'<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
  replay:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  close:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  edit:'<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>',
  next:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  pencil:'<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'
};
export const icon=name=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.info}</svg>`;
