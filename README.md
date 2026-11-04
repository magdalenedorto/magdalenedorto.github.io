# magdalenedorto.github.io
Personal portfolio website for Magdalene Dorto.

## Site structure

- `index.html` is the Jekyll-rendered portfolio page.
- `_data/homepage.yml` contains the home and mode-selection copy.
- `style.css` contains shared theme styles; the page also has layout-specific CSS.
- `reviews.html` and `reviews.js` implement the feedback form and public review list.
- `supabase/reviews-policies.sql` contains the required Supabase table privacy policies.

## Feedback delivery

The form sends every submission to Web3Forms at `https://api.web3forms.com/submit`. Its access key must be active in the Web3Forms dashboard, and the destination inbox must be verified there.

Private feedback is emailed only. Public reviews are emailed and inserted into `public.portfolio_reviews`. The browser uses a Supabase **anon** key; never put a service-role key in site files. In the Supabase SQL Editor, run `supabase/reviews-policies.sql` once to add the privacy column, enable row-level security, and allow anonymous users to read and insert only public reviews. Existing rows are treated as private by that migration.

Keep the Supabase project URL and anon key in `reviews.js` synchronized with the project settings. The live project currently returns PostgREST error `42703`: `portfolio_reviews.privacy` does not exist. Run `supabase/reviews-policies.sql` in the Supabase SQL Editor to add that column and enable public-only row-level-security policies. The page now shows this specific instruction when it sees that error.

## Jekyll

Both HTML pages use `layout: null` front matter to render without a site layout. GitHub Pages builds the Liquid references in `index.html`; opening the source directly with `file://` does not render those variables. Test the deployed page or run it through a local Jekyll server.

The large `index.html` can eventually be split into Jekyll includes and dedicated CSS/JavaScript files; keep that as a separate refactor after the feedback integrations are stable.
