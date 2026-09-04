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

## 5. Texting a decision in (optional, free)

Some people will never scan a QR code. This gets their texts into the same
pile the host draws from, without paying anyone.

Google Voice is the only way to get a phone number for nothing. It cannot call
a webhook — but it will forward every text it receives to an email address, so
the site reads that mailbox instead.

1. **Get a number** at [voice.google.com](https://voice.google.com).
2. In Voice, **Settings → Messages → Forward messages to email**.
3. On the receiving Gmail account, turn on 2-step verification and create an
   **app password** at
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   A normal account password will not work for IMAP.
4. Set `INBOX_IMAP_USER` (the Gmail address) and `INBOX_IMAP_PASSWORD` (the
   app password from step 3, not the account password) in Vercel. The host,
   port and mailbox default to Gmail's, so those three need no variable.
   Redeploy afterwards — a running deployment does not pick up new variables.
5. Put the number in **Admin → Bad Decisions → Text-in number** so it appears
   on the page.

**What arrives.** Voice sends `multipart/alternative` mail — a plain-text part
and an HTML one, each separately encoded. The site picks the plain part and
decodes it before reading a word of it, so the boundary markers and MIME headers
never reach the stage. Long texts are hard-wrapped by Voice at about 75
characters; those breaks are rejoined, and only a blank line starts a new
paragraph.

**When it runs.** The admin's *Tonight* panel checks the mailbox each time it
polls, which is every fifteen seconds while it is open — the hour of the show,
and no other time. That is deliberate: a scheduler is the part that costs
money, since Vercel's hobby plan allows a cron job once a day, which is no use
to a live show. Keep the panel open and texts appear in the pile beside the
form submissions.

The panel says whether the mailbox is answering. Mail that does not look like a
forwarded text is left alone, every message is marked read so nothing is added
twice, and texts outside the open window are skipped like any other late
submission. **The sender's number is never stored.**

### The paid alternative

A carrier number that can POST to a webhook removes the mailbox from the
middle. Twilio charges roughly $1.15/month plus a fraction of a cent per
message. Point its **A message comes in** webhook at
`<NEXT_PUBLIC_SITE_URL>/api/decisions/sms` and set `TWILIO_AUTH_TOKEN`. That
route verifies Twilio's signature and refuses every message while the token is
unset, so leaving it unconfigured is safe.

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
