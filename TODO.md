# Launch checklist

Everything left to do, in the order it has to happen. Tick as you go.

Anything marked **⚠️** breaks something if you skip it or do it out of order.

---

## Part 1 — Get the code live (15 minutes)

### ☐ 1. Merge the open pull request

Open **https://github.com/taylordrew4u2/taylordrew4u2/pull/2**

1. Click **Ready for review** (it's currently a draft).
2. Click **Squash and merge** → **Confirm squash and merge**.

This is what puts the storage bug fix, the robots fix and the "no Blob store"
warning banner into production. Vercel starts a production deploy the moment it
merges.

---

### ☐ 2. Add the three environment variables

Go to **https://vercel.com/taylordrew4u2s-projects/taylordrew4u2** →
**Settings** → **Environment Variables**.

Add each one with **all three** boxes ticked (Production, Preview, Development):

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://pinsandneedlescomedy.com` |
| `ADMIN_SECRET` | a long random string — see below |
| `ADMIN_PASSWORD` | `weed`, or whatever you'd rather use |

**For `ADMIN_SECRET`:** run `openssl rand -hex 32` in a terminal and paste the
result. No terminal? Open any browser's dev console (F12) and run:

```js
crypto.randomUUID() + crypto.randomUUID()
```

Paste that. It just needs to be long and random — you never type it again.

> Skipping `ADMIN_SECRET` doesn't break anything today, but it logs you out of
> `/admin` every time the site redeploys.

---

### ⚠️ ☐ 3. Add the Blob store — the site cannot save without this

Same project → the **Storage** tab (top of the page, next to Deployments) →
**Create Database** → choose **Blob** → **Continue** → name it anything →
**Create** → **Connect to Project**.

**Why this matters:** Vercel's servers have a read-only disk. Without a Blob
store, `/admin` looks completely normal — it loads, you log in, you type — and
then nothing you write is ever saved. This is where your text and every image
you upload actually lives.

It's free and this site will not come close to the free limit.

---

### ☐ 4. Redeploy

**Deployments** tab → the top entry → the **⋯** menu on the right →
**Redeploy** → **Redeploy**.

Environment variables and storage do **not** apply to a build that already
finished. If you skip this, steps 2 and 3 have no effect yet.

Wait for the green **Ready**.

---

### ☐ 5. Confirm saving actually works

1. Open your Vercel URL and add `/admin` to the end.
2. Log in with your password.
3. **Look for an orange banner** at the top saying saving isn't set up.
   - **Banner is there** → the Blob store isn't connected. Redo step 3, then step 4.
   - **No banner** → you're good.
4. Change any text field. Watch the top of the page: it should flash
   **Saving…** then **Saved**.
5. Refresh the page. Your change should still be there.

**Do not go further until step 5 passes.** Everything after this is you typing
content in, and you don't want to discover it isn't saving after an hour of work.

---

## Part 2 — Before you point the domain

### ☐ 6. Check who can see the site

**Settings** → **Deployment Protection**.

- Protection on **preview** deployments is fine and normal — leave it.
- If anything is set to protect **Production** or **All Deployments**, turn that
  off. Otherwise visitors to pinsandneedlescomedy.com would hit a Vercel login
  screen instead of your site.

---

### ⚠️ ☐ 7. Get your Shopify embed in BEFORE the DNS moves

`pinsandneedlescomedy.com` currently points at Shopify. The second you move the
DNS in step 8, that address stops serving your store — so bring the store over
first.

1. In **Shopify admin** → **Sales channels** → **Buy Button**.
   (Not there? **Settings** → **Apps and sales channels** → **Shopify App Store**
   → search "Buy Button" → add it.)
2. **Create a Buy Button** → **Collection** → pick your products collection.
3. Choose a layout, then **Next** → **Copy code**.
4. In your site: `/admin` → **Shop** tab → paste it into **Embed code**.
5. Open `/shop` on the Vercel URL and confirm your products appear.

**Also write down your `something.myshopify.com` URL now.** After the DNS moves,
that's the only way back into the Buy Button generator.

---

### ☐ 8. Point the domain at Vercel

**Settings** → **Domains** → **Add** → type `pinsandneedlescomedy.com` → **Add**.

Vercel shows you the DNS records to create. Go to wherever you bought the domain
(or wherever its DNS lives today — possibly Shopify) and:

1. Change the **A record** for `@` to the IP Vercel gives you.
2. Change the **CNAME** for `www` to the value Vercel gives you.
3. Delete or replace the old Shopify records for those two names.

DNS takes anywhere from 10 minutes to a few hours. Vercel's Domains page shows
a green check when it's live and the certificate is issued.

Then set `NEXT_PUBLIC_SITE_URL` (step 2) to the final address if it changed, and
redeploy once more.

---

## Part 3 — Fill in your content

All of this is at `/admin`. It saves as you type — there is no save button.

### ⚠️ ☐ 9. Set the blog cover shape FIRST

**News** tab → **Cover orientation (all posts)**.

Pick the shape you want for every blog cover: 9:16 tall, 4:5 portrait, 1:1
square, 3:2 or 16:9 wide.

**Do this before uploading any covers.** The cropper matches whatever is
selected here, so changing it later means re-uploading every cover you'd already
done.

While you're on that tab you can also set card width, title font, size, weight,
padding, alignment, case, colour and how dark the overlay behind the title sits.

---

### ☐ 10. Upload the blog covers

**News** tab → open each post → **Cover image** → **Upload**.

The cropper opens automatically. Drag to reposition, slide to zoom, then
**Use this crop**.

There are 12 posts already loaded with their real titles and text from the old
site. Right now they show a faded logo as a placeholder.

Fill in **Cover alt text** too — one short sentence describing the image. It
helps Google Images and screen readers.

---

### ☐ 11. Add the reels

**Reels** tab. Nothing is in here yet — both grids on the home page currently
collapse to a "Watch on Instagram" band.

**Read this first:** each tile plays a video file you upload, not an Instagram
embed. Instagram's own embed won't autoplay silently and drags in its own header
and caption, which wrecks the edge-to-edge grid. Clicking a tile still opens the
real Instagram post.

For each reel:

1. **Paste the Instagram permalink** (`https://www.instagram.com/reel/...`).
   You can bulk-paste a whole list at once in the box at the top.
2. **Upload the video.** Your original export is best. Otherwise download the
   reel from Instagram.
3. **Optionally upload a poster frame** — the still shown while the video loads.
4. **Alt text** — one sentence on what's in the reel.

Start with 8–12. The bottom grid keeps loading more as you scroll, so the more
you add the longer it runs.

---

### ☐ 12. Producer headshots

**About Us** tab → scroll to **Producers**.

Taylor Drew and Justin Hartmann are already there with bios — the headshots are
empty. Upload one for each (square crop) and edit the bios to whatever you'd
rather they said.

---

### ☐ 13. Logo gallery

**About Us** tab → **Logo gallery**.

Two versions of the mark are in there. Add every other variant you have —
alternate logos, event art, flash sheets. Set **Image size inside each tile**
and **Columns** to taste.

---

### ☐ 14. Check the SEO fields

**Every tab has an SEO section at the bottom**, and every post has its own.

They're already filled in with suggestions built from your content — meta title,
description, keywords, share image, an AI summary for ChatGPT/Claude/Perplexity,
and FAQ entries.

You don't have to touch any of it. But it's worth reading through the **Home**
and **About Us** ones and making them sound like you. Each field has a character
meter and a live Google preview underneath so you can see exactly how it'll look.

---

## Part 4 — After launch

### ☐ 15. Tell Google the site exists

1. Go to **https://search.google.com/search-console**
2. Add `pinsandneedlescomedy.com` as a property (verify by DNS record).
3. **Sitemaps** → submit `sitemap.xml`.

The site also publishes `/rss.xml` and `/llms.txt` automatically — the second is
a plain-text brief written for AI answer engines. Nothing to do, they just work.

### ☐ 16. Look at it on your phone

Open the real domain on a phone. Check the home page, one blog post, and the
shop page.

### ☐ 17. Change the admin password

If you left it as `weed`, set `ADMIN_PASSWORD` in Vercel to something else and
redeploy. Anyone who reads this file knows the default.

---

## If something goes wrong

| What you see | What it means |
| --- | --- |
| Orange banner in `/admin` | No Blob store. Step 3, then step 4. |
| `Save failed — retrying` | Storage is unreachable. It retries by itself; if it persists, check the Blob store is still connected. |
| Logged out of `/admin` after a deploy | `ADMIN_SECRET` isn't set. Step 2. |
| Home page reels show "Watch on Instagram" | No reels added yet. Step 11. |
| Blog covers show a faded logo | No cover uploaded for that post. Step 10. |
| `/shop` shows a dashed empty box | No Shopify embed code pasted. Step 7. |
| Visitors hit a Vercel login | Deployment protection is covering production. Step 6. |

Full reference in `README.md`.
