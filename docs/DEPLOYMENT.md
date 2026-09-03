# Deployment

The site runs on Vercel. Nothing here needs a paid plan.

## 1. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**, for
Production and Preview.

| Variable | Required | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical origin. Drives canonical tags, sitemap, RSS, and the indexing gate. |
| `ADMIN_PASSWORD` | yes | Password for `/admin`. |
| `ADMIN_SECRET` | yes | Signs the admin cookie. `openssl rand -hex 32`. |

**`/admin` refuses every login unless both admin variables are set.** There is
no production fallback — see [ARCHITECTURE.md](./ARCHITECTURE.md#the-admin-fails-closed).
If logins start failing after a deploy, check these first.

## 2. Storage

Vercel's filesystem is read-only, so the `fs` driver cannot be used in
production. Pick one of the two:

### GitHub (free, no card)

Create a **second, private** repository to hold the content — not the one the
site deploys from, or every autosave would trigger a deployment. Keep it
private: `content.json` holds the Instagram token.

Create a fine-grained personal access token
([github.com/settings/tokens?type=beta](https://github.com/settings/tokens?type=beta))
scoped to that one repository, with **Contents: Read and write**. Then set:

```
CONTENT_GITHUB_TOKEN=github_pat_...
CONTENT_GITHUB_REPO=your-username/your-content-repo
CONTENT_GITHUB_BRANCH=main
```

Every save becomes a commit, so the content has a full history you can read back
and revert.

### Vercel Blob

Add a Blob store to the project. Vercel sets `BLOB_READ_WRITE_TOKEN` itself, and
the driver switches on automatically.

The driver is chosen from whichever secrets exist — GitHub wins over Blob,
because configuring it is the deliberate act. `CONTENT_DRIVER` overrides that if
you ever need it to.

## 3. Verify the deployment can actually save

This is the step worth not skipping, because everything looks fine until someone
tries to edit.

1. Open `/admin` and log in.
2. Change one visible piece of copy.
3. Wait for the status to read **Saved**.
4. Hard-reload the public page and confirm the change survived.

If it says **Save failed**, the message carries the store's own error. The usual
causes are a missing token, a token scoped to the wrong repository, or a content
repo that does not exist yet.

## 4. Instagram sync (optional)

Only needed for pulling reels in automatically. Create an app at
developers.facebook.com, add the Instagram product, and set its OAuth redirect
URI to `<NEXT_PUBLIC_SITE_URL>/api/admin/instagram/callback`. Then set
`INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`.

The token is stored in `content.json` and refreshes itself before its ~60-day
expiry — which is why the content repository must be private.

## 5. Texting a decision in (optional)

There are two halves to this, and only one of them is free.

### Showing a number — free

Put a number in **Admin → Bad Decisions → Text-in number** and it appears on
`/bad-decisions` as an alternative to the form, as a tappable `sms:` link.
Leave it blank and the whole option disappears.

A free [Google Voice](https://voice.google.com) number is enough for this.
Texts arrive in the Google Voice app, so the host reads them off their own
phone during the show. They are *not* in the pile the **Draw one** button pulls
from — the host works from two places.

### Putting texts in the pile — not free

For a text to land in the same pile as the form, so it gets drawn at random
alongside everything else, the number has to belong to a provider that can
POST to a webhook. Google Voice cannot; Twilio can, at roughly $1.15/month for
the number plus a fraction of a cent per message.

If that is ever worth it: buy a number, point its **A message comes in**
webhook at `<NEXT_PUBLIC_SITE_URL>/api/decisions/sms`, and set
`TWILIO_AUTH_TOKEN`. The route verifies Twilio's request signature and
**refuses every message when the token is unset**, so an unconfigured
deployment cannot have its pile written to by anyone who guesses the URL.

Texted decisions are stored anonymously — the sender's number is never written
down. They respect the same open/closed window as the form, and a text sent
outside it gets a reply saying when the door opens.

## 6. Moving the domain

Do this last. Until `NEXT_PUBLIC_SITE_URL` matches the host actually serving
traffic, the site refuses to let search engines index it — that gate is
deliberate, so a preview deployment can never outrank the real site.

1. Add the domain in **Vercel → Settings → Domains** and follow its DNS
   instructions.
2. Confirm `NEXT_PUBLIC_SITE_URL` is set to the final `https://` origin, with no
   trailing slash.
3. Redeploy, then check `/robots.txt` and `/sitemap.xml` on the real domain.
4. Submit the sitemap in Google Search Console.

## Rollback

Content and code roll back separately:

- **Code:** redeploy a previous deployment from the Vercel dashboard.
- **Content:** on the GitHub driver, revert the commit in the content repo.
