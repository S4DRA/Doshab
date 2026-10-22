const container = document.getElementById('sources');
const status = document.getElementById('status');
const share = document.getElementById('share');
let selected = null;
window.valShare.sources().then(({ sources, audioRequested }) => {
  document.getElementById('audio-option').hidden = !audioRequested;
  status.textContent = sources.length ? '' : 'No sources available. Close this window and try again.';
  for (const source of sources) {
    const button = document.createElement('button');
    button.className = 'source';
    button.setAttribute('aria-pressed', 'false');
    const image = document.createElement('img');
    image.src = source.thumbnail;
    image.alt = '';
    const label = document.createElement('span');
    label.textContent = source.name;
    button.append(image, label);
    button.addEventListener('click', () => {
      selected = source.id;
      for (const sibling of container.children) sibling.setAttribute('aria-pressed', String(sibling === button));
      share.disabled = false;
    });
    container.append(button);
  }
}).catch(() => { status.textContent = 'Could not list sources. Close this window and try again.'; });
share.addEventListener('click', () => {
  if (!selected) return;
  share.disabled = true;
  window.valShare.select(selected, document.getElementById('audio').checked).catch(() => { status.textContent = 'Sharing failed. Close this window and try again.'; });
});
