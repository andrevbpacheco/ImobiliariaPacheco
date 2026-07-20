// Wiring do módulo "Anúncio de Imóvel": formulário -> render -> preview -> download.

function formatBRLNumber(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function initPropertyModule(root) {
  const manualTags = [];
  let extractedTags = [];

  const imageManagerEl = root.querySelector('#prop-images');
  const imageManager = createImageManager(imageManagerEl, { multiple: true, onChange: updateImageCount });

  const els = {
    tipo: root.querySelector('#prop-tipo'),
    categoria: root.querySelector('#prop-categoria'),
    codigo: root.querySelector('#prop-codigo'),
    titulo: root.querySelector('#prop-titulo'),
    endereco: root.querySelector('#prop-endereco'),
    quartos: root.querySelector('#prop-quartos'),
    suites: root.querySelector('#prop-suites'),
    vagas: root.querySelector('#prop-vagas'),
    metragem: root.querySelector('#prop-metragem'),
    metragemTipo: root.querySelector('#prop-metragem-tipo'),
    preco: root.querySelector('#prop-preco'),
    precoNota: root.querySelector('#prop-preco-nota'),
    telefone: root.querySelector('#prop-telefone'),
    cta: root.querySelector('#prop-cta'),
    tagInput: root.querySelector('#prop-tag-input'),
    tagPills: root.querySelector('#prop-tag-pills'),
    freeText: root.querySelector('#prop-free-text'),
    extractBtn: root.querySelector('#prop-extract-btn'),
    generateBtn: root.querySelector('#prop-generate-btn'),
    downloadAllBtn: root.querySelector('#prop-download-all-btn'),
    preview: root.querySelector('#prop-preview'),
    imageCount: root.querySelector('#prop-image-count'),
    status: root.querySelector('#prop-status'),
  };

  els.preco.value = '1.600';
  els.telefone.value = THEME.phone;
  els.cta.value = 'Agende sua visita →';

  function updateImageCount(items) {
    els.imageCount.textContent = items.length
      ? `${items.length} ${items.length > 1 ? 'imagens' : 'imagem'} — a 1ª será a capa completa, as demais saem limpas com a marca d'água.`
      : 'Nenhuma imagem adicionada ainda.';
  }
  updateImageCount([]);

  function renderTagPills() {
    els.tagPills.innerHTML = '';
    const all = [...manualTags, ...extractedTags];
    all.forEach((tag, i) => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.innerHTML = `${tag}<button type="button" aria-label="remover">✕</button>`;
      pill.querySelector('button').addEventListener('click', () => {
        if (i < manualTags.length) manualTags.splice(i, 1);
        else extractedTags.splice(i - manualTags.length, 1);
        renderTagPills();
      });
      els.tagPills.appendChild(pill);
    });
  }

  els.tagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = els.tagInput.value.trim().replace(/,$/, '');
      if (val) {
        manualTags.push(val.charAt(0).toUpperCase() + val.slice(1));
        els.tagInput.value = '';
        renderTagPills();
      }
    }
  });

  els.extractBtn.addEventListener('click', () => {
    const found = extractTagsFromText(els.freeText.value);
    const existingKeys = new Set([...manualTags, ...extractedTags].map(t => t.toLowerCase()));
    const fresh = found.filter(t => !existingKeys.has(t.toLowerCase()));
    extractedTags.push(...fresh);
    renderTagPills();
    els.status.textContent = fresh.length
      ? `${fresh.length} tag(s) extraída(s) do texto.`
      : 'Nenhuma tag nova encontrada nesse texto.';
  });

  function gatherSpecs() {
    const specs = [];
    if (els.quartos.value) specs.push({ icon: 'bed', value: els.quartos.value, label: 'QUARTOS' });
    if (els.suites.value) specs.push({ icon: 'suite', value: els.suites.value, label: Number(els.suites.value) > 1 ? 'SUÍTES' : 'SUÍTE' });
    if (els.vagas.value) specs.push({ icon: 'garage', value: els.vagas.value, label: Number(els.vagas.value) > 1 ? 'VAGAS' : 'VAGA' });
    if (els.metragem.value) specs.push({ icon: 'area', value: els.metragem.value, label: `M² ${els.metragemTipo.value}` });
    return specs;
  }

  function buildData(photoSrc) {
    const tipo = els.tipo.value; // 'Locação' | 'Venda'
    const categoria = (els.categoria.value || 'Imóvel').toUpperCase();
    const categoryLabel = tipo === 'Locação' ? `${categoria} PARA LOCAÇÃO` : `${categoria} À VENDA`;
    return {
      photoSrc,
      badgeLabel: tipo,
      code: els.codigo.value.trim(),
      categoryLabel,
      title: els.titulo.value.trim() || 'Título do imóvel',
      address: els.endereco.value.trim(),
      specs: gatherSpecs(),
      tags: [...manualTags, ...extractedTags],
      priceLabel: tipo === 'Locação' ? 'ALUGUEL MENSAL' : 'VALOR DE VENDA',
      priceValue: 'R$ ' + (formatBRLNumber(els.preco.value) || '0') + ',00',
      priceNote: els.precoNota.value.trim(),
      phone: els.telefone.value.trim() || THEME.phone,
      cta: els.cta.value.trim() || 'Agende sua visita →',
    };
  }

  async function generate() {
    const items = imageManager.getItems();
    if (!items.length) {
      els.status.textContent = 'Adicione ao menos uma imagem antes de gerar.';
      return;
    }
    els.generateBtn.disabled = true;
    els.status.textContent = 'Gerando publicação…';
    await ensureFontsLoaded();

    els.preview.innerHTML = '';
    const canvases = [];
    try {
      const coverData = buildData(items[0].url);
      const coverCanvas = await renderPropertyCoverSlide(coverData);
      canvases.push({ canvas: coverCanvas, name: 'capa' });

      for (let i = 1; i < items.length; i++) {
        const clean = await renderPropertyCleanSlide(items[i].url);
        canvases.push({ canvas: clean, name: `slide-${i + 1}` });
      }

      canvases.forEach((entry, i) => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        entry.canvas.className = 'preview-canvas';
        const dl = document.createElement('button');
        dl.type = 'button';
        dl.className = 'btn btn-secondary';
        dl.textContent = i === 0 ? 'Baixar capa' : `Baixar slide ${i + 1}`;
        dl.addEventListener('click', () => downloadCanvas(entry.canvas, `pacheco-imovel-${entry.name}.png`));
        card.appendChild(entry.canvas);
        card.appendChild(dl);
        els.preview.appendChild(card);
      });

      els.downloadAllBtn.style.display = canvases.length > 1 ? 'inline-flex' : 'none';
      els.downloadAllBtn.onclick = () => canvases.forEach((entry, i) =>
        setTimeout(() => downloadCanvas(entry.canvas, `pacheco-imovel-${entry.name}.png`), i * 300));

      els.status.textContent = `${canvases.length} imagem(ns) geradas.`;
    } catch (err) {
      console.error(err);
      els.status.textContent = 'Erro ao gerar: ' + err.message;
    } finally {
      els.generateBtn.disabled = false;
    }
  }

  els.generateBtn.addEventListener('click', generate);
}
