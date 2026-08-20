(() => {
  const hours = document.querySelector('#hours');
  const minutes = document.querySelector('#minutes');
  const speed = document.querySelector('#speed');
  const adjusted = document.querySelector('#adjusted-time');
  const saved = document.querySelector('#time-saved');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const format = (value) => {
    const total = Math.max(0, Math.round(value));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h ? `${h}h` : ''}${h && m ? ' ' : ''}${m ? `${m}m` : ''}` || '0m';
  };
  const calculate = () => {
    const original = clamp(Number(hours.value) || 0, 0, 999) * 60 + clamp(Number(minutes.value) || 0, 0, 59);
    const rate = clamp(Number(speed.value) || 1, 0.5, 4);
    const actual = original / rate;
    const difference = original - actual;
    adjusted.value = format(actual);
    saved.textContent = difference >= 0 ? `You save ${format(difference)}` : `${format(Math.abs(difference))} longer than 1×`;
  };
  document.querySelector('#speed-calculator').addEventListener('input', calculate);
  calculate();
})();
