const { App } = require('@slack/bolt');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// 🧠 Memory store for job tracking
const jobMemory = {};

app.event('app_mention', async ({ event, say }) => {
  try {
    // Clean input and get channel
    const cleanedText = event.text.replace(/<@[^>]+>\s*/g, '').toLowerCase().trim();
    const channelId = event.channel;

    // Init job memory if needed
    if (!jobMemory[channelId]) {
      jobMemory[channelId] = {
        startedBy: event.user,
        steps: [],
        jobType: null,
        equipmentType: null,
        status: 'open',
        lastUpdated: new Date().toISOString()
      };
    }

    const memory = jobMemory[channelId];

    // Log the current step
    memory.steps.push({ user: event.user, text: cleanedText, timestamp: new Date().toISOString() });
    memory.lastUpdated = new Date().toISOString();

    // Handle message logic
    if (cleanedText.includes("test")) {
      await say(`✅ M3AI is live and memory is tracking.`);
      return;
    }

    if (cleanedText.includes("start job") || cleanedText.includes("new job")) {
      memory.status = 'active';
      await say(`👷‍♂️ Starting job thread. What kind of job is this? (Install / Service / PM)`);
      return;
    }

    if (cleanedText.includes("install")) {
      memory.jobType = "install";
      await say(`🔧 Noted: *Install job*. What equipment are you installing? (Furnace / Coil / Condenser / Water Heater / Breaker / Disconnect)`);
      return;
    }

    if (cleanedText.includes("service")) {
      memory.jobType = "service";
      await say(`🛠 Got it: *Service job*. What kind of system is this? (HVAC / Plumbing / Electrical)`);
      return;
    }

    if (cleanedText.includes("pm")) {
      memory.jobType = "pm";
      await say(`🧼 PM job. Are you working on the *Indoor* or *Outdoor* unit?`);
      return;
    }

    if (
      cleanedText.includes("furnace") ||
      cleanedText.includes("coil") ||
      cleanedText.includes("condenser") ||
      cleanedText.includes("water heater") ||
      cleanedText.includes("breaker") ||
      cleanedText.includes("disconnect")
    ) {
      memory.equipmentType = cleanedText;
      await say(`✅ Logged: installing *${cleanedText}*.\nLet me know when you're done or need help.`);
      return;
    }

    if (cleanedText.includes("done") || cleanedText.includes("complete")) {
      memory.status = 'closed';
      await say(`📦 Wrapping this job. Logging notes and notifying Maranda.`);
      return;
    }

    // Fallback catch-all
    await say(`👋 I’m M3AI. I’ve logged that — type \`done\` when you're finished, or keep going.`);

    // Debug log of memory
    console.log("Current Memory:", JSON.stringify(jobMemory[channelId], null, 2));
  } catch (error) {
    console.error("Error responding to app_mention:", error);
  }
});

// Start the bot
(async () => {
  await app.start();
  console.log('⚡️ M3AI is running via Socket Mode');
})();
