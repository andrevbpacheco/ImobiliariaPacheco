// Módulo de criação livre — publicação dentro da identidade visual a partir de ideia/texto/imagens do usuário.

const CREATIVE_SIZES = {
  feed: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

// "Quarenta anos de *confiança*" -> [{word:'Quarenta',italic:false}, ..., {word:'confiança',italic:true}]
function tokenizeAccent(text) {
  const segments = text.split('*');
  const tokens = [];
  segments.forEach((seg, i) => {
    const italic = i % 2 === 1;
    seg.split(/\s+/).filter(Boolean).forEach(word => tokens.push({ word, italic }));
  });
  return tokens;
}

function drawAccentWrapped(ctx, text, x, y, maxWidth, opts) {
  const {
    regularFont, italicFont, colorRegular, colorItalic,
    lineHeight, align = 'left',
  } = opts;
  const tokens = tokenizeAccent(text);
  const spaceW = (() => { ctx.font = regularFont; return ctx.measureText(' ').width; })();

  // agrupa tokens em linhas respeitando maxWidth
  const lines = [];
  let current = [];
  let currentWidth = 0;
  for (const tok of tokens) {
    ctx.font = tok.italic ? italicFont : regularFont;
    const w = ctx.measureText(tok.word).width;
    const addW = current.length ? spaceW + w : w;
    if (currentWidth + addW > maxWidth && current.length) {
      lines.push(current);
      current = [tok];
      currentWidth = w;
    } else {
      current.push(tok);
      currentWidth += addW;
    }
  }
  if (current.length) lines.push(current);

  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, li) => {
    let lineWidth = 0;
    line.forEach((tok, i) => {
      ctx.font = tok.italic ? italicFont : regularFont;
      lineWidth += ctx.measureText(tok.word).width + (i > 0 ? spaceW : 0);
    });
    let cx = x;
    if (align === 'center') cx = x - lineWidth / 2;
    else if (align === 'right') cx = x - lineWidth;
    const ly = y + li * lineHeight;
    line.forEach(tok => {
      ctx.font = tok.italic ? italicFont : regularFont;
      ctx.fillStyle = tok.italic ? colorItalic : colorRegular;
      ctx.fillText(tok.word, cx, ly);
      cx += ctx.measureText(tok.word).width + spaceW;
    });
  });

  return lines.length * lineHeight;
}

async function renderCreativeSlide(data) {
  const { w, h } = CREATIVE_SIZES[data.format] || CREATIVE_SIZES.feed;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const C = THEME.color;

  const hasPhoto = !!data.photoSrc;
  const bgIsDark = hasPhoto || data.background === 'dark';
  const [logoWhite, logoColor, photo] = await Promise.all([
    loadImage(BRAND_ASSETS.logoWhite),
    loadImage(BRAND_ASSETS.logoColor),
    hasPhoto ? loadImage(data.photoSrc) : Promise.resolve(null),
  ]);
  const logo = bgIsDark ? logoWhite : logoColor;
  const textColor = bgIsDark ? '#fff' : C.greenDark;
  const subColor = bgIsDark ? '#d8e4dd' : C.textMuted;
  const accentColor = bgIsDark ? '#e8a24a' : C.orange;

  // fundo
  if (hasPhoto) {
    drawImageCover(ctx, photo, 0, 0, w, h);
    drawLinearGradientRect(ctx, 0, 0, w, h * 0.45, [[0, 'rgba(8,26,18,.05)'], [1, 'rgba(8,26,18,0)']], 'toBottom');
    drawLinearGradientRect(ctx, 0, h * 0.35, w, h * 0.65, [[0, 'rgba(8,26,18,0)'], [1, 'rgba(8,26,18,.9)']], 'toBottom');
  } else if (data.background === 'dark') {
    ctx.fillStyle = C.greenDark;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, w, h);
  }

  const padX = 56;
  const contentW = w - padX * 2;

  // topo: rótulo pequeno + logo
  const topY = 60;
  if (data.eyebrow) {
    drawSpacedText(ctx, data.eyebrow.toUpperCase(), padX, topY, {
      font: "600 13px 'Archivo', sans-serif",
      color: bgIsDark ? 'rgba(255,255,255,.85)' : C.greenStructural,
      letterSpacing: 4,
    });
  }
  const logoH = 44, logoW = logoH * (logo.width / logo.height);
  ctx.save();
  if (bgIsDark) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2; }
  ctx.drawImage(logo, w - padX - logoW, topY - 30, logoW, logoH);
  ctx.restore();

  // headline + subheadline ancorados na base
  const bottomPad = 72;
  let cursorY = h - bottomPad;

  let subLines = [];
  if (data.subheadline) {
    ctx.font = "400 24px 'Archivo', sans-serif";
    subLines = wrapText(ctx, data.subheadline, contentW, "400 24px 'Archivo', sans-serif");
  }
  const subLineHeight = 34;
  const subHeight = subLines.length ? subLines.length * subLineHeight + 20 : 0;

  const ctaHeight = data.cta ? 60 : 0;

  const headlineSize = data.format === 'story' ? 78 : 64;
  const headlineLineHeight = headlineSize * 1.02;

  // mede quantas linhas o headline vai ocupar (desenho em posição temporária fora da tela não é necessário: renderizamos de baixo pra cima)
  ctx.font = `700 ${headlineSize}px 'Archivo', sans-serif`;
  const measuredLines = tokenizeAccent(data.headline || '').length ? estimateAccentLines(ctx, data.headline, contentW, headlineSize) : 0;
  const headlineHeight = measuredLines * headlineLineHeight;

  cursorY -= ctaHeight;
  if (data.cta) {
    ctx.font = "italic 400 34px 'Instrument Serif', serif";
    ctx.fillStyle = accentColor;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(data.cta, padX, cursorY + 34);
  }

  cursorY -= subHeight;
  if (subLines.length) {
    ctx.font = "400 24px 'Archivo', sans-serif";
    ctx.fillStyle = subColor;
    subLines.forEach((line, i) => ctx.fillText(line, padX, cursorY + i * subLineHeight + 20));
  }

  cursorY -= headlineHeight;
  if (data.headline) {
    drawAccentWrapped(ctx, data.headline, padX, cursorY + headlineSize * 0.85, contentW, {
      regularFont: `700 ${headlineSize}px 'Archivo', sans-serif`,
      italicFont: `italic 400 ${headlineSize * 0.9}px 'Instrument Serif', serif`,
      colorRegular: textColor,
      colorItalic: accentColor,
      lineHeight: headlineLineHeight,
    });
  }

  return canvas;
}

function estimateAccentLines(ctx, text, maxWidth, size) {
  const tokens = tokenizeAccent(text);
  const regularFont = `700 ${size}px 'Archivo', sans-serif`;
  const italicFont = `italic 400 ${size * 0.9}px 'Instrument Serif', serif`;
  ctx.font = regularFont;
  const spaceW = ctx.measureText(' ').width;
  let lines = 1, currentWidth = 0, first = true;
  for (const tok of tokens) {
    ctx.font = tok.italic ? italicFont : regularFont;
    const w = ctx.measureText(tok.word).width;
    const addW = first ? w : spaceW + w;
    if (currentWidth + addW > maxWidth && !first) {
      lines += 1;
      currentWidth = w;
    } else {
      currentWidth += addW;
    }
    first = false;
  }
  return lines || 1;
}
