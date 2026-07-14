// Componente reutilizável de upload/ordenação de imagens (drag&drop + input file + reordenar).
function createImageManager(container, { multiple = true, onChange = () => {} } = {}) {
  let items = []; // [{id, file, url}]
  let nextId = 1;

  const dropzone = document.createElement('div');
  dropzone.className = 'dropzone';
  dropzone.innerHTML = `<span class="dropzone-icon">＋</span><span>Arraste imagens aqui ou clique para escolher</span>`;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = multiple;
  input.style.display = 'none';

  const list = document.createElement('div');
  list.className = 'image-list';

  container.appendChild(dropzone);
  container.appendChild(input);
  container.appendChild(list);

  function addFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!multiple) items = [];
    for (const file of files) {
      items.push({ id: nextId++, file, url: URL.createObjectURL(file) });
      if (!multiple) break;
    }
    render();
    onChange(items);
  }

  dropzone.addEventListener('click', () => input.click());
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    addFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', () => addFiles(input.files));

  function move(id, dir) {
    const idx = items.findIndex(i => i.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    render();
    onChange(items);
  }

  function remove(id) {
    items = items.filter(i => i.id !== id);
    render();
    onChange(items);
  }

  function render() {
    list.innerHTML = '';
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = `
        <img src="${item.url}" alt="">
        ${idx === 0 && multiple ? '<span class="image-card-badge">Capa</span>' : ''}
        <div class="image-card-actions">
          ${multiple ? `<button type="button" data-act="up" title="Mover para cima">↑</button>
          <button type="button" data-act="down" title="Mover para baixo">↓</button>` : ''}
          <button type="button" data-act="remove" title="Remover">✕</button>
        </div>`;
      card.querySelector('[data-act="up"]')?.addEventListener('click', () => move(item.id, -1));
      card.querySelector('[data-act="down"]')?.addEventListener('click', () => move(item.id, 1));
      card.querySelector('[data-act="remove"]').addEventListener('click', () => remove(item.id));
      list.appendChild(card);
    });
  }

  return {
    getItems: () => items,
    clear: () => { items = []; render(); onChange(items); },
  };
}
