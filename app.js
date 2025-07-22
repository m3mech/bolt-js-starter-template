// app.js
const { App } = require('@slack/bolt');
const { Configuration, OpenAIApi } = require("openai");

// Slack & OpenAI config
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Memory per job channel
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

app.event('app_mention', async ({ event, client, say }) => {
  const channel = event.channel;
  const user = event.user;
  const cleanedText = event.text.replace(/<@[^>]+>\s*/g, '').toLowerCase().trim();
  const memory = getChannelMemory(channel);

  // Store the step
  memory.steps.push({ user, text: cleanedText, timestamp: new Date().toISOString() });
  memory.lastUpdated = new Date().toISOString();

  // Start job flow manually
  if (cleanedText.includes("start job") || cleanedText.includes("new job")) {
    memory.phase = 'arrival';
    memory.jobType = null;
    memory.equipment = [];
    memory.status = 'active';
    memory.lastPrompt = 'jobType';
    await say(`\uD83D\uDC77 Got it — kicking off job check-in.\nWhat kind of job is this? (Install / Service / PM)`);
    return;
  }

  // Build GPT-powered response based on memory + thread
  try {
    const history = await client.conversations.history({ channel, limit: 15 });
    const messages = history.messages.reverse().map((msg) => {
      const who = msg.user === user ? "Tech" : "M3AI";
      return `${who}: ${msg.text}`;
    }).join("\n");

    const prompt = `
You are M3AI, an intelligent field assistant for a commercial HVAC, plumbing, and electrical service company. You live in Slack and help techs walk jobs, complete checklists, avoid inspection fails, and summarize work.

- Be direct, smart, and helpful.
- Track job phases: arrival, demo, install, photo, closeout.
- Know which photos are required for each job type.
- Ask about vacuum levels, drain pans, permits, labels, or any code violations.
- Ask only what’s relevant based on what techs have said.
- Don't sound like a robot. Talk like you’re running the field.

Slack thread so far:
${messages}

Current job memory:
Job Type: ${memory.jobType || 'Not set'}
Equipment: ${memory.equipment.join(', ') || 'None yet'}
Phase: ${memory.phase || 'unknown'}

Reply as M3AI to move the job forward. Keep it short and real.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = completion.data.choices[0].message.content;
    await say(reply);

  } catch (err) {
    console.error("GPT error:", err);
    await say("⚠️ GPT engine had an issue. Try again in a second.");
  }
});

(async () => {
  await app.start();
  console.log('⚡️ M3AI running with GPT brain + job memory');
})();
