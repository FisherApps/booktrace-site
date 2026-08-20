(() => {
  const form = document.querySelector('#speed-calculator');
  if (!form) return;

  const hours = form.querySelector('#hours');
  const minutes = form.querySelector('#minutes');
  const speed = form.querySelector('#speed');
  const adjusted = form.querySelector('#adjusted-time');
  const saved = form.querySelector('#time-saved');
  const presets = [...form.querySelectorAll('[data-speed]')];
  const tableCells = [...document.querySelectorAll('[data-table-speed]')];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function formatDuration(totalMinutes) {
    const rounded = Math.max(0, Math.round(totalMinutes));
    const wholeHours = Math.floor(rounded / 60);
    const remainingMinutes = rounded % 60;
    if (!wholeHours) return `${remainingMinutes}m`;
    if (!remainingMinutes) return `${wholeHours}h`;
    return `${wholeHours}h ${remainingMinutes}m`;
  }

  function calculate() {
    const enteredHours = clamp(Number(hours.value) || 0, 0, 999);
    const enteredMinutes = clamp(Number(minutes.value) || 0, 0, 59);
    const playbackSpeed = clamp(Number(speed.value) || 1, 0.5, 4);
    const originalMinutes = enteredHours * 60 + enteredMinutes;
    const listeningMinutes = originalMinutes / playbackSpeed;
    const difference = originalMinutes - listeningMinutes;

    adjusted.value = formatDuration(listeningMinutes);
    saved.textContent = difference >= 0
      ? `You save ${formatDuration(difference)}`
      : `${formatDuration(Math.abs(difference))} longer than 1×`;

    presets.forEach((button) => {
      button.classList.toggle('active', Number(button.dataset.speed) === playbackSpeed);
    });

    tableCells.forEach((cell) => {
      cell.textContent = formatDuration(originalMinutes / Number(cell.dataset.tableSpeed));
    });
  }

  form.addEventListener('input', calculate);
  presets.forEach((button) => button.addEventListener('click', () => {
    speed.value = button.dataset.speed;
    calculate();
  }));
  calculate();
})();
