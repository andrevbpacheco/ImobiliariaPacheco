// Template "Post de Imóvel" — 1080×1350 (feed 4:5), conforme seção 03 do sistema de identidade.

const PROP_W = 1080;
const PROP_H = 1350;
const PHOTO_H = 720;

function fitTitleFontSize(ctx, title, maxWidth, startSize, weight = 700) {
  let size = startSize;
  while (size > 38) {
    ctx.font = `${weight} ${size}px 'Archivo', sans-serif`;
    if (ctx.measureText(title).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

async function renderPropertyCoverSlide(data) {
  const canvas = document.createElement('canvas');
  canvas.width = PROP_W;
  canvas.height = PROP_H;
  const ctx = canvas.getContext('2d');
  const C = THEME.color;

  const [photo, logoWhite, logoColor] = await Promise.all([
    loadImage(data.photoSrc),
    loadImage(BRAND_ASSETS.logoWhite),
    loadImage(BRAND_ASSETS.logoColor),
  ]);

  // fundo
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, PROP_W, PROP_H);

  // foto (cover-fit) + gradiente superior
  drawImageCover(ctx, photo, 0, 0, PROP_W, PHOTO_H);
  drawLinearGradientRect(ctx, 0, 0, PROP_W, 230, [[0, C.overlayTopFrom], [1, 'rgba(8,32,22,0)']], 'toBottom');

  // topo: rótulo (LOCAÇÃO/VENDA) + logo branca
  const padX = 52, padTop = 44;
  const labelY = padTop + 15;
  const labelW = drawSpacedText(ctx, data.badgeLabel.toUpperCase(), padX, labelY, {
    font: "600 18px 'Archivo', sans-serif", color: '#fff', letterSpacing: 5,
  });
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, labelY + 8);
  ctx.lineTo(padX + labelW, labelY + 8);
  ctx.stroke();

  const logoH = 50;
  const logoW = logoH * (logoWhite.width / logoWhite.height);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(logoWhite, PROP_W - padX - logoW, padTop, logoW, logoH);
  ctx.restore();

  // código do imóvel
  if (data.code) {
    drawSpacedText(ctx, `CÓD. ${data.code}`.toUpperCase(), padX, PHOTO_H - 28, {
      font: "500 14px 'Archivo', sans-serif", color: 'rgba(255,255,255,.9)', letterSpacing: 3,
    });
  }

  // ===== bloco inferior =====
  const contentX = 56;
  const contentW = PROP_W - contentX * 2;
  let y = PHOTO_H + 40;

  drawSpacedText(ctx, data.categoryLabel.toUpperCase(), contentX, y + 14, {
    font: "600 14px 'Archivo', sans-serif", color: C.greenStructural, letterSpacing: 4,
  });
  y += 14 + 10;

  const titleSize = fitTitleFontSize(ctx, data.title, contentW, 64, 700);
  ctx.font = `700 ${titleSize}px 'Archivo', sans-serif`;
  ctx.fillStyle = C.greenDark;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(data.title, contentX, y + titleSize * 0.82);
  y += titleSize * 0.9 + 10;

  if (data.address) {
    ctx.font = "500 22px 'Archivo', sans-serif";
    ctx.fillStyle = C.textMuted2;
    ctx.fillText(data.address, contentX, y + 20);
    y += 22 * 1.2;
  }
  y += 20;

  // specs em fios (hairlines)
  if (data.specs && data.specs.length) {
    ctx.strokeStyle = C.hairline;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(contentX, y); ctx.lineTo(contentX + contentW, y); ctx.stroke();
    const specTop = y + 20;
    const colW = contentW / data.specs.length;
    data.specs.forEach((spec, i) => {
      const cx0 = contentX + colW * i;
      drawStrokeIcon(ctx, spec.icon, cx0, specTop, 30, C.greenDark, 1.5);
      const numX = cx0 + 30 + 12;
      ctx.font = "800 36px 'Archivo', sans-serif";
      ctx.fillStyle = C.greenDark;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(spec.value), numX, specTop + 30);
      drawSpacedText(ctx, spec.label.toUpperCase(), numX, specTop + 48, {
        font: "600 14px 'Archivo', sans-serif", color: C.labelMuted, letterSpacing: 2,
      });
    });
    y = specTop + 60 + 24;
  }

  // tags
  if (data.tags && data.tags.length) {
    const usedH = drawWrappedPills(ctx, data.tags, contentX, y, contentW, {
      font: "600 19px 'Archivo', sans-serif",
      lineHeight: 40,
    });
    y += usedH + 24;
  }

  // preço + CTA — ancorados na base do bloco
  const bottomY = PROP_H - 40;
  const footerH = 60;
  const priceBlockY = bottomY - footerH - 148;

  ctx.font = "600 18px 'Archivo', sans-serif";
  drawSpacedText(ctx, data.priceLabel.toUpperCase(), contentX, priceBlockY, {
    font: "600 18px 'Archivo', sans-serif", color: C.labelMuted, letterSpacing: 3,
  });
  ctx.font = "800 68px 'Archivo', sans-serif";
  ctx.fillStyle = C.orange;
  ctx.fillText(data.priceValue, contentX, priceBlockY + 74);
  if (data.priceNote) {
    ctx.font = "600 22px 'Archivo', sans-serif";
    ctx.fillStyle = C.labelMuted;
    ctx.fillText(data.priceNote, contentX, priceBlockY + 114);
  }

  // CTA direita — centralizado com o bloco de preço
  const rightX = contentX + contentW;
  ctx.font = "italic 400 32px 'Instrument Serif', serif";
  ctx.fillStyle = C.greenDark;
  ctx.textAlign = 'right';
  ctx.fillText(data.cta || 'Agende sua visita →', rightX, priceBlockY + 40);
  ctx.textAlign = 'left';

  // pílula do whatsapp
  ctx.font = "800 29px 'Archivo', sans-serif";
  const phoneW = ctx.measureText(data.phone).width;
  const pillPadX = 20, pillPadY = 12, iconSize = 26, gapIcon = 11;
  const pillW = pillPadX * 2 + iconSize + gapIcon + phoneW;
  const pillH = iconSize + pillPadY * 2;
  const pillX = rightX - pillW;
  const pillY = priceBlockY + 54;
  ctx.fillStyle = C.tagBg;
  roundRectPath(ctx, pillX, pillY, pillW, pillH, 12);
  ctx.fill();
  ctx.strokeStyle = C.tagBorder;
  ctx.lineWidth = 2;
  roundRectPath(ctx, pillX, pillY, pillW, pillH, 12);
  ctx.stroke();
  drawWhatsappIcon(ctx, pillX + pillPadX, pillY + pillPadY, iconSize, C.greenStructural);
  ctx.font = "800 29px 'Archivo', sans-serif";
  ctx.fillStyle = C.greenDark;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(data.phone, pillX + pillPadX + iconSize + gapIcon, pillY + pillH / 2 + 10);

  // rodapé
  const footerY = bottomY;
  ctx.strokeStyle = C.hairlineSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX, footerY - footerH);
  ctx.lineTo(contentX + contentW, footerY - footerH);
  ctx.stroke();
  drawSpacedText(ctx, THEME.footerLine, contentX, footerY - 12, {
    font: "600 14px 'Archivo', sans-serif", color: C.labelMuted, letterSpacing: 3,
  });
  const fLogoH = 48, fLogoW = fLogoH * (logoColor.width / logoColor.height);
  ctx.drawImage(logoColor, contentX + contentW - fLogoW, footerY - fLogoH, fLogoW, fLogoH);

  return canvas;
}

// Slides "limpos" (2ª foto em diante): foto inteira + logomarca como marca d'água.
async function renderPropertyCleanSlide(photoSrc) {
  const canvas = document.createElement('canvas');
  canvas.width = PROP_W;
  canvas.height = PROP_H;
  const ctx = canvas.getContext('2d');

  const [photo, logoColor] = await Promise.all([
    loadImage(photoSrc),
    loadImage(BRAND_ASSETS.logoColor),
  ]);

  drawImageCover(ctx, photo, 0, 0, PROP_W, PROP_H);

  // gradiente sutil na base para a marca d'água ficar legível em qualquer foto
  drawLinearGradientRect(ctx, 0, PROP_H - 260, PROP_W, 260, [[0, 'rgba(6,20,14,0)'], [1, 'rgba(6,20,14,.55)']], 'toBottom');

  const logoW = 420;
  const logoH = logoW * (logoColor.height / logoColor.width);
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.drawImage(logoColor, PROP_W - 56 - logoW, 56, logoW, logoH);
  ctx.restore();

  return canvas;
}
