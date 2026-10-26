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
// =================================================================
// AUTOMATED DATABASE SUBMISSION LOOP (PASTED AT THE BOTTOM)
// =================================================================
const SUPABASE_URL = "https://cyqvkmqcsgyvkhixcvan.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cXZrbXFjc2d5dmtoaXhjdmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDUwMDQsImV4cCI6MjEwODYyMTAwNH0.EBA-oB__Rw7qQxjcve5SLe95d5QGSf6IfFEb3V0ao1Q";

document.addEventListener('submit', async function(event) {
    if (event.target && (event.target.id === 'feedback-box' || event.target.classList.contains('feedback-box') || event.target.classList.contains('feedback-form-automated'))) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]') || document.getElementById('live-review');
        
        if (submitBtn) {
            submitBtn.textContent = 'Publishing Live...';
            submitBtn.disabled = true;
        }

        // Package data for your Supabase Cloud Database Table
        const formData = new FormData(form);
        const databasePayload = {
            visitor_name: formData.get('visitor_name') || formData.get('name') || 'Anonymous Visitor',
            visitor_location: formData.get('visitor_location') || 'Ghana',
            star_rating: parseInt(formData.get('rating')) || 5,
            public_comment: formData.get('message') || formData.get('comment')
        };

        try {
            // 1. Post instantly to Supabase Cloud Database Table
            const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(databasePayload)
            });

            // 2. Post to Web3Forms API for your private Outlook Inbox alert in the background
            const emailObject = Object.fromEntries(formData);
            await fetch('https://web3forms.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(emailObject)
            });

            if (dbResponse.ok) {
                // Success layout template injection (no black screens)
                form.innerHTML = `
                    <div style="padding: 2.5rem; text-align: center; color: #173b57; background: #ffffff; border-radius: 16px; box-shadow: 0 12px 28px rgba(0,0,0,0.06); border-bottom: 4px solid #df682e;">
                        <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #df682e; margin-bottom: 1rem;"></i>
                        <h4 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 0.5rem; color: #173b57;">Review Published Live!</h4>
                        <p style="font-size: 0.95rem; color: #526574; line-height: 1.6;">Thank you! Your 5-star rating and comment have been updated automatically to your public reviews board.</p>
                    </div>`;
            } else {
                throw new Error('Database insertion rejected.');
            }

        } catch (error) {
            if (submitBtn) {
                submitBtn.textContent = 'Submit Review';
                submitBtn.disabled = false;
            }
            alert('Database connection timeout. Please verify your internet connection and try again.');
        }
    }
});
// =================================================================
// DYNAMIC REVIEW BOARD RENDERER ENGINE
// =================================================================
async function loadPublicReviews() {
    const gridContainer = document.getElementById('live-reviews-grid');
    if (!gridContainer) return; // Only execute if we are on the reviews page

    try {
        // Pull all entries sorted by newest first
        const response = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_reviews?select=*&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch data');
        const reviews = await response.json();

        if (reviews.length === 0) {
            gridContainer.innerHTML = '<p style="text-align:center; color:#526574; padding:2rem;">No reviews published yet. Be the first to leave feedback!</p>';
            return;
        }

        // Clear loading spinner and map out cards dynamically
        gridContainer.innerHTML = '';
        reviews.forEach(review => {
            // Generate star string based on rating value
            const stars = '⭐'.repeat(review.star_rating);
            
            const card = document.createElement('div');
            card.className = 'review-card';
            card.style = "background:#ffffff; padding:1.5rem; border-radius:14px; box-shadow:0 8px 24px rgba(23,59,87,0.06); display:grid; gap:0.75rem; border-left:4px solid #173b57;";
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#173b57; font-size:1.1rem;">${review.visitor_name}</strong>
                    <span style="font-size:0.8rem; color:#526574;">${review.visitor_location}</span>
                </div>
                <div style="color:#df682e; font-size:0.9rem;">${stars}</div>
                <p style="color:#21313f; font-size:0.95rem; line-height:1.6; margin:0.25rem 0;">"${review.public_comment}"</p>
                
                <!-- Automated Emoji Counter Blocks -->
                <div class="emoji-reactions" style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                    <button onclick="updateReaction(${review.id}, 'emoji_likes')" style="background:rgba(23,59,87,0.04); border:0; padding:0.4rem 0.75rem; border-radius:8px; cursor:pointer; font-size:0.85rem; color:#173b57; display:flex; align-items:center; gap:4px;">
                        👍 <span id="like-count-${review.id}">${review.emoji_likes || 0}</span>
                    </button>
                    <button onclick="updateReaction(${review.id}, 'emoji_hearts')" style="background:rgba(23,59,87,0.04); border:0; padding:0.4rem 0.75rem; border-radius:8px; cursor:pointer; font-size:0.85rem; color:#173b57; display:flex; align-items:center; gap:4px;">
                        ❤️ <span id="heart-count-${review.id}">${review.emoji_hearts || 0}</span>
                    </button>
                    <button onclick="updateReaction(${review.id}, 'emoji_dislikes')" style="background:rgba(23,59,87,0.04); border:0; padding:0.4rem 0.75rem; border-radius:8px; cursor:pointer; font-size:0.85rem; color:#173b57; display:flex; align-items:center; gap:4px;">
                        👎 <span id="dislike-count-${review.id}">${review.emoji_dislikes || 0}</span>
                    </button>
                </div>
            `;
            gridContainer.appendChild(card);
        });

    } catch (error) {
        gridContainer.innerHTML = '<p style="text-align:center; color:#b84f24; padding:2rem;">Failed to synchronize reviews list from database.</p>';
    }
}

// Function to handle interactive live emoji counter increment clicks
async function updateReaction(reviewId, fieldColumn) {
    const counterSpan = document.getElementById(`${fieldColumn === 'emoji_likes' ? 'like' : fieldColumn === 'emoji_hearts' ? 'heart' : 'dislike'}-count-${reviewId}`);
    if (!counterSpan) return;

    // Instantly pre-increment visually on the screen (UI optimization)
    let currentCount = parseInt(counterSpan.textContent) || 0;
    counterSpan.textContent = currentCount + 1;

    try {
        // Fetch current database counts to accurately increment the value
        const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_reviews?id=eq.${reviewId}&select=${fieldColumn}`, {
            method: 'GET',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const data = await getResponse.json();
        const freshCount = (data[0]?.[fieldColumn] || 0) + 1;

        // Patch the database table field column with the new increment value
        await fetch(`${SUPABASE_URL}/rest/v1/portfolio_reviews?id=eq.${reviewId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ [fieldColumn]: freshCount })
        });
    } catch (e) {
        // Fallback row if network connection fails
        counterSpan.textContent = currentCount;
    }
}

// Run the data loader initialization hook on window startup
document.addEventListener('DOMContentLoaded', loadPublicReviews);
