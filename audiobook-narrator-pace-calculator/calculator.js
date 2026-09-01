(() => {
  const form = document.querySelector('#pace-calculator');
  if (!form) return;

  const minutes = form.querySelector('#pace-minutes');
  const seconds = form.querySelector('#pace-seconds');
  const words = form.querySelector('#pace-words');
  const target = form.querySelector('#pace-target');
  const wpmOutput = form.querySelector('#pace-wpm');
  const suggestion = form.querySelector('#pace-suggestion');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function calculate() {
    const clipMinutes = clamp(Number(minutes.value) || 0, 0, 60);
    const clipSeconds = clamp(Number(seconds.value) || 0, 0, 59);
    const wordCount = clamp(Number(words.value) || 0, 1, 2000);
    const targetWpm = clamp(Number(target.value) || 0, 80, 400);

    const totalMinutes = clipMinutes + clipSeconds / 60;
    if (totalMinutes <= 0) {
      wpmOutput.textContent = '—';
      suggestion.textContent = 'Enter a clip length longer than zero.';
      return;
    }

    const measuredWpm = wordCount / totalMinutes;
    wpmOutput.textContent = `${Math.round(measuredWpm)} wpm`;

    const rawSpeed = targetWpm / measuredWpm;
    const suggestedSpeed = Math.round(clamp(rawSpeed, 0.5, 4) * 20) / 20;
    suggestion.textContent = `Play at ${suggestedSpeed}× to reach your preferred ${targetWpm} wpm`;
  }

  form.addEventListener('input', calculate);
  calculate();
})();
