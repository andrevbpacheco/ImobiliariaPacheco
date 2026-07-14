// Sistema de identidade visual Pacheco Imóveis — tokens extraídos do design (sistema.dc.html).
const THEME = {
  color: {
    greenDark: '#0A3D28',
    greenStructural: '#028F4F',
    greenStructuralHover: '#0A6B3C',
    orange: '#CC7A02',
    cream: '#F7F4EC',
    creamPageBg: '#E2DCCF',
    textMuted: '#4a5952',
    textMuted2: '#5c6b62',
    textMuted3: '#6b7770',
    labelMuted: '#8a8069',
    tagBg: 'rgba(2,143,79,.10)',
    tagBorder: 'rgba(2,143,79,.34)',
    tagText: '#0A6B3C',
    hairline: 'rgba(10,61,40,.16)',
    hairlineSoft: 'rgba(10,61,40,.12)',
    overlayTopFrom: 'rgba(8,32,22,.55)',
    darkPanel: '#12241b',
  },
  font: {
    sans: "'Archivo', sans-serif",
    serifItalic: "italic 400 1em 'Instrument Serif', serif",
  },
  fonts: [
    { family: 'Archivo', weight: '400' },
    { family: 'Archivo', weight: '500' },
    { family: 'Archivo', weight: '600' },
    { family: 'Archivo', weight: '700' },
    { family: 'Archivo', weight: '800' },
    { family: 'Archivo', weight: '900' },
    { family: 'Instrument Serif', weight: '400', style: 'italic' },
  ],
  phone: '(49) 99923-3892',
  footerLine: 'DESDE 1986 · CRECI 000418-J',
};

async function ensureFontsLoaded() {
  const specs = THEME.fonts.map(f => `${f.style ? f.style + ' ' : ''}${f.weight} 40px "${f.family}"`);
  await Promise.all(specs.map(s => document.fonts.load(s)));
  await document.fonts.ready;
}
