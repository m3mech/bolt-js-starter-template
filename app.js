// app.js
const { App } = require('@slack/bolt');
const OpenAI = require("openai");
require('dotenv').config();

// ✅ Initialize OpenAI v4
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Initialize Slack app with socket mode
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// ✅ Job memory per channel
const jobMemory = {};
function getChannelMemory(channelId) {
  if (!jobMemory[channelId]) {
    jobMemory[channelId] = {
      jobType: null,
      equipment: [],
      phase: 'arrival',
      steps: [],
      lastPrompt: '',
      status: 'open',
      lastUpdated: new Date().toISOString(),
    };
  }
  return jobMemory[channelId];
}

// ✅ Slack mention handler
app.event('app_mention', async ({ event, client, say }) => {
  const channel = event.channel;
  const user = event.user;
  const cleanedText = event.text.replace(/<@[^>]+>\s*/g, '').toLowerCase().trim();
  const memory = getChannelMemory(channel);

  // Log step
  memory.steps.push({ user, text: cleanedText, timestamp: new Date().toISOString() });
  memory.lastUpdated = new Date().toISOString();

  // 🔧 Kick off job
  if (cleanedText.includes("start job") || cleanedText.includes("new job")) {
    memory.phase = 'arrival';
    memory.jobType = null;
    memory.equipment = [];
    memory.status = 'active';
    memory.lastPrompt = 'jobType';
    await say(`👷 Got it — kicking off job check-in.\nWhat kind of job is this? (Install / Service / PM)`);
    return;
  }

  // 🧠 GPT logic
  try {
    const history = await client.conversations.history({ channel, limit: 15 });
    const messages = history.messages.reverse().map((msg) => {
      const who = msg.user === user ? "Tech" : "M3AI";
      return `${who}: ${msg.text}`;
    }).join("\n");

    const prompt = `
You are M3AI, an intelligent field assistant for a commercial HVAC, plumbing, and electrical company. You live in Slack and help techs walk jobs, complete checklists, avoid inspection fails, and summarize work.

- Be direct, smart, and helpful.
- Track job phases: arrival, demo, install, photo, closeout.
- Know which photos are required for each job type.
- Ask about vacuum levels, drain pans, permits, labels, or code violations.
- Ask only what’s relevant based on what techs said.
- Don't sound like a robot. Talk like you run the field.

Slack thread:
${messages}

Job memory:
Job Type: ${memory.jobType || 'Not set'}
Equipment: ${memory.equipment.join(', ') || 'None yet'}
Phase: ${memory.phase || 'unknown'}

Reply as M3AI. Be short and real.`;

    console.log("🧠 Sending prompt to GPT:", prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.choices[0].message.content;
    await say(reply);

  } catch (err) {
    console.error("❌ GPT ERROR:", err.response?.data || err.message);
    await say("⚠️ GPT engine failed. Check logs or try again later.");
  }
});

(async () => {
  await app.start();
  console.log('⚡️ M3AI running with GPT brain + job memory');
})();


