require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS"
    ],
    partials: ["CHANNEL"]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);

client.on('messageCreate', msg => {
  console.log("Received message");
  if (msg.content === "ping") {
    console.log("Received ping request");
    msg.reply("pong");
  } else if (msg.content.startsWith("PREFIX_HERE")) {
    console.log("Received register request");
  }
});
