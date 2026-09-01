(() => {
  const form = document.querySelector('#cost-calculator');
  if (!form) return;

  const aPrice = form.querySelector('#cost-a-price');
  const aHours = form.querySelector('#cost-a-hours');
  const bPrice = form.querySelector('#cost-b-price');
  const bHours = form.querySelector('#cost-b-hours');
  const aOutput = form.querySelector('#cost-a-output');
  const bOutput = form.querySelector('#cost-b-output');
  const verdict = form.querySelector('#cost-verdict');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function perHour(price, hours) {
    return hours > 0 ? price / hours : null;
  }

  function calculate() {
    const priceA = clamp(Number(aPrice.value) || 0, 0, 500);
    const hoursA = clamp(Number(aHours.value) || 0, 0, 999);
    const priceB = clamp(Number(bPrice.value) || 0, 0, 500);
    const hoursB = clamp(Number(bHours.value) || 0, 0, 999);

    const rateA = perHour(priceA, hoursA);
    const rateB = perHour(priceB, hoursB);

    aOutput.textContent = rateA === null ? '—' : `$${rateA.toFixed(2)}/hr`;
    bOutput.textContent = rateB === null ? '—' : `$${rateB.toFixed(2)}/hr`;

    if (rateA === null || rateB === null) {
      verdict.textContent = 'Enter a runtime greater than zero for both options.';
      return;
    }

    const difference = Math.abs(rateA - rateB);
    if (difference < 0.01) {
      verdict.textContent = 'Both options cost about the same per hour.';
    } else if (rateA < rateB) {
      verdict.textContent = `Option A is the better value — $${difference.toFixed(2)}/hr cheaper.`;
    } else {
      verdict.textContent = `Option B is the better value — $${difference.toFixed(2)}/hr cheaper.`;
    }
  }

  form.addEventListener('input', calculate);
  calculate();
})();
