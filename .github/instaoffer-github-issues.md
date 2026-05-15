# InstaOffer — GitHub Issues (Label: `Audit`)
# Ready to paste into GitHub Issues one by one
# Each issue includes full AI agent instructions for autonomous implementation

---

## ISSUE #1 — [Audit] [P0] Fix /valuation page SSR — page renders blank "Loading…" only

**Labels:** `Audit` `bug` `P0` `critical` `frontend`
**Assignee:** AI Agent
**Milestone:** Sprint 1

### Problem
The `/valuation` route renders only the text "Loading…" in production. The page is entirely client-side rendered with no SSR or static fallback. Any user clicking the primary CTA ("Get My Free Valuation") sees a blank loading state and likely bounces. This is the #1 conversion blocker.

### Expected Behavior
On first load (even without JS hydration), the user should see Step 1 of the valuation form: car Make selector, Model selector, and Year field. The AI estimate API call is async and can resolve after initial render.

### AI Agent Instructions

**Context:** This is a Next.js app deployed on Vercel. The valuation page is at `src/app/valuation/page.tsx` (or `pages/valuation.tsx`). The form data flow likely calls an internal API route that proxies to an ML model.

**Step 1 — Diagnose rendering mode**
```bash
# Check if the page uses 'use client' directive at the top
grep -r "use client" src/app/valuation/
# Check for dynamic imports without SSR
grep -r "dynamic(" src/app/valuation/
```

**Step 2 — Convert Step 1 of the form to a server-renderable component**

Create or update `src/components/ValuationStep1.tsx`:
```tsx
// This component must NOT have 'use client' at the top level
// It renders the initial form fields statically

export default function ValuationStep1() {
  return (
    <div className="valuation-step" data-step="1">
      <h2>Tell us about your car</h2>
      <p className="step-indicator">Step 1 of 5</p>
      
      {/* Make selector — populate from static JSON list, not API */}
      <label htmlFor="make">Car Make</label>
      <select id="make" name="make" required>
        <option value="">Select make...</option>
        {CAR_MAKES.map(make => (
          <option key={make} value={make}>{make}</option>
        ))}
      </select>

      {/* Model — dynamically populated client-side after make selection */}
      <label htmlFor="model">Model</label>
      <select id="model" name="model" required disabled>
        <option value="">Select model...</option>
      </select>

      {/* Year */}
      <label htmlFor="year">Year</label>
      <select id="year" name="year" required>
        {Array.from({length: 20}, (_, i) => new Date().getFullYear() - i).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <button type="button" id="step1-next">Continue →</button>
    </div>
  )
}

// Static list — no API call needed for Step 1
const CAR_MAKES = [
  'Toyota', 'Nissan', 'Lexus', 'BMW', 'Mercedes-Benz',
  'Honda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet',
  'Land Rover', 'Mitsubishi', 'Audi', 'Volkswagen', 'Infiniti'
]
```

**Step 3 — Update the valuation page to use SSR for Step 1**

In `src/app/valuation/page.tsx`:
```tsx
import ValuationStep1 from '@/components/ValuationStep1'

// Remove any 'use client' from this file
// Add this export to force SSR
export const dynamic = 'force-dynamic' // or 'force-static' if no auth needed on step 1

export default function ValuationPage() {
  return (
    <main>
      <ValuationStepIndicator currentStep={1} totalSteps={5} />
      <ValuationStep1 />
      {/* Subsequent steps load client-side after Step 1 interaction */}
    </main>
  )
}
```

**Step 4 — Add loading skeleton for async steps**

Create `src/components/ValuationSkeleton.tsx`:
```tsx
'use client'
export default function ValuationSkeleton() {
  return (
    <div className="skeleton-wrapper" aria-label="Loading your estimate...">
      <div className="skeleton-bar w-48 h-4 mb-6" />
      <div className="skeleton-bar w-full h-12 mb-4" />
      <div className="skeleton-bar w-full h-12 mb-4" />
      <div className="skeleton-bar w-3/4 h-12 mb-8" />
      <div className="skeleton-bar w-40 h-10" />
    </div>
  )
}
```

**Step 5 — Add 8-second timeout fallback**

In the async estimate fetch:
```tsx
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 8000)

try {
  const res = await fetch('/api/estimate', { signal: controller.signal })
  // handle response
} catch (err) {
  if (err.name === 'AbortError') {
    // Show fallback: "Taking longer than usual"
    setEstimateState('timeout')
  }
} finally {
  clearTimeout(timeoutId)
}
```

**Step 6 — Test**
```bash
# Build and test SSR
npm run build && npm run start
# Open http://localhost:3000/valuation with JavaScript disabled
# The form Step 1 MUST be visible without JS
```

**Acceptance Criteria:**
- [ ] `/valuation` shows car Make/Model/Year form on first load with JS disabled
- [ ] No "Loading…" text visible on initial render
- [ ] Loading skeleton shows during async estimate fetch
- [ ] Timeout fallback triggers after 8 seconds with a user-friendly message
- [ ] Vercel preview deployment passes lighthouse performance score ≥ 70

---

## ISSUE #2 — [Audit] [P0] Build /urgent-sale page — currently renders empty shell

**Labels:** `Audit` `bug` `P0` `critical` `frontend`
**Assignee:** AI Agent
**Milestone:** Sprint 1

### Problem
The `/urgent-sale` route exists but renders only the header and footer with no page content. Users who select "Sell my car fast" from the homepage land on a blank page.

### Expected Behavior
The urgent sale flow should clearly explain the expedited process, collect the car details (same as valuation), flag the listing as "urgent", and set a 24-hour dealer response expectation.

### AI Agent Instructions

**Context:** Review the FigJam wireframe at https://www.figma.com/board/QqTc15FAXJg2eV4LWFFEx3/ for the intended urgent sale flow. Key differences from the standard valuation flow: (1) urgency flag is pre-set, (2) seller sets a minimum acceptable price, (3) dealers are notified immediately via alert.

**Step 1 — Create the page file**

`src/app/urgent-sale/page.tsx`:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Urgent Car Sale Qatar | InstaOffer',
  description: 'Need to sell your car fast in Qatar? Get dealer offers within hours.',
}

export default function UrgentSalePage() {
  return (
    <main className="urgent-sale-page">
      <UrgentSaleHero />
      <UrgentSaleForm />
    </main>
  )
}
```

**Step 2 — Build the hero section**

```tsx
function UrgentSaleHero() {
  return (
    <section className="urgent-hero">
      <div className="urgency-badge">⚡ Urgent Sale</div>
      <h1>Sell Your Car Fast — Dealer Offers Within Hours</h1>
      <p>Set your minimum price. Verified dealers compete to meet it. You pick the winner.</p>
      
      <div className="timeline-strip">
        <div className="timeline-item">
          <span className="time">Now</span>
          <span className="event">List your car</span>
        </div>
        <div className="timeline-arrow">→</div>
        <div className="timeline-item">
          <span className="time">2 hrs</span>
          <span className="event">Dealers notified</span>
        </div>
        <div className="timeline-arrow">→</div>
        <div className="timeline-item">
          <span className="time">24 hrs</span>
          <span className="event">Offers in hand</span>
        </div>
        <div className="timeline-arrow">→</div>
        <div className="timeline-item">
          <span className="time">48 hrs</span>
          <span className="event">Car sold</span>
        </div>
      </div>
    </section>
  )
}
```

**Step 3 — Build the urgent sale form**

```tsx
'use client'
import { useState } from 'react'

function UrgentSaleForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    make: '', model: '', year: '', mileage: '',
    condition: '', reason: '', minPrice: '', phone: ''
  })

  // Step 1: Car details (reuse ValuationStep1 component)
  // Step 2: Condition + reason for urgent sale
  // Step 3: Minimum acceptable price
  // Step 4: Phone (with privacy notice)
  // Step 5: Confirmation

  const urgencyReasons = [
    'Relocating / Leaving Qatar',
    'Financial need',
    'Upgrading to new car',
    'Vehicle no longer needed',
    'Other'
  ]

  return (
    <form className="urgent-sale-form">
      {step === 1 && (
        <div>
          {/* Reuse standard car detail fields */}
          <h3>Step 1 of 4 — Car Details</h3>
          {/* Make / Model / Year / Mileage fields */}
          <button type="button" onClick={() => setStep(2)}>Next →</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Step 2 of 4 — Why the urgency?</h3>
          <p className="helper">This helps dealers understand your situation and prioritize your listing.</p>
          <div className="reason-grid">
            {urgencyReasons.map(reason => (
              <button
                key={reason}
                type="button"
                className={`reason-chip ${formData.reason === reason ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, reason})}
              >
                {reason}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(1)}>← Back</button>
          <button type="button" onClick={() => setStep(3)} disabled={!formData.reason}>Next →</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>Step 3 of 4 — Your minimum price</h3>
          <p className="helper">Set the lowest offer you'd accept. Dealers only see that offers must meet this floor.</p>
          <div className="price-input-wrapper">
            <span className="currency">QAR</span>
            <input
              type="number"
              placeholder="e.g. 85000"
              value={formData.minPrice}
              onChange={e => setFormData({...formData, minPrice: e.target.value})}
            />
          </div>
          <p className="note">💡 Not sure? We'll show you market data to help you decide.</p>
          <button type="button" onClick={() => setStep(2)}>← Back</button>
          <button type="button" onClick={() => setStep(4)} disabled={!formData.minPrice}>Next →</button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3>Step 4 of 4 — Where should dealers reach you?</h3>
          <input
            type="tel"
            placeholder="Your phone number"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
          <p className="privacy-note">
            🔒 Your number is private. Dealers only see it if <strong>you approve their contact request</strong>.
          </p>
          <button type="button" onClick={() => setStep(3)}>← Back</button>
          <button type="submit">⚡ List My Car Urgently</button>
          <p className="disclaimer">Non-binding. Free for sellers. No obligation to accept any offer.</p>
        </div>
      )}
    </form>
  )
}
```

**Step 4 — Wire to API**

On form submit, call `POST /api/listings` with `{ ...formData, isUrgent: true, urgencyScore: 100 }`. The API should set `urgent: true` on the listing record in Supabase and trigger dealer notifications.

**Step 5 — Add to homepage CTA routing**

Confirm that the homepage "Sell my car fast" card correctly routes to `/urgent-sale` (not `/valuation`).

**Acceptance Criteria:**
- [ ] `/urgent-sale` renders full page content on first load (SSR)
- [ ] 4-step form collects: car details, urgency reason, min price, phone
- [ ] Privacy note appears inline on the phone field step
- [ ] Form submits with `isUrgent: true` flag to the listings API
- [ ] Confirmation screen shows expected dealer response timeline (24 hrs)
- [ ] Back navigation works on every step

---

## ISSUE #3 — [Audit] [P0] Add global error boundaries and loading skeleton states

**Labels:** `Audit` `bug` `P0` `frontend` `resilience`
**Assignee:** AI Agent
**Milestone:** Sprint 1

### Problem
No page in the app has error handling or fallback UI. If any async operation fails (API timeout, network error, cold start), the user sees either a blank screen or a perpetual loading state with no recovery path.

### AI Agent Instructions

**Step 1 — Create global error boundary**

`src/app/error.tsx` (Next.js 13+ App Router global error boundary):
```tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error-page">
      <div className="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>We couldn't load this page. This is likely a temporary issue.</p>
      <div className="error-actions">
        <button onClick={() => reset()}>Try Again</button>
        <a href="/">← Back to Home</a>
        <a href="https://wa.me/97430000000" target="_blank">Contact Support on WhatsApp</a>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="error-detail">{error.message}</pre>
      )}
    </div>
  )
}
```

**Step 2 — Create route-level error boundaries**

For each major route, add a local `error.tsx`:
- `src/app/valuation/error.tsx`
- `src/app/urgent-sale/error.tsx`
- `src/app/for-dealers/error.tsx`

Each should include a relevant recovery CTA (e.g., valuation error → "Try entering your car details again").

**Step 3 — Create reusable skeleton component**

`src/components/ui/Skeleton.tsx`:
```tsx
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-md bg-muted h-4 w-full mb-3',
            className
          )}
        />
      ))}
    </>
  )
}

export function FormSkeleton() {
  return (
    <div className="form-skeleton" aria-busy="true" aria-label="Loading form...">
      <Skeleton className="h-6 w-48 mb-6" />
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-12 w-3/4 mb-8" />
      <Skeleton className="h-11 w-40" />
    </div>
  )
}

export function EstimateSkeleton() {
  return (
    <div className="estimate-skeleton" aria-busy="true" aria-label="Calculating your estimate...">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-14 w-56 mb-6" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-4/6 mb-8" />
    </div>
  )
}
```

**Step 4 — Replace all "Loading…" text instances**

Search the codebase for loading states:
```bash
grep -r "Loading" src/ --include="*.tsx" --include="*.ts"
grep -r "loading" src/ --include="*.tsx" | grep -i "return\|text\|<p"
```

Replace each with the appropriate skeleton component.

**Step 5 — Add API timeout wrapper**

`src/lib/fetchWithTimeout.ts`:
```ts
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw err
  }
}
```

Use `fetchWithTimeout` everywhere the app calls `/api/*` routes.

**Acceptance Criteria:**
- [ ] Global `error.tsx` catches unhandled errors on all routes
- [ ] Each major route has a local error boundary with recovery CTA
- [ ] No "Loading…" text anywhere in the app — replaced with skeleton UI
- [ ] All API calls use `fetchWithTimeout` with 8-second limit
- [ ] Timeout state shows: "This is taking longer than usual. [Try again] or [Contact us]"

---

## ISSUE #4 — [Audit] [P1] Consolidate homepage CTAs — reduce decision paralysis at entry

**Labels:** `Audit` `ux` `P1` `conversion` `homepage`
**Assignee:** AI Agent
**Milestone:** Sprint 1

### Problem
The homepage presents 4 equally-weighted seller paths simultaneously. Users — especially first-time Qatar platform users — experience decision paralysis. The "Popular" badge on "Sell my car fast" is too subtle to create a clear primary action.

### AI Agent Instructions

**Context:** File is likely `src/app/page.tsx` or `src/components/homepage/HeroSection.tsx`.

**Step 1 — Restructure CTA hierarchy**

Replace the 4-equal-card grid with this hierarchy:

```tsx
function HeroCTA() {
  return (
    <div className="hero-cta-section">
      {/* PRIMARY — Full width, dominant */}
      <a href="/urgent-sale" className="cta-primary">
        <div className="cta-primary-inner">
          <div className="cta-icon-large">⚡</div>
          <div className="cta-text">
            <span className="cta-label">Most Popular</span>
            <h2>Sell My Car Fast</h2>
            <p>Get dealer offers within hours. Set your price. Accept the best offer.</p>
          </div>
          <div className="cta-arrow">→</div>
        </div>
      </a>

      {/* SECONDARY — Smaller, 3 options in a row */}
      <div className="cta-secondary-label">Or choose a specific goal:</div>
      <div className="cta-secondary-grid">
        <a href="/valuation" className="cta-secondary">
          <span>💡</span>
          <span>Know My Car Value</span>
        </a>
        <a href="/trade-in" className="cta-secondary">
          <span>🔄</span>
          <span>Trade In My Car</span>
        </a>
        <a href="/buy-request" className="cta-secondary">
          <span>🔍</span>
          <span>Find My Next Car</span>
        </a>
      </div>
    </div>
  )
}
```

**Step 2 — Update styles**

Primary CTA:
```css
.cta-primary {
  display: block;
  background: linear-gradient(135deg, #1a3a2a, #0f2a1f);
  border: 2px solid #4dff91;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 16px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(77, 255, 145, 0.15);
}
.cta-primary-inner {
  display: flex;
  align-items: center;
  gap: 20px;
}
.cta-label {
  background: #4dff91;
  color: #000;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 3px 10px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 6px;
}
```

Secondary CTAs:
```css
.cta-secondary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.cta-secondary {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--muted);
  transition: border-color 0.15s, color 0.15s;
}
.cta-secondary:hover {
  border-color: var(--accent);
  color: var(--text);
}
```

**Step 3 — Mobile responsiveness**

```css
@media (max-width: 640px) {
  .cta-secondary-grid {
    grid-template-columns: 1fr;
  }
  .cta-primary-inner {
    flex-direction: column;
    text-align: center;
  }
}
```

**Acceptance Criteria:**
- [ ] Single dominant primary CTA ("Sell My Car Fast") is visually dominant above the fold
- [ ] 3 secondary options are clearly de-emphasized but accessible
- [ ] "Most Popular" badge is high-contrast and immediately visible
- [ ] Mobile layout stacks correctly
- [ ] All 4 routes still accessible (no user journey removed)

---

## ISSUE #5 — [Audit] [P1] Fix navbar — remove duplicate CTAs and dead "New Cars" link

**Labels:** `Audit` `bug` `P1` `frontend` `nav`
**Assignee:** AI Agent
**Milestone:** Sprint 1

### Problem
1. The navbar contains "Sell My Car" as both a text link AND a button — identical destination, redundant noise
2. "New Cars" links to `/cars` which is a stub/unbuilt page — erodes trust when it 404s or shows empty content

### AI Agent Instructions

**File:** `src/components/layout/Navbar.tsx` (or similar)

**Step 1 — Remove the text-link "Sell My Car" from nav links**

Current (approximate):
```tsx
<nav>
  <a href="/valuation">Sell My Car</a>        {/* ← REMOVE THIS */}
  <a href="/cars">New Cars</a>                 {/* ← REMOVE OR REPLACE */}
  <span>For Dealers</span>
  <a href="/login">Sign In</a>
  <a href="/valuation" className="btn-primary">Sell My Car</a>  {/* ← KEEP */}
</nav>
```

Updated:
```tsx
<nav>
  <a href="/how-it-works">How It Works</a>
  <a href="/for-dealers">For Dealers</a>
  <a href="/login">Sign In</a>
  <a href="/urgent-sale" className="btn-primary">Sell My Car</a>
</nav>
```

**Step 2 — Replace /cars with /how-it-works**

The 5-step section on the homepage IS the "how it works" content. Create `src/app/how-it-works/page.tsx` that mirrors and expands on the homepage 5-step section. Link it from nav.

**Step 3 — Update primary nav CTA destination**

The primary nav button should go to `/urgent-sale` (the most popular path), not `/valuation`. Update the href accordingly.

**Step 4 — Verify /cars page**

```bash
# Check if /cars has real content
curl -s https://instaoffer.vercel.app/cars | grep -i "loading\|no cars\|coming soon"
```

If `/cars` is empty or stub, remove the link from footer as well. Add a `<!-- TODO: restore when /cars is built -->` comment.

**Acceptance Criteria:**
- [ ] Only one "Sell My Car" CTA in navbar (the button)
- [ ] "New Cars" link removed until /cars page is built with real content
- [ ] "How It Works" added to navbar linking to /how-it-works
- [ ] Nav CTA button routes to /urgent-sale
- [ ] No 404 links in navbar on any route

---

## ISSUE #6 — [Audit] [P1] Add inline privacy microcopy to phone field in all forms

**Labels:** `Audit` `ux` `P1` `trust` `conversion`
**Assignee:** AI Agent
**Milestone:** Sprint 1

### Problem
Trust signals ("Phone number stays private") are only on the homepage. At the critical moment when a user is asked for their phone number in the valuation or urgent sale form, there is no reassurance inline. This is a major conversion drop-off point.

### AI Agent Instructions

**Step 1 — Create a reusable PhoneInput component**

`src/components/ui/PhoneInput.tsx`:
```tsx
'use client'
import { useState } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export default function PhoneInput({ value, onChange, required }: PhoneInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="phone-input-wrapper">
      <label htmlFor="phone">Your Phone Number</label>
      
      <div className={`phone-field ${focused ? 'focused' : ''}`}>
        <span className="phone-prefix">🇶🇦 +974</span>
        <input
          id="phone"
          type="tel"
          placeholder="3X XXX XXXX"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          pattern="[0-9]{8}"
          maxLength={8}
        />
      </div>

      {/* Privacy reassurance — always visible, not just on hover */}
      <div className="phone-privacy-note">
        <span className="lock-icon">🔒</span>
        <span>
          Your number is <strong>never shown to dealers</strong> unless you personally approve their contact request.
          <a href="/privacy" className="privacy-link"> How this works →</a>
        </span>
      </div>

      {/* WhatsApp option */}
      <div className="whatsapp-option">
        <input type="checkbox" id="whatsapp-ok" defaultChecked />
        <label htmlFor="whatsapp-ok">
          Dealers can also reach me on WhatsApp (recommended in Qatar)
        </label>
      </div>
    </div>
  )
}
```

**Step 2 — Apply styles**

```css
.phone-privacy-note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: rgba(77, 255, 145, 0.06);
  border: 1px solid rgba(77, 255, 145, 0.2);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 8px;
  font-size: 13px;
  color: #b0b0cc;
  line-height: 1.5;
}

.phone-privacy-note strong { color: #e8e8f0; }
.privacy-link { color: #4dff91; text-decoration: none; }
.privacy-link:hover { text-decoration: underline; }

.whatsapp-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 13px;
  color: #b0b0cc;
}
```

**Step 3 — Replace all phone input instances**

Find all phone inputs in the codebase:
```bash
grep -r "type=\"tel\"\|name=\"phone\"\|id=\"phone\"" src/ --include="*.tsx"
```

Replace each with `<PhoneInput />`.

**Acceptance Criteria:**
- [ ] PhoneInput component created with privacy note always visible (not hover-dependent)
- [ ] Privacy note appears in: valuation form, urgent sale form, trade-in form
- [ ] WhatsApp opt-in checkbox included (checked by default)
- [ ] Qatar +974 prefix shown in the input
- [ ] Privacy note links to /privacy page

---

## ISSUE #7 — [Audit] [P1] Build dealer pricing table on /for-dealers page

**Labels:** `Audit` `ux` `P1` `dealer` `conversion`
**Assignee:** AI Agent
**Milestone:** Sprint 2

### Problem
The dealer section mentions "Only 1,000 QAR / month" but shows no feature list, no plan comparison, no trial offer, and no registration CTA. Dealers won't convert without knowing what they get.

### AI Agent Instructions

**File:** `src/app/for-dealers/page.tsx` or the dealer section component.

**Step 1 — Add pricing table component**

```tsx
function DealerPricingTable() {
  const features = [
    { label: 'Real-time urgent seller alerts', included: true },
    { label: 'Market estimate per listing (buy low, sell high)', included: true },
    { label: 'Opportunity score (0–100) per vehicle', included: true },
    { label: 'Margin visibility before bidding', included: true },
    { label: 'Direct bid submission', included: true },
    { label: 'Seller contact (post-approval)', included: true },
    { label: 'Acquisition analytics dashboard', included: true },
    { label: 'Unlimited listings per month', included: true },
    { label: 'Dealer profile page', included: true },
    { label: 'Priority listing alerts (coming soon)', included: false },
  ]

  return (
    <div className="pricing-section">
      <div className="pricing-card featured">
        <div className="pricing-badge">Dealer Access</div>
        <div className="pricing-amount">
          <span className="price">1,000</span>
          <span className="currency">QAR</span>
          <span className="period">/month</span>
        </div>
        <p className="pricing-tagline">First 30 days free. Cancel anytime.</p>

        <ul className="feature-list">
          {features.map(f => (
            <li key={f.label} className={f.included ? 'included' : 'excluded'}>
              <span className="check">{f.included ? '✓' : '○'}</span>
              {f.label}
              {!f.included && <span className="soon-badge">Soon</span>}
            </li>
          ))}
        </ul>

        <a href="/dealer-signup" className="btn-dealer-cta">
          Start Free 30-Day Trial →
        </a>
        <p className="no-card">No credit card required for trial</p>
      </div>

      <div className="pricing-comparison">
        <h4>vs. the alternatives</h4>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>InstaOffer</th>
              <th>Mzad / OLX</th>
              <th>Cold Calling</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Motivated sellers only</td><td>✓</td><td>✗</td><td>✗</td></tr>
            <tr><td>Margin visibility</td><td>✓</td><td>✗</td><td>✗</td></tr>
            <tr><td>Instant alerts</td><td>✓</td><td>✗</td><td>✗</td></tr>
            <tr><td>Monthly cost</td><td>1,000 QAR</td><td>Per listing</td><td>Time + labor</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Step 2 — Add dealer registration CTA**

```tsx
function DealerRegistrationCTA() {
  return (
    <div className="dealer-reg-cta">
      <h2>Ready to acquire smarter?</h2>
      <p>Join 30+ verified Qatar dealers already using InstaOffer.</p>
      <div className="cta-buttons">
        <a href="/dealer-signup" className="btn-primary">Apply as a Dealer →</a>
        <a href="https://wa.me/97430000000?text=Hi, I'm interested in becoming an InstaOffer dealer"
           className="btn-whatsapp" target="_blank">
          💬 Chat on WhatsApp
        </a>
      </div>
      <p className="dealer-note">We verify all dealers before granting access. Approval takes 24–48 hours.</p>
    </div>
  )
}
```

**Step 3 — Create /dealer-signup route**

```tsx
// src/app/dealer-signup/page.tsx
// Simple form: Business name, CR number, WhatsApp, email, vehicle specialization
// On submit → POST /api/dealer-applications → notify admin via email
// Show confirmation: "We'll review your application within 24 hours"
```

**Acceptance Criteria:**
- [ ] Pricing table with 10 feature items visible on /for-dealers
- [ ] Comparison table vs Mzad/OLX/cold calling
- [ ] "Start Free 30-Day Trial" CTA prominent
- [ ] WhatsApp contact option for dealers who prefer to call first
- [ ] /dealer-signup route created with basic application form
- [ ] Confirmation screen after dealer application submission

---

## ISSUE #8 — [Audit] [P2] Add Arabic language support — language toggle EN/عربي

**Labels:** `Audit` `i18n` `P2` `localization` `accessibility`
**Assignee:** AI Agent
**Milestone:** Sprint 3

### Problem
The platform targets Qatar's car market but is English-only. A significant portion of Qatar's used car sellers communicate primarily in Arabic. Missing this audience limits TAM.

### AI Agent Instructions

**Step 1 — Set up next-intl or i18next**

```bash
npm install next-intl
```

**Step 2 — Create translation files**

`messages/en.json`:
```json
{
  "hero": {
    "title": "What do you want to do today?",
    "subtitle": "Choose your goal — we'll route you into the right experience."
  },
  "cta": {
    "sellFast": "Sell My Car Fast",
    "sellFastDesc": "Get dealer offers within hours, not weeks.",
    "getValuation": "Get My Free Valuation",
    "knowValue": "Know My Car Value"
  },
  "trust": {
    "phonePrivate": "Phone number stays private",
    "nonBinding": "Non-binding offers",
    "freeForSellers": "Free to use",
    "noSignup": "No sign-up to get estimate"
  },
  "nav": {
    "howItWorks": "How It Works",
    "forDealers": "For Dealers",
    "signIn": "Sign In",
    "sellMyCar": "Sell My Car"
  }
}
```

`messages/ar.json`:
```json
{
  "hero": {
    "title": "ماذا تريد أن تفعل اليوم؟",
    "subtitle": "اختر هدفك — سنوجهك إلى التجربة المناسبة."
  },
  "cta": {
    "sellFast": "بيع سيارتي بسرعة",
    "sellFastDesc": "احصل على عروض من التجار خلال ساعات، لا أسابيع.",
    "getValuation": "احصل على تقييم مجاني",
    "knowValue": "اعرف قيمة سيارتي"
  },
  "trust": {
    "phonePrivate": "رقم هاتفك يبقى خاصاً",
    "nonBinding": "عروض غير ملزمة",
    "freeForSellers": "مجاني للبائعين",
    "noSignup": "لا تسجيل للحصول على التقييم"
  },
  "nav": {
    "howItWorks": "كيف يعمل",
    "forDealers": "للتجار",
    "signIn": "تسجيل الدخول",
    "sellMyCar": "بيع سيارتي"
  }
}
```

**Step 3 — Add language toggle to navbar**

```tsx
'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en'
    router.push(`/${newLocale}${pathname}`)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="lang-toggle"
      aria-label="Toggle language"
    >
      {locale === 'en' ? 'عربي' : 'EN'}
    </button>
  )
}
```

**Step 4 — Add RTL support**

In `src/app/layout.tsx`:
```tsx
import { useLocale } from 'next-intl'

export default function RootLayout({ children }) {
  const locale = useLocale()
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  )
}
```

Add RTL CSS:
```css
[dir="rtl"] .nav-item { flex-direction: row-reverse; }
[dir="rtl"] .cta-arrow { transform: scaleX(-1); }
[dir="rtl"] .phone-prefix { border-radius: 0 8px 8px 0; }
```

**Scope for this issue:** Homepage, navbar, valuation form Step 1, trust badges. Full app translation is a follow-up issue.

**Acceptance Criteria:**
- [ ] Language toggle (EN / عربي) visible in navbar
- [ ] Homepage hero, CTAs, trust badges translated to Arabic
- [ ] Valuation form Step 1 labels translated
- [ ] `dir="rtl"` applied to `<html>` when Arabic is selected
- [ ] RTL layout doesn't break existing component structure

---

## ISSUE #9 — [Audit] [P2] Build /my-offers unauthenticated empty state

**Labels:** `Audit` `ux` `P2` `empty-states` `funnel`
**Assignee:** AI Agent
**Milestone:** Sprint 2

### Problem
`/my-offers` currently dead-ends unauthenticated users with a login redirect and no explanation of what "offers" are or why they should create an account. This is a missed funnel opportunity.

### AI Agent Instructions

**File:** `src/app/my-offers/page.tsx`

**Step 1 — Add auth check with graceful unauthenticated state**

```tsx
import { getServerSession } from 'next-auth' // or your auth provider

export default async function MyOffersPage() {
  const session = await getServerSession()

  if (!session) {
    return <UnauthenticatedOffersState />
  }

  return <AuthenticatedOffersView userId={session.user.id} />
}

function UnauthenticatedOffersState() {
  return (
    <div className="empty-state-page">
      <div className="empty-illustration">
        {/* SVG illustration of offer cards */}
        <div className="mock-offer-card blurred">
          <div className="mock-offer-inner">
            <span className="mock-dealer">Al Meera Cars</span>
            <span className="mock-amount">285,000 QAR</span>
            <span className="mock-badge">Best Offer</span>
          </div>
        </div>
        <div className="mock-offer-card blurred offset">
          <div className="mock-offer-inner">
            <span className="mock-dealer">Qatar Premium Auto</span>
            <span className="mock-amount">271,000 QAR</span>
          </div>
        </div>
        <div className="blur-overlay">
          <span className="lock-icon">🔒</span>
        </div>
      </div>

      <h2>You don't have any offers yet</h2>
      <p>Get a free valuation and request dealer offers — it takes less than 5 minutes.</p>

      <div className="empty-state-steps">
        <div className="step">
          <span className="step-num">1</span>
          <span>Enter your car details</span>
        </div>
        <div className="step-arrow">→</div>
        <div className="step">
          <span className="step-num">2</span>
          <span>Get your instant estimate</span>
        </div>
        <div className="step-arrow">→</div>
        <div className="step">
          <span className="step-num">3</span>
          <span>Dealers compete to buy your car</span>
        </div>
      </div>

      <a href="/urgent-sale" className="btn-primary cta-large">
        Get My First Offer — Free →
      </a>
      <p className="no-account-note">No account needed to get your estimate</p>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Unauthenticated /my-offers shows a teaser state (not a redirect)
- [ ] Blurred mock offer cards visible to show what they're missing
- [ ] Clear CTA routes to /urgent-sale
- [ ] "No account needed to get estimate" note included
- [ ] Authenticated state still shows real offers for logged-in users

---

## ISSUE #10 — [Audit] [P2] Add WhatsApp contact option throughout seller funnel

**Labels:** `Audit` `ux` `P2` `localization` `Qatar`
**Assignee:** AI Agent
**Milestone:** Sprint 2

### Problem
Qatar's market overwhelmingly uses WhatsApp for business communication. The current funnel uses email/form-only contact, which has significantly lower response rates and trust in this market.

### AI Agent Instructions

**Step 1 — Add WhatsApp CTA to confirmation screens**

After a seller submits a valuation or urgent sale listing:
```tsx
function ConfirmationScreen({ listing }) {
  const waMessage = encodeURIComponent(
    `Hi InstaOffer, I just listed my ${listing.year} ${listing.make} ${listing.model}. Listing ID: ${listing.id}`
  )
  const waUrl = `https://wa.me/97430000000?text=${waMessage}`

  return (
    <div className="confirmation">
      <div className="success-icon">✅</div>
      <h2>Your listing is live!</h2>
      <p>Dealers are being notified now. Expect offers within 24 hours.</p>

      <div className="next-steps">
        <a href={waUrl} target="_blank" className="btn-whatsapp">
          💬 Get updates on WhatsApp
        </a>
        <a href="/my-offers" className="btn-secondary">
          View My Offers →
        </a>
      </div>

      <p className="whatsapp-note">
        We'll send you a WhatsApp message when dealers respond. Much faster than email.
      </p>
    </div>
  )
}
```

**Step 2 — Add WhatsApp to dealer contact flow**

When a seller approves a dealer's contact request:
```tsx
// Instead of revealing email, offer WhatsApp intro
function ApproveContactModal({ dealer, listing }) {
  const waIntro = encodeURIComponent(
    `Hi ${dealer.name}, I'm the seller of the ${listing.year} ${listing.make} ${listing.model} on InstaOffer (ID: ${listing.id}). Let's discuss.`
  )

  return (
    <div className="approve-modal">
      <h3>Connect with {dealer.name}</h3>
      <p>Choose how you'd like {dealer.name} to reach you:</p>
      <a href={`https://wa.me/${dealer.whatsapp}?text=${waIntro}`} className="btn-whatsapp">
        💬 WhatsApp {dealer.name}
      </a>
      <button className="btn-secondary">Share my phone number instead</button>
    </div>
  )
}
```

**Step 3 — Add WhatsApp support button (site-wide)**

In the global layout footer or floating button:
```tsx
function WhatsAppSupportButton() {
  return (
    <a
      href="https://wa.me/97430000000?text=Hi, I need help with InstaOffer"
      target="_blank"
      className="wa-support-fab"
      aria-label="Chat with InstaOffer support on WhatsApp"
    >
      💬
      <span className="wa-tooltip">Need help? Chat with us</span>
    </a>
  )
}
```

**Acceptance Criteria:**
- [ ] WhatsApp CTA on listing confirmation screen
- [ ] WhatsApp option in dealer contact approval flow
- [ ] Floating WhatsApp support button on all pages
- [ ] WhatsApp messages pre-filled with relevant listing context
- [ ] Qatar +974 number used throughout (update placeholder with real number before launch)

---

## Summary Table

| # | Issue | Priority | Label | Milestone |
|---|-------|----------|-------|-----------|
| 1 | Fix /valuation SSR — blank "Loading…" | P0 Critical | `Audit` `bug` | Sprint 1 |
| 2 | Build /urgent-sale page content | P0 Critical | `Audit` `bug` | Sprint 1 |
| 3 | Global error boundaries + skeleton states | P0 Critical | `Audit` `bug` | Sprint 1 |
| 4 | Consolidate homepage CTAs | P1 High | `Audit` `ux` | Sprint 1 |
| 5 | Fix navbar — remove duplicate CTAs | P1 High | `Audit` `bug` | Sprint 1 |
| 6 | Inline phone privacy microcopy | P1 High | `Audit` `ux` | Sprint 1 |
| 7 | Dealer pricing table + registration CTA | P1 High | `Audit` `ux` | Sprint 2 |
| 8 | Arabic language toggle | P2 Medium | `Audit` `i18n` | Sprint 3 |
| 9 | /my-offers unauthenticated empty state | P2 Medium | `Audit` `ux` | Sprint 2 |
| 10 | WhatsApp integration throughout funnel | P2 Medium | `Audit` `Qatar` | Sprint 2 |
