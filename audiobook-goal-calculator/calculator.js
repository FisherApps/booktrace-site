(() => {
  const form = document.querySelector('#goal-calculator');
  if (!form) return;
  const hours = form.querySelector('#goal-hours');
  const minutes = form.querySelector('#goal-minutes');
  const speed = form.querySelector('#goal-speed');
  const days = form.querySelector('#goal-days');
  const daily = form.querySelector('#daily-goal');
  const summary = form.querySelector('#goal-summary');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const format = (value) => {
    const total = Math.max(0, Math.round(value));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h ? `${h}h` : ''}${h && m ? ' ' : ''}${m ? `${m}m` : ''}` || '0m';
  };
  const calculate = () => {
    const remaining = clamp(Number(hours.value) || 0, 0, 999) * 60 + clamp(Number(minutes.value) || 0, 0, 59);
    const rate = clamp(Number(speed.value) || 1, 0.5, 4);
    const availableDays = clamp(Math.round(Number(days.value) || 1), 1, 365);
    const listening = remaining / rate;
    daily.value = listening > 0 ? `${Math.ceil(listening / availableDays)} min` : '0 min';
    summary.textContent = `${format(listening)} of listening across ${availableDays} ${availableDays === 1 ? 'day' : 'days'}`;
  };
  form.addEventListener('input', calculate);
  calculate();
})();
