/**
 * Pins & Needles — carry texted decisions from Google Voice to the site.
 *
 * Google Voice will not call a webhook. The one thing it does is email every
 * text it receives to its own Google account, so something has to carry that
 * last hop. This is that something: it runs on the account the Voice number
 * already forwards to, reads the forwards, and posts them to the site.
 *
 * It is free, has no monthly task cap, and — the point — the site never gets
 * a password to this or any other mailbox. It holds one secret, scoped to one
 * endpoint, and this script is the only thing that knows it.
 *
 * ---------------------------------------------------------------------------
 * Setting it up, once:
 *
 *  1. script.google.com -> New project. Paste this in, replacing everything.
 *  2. Project Settings -> Script properties -> Add two:
 *
 *       ENDPOINT   https://pinsandneedlescomedy.com/api/decisions/inbound
 *       SECRET     (the same value as DECISIONS_INBOUND_SECRET in Vercel)
 *
 *     They go here rather than in the code so the secret is not sitting in a
 *     file that gets copied around.
 *  3. Run `checkSetup` once. It asks for permission to read Gmail and to make
 *     web requests, then tells you whether the site answered.
 *  4. Triggers -> Add trigger -> `forwardDecisions`, time-driven, every 5
 *     minutes.
 *
 * Nothing else. It is safe to leave running all week: the site refuses
 * anything outside the submission window, so a text sent on a Tuesday is read
 * and dropped rather than queued up for the next show.
 * ---------------------------------------------------------------------------
 */

/** Only Voice's own forwards. Anything else in the mailbox is left alone. */
const QUERY = 'from:voice-noreply@google.com subject:"text message" -label:{LABEL} newer_than:2d';

/** Threads already sent get this label, so nothing is ever posted twice. */
const LABEL = 'decisions-sent';

/** A cap per run, so a backlog cannot turn into one enormous request burst. */
const MAX_PER_RUN = 25;

function settings() {
  const props = PropertiesService.getScriptProperties();
  const endpoint = props.getProperty('ENDPOINT');
  const secret = props.getProperty('SECRET');
  if (!endpoint || !secret) {
    throw new Error('Set ENDPOINT and SECRET in Project Settings -> Script properties.');
  }
  return { endpoint: endpoint, secret: secret };
}

/**
 * Post one message and say whether it is finished with.
 *
 * A 2xx means the site has made its decision — accepted, or knowingly not
 * (outside the window, not a decision, wrong sender) — and there is nothing
 * to retry. Anything else is the site being unreachable, misconfigured or
 * busy, so the message is left unlabelled and tried again next run.
 */
function post(config, message) {
  const response = UrlFetchApp.fetch(config.endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-inbound-secret': config.secret },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      // The whole message, untouched. The site pulls the plain-text part out
      // of it and strips Google's footer itself, which it does better from
      // the original than from anything this script could pre-chew.
      raw: message.getRawContent(),
      from: message.getFrom(),
      subject: message.getSubject(),
    }),
  });

  const code = response.getResponseCode();
  if (code >= 200 && code < 300) return true;

  console.warn('Site answered ' + code + ': ' + response.getContentText().slice(0, 200));
  return false;
}

function forwardDecisions() {
  const config = settings();
  const label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  const threads = GmailApp.search(QUERY.replace('{LABEL}', LABEL), 0, MAX_PER_RUN);

  for (var i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();
    var allDone = true;

    for (var j = 0; j < messages.length; j++) {
      if (!post(config, messages[j])) allDone = false;
    }

    // Label the thread only when every message on it got through, so a
    // failure halfway down is retried rather than quietly lost.
    if (allDone) threads[i].addLabel(label);
  }

  console.log('Handled ' + threads.length + ' thread(s).');
}

/**
 * Run this by hand after setting the two properties.
 *
 * Posts nothing. It checks that the settings are there, that the mailbox has
 * forwards in it, and that the site answers — a 401 here means the secret does
 * not match the one in Vercel, and a 503 means DECISIONS_INBOUND_SECRET is not
 * set there at all.
 */
function checkSetup() {
  const config = settings();
  const found = GmailApp.search(QUERY.replace('{LABEL}', LABEL), 0, 5).length;

  const response = UrlFetchApp.fetch(config.endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-inbound-secret': config.secret },
    muteHttpExceptions: true,
    payload: JSON.stringify({ text: '' }),
  });

  const code = response.getResponseCode();
  console.log('Unsent forwards waiting: ' + found);
  console.log('Site answered: ' + code + ' ' + response.getContentText().slice(0, 200));

  if (code === 401) console.error('SECRET does not match DECISIONS_INBOUND_SECRET in Vercel.');
  else if (code === 503) console.error('DECISIONS_INBOUND_SECRET is not set in Vercel yet.');
  else if (code >= 200 && code < 300) console.log('Working. Add the 5-minute trigger.');
}
