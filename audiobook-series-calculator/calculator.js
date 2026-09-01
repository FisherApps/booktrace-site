(() => {
  const form = document.querySelector('#series-calculator');
  if (!form) return;

  const rowsWrap = form.querySelector('#series-rows');
  const addButton = form.querySelector('#series-add');
  const speed = form.querySelector('#series-speed');
  const daily = form.querySelector('#series-daily');
  const totalOutput = form.querySelector('#series-total');
  const summary = form.querySelector('#series-summary');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function formatDuration(totalMinutes) {
    const rounded = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    if (!h) return `${m}m`;
    if (!m) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function formatDate(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function renumberRows() {
    [...rowsWrap.querySelectorAll('.series-row')].forEach((row, index) => {
      row.querySelector('span').textContent = `Book ${index + 1}`;
    });
  }

  function bindRow(row) {
    row.querySelectorAll('input').forEach((input) => input.addEventListener('input', calculate));
    row.querySelector('.series-remove').addEventListener('click', () => {
      if (rowsWrap.querySelectorAll('.series-row').length <= 1) return;
      row.remove();
      renumberRows();
      calculate();
    });
  }

  function addRow() {
    const row = document.createElement('div');
    row.className = 'series-row';
    row.innerHTML = `<span>Book</span><label><span>Hours</span><input class="series-hours" type="number" inputmode="numeric" min="0" max="999" value="10"></label><label><span>Minutes</span><input class="series-minutes" type="number" inputmode="numeric" min="0" max="59" value="0"></label><button type="button" class="series-remove" aria-label="Remove this book">&times;</button>`;
    rowsWrap.appendChild(row);
    bindRow(row);
    renumberRows();
    calculate();
  }

  function calculate() {
    const rows = [...rowsWrap.querySelectorAll('.series-row')];
    const totalMinutes = rows.reduce((sum, row) => {
      const h = clamp(Number(row.querySelector('.series-hours').value) || 0, 0, 999);
      const m = clamp(Number(row.querySelector('.series-minutes').value) || 0, 0, 59);
      return sum + h * 60 + m;
    }, 0);

    const playbackSpeed = clamp(Number(speed.value) || 1, 0.5, 4);
    const dailyMinutes = clamp(Number(daily.value) || 1, 1, 600);
    const listeningMinutes = totalMinutes / playbackSpeed;
    const days = listeningMinutes > 0 ? Math.ceil(listeningMinutes / dailyMinutes) : 0;

    totalOutput.textContent = formatDuration(listeningMinutes);

    if (days === 0) {
      summary.textContent = `Add a book to see your finish date.`;
      return;
    }

    const finish = new Date();
    finish.setDate(finish.getDate() + days);
    summary.textContent = `Across ${rows.length} ${rows.length === 1 ? 'book' : 'books'} at ${playbackSpeed}× — finishes ${formatDate(finish)}`;
  }

  rowsWrap.querySelectorAll('.series-row').forEach(bindRow);
  addButton.addEventListener('click', addRow);
  form.addEventListener('input', (event) => {
    if (event.target === speed || event.target === daily) calculate();
  });
  calculate();
})();
