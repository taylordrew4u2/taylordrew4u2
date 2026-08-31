# Launch checklist

What's left, in the order it has to happen. Tick as you go.

**⚠️** marks the steps that break something if you skip them or do them out of
order. Everything else is safe to do whenever.

The domain move is **Part 4** — deliberately last. Parts 1–3 all happen on the
Vercel URL while `pinsandneedlescomedy.com` keeps serving Shopify, untouched.

---

## Part 1 — Make it save (15 minutes)

### ☐ 1. Merge the open pull request

**https://github.com/taylordrew4u2/taylordrew4u2/pull/2**

Click **Ready for review**, then **Squash and merge** → **Confirm**.

Vercel starts a production deploy the moment it lands.

---

### ☐ 2. Add three environment variables

**https://vercel.com/taylordrew4u2s-projects/taylordrew4u2** → **Settings** →
**Environment Variables**. Tick all three boxes (Production, Preview,
Development) on each:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://pinsandneedlescomedy.com` |
| `ADMIN_SECRET` | a long random string — see below |
| `ADMIN_PASSWORD` | `weed`, or something better |

**Set `NEXT_PUBLIC_SITE_URL` to the real domain now, even though it still
points at Shopify.** That's intentional — see step 6.

**For `ADMIN_SECRET`:** run `openssl rand -hex 32` in a terminal. No terminal?
Open any browser's dev console (F12) and run:

```js
crypto.randomUUID() + crypto.randomUUID()
```

Paste the result. It only needs to be long and random — you never type it
again. Skipping it logs you out of `/admin` on every deploy.

---

### ⚠️ ☐ 3. Set up storage — nothing saves without this

Vercel's servers have a read-only disk. Without a content store, `/admin` looks
completely normal — loads, logs you in, lets you type — and then throws away
everything you write. This is where your text and every uploaded image actually
lives.

Pick **one** of these two. Both are free.

#### Option A — GitHub (free, no card, keeps every version)

Nothing new to sign up for, and every save becomes a commit you can look back
through.

1. **github.com/new** → name it `pins-needles-content` → tick **Private** →
   tick **Add a README file** → **Create repository**.
   ⚠️ It has to be a *different* repo from this site's, or every autosave
   would kick off a new deployment. Keep it **private** — the file it stores
   holds your Instagram token.
2. **github.com/settings/tokens?type=beta** → **Generate new token**.
   - Token name: anything, e.g. `pins-needles-site`
   - Expiration: **No expiration** (or set a reminder to replace it)
   - Repository access: **Only select repositories** → pick
     `pins-needles-content`
   - Permissions → **Repository permissions** → **Contents** → **Read and
     write**
   - **Generate token**, then copy it — GitHub shows it once.
3. In Vercel → **Settings** → **Environment Variables**, add two, all three
   boxes ticked:

   | Key | Value |
   | --- | --- |
   | `CONTENT_GITHUB_TOKEN` | the token you just copied |
   | `CONTENT_GITHUB_REPO` | `your-username/pins-needles-content` |

#### Option B — Vercel Blob

Same project → the **Storage** tab at the top → **Create Database** → **Blob**
→ **Continue** → name it anything → **Create** → **Connect to Project**.

Simpler if it works for your account; Vercel sometimes asks for a payment
method before it will create one, which is why Option A exists.

---

### ☐ 4. Redeploy

**Deployments** → top entry → **⋯** → **Redeploy** → **Redeploy**.

Environment variables and storage don't apply to a build that already finished.
Skip this and steps 2 and 3 have had no effect yet.

Wait for the green **Ready**.

---

### ⚠️ ☐ 5. Confirm saving actually works — do not skip

1. Open the Vercel URL with `/admin` on the end.
2. Log in.
3. **Is there an orange banner** about saving? Read it — it names the problem.
   - "no content store" → step 3 was skipped or the variables are missing.
   - "could not be read" → the store is configured but not answering. For
     GitHub: check the token has **Contents: Read and write** on that exact
     repo and hasn't expired. For Blob: check the store is still connected.
   - Fix it, redo step 4, and check again.
   - **No banner** → good.
4. Change any text field. The header should flash **Saving…** then **Saved**.
5. Refresh. Your change should still be there.

Everything after this is you typing content in. Find out now, not after an hour
of work.

---

## Part 2 — One thing to know before you start

### ☐ 6. Why Google can't see the Vercel URL (nothing to do — just read this)

While the site is on its `.vercel.app` address it serves `noindex` and a
`robots.txt` that blocks everything. That's on purpose. It's the same pages
that will live at pinsandneedlescomedy.com, and if Google indexed this copy it
would compete with the real domain later.

The site decides this by comparing the address in the browser to
`NEXT_PUBLIC_SITE_URL`. **The day DNS moves, it becomes fully crawlable by
itself.** No setting to remember, nothing to switch.

So: if you check the page source and see `noindex`, that's correct, not broken.

---

## Part 3 — Fill in your content

All at `/admin`. It saves as you type — there's no save button.

### ⚠️ ☐ 7. Set the blog cover shape FIRST

**News** tab → **Cover orientation (all posts)** → pick 9:16 tall, 4:5
portrait, 1:1 square, 3:2 or 16:9 wide. It's on 4:5 now.

**Before you upload any covers.** The cropper matches whatever is selected, so
changing it later means re-cropping everything you'd already done.

The existing 31 covers came across at full size and are cropped by CSS, so they
follow this setting automatically — it's only *your* uploads that get baked to
the shape.

Same tab: card width, gap, corner radius, and the title's font, size, weight,
padding, alignment, case, colour and overlay darkness.

---

### ☐ 8. Add the reels

**Reels** tab. Empty right now — both home-page grids show a "Watch on
Instagram" band until you add some.

**Read this first:** each tile plays a video file hosted on this site, not an
Instagram embed. Instagram's own embed won't autoplay silently and drags in
its own header and caption, which wrecks the edge-to-edge grid. Clicking a
tile still opens the real Instagram post either way.

**Fastest way — pull everything from @pinsandneedlescomedy automatically:**

**Reels** tab → **Instagram sync** panel at the top. It logs in through a real
Instagram screen — no token to copy anywhere — but getting there needs a
one-time setup only the account owner can do, since Meta requires the account
owner to approve API access for anyone:

1. Switch the Instagram account to Professional (Business or Creator) —
   free, in the Instagram app under **Settings → Account type**.
2. Create a free app at **developers.facebook.com**, add the Instagram
   product to it, and set its OAuth redirect URI to
   `https://pinsandneedlescomedy.com/api/admin/instagram/callback`.
3. On that same app, add the Instagram account as a tester — the app can
   stay in Development mode, no review needed for just your own account.
4. Copy the app's **App ID** and **App Secret** into Vercel → **Settings →
   Environment Variables** as `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`,
   then redeploy.
5. Back in `/admin` → **Reels**, click **Log in with Instagram**, approve on
   Instagram's own screen, and you're back here connected.
6. Click **Sync all reels from Instagram**. It downloads every reel's video
   and keeps going until it's pulled the whole account, then stops.

The connection lasts about 60 days; every sync refreshes it automatically, so
step 4 onward only ever needs doing once. Click the sync button again any
time to pick up new posts — it only ever adds reels it hasn't seen yet, so a
manual reorder or a hidden reel is never touched.

**Or add one manually** — useful for a single video that isn't on the
Instagram account at all:

1. **Paste the Instagram permalink** (`https://www.instagram.com/reel/...`).
   Bulk-paste a whole list at once in the box further down the tab.
2. **Upload the video** — your original export, or the reel downloaded from
   Instagram.
3. **Poster frame** (optional) — the still shown while the video loads.
4. **Alt text** — one sentence on what's in it.

---

### ☐ 9. Producer headshots

**About Us** → **Producers**. Taylor Drew and Justin Hartmann are there with
bios; the headshots are empty. Upload one each (square crop) and rewrite the
bios however you like — I drafted them from the live site's About page.

---

### ☐ 10. Add the rest of the logos

**About Us** → **Logo gallery** → **Add a logo** → **Upload**.

Two are in there. **The three you sent me came through as chat images, not
files, so I couldn't add them** — drag each into the uploader and it's done in
about twenty seconds:

- the tattoo machine crossed with a microphone
- the skull with two crossed mics and **STRIP DOWN FOR STAND-UP**
- the original flash circle, if your copy is cleaner than the one I pulled off
  the site

That third one carries the tagline — worth also setting as the share image
under **Site & SEO → Share image**, so it's what shows when someone posts a
link.

---

### ☐ 11. Paste in the Shopify store

**Shop** tab. `/shop` shows a dashed empty box until you do.

1. Shopify admin → **Sales channels** → **Buy Button**.
   (Missing? **Settings** → **Apps and sales channels** → **Shopify App Store**
   → search "Buy Button" → add it.)
2. **Create a Buy Button** → **Collection** → your products.
3. Pick a layout → **Next** → **Copy code**.
4. `/admin` → **Shop** → paste into **Embed code**.
5. Check `/shop` on the Vercel URL.

**Write down your `something.myshopify.com` address while you're in there.**
After the DNS moves in Part 4, that's the only route back into the Buy Button
generator.

---

### ☐ 12. Read the SEO fields (optional)

Every tab has an SEO section, and so does every post. All 31 posts already have
a meta title, description, keywords, share image and AI summary generated from
their own text.

Nothing here is required. But the **Home** and **About Us** ones are worth a
read — they're what shows in Google and in ChatGPT answers. Each field has a
character meter and a live Google preview underneath.

---

## Part 4 — When you're ready to switch the domain

Nothing above depends on this. Do it whenever.

### ☐ 13. Check who can see the site

**Settings** → **Deployment Protection**.

Protection on **preview** deployments is fine — leave it. If anything covers
**Production** or **All Deployments**, turn it off, or visitors will hit a
Vercel login instead of your site.

### ⚠️ ☐ 14. Make sure step 11 is done

The moment the DNS moves, `pinsandneedlescomedy.com` stops serving Shopify. If
the Buy Button code isn't pasted in yet, your store goes dark.

### ☐ 15. Move the DNS

**Settings** → **Domains** → **Add** → `pinsandneedlescomedy.com` → **Add**.

Vercel shows you the records. At your DNS host (possibly Shopify):

1. Point the **A record** for `@` at the IP Vercel gives you.
2. Point the **CNAME** for `www` at the value Vercel gives you.
3. Remove the old Shopify records for those two names.

10 minutes to a few hours. Vercel's Domains page goes green when the
certificate is issued.

Then load the site and view source — `noindex` should be gone. That's step 6
switching over by itself.

### ☐ 16. Tell Google it exists

1. **https://search.google.com/search-console**
2. Add `pinsandneedlescomedy.com` (verify by DNS record).
3. **Sitemaps** → submit `sitemap.xml`.

`/rss.xml` and `/llms.txt` publish themselves — the second is a plain-text
brief for AI answer engines. Nothing to do.

### ☐ 17. Last passes

- Open the real domain on your phone. Home, one post, the shop.
- If `ADMIN_PASSWORD` is still `weed`, change it and redeploy. Anyone reading
  this file knows the default.

---

## Already done — nothing needed from you

- All **31 blog posts** migrated from the live site with their original text,
  dates and cover photos. Not summaries — the actual posts.
- SEO on every page and post: meta title, description, keywords, share image,
  canonical, AI summary, FAQ. Plus sitemap, robots, RSS, `llms.txt` and
  structured data.
- The `noindex` guard in step 6.
- About Us copy, the show description and format, and both producer bios.
- 30 tests and CI running on every push.

---

## If something looks wrong

| What you see | What it is |
| --- | --- |
| Orange banner in `/admin` | Read it — it says whether no store is configured, or one is configured but not answering. Step 3, then 4. |
| `Save failed — retrying` | Storage unreachable. It retries itself; if it sticks, check the store from step 3 — a GitHub token that expired or lost its Contents permission does this. |
| Logged out after every deploy | `ADMIN_SECRET` not set. Step 2. |
| `noindex` in the page source | Correct on the Vercel URL. Step 6. |
| Reels show "Watch on Instagram" | No reels yet. Step 8. |
| A post shows a faded logo | That post has no cover. Two of the 31 never had one. |
| `/shop` shows a dashed box | No embed code. Step 11. |
| Visitors hit a Vercel login | Protection covering production. Step 13. |

Full reference in `README.md`.
