const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});
app.event('app_mention', async ({ event, client, say }) => {
  try {
    console.log("Event received:", event);

    // Basic reply to confirm it’s working
    await say(`👋 What's up <@${event.user}>? I heard you say: "${event.text}"`);

  } catch (error) {
    console.error("Error responding to app_mention:", error);
  }
});

app.event('app_mention', async ({ event, say }) => {
  try {
    console.log("Event received:", event);
    const text = event.text.toLowerCase();

    if (text.includes("test")) {
      await say(`✅ M3AI is live and listening.`);
    } else if (text.includes("start job") || text.includes("new job")) {
      await say(`👷‍♂️ Got it — kicking off job check-in now.\nWhat kind of job is this? (Install / Service / PM)`);
    } else if (text.includes("done") || text.includes("complete")) {
      await say(`📦 Wrapping this job. I’ll log the info and notify Maranda if anything’s missing.`);
    } else {
      await say(`👋 I’m M3AI — your job assistant. Type \`start job\`, \`done\`, or \`test\` to begin.`);
    }

  } catch (error) {
    console.error("Error responding to app_mention:", error);
  }
});

// ✅ ONLY ONE startup block
(async () => {
  await app.start();
  console.log('⚡️ M3AI is running via Socket Mode');
})();
(async () => {
  await app.start();
  console.log('⚡️ M3AI is running');
})();
