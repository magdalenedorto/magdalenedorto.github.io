const SUPABASE_URL = 'https://cyqvkmqcsgyvkhixcvan.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cXZrbXFjc2d5dmtoaXhjdmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDUwMDQsImV4cCI6MjEwODYyMTAwNH0.EBA-oB__Rw7qQxjcve5SLe95d5QGSf6IfFEb3V0ao1Q';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

const feedbackForm = document.getElementById('feedback-form');
const feedbackStatus = document.getElementById('feedback-status');
const reviewsGrid = document.getElementById('live-reviews-grid');
const ratingInput = document.getElementById('visitor-rating');
const ratingButtons = [...document.querySelectorAll('.rating-control [role="radio"]')];

function setRating(value, focus = false) {
    const rating = Math.min(5, Math.max(1, Number(value) || 5));
    ratingInput.value = String(rating);
    ratingButtons.forEach(button => {
        const buttonRating = Number(button.dataset.rating);
        button.setAttribute('aria-checked', String(buttonRating === rating));
        button.classList.toggle('is-selected', buttonRating <= rating);
        button.querySelector('i').className = buttonRating <= rating ? 'fa-solid fa-star' : 'fa-regular fa-star';
        if (focus && buttonRating === rating) button.focus();
    });
}

ratingButtons.forEach(button => {
    button.addEventListener('click', () => setRating(button.dataset.rating));
    button.addEventListener('keydown', event => {
        const currentRating = Number(ratingInput.value) || 5;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault();
            setRating(Math.min(5, currentRating + 1), true);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault();
            setRating(Math.max(1, currentRating - 1), true);
        } else if (event.key === 'Home') {
            event.preventDefault();
            setRating(1, true);
        } else if (event.key === 'End') {
            event.preventDefault();
            setRating(5, true);
        }
    });
});

setRating(ratingInput.value);

function setFeedbackStatus(message, state) {
    feedbackStatus.textContent = message;
    feedbackStatus.dataset.state = state;
}

async function sendEmailNotification(payload) {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || `Email service returned ${response.status}`);
    }
}

async function publishPublicReview(review) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=minimal'
        },
        body: JSON.stringify(review)
    });
    if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(`Supabase returned ${response.status}: ${details.slice(0, 300)}`);
    }
}

feedbackForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!feedbackForm.reportValidity()) return;

    const formData = new FormData(feedbackForm);
    if (formData.get('botcheck')) return;

    const submitButton = feedbackForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    const privacy = formData.get('privacy') === 'public' ? 'public' : 'private';
    const visitorName = String(formData.get('name') || '').trim() || 'Anonymous';
    const visitorEmail = String(formData.get('email') || '').trim();
    const visitorLocation = String(formData.get('visitor_location') || '').trim() || 'Not shared';
    const rating = Number(formData.get('rating')) || 5;
    const comment = String(formData.get('message') || '').trim();

    const emailPayload = {
        access_key: formData.get('access_key'),
        name: visitorName,
        subject: `${privacy === 'public' ? 'Public review' : 'Private feedback'} - Magdalene Dorto portfolio`,
        message: comment,
        privacy,
        rating,
        visitor_location: visitorLocation,
        from_name: 'Magdalene Dorto portfolio'
    };
    if (visitorEmail) {
        emailPayload.email = visitorEmail;
        emailPayload.replyto = visitorEmail;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    setFeedbackStatus('Sending your feedback securely…', 'pending');

    const [emailResult, reviewResult] = await Promise.allSettled([
        sendEmailNotification(emailPayload),
        privacy === 'public'
            ? publishPublicReview({
                visitor_name: visitorName,
                visitor_location: visitorLocation,
                star_rating: rating,
                public_comment: comment,
                privacy: 'public',
                moderation_status: 'pending'
            })
            : Promise.resolve()
    ]);

    const emailSent = emailResult.status === 'fulfilled';
    const reviewQueued = privacy === 'public' && reviewResult.status === 'fulfilled';

    if (privacy === 'private') {
        if (emailSent) {
            setFeedbackStatus('Your private feedback was emailed to the project team. It will not appear publicly.', 'success');
            feedbackForm.reset();
        } else {
            console.error('Web3Forms submission failed:', emailResult.reason);
            setFeedbackStatus('We could not email your feedback. Please try again later or contact the team directly.', 'error');
        }
    } else if (reviewQueued && emailSent) {
        setFeedbackStatus('Thank you. Your review request was emailed to the team and is waiting for approval before it appears publicly.', 'success');
        feedbackForm.reset();
    } else if (reviewQueued) {
        console.error('Web3Forms notification failed:', emailResult.reason);
        setFeedbackStatus('Your review request is waiting for approval, but its email notification failed.', 'error');
        feedbackForm.reset();
    } else if (emailSent) {
        console.error('Supabase insert failed:', reviewResult.reason);
        const supabaseError = String(reviewResult.reason?.message || '');
        if (supabaseError.includes('42703') && supabaseError.includes('privacy')) {
            setFeedbackStatus('Your email was sent, but public reviews are not set up yet. Run supabase/reviews-policies.sql in the Supabase SQL Editor, then try again.', 'error');
        } else {
            setFeedbackStatus('Your email was sent, but your public review request could not be queued. Check the Supabase table and row-level security setup.', 'error');
        }
    } else {
        console.error('Feedback delivery failed:', { email: emailResult.reason, review: reviewResult.reason });
        setFeedbackStatus('Feedback could not be delivered. Check the Web3Forms access key and Supabase project configuration, then try again.', 'error');
    }

    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
});

async function loadPublicReviews() {
    if (!reviewsGrid) return;

    try {
        const query = new URLSearchParams({
            select: 'visitor_name,visitor_location,star_rating,public_comment,created_at',
            privacy: 'eq.public',
            moderation_status: 'eq.published',
            order: 'created_at.desc',
            limit: '50'
        });
        const response = await fetch(`${SUPABASE_URL}/rest/v1/portfolio_reviews?${query}`, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (!response.ok) {
            const details = await response.text().catch(() => '');
            throw new Error(`Supabase returned ${response.status}: ${details.slice(0, 300)}`);
        }
        const reviews = await response.json();
        reviewsGrid.replaceChildren();

        if (!reviews.length) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No public reviews yet.';
            reviewsGrid.append(emptyMessage);
            return;
        }

        reviews.forEach(review => {
            const card = document.createElement('article');
            card.className = 'review-card';

            const header = document.createElement('div');
            header.className = 'review-card-header';
            const name = document.createElement('strong');
            name.textContent = review.visitor_name || 'Anonymous';
            const location = document.createElement('span');
            location.className = 'review-card-location';
            location.textContent = review.visitor_location || '';
            header.append(name, location);

            const rating = document.createElement('p');
            rating.className = 'review-card-rating';
            const starCount = Math.min(5, Math.max(1, Number(review.star_rating) || 5));
            rating.setAttribute('role', 'img');
            rating.setAttribute('aria-label', `${starCount} out of 5 stars`);
            for (let index = 0; index < 5; index += 1) {
                const star = document.createElement('i');
                star.className = index < starCount ? 'fa-solid fa-star' : 'fa-regular fa-star';
                star.setAttribute('aria-hidden', 'true');
                rating.append(star);
            }

            const comment = document.createElement('p');
            comment.className = 'review-card-comment';
            comment.textContent = review.public_comment || '';
            card.append(header, rating, comment);
            reviewsGrid.append(card);
        });
    } catch (error) {
        console.error('Could not load public reviews:', error);
        reviewsGrid.replaceChildren();
        const message = document.createElement('p');
        const errorDetails = String(error.message || '');
        message.textContent = errorDetails.includes('42703') && errorDetails.includes('privacy')
            ? 'Public reviews need database setup. The site owner must run supabase/reviews-policies.sql in the Supabase SQL Editor.'
            : 'Public reviews are temporarily unavailable.';
        reviewsGrid.append(message);
    }
}

loadPublicReviews();
