(() => {
  const button = document.querySelector('#copy-embed-code');
  const code = document.querySelector('#embed-code');
  if (!button || !code) return;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.value);
      button.textContent = 'Copied';
      document.dispatchEvent(new CustomEvent('booktrace:track', {
        detail: { name: 'embed_code_copied', parameters: { page_path: window.location.pathname } }
      }));
    } catch {
      code.focus();
      code.select();
      button.textContent = 'Code selected';
    }
    window.setTimeout(() => { button.textContent = 'Copy embed code'; }, 1800);
  });
})();
