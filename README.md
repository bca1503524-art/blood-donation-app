# Blood Donation App (PWA Version)

This version is a **Progressive Web App (PWA)**. Unlike the earlier PHP+MySQL
version, it needs **no server and no database to install** — it runs entirely
in the browser and can be **installed like a real app** on any phone or PC,
without the Play Store.

## Step 3: What We Used (for your weekly report)

| Part | Technology | Why |
|---|---|---|
| Structure | HTML | The app's screens (views) |
| Styling | CSS | Layout and colors |
| Logic | JavaScript (vanilla, no framework) | All app behavior |
| Database | **Browser localStorage** | Stores users, donors, donations, requests as JSON - no server needed |
| Installability | **manifest.json** | Tells the browser this is an app (name, icon, colors) |
| Offline support | **service-worker.js** | Caches app files so it opens even without internet |

## How to Test It Right Now (on your PC)

You cannot just double-click `index.html` for the **install** feature to work
(browsers block that for security). You need to "serve" the folder locally —
takes 1 minute:

1. Install **Python** (most PCs already have it) or **VS Code** with the
   **Live Server** extension.
2. **If using Python:** open a terminal inside the `blood_donation_app` (flat version)
   folder and run:
   ```
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.
3. **If using VS Code:** right-click `index.html` → "Open with Live Server".

You'll see an **"Install"** banner at the top — click it to install the app
to your PC like a real program.

## How to Make It Installable on ANY Phone/PC (not just your PC)

To let your teacher or anyone else install it, you need to put it online
(free, no coding needed):

### Option A: Netlify Drop (easiest)
1. Go to **https://app.netlify.com/drop**
2. Drag and drop the whole `blood_donation_app` (flat version) folder onto the page
3. You instantly get a free link like `https://your-app.netlify.app`
4. Open that link on **any phone or PC** → browser will show "Add to Home
   Screen" / "Install app"

### Option B: GitHub Pages
1. Create a free GitHub account and a new repository
2. Upload all the files in this folder
3. Go to Settings → Pages → enable GitHub Pages on the `main` branch
4. You get a link like `https://yourusername.github.io/blood-donation-app`

Once hosted on either of these (both are **HTTPS**, which installable PWAs
require), anyone can open the link on their phone, tap **"Add to Home
Screen"** in the browser menu (or the Install banner this app shows), and
it behaves like a normal installed app — icon, full screen, works offline.

## Test Logins
| Role | Email | Password |
|---|---|---|
| Admin | admin@bloodapp.com | admin123 |
| Donor | ravi@mail.com | ravi123 |
| Recipient | amit@mail.com | amit123 |

## What Each File Does
- `index.html` — all app screens in one file (home, register, login, dashboards)
- `css/style.css` — styling
- `js/app.js` — data storage + all actions (register, login, log donation, submit request, verify, approve)
- `js/views.js` — switches between screens and renders tables with current data
- `manifest.json` — app name/icon/colors so it can be installed
- `service-worker.js` — caches files for offline use
- `icons/` — app icon (192px and 512px, required sizes for installable apps)

## Key Logic to Explain to Your Teacher
1. **localStorage as a database** — `localStorage.setItem()` / `getItem()` stores
   everything as a single JSON object, so no MySQL server is needed. This is
   why the app works completely offline once installed.
2. **Eligibility logic** — same 90-day rule as before, calculated in JavaScript
   using `Date` objects (`getEligibility()` in `app.js`).
3. **Loyalty Program** — a donation starts `verified: false`; only when admin
   clicks "Verify" do they get `+10` points (`verifyDonation()`).
4. **Priority Matching** — if a recipient enters a donor's email with
   `loyalty_points > 0`, their request is auto-flagged priority.
5. **Single Page App (SPA) pattern** — all screens exist in one `index.html`;
   JavaScript shows/hides `<div>` sections instead of loading new pages. This
   is why it feels instant, like a real app.
6. **PWA installability** — the combination of `manifest.json` + a registered
   `service-worker.js` + HTTPS hosting is what triggers the browser's
   "Install" prompt on any device.

## Limitations to Mention Honestly
- Data is stored **per device/browser** (not shared across devices) since
  there's no central server. For a class project this is fine and is a good
  "future scope" point: "connect to a real backend so data syncs across
  devices."
- This is **not** on the Play Store. It's a PWA — installable without an app
  store, which is a legitimate and common real-world approach (used by
  Starbucks, Twitter/X Lite, Spotify's web player, etc.) and fits what was asked:
  "can run on any mobile phone or PC."

## Future Scope (as per your proposal)
- Move data to a real backend (Firebase or the earlier PHP+MySQL version) so
  it syncs across devices
- SMS and email notifications
- GPS-based nearby donor search
- AI-based emergency donor recommendation
- Digital donor certificate generation
