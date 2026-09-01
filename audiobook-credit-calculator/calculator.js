(() => {
  const form = document.querySelector('#credit-calculator');
  if (!form) return;

  const price = form.querySelector('#credit-price');
  const credits = form.querySelector('#credit-count');
  const books = form.querySelector('#credit-books');
  const altPrice = form.querySelector('#credit-alt-price');
  const perBookOutput = form.querySelector('#credit-per-book');
  const altOutput = form.querySelector('#credit-alt-output');
  const verdict = form.querySelector('#credit-verdict');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const money = (value) => `$${value.toFixed(2)}`;

  function calculate() {
    const monthlyPrice = clamp(Number(price.value) || 0, 0, 500);
    const includedCredits = clamp(Number(credits.value) || 0, 0, 24);
    const booksUsed = clamp(Number(books.value) || 0, 0, 30);
    const individualPrice = clamp(Number(altPrice.value) || 0, 0, 200);

    const extraBooks = Math.max(0, booksUsed - includedCredits);
    const totalMembershipCost = monthlyPrice + extraBooks * individualPrice;
    const membershipPerBook = booksUsed > 0 ? totalMembershipCost / booksUsed : monthlyPrice;
    const totalAltCost = booksUsed * individualPrice;

    perBookOutput.textContent = money(membershipPerBook);
    altOutput.textContent = money(individualPrice);

    const difference = totalAltCost - totalMembershipCost;
    if (booksUsed === 0) {
      verdict.textContent = `Enter how many audiobooks you'll use to see a comparison.`;
    } else if (Math.abs(difference) < 0.01) {
      verdict.textContent = `Membership and buying individually cost about the same this month.`;
    } else if (difference > 0) {
      verdict.textContent = `Membership saves ${money(difference)} this month.`;
    } else {
      verdict.textContent = `Buying individually saves ${money(Math.abs(difference))} this month.`;
    }
  }

  form.addEventListener('input', calculate);
  calculate();
})();
