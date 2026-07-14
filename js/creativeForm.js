// Wiring do "Módulo de Criação": ideia livre (texto + imagem) -> publicação na identidade visual.

function initCreativeModule(root) {
  const imageManagerEl = root.querySelector('#creative-images');
  const imageManager = createImageManager(imageManagerEl, { multiple: false, onChange: updateBgVisibility });

  const els = {
    format: root.querySelector('#creative-format'),
    background: root.querySelector('#creative-background'),
    backgroundRow: root.querySelector('#creative-background-row'),
    eyebrow: root.querySelector('#creative-eyebrow'),
    headline: root.querySelector('#creative-headline'),
    subheadline: root.querySelector('#creative-subheadline'),
    cta: root.querySelector('#creative-cta'),
    generateBtn: root.querySelector('#creative-generate-btn'),
    downloadBtn: root.querySelector('#creative-download-btn'),
    preview: root.querySelector('#creative-preview'),
    status: root.querySelector('#creative-status'),
  };

  function updateBgVisibility(items) {
    els.backgroundRow.style.display = items.length ? 'none' : 'flex';
  }
  updateBgVisibility([]);

  async function generate() {
    els.generateBtn.disabled = true;
    els.status.textContent = 'Gerando publicação…';
    await ensureFontsLoaded();

    try {
      const items = imageManager.getItems();
      const data = {
        format: els.format.value,
        background: els.background.value,
        photoSrc: items[0]?.url || null,
        eyebrow: els.eyebrow.value.trim(),
        headline: els.headline.value.trim() || 'Sua ideia aqui',
        subheadline: els.subheadline.value.trim(),
        cta: els.cta.value.trim(),
      };
      const canvas = await renderCreativeSlide(data);

      els.preview.innerHTML = '';
      canvas.className = 'preview-canvas';
      const card = document.createElement('div');
      card.className = 'preview-card';
      card.appendChild(canvas);
      els.preview.appendChild(card);

      els.downloadBtn.style.display = 'inline-flex';
      els.downloadBtn.onclick = () => downloadCanvas(canvas, 'pacheco-publicacao.png');
      els.status.textContent = 'Publicação gerada.';
    } catch (err) {
      console.error(err);
      els.status.textContent = 'Erro ao gerar: ' + err.message;
    } finally {
      els.generateBtn.disabled = false;
    }
  }

  els.generateBtn.addEventListener('click', generate);
}
