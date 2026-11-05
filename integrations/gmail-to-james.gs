/**
 * Gmail → James bridge (Google Apps Script)
 *
 * Runs inside Matt's own Gmail every 15 minutes. Finds F5Bot alert emails,
 * sends them to James, and labels them "james/done" so each is sent once.
 * Read-only on the mailbox apart from that label.
 *
 * Setup: script.google.com → New project → paste this → set JAMES_SECRET
 * (Project Settings → Script properties) → run setup() once and approve.
 */

const JAMES_URL = "https://james-ochre-delta.vercel.app/api/inbox";
const SEARCH = 'from:f5bot.com -label:james/done newer_than:3d';

function pushAlertsToJames() {
  const secret = PropertiesService.getScriptProperties().getProperty("JAMES_SECRET");
  if (!secret) throw new Error("Set JAMES_SECRET in Project Settings → Script properties");
  const done = GmailApp.getUserLabelByName("james/done") || GmailApp.createLabel("james/done");

  const threads = GmailApp.search(SEARCH, 0, 10);
  for (const thread of threads) {
    const messages = thread.getMessages().map((m) => ({
      id: m.getId(),
      from: m.getFrom(),
      subject: m.getSubject(),
      date: m.getDate().toISOString(),
      body: m.getPlainBody().slice(0, 50000),
    }));
    const res = UrlFetchApp.fetch(JAMES_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "x-intake-secret": secret },
      payload: JSON.stringify({ kind: "f5bot", messages }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() === 200) thread.addLabel(done);
    else console.log(`James returned ${res.getResponseCode()}: ${res.getContentText().slice(0, 300)}`);
  }
}

/** Run once: creates the 15-minute trigger and asks for Gmail permission. */
function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("pushAlertsToJames").timeBased().everyMinutes(15).create();
  pushAlertsToJames();
}
