document.addEventListener("DOMContentLoaded", () => {
  const menuButtons = document.querySelectorAll('.menu-btn');
  const pageSections = document.querySelectorAll('.page-section');

  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Deactivate old highlighted menu tabs
      menuButtons.forEach(btn => btn.classList.remove('active'));
      // 2. Highlight clicked menu tab
      button.classList.add('active');

      // 3. Smoothly sweep away old page content
      pageSections.forEach(section => {
        section.classList.remove('active');
      });
      
      // 4. Match dataset target attribute to target page section id
      const targetId = button.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });

  // Theme toggle: support either a dedicated button or an element with this class.
  document.querySelectorAll('.theme-toggle, #theme-toggle').forEach(button => {
    button.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      button.setAttribute('aria-pressed', document.body.classList.contains('dark-theme'));
    });
  });

  // Pricing text can provide a base amount and currency through data attributes.
  const rates = { USD: 1, EUR: 0.92, GHS: 15.5 };
  const currencyNames = ['USD', 'EUR', 'GHS'];
  document.querySelectorAll('.pricing-text, [data-price]').forEach(price => {
    const amount = Number(price.dataset.price || price.textContent.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(amount)) return;
    let currencyIndex = currencyNames.indexOf((price.dataset.currency || 'USD').toUpperCase());
    if (currencyIndex < 0) currencyIndex = 0;
    price.addEventListener('click', () => {
      currencyIndex = (currencyIndex + 1) % currencyNames.length;
      const currency = currencyNames[currencyIndex];
      price.textContent = `${currency} ${(amount * rates[currency]).toFixed(2)}`;
      price.dataset.currency = currency;
    });
  });

  // Validate and display the live review input without navigating away.
  document.querySelectorAll('#live-review, .live-review').forEach(button => {
    button.addEventListener('click', () => {
      const review = window.prompt('Enter your review (at least 3 characters):');
      if (review === null) return;
      window.alert(review.trim().length >= 3
        ? 'Thank you! Your review is ready to submit.'
        : 'Please enter at least 3 characters.');
    });
  });

  // Translate a selected word from paragraph text in a Google Translate tab.
  document.querySelectorAll('p').forEach(paragraph => {
    paragraph.addEventListener('dblclick', () => {
      const selected = window.getSelection().toString().trim().split(/\s+/)[0];
      if (!selected) return;
      window.open(
        `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(selected)}&op=translate`,
        '_blank', 'noopener,noreferrer'
      );
    });
  });
});

// Google Translate widget initialization hook.
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
}