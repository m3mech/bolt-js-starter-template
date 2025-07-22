const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.event('app_mention', async ({ event, say }) => {
  try {
    // Remove the bot mention from the message text
    const cleanedText = event.text.replace(/<@[^>]+>\s*/g, '').toLowerCase().trim();

    if (cleanedText.includes("test")) {
      await say(`✅ M3AI is live and listening.`);
      return;
    }

    if (cleanedText.includes("start job") || cleanedText.includes("new job")) {
      await say(`👷‍♂️ Got it — kicking off job check-in now.\nWhat kind of job is this? (Install / Service / PM)`);
      return;
    }

    if (cleanedText.includes("install")) {
      await say(`🔧 Got it — this is an *install* job.\nWhat equipment are you installing? (Furnace / Coil / Condenser / Water Heater / Breaker / Disconnect)`);
      return;
    }

    if (cleanedText.includes("service")) {
      await say(`🛠 Okay — this is a *service* job.\nWhat type of system is this? (HVAC / Plumbing / Electrical)`);
      return;
    }

    if (cleanedText.includes("pm")) {
      await say(`🧼 Starting a *PM* job.\nAre you working on the *Indoor* or *Outdoor* unit right now?`);
      return;
    }

    if (cleanedText.includes("done") || cleanedText.includes("complete")) {
      await say(`📦 Wrapping this job. I’ll log the info and notify Maranda if anything’s missing.`);
      return;
    }

    await say(`👋 I’m M3AI — your job assistant. Type \`start job\`, \`done\`, or a job type like \`install\`, \`service\`, or \`pm\` to continue.`);
  } catch (error) {
    console.error("Error responding to app_mention:", error);
  }
});

(async () => {
  await app.start();
  console.log('⚡️ M3AI is running via Socket Mode');
})();
