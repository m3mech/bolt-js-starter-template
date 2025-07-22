const { App } = require('@slack/bolt');
const { Configuration, OpenAIApi } = require("openai");

// Slack App config
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// OpenAI config
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Smart AI-powered response to mentions
app.event('app_mention', async ({ event, client, say }) => {
  try {
    const channelId = event.channel;

    // Get recent message history for context
    const history = await client.conversations.history({
      channel: channelId,
      limit: 15,
    });

    // Format context for GPT
    const messages = history.messages.reverse().map((msg) => {
      const userLabel = msg.user === event.user ? "Tech" : "M3AI";
      return `${userLabel}: ${msg.text}`;
    }).join("\n");

    const prompt = `
You are M3AI, an intelligent assistant in a Slack workspace for an HVAC, plumbing, and electrical company. Your job is to assist technicians in the field and support dispatch and office staff. You track jobs, ask the right questions, notice missing steps, and respond like a human.

Respond with personality — direct, smart, helpful, a little sarcastic if the situation calls for it. Always move the job forward.

Here is the current thread:

${messages}

Reply now as M3AI with the next message in the conversation. Make it sound natural, like you're actually helping run this job.
    `;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const gptReply = completion.data.choices[0].message.content;
    await say(gptReply);

  } catch (error) {
    console.error("GPT error:", error);
    await say("⚠️ Something went sideways trying to think that through.");
  }
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ M3AI is running with GPT brain via Socket Mode');
})();
