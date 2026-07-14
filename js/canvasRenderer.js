// Primitivas de desenho compartilhadas por todos os templates.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// object-fit: cover
function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawLinearGradientRect(ctx, x, y, w, h, stops, direction = 'toBottom') {
  let g;
  if (direction === 'toBottom') g = ctx.createLinearGradient(x, y, x, y + h);
  else if (direction === 'toTop') g = ctx.createLinearGradient(x, y + h, x, y);
  else if (direction === 'toRight') g = ctx.createLinearGradient(x, y, x + w, y);
  else g = ctx.createLinearGradient(x + w, y, x, y);
  stops.forEach(([offset, color]) => g.addColorStop(offset, color));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Canvas letter-spacing tem suporte inconsistente entre navegadores — desenhamos char a char.
function measureSpacedWidth(ctx, text, font, letterSpacing) {
  ctx.font = font;
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + letterSpacing;
  return w - (text.length ? letterSpacing : 0);
}

function drawSpacedText(ctx, text, x, y, { font, color, letterSpacing = 0, align = 'left' }) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  const totalWidth = measureSpacedWidth(ctx, text, font, letterSpacing);
  let startX = x;
  if (align === 'center') startX = x - totalWidth / 2;
  else if (align === 'right') startX = x - totalWidth;
  let cx = startX;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + letterSpacing;
  }
  return totalWidth;
}

function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Ícones vetoriais (viewBox 24x24) extraídos do sistema de design.
const ICONS = {
  bed: 'M3 13V8h18v5 M3 13h18v5 M3 18v2M21 18v2 M7 13V10h4v3',
  suite: 'M4 12h16v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z M6 12V6a2 2 0 0 1 4 0 M7 21l-1-2M17 21l1-2',
  garage: 'M5 13l1.6-4.7A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.3L19 13 M4 13h16v4H4z M7 17v2M17 17v2',
  area: 'M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4',
};
const ICON_WHATSAPP = 'M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2 .2-.3.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2.1.4 0 .5l-.3.5c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.5.3.1.3.1.7-.1 1.3z';

function drawStrokeIcon(ctx, iconKey, x, y, size, color, strokeWidth = 1.5) {
  const scale = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth / scale * scale; // stroke width em unidades do viewBox
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = new Path2D(ICONS[iconKey]);
  ctx.stroke(path);
  ctx.restore();
}

function drawWhatsappIcon(ctx, x, y, size, color) {
  const scale = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(ICON_WHATSAPP));
  ctx.restore();
}

// Desenha as tags como "pills", quebrando linha quando exceder maxWidth.
// Retorna a altura total ocupada.
function drawWrappedPills(ctx, tags, x, y, maxWidth, opts = {}) {
  const {
    font = "600 22px 'Archivo', sans-serif",
    textColor = THEME.color.tagText,
    bg = THEME.color.tagBg,
    border = THEME.color.tagBorder,
    paddingX = 22,
    paddingY = 11,
    gap = 14,
    lineHeight = 44,
    radius = 999,
  } = opts;
  ctx.font = font;
  let cx = x, cy = y;
  let lines = 1;
  for (const tag of tags) {
    const textW = ctx.measureText(tag).width;
    const pillW = textW + paddingX * 2;
    const pillH = lineHeight;
    if (cx + pillW > x + maxWidth && cx !== x) {
      cx = x;
      cy += pillH + gap;
      lines += 1;
    }
    ctx.fillStyle = bg;
    roundRectPath(ctx, cx, cy, pillW, pillH, radius);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    roundRectPath(ctx, cx, cy, pillW, pillH, radius);
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, cx + paddingX, cy + pillH / 2 + 1);
    cx += pillW + gap;
  }
  return (cy - y) + lineHeight;
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
