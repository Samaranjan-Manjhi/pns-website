# P.N.S. Enterprises website

A fast, free-to-host static website. No database, no server, no monthly cost.

```
pns-website/
  index.html            page content (text, phone numbers, address)
  css/style.css         design
  images/gallery/<product>/   YOUR PHOTOS: one folder per product
  videos/<product>.txt        YOUR VIDEOS: YouTube links, one per line
  js/gallery-data.js          built automatically from the two above (do not edit)
  js/main.js                  behavior (leave alone)
  images/products/            ONE picture per product for the "What we make" list
  scripts/build-gallery.js    the builder that GitHub runs on every push
  scripts/optimize-images.js  shrinks big photos (GitHub runs it on every push)
  .github/workflows/          tells GitHub to run the builder
```

## 1. Preview on your computer

Open `index.html` in a browser. Or, for exact behavior:

```
cd pns-website
python3 -m http.server 8000
# open http://localhost:8000
```

## 2. Check these details before going live

Open `index.html` and search for each one.

| What | Search for | Note |
|---|---|---|
| WhatsApp number | `917666480080` | Appears 21 times. Use find and replace. Format: 91 + 10 digits, no spaces or +. Make sure this number has WhatsApp. |
| Phone numbers | `76664 80080`, `86526 76892` | Shown in the hero, contact section and `tel:` links. |
| Email | `p.n.s.enterprises001@gmail.com` | Appears in the contact section and search-engine data. |
| Address | `Barkya Rama Compound` | Copied from your tax invoice. Appears in the contact section and search-engine data. |
| Areas you serve | `areaServed` | Search-engine data near the top. Keep only areas you really serve. |
| Map | `maps?q=` | Once your Google Business Profile is live, replace the map link with the exact "Share > Embed a map" link from Google Maps. |

The text "made to fit your window", "GST-registered manufacturer" and "tax invoice on every order" comes from your invoice and business. Remove any line that is not true for you.

## 3. Add your photos and videos (no code editing)

**Photos.** Drop the file into the folder for that product, then push to GitHub:

| Folder inside `images/gallery/` | Section on the website |
|---|---|
| `motorized` | Motorized curtains and blinds |
| `curtains` | Curtains |
| `roller` | Roller blinds |
| `roman` | Roman blinds |
| `vertical` | Vertical blinds |
| `honeycomb` | Honeycomb blinds |
| `chick` | PVC and wooden chick blinds |
| `skylight` | Skylight blinds |
| `awning` | Awnings |
| `film` | Sun control and decorative film |
| `repair` | Repairs |

- Newest photos show first. The first 9 show, with a "Show all" button for the rest.
- The file name becomes the caption: `roller-blinds-bedroom-kandivali.webp` shows as "Roller blinds bedroom kandivali". Camera names like `IMG_9384.jpg` show no caption. Avoid spaces in file names.
- Compress first (free: squoosh.app). Under 300 KB each keeps the site fast.
- Need a new section? Create a new folder inside `images/gallery/` (for example `wallpaper`). It appears automatically.

**Videos.** Upload to YouTube, then open `videos/<product>.txt` (for example `videos/roller.txt`) and paste the link on a new line. Normal links, `youtu.be` links and Shorts links all work. Add a title after a `|` sign if you like:

```
https://www.youtube.com/watch?v=AbC123xyz89 | Roller blind in a 2 BHK
https://www.youtube.com/shorts/AbC123xyz89
```

Never put video files in the site. They are too big for free hosting.

**What visitors see.** Each product with photos gets a block in "Our work". Under its photos is a link to that product's videos. All videos also sit together in the "Videos" block below. Products with nothing yet stay hidden.

**How it updates.** When you push, GitHub runs `.github/workflows/gallery.yml`, which rebuilds `js/gallery-data.js` and commits it. Wait about a minute, then run `git pull` before your next change so you have the bot's update. For this to work, go to your repository Settings, Actions, General, Workflow permissions, and choose "Read and write permissions".

**Product pictures ("What we make").** Put one picture per product in `images/products/`, named after the product: `motorized`, `curtains`, `roller`, `roman`, `vertical`, `honeycomb`, `chick`, `skylight`, `awning`, `film` (jpg, png or webp, lowercase, no spaces). Square pictures about 400 x 400 px look best. A product with no picture keeps its drawn pattern.

**Big photos shrink automatically.** On every push GitHub resizes photos to at most 1600 px, compresses them, fixes sideways phone photos and removes hidden GPS data. Keep your original photos on your computer, because the copy in the repo is replaced by the small one.

**To preview on your computer** (needs Node.js): run `node scripts/build-gallery.js`, then open `index.html`.

Get permission from the customer before you post photos of their home.

## 4. Put it online for free

**Option A: Cloudflare Pages (recommended)**
1. Create a free GitHub account and upload this folder as a new repository.
2. Create a free Cloudflare account, go to Workers & Pages, create a Pages project and connect your GitHub repository.
3. Framework: None. Build command: leave empty. Output directory: `/` (leave as root).
4. Deploy. You get a free `something.pages.dev` link. Every time you push a change to GitHub, the site updates by itself.

**Option B: GitHub Pages.** Repository Settings, Pages, deploy from the main branch.

**Option C: Netlify Drop.** Drag the folder into app.netlify.com/drop for a quick test link.

Free hosts change their menus now and then. If a step looks different, search for "deploy static site on [host name]".

## 5. After it is live

1. Add the website link to your Google Business Profile, Instagram bio, WhatsApp Business profile and your next visiting card.
2. Add the site to Google Search Console (free) and submit the link so Google finds it.
3. Update the gallery every week or two. Fresh work is the best sales tool you have.
4. A `.in` domain (roughly Rs 500 to 800 a year) looks far more trustworthy than a `.pages.dev` link. Worth buying once you have steady enquiries. Cloudflare Pages lets you connect it.

## Not included on purpose

- A contact form. On mobile, customers prefer WhatsApp and calling. Forms add spam and something to maintain.
- Your GST number, bank details or prices. Add the GSTIN to the footer if you want it shown. Keep bank details off the site.
- A Google review button. Once your Google Business Profile is verified, copy its review link and add a button in the contact section.
