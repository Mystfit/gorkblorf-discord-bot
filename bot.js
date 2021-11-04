require('dotenv').config();
const Discord = require('discord.js');
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const client = new Discord.Client({ intents: [
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS"
    ],
    partials: ["CHANNEL"]
});

let watch_channel = ('CHANNEL' in process.env) ? process.env.CHANNEL : "905706918243364865"
let language_match_threshold = ('LANGUAGE_MATCH_THRESHOLD' in process.env) ? process.env.LANGUAGE_MATCH_THRESHOLD : 0.4
let max_violations = ('MAX_GORKBLORF_VIOLATIONS' in process.env) ? process.env.MAX_GORKBLORF_VIOLATIONS : 3
let url_re = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    populate_markov_from_channel(watch_channel);
});

client.login(process.env.DISCORD_TOKEN);

// Direct message the bot
client.on('messageCreate', message => {
  if (message.content === "ping") {
    console.log("Received ping request");
    message.reply("pong");
  }

  // Have the bot watch for new messages arriving in a specific channel
  if (message.channel.id === watch_channel){
    validate_gorkblorf_message(message);
  }
});


function validate_gorkblorf_message(message)
{
  // Ignore URLs
  if(message.content.match(url_re)){
    console.log("Ignoring URL");
    return;
  }

  // Split the sentence into discrete words so we can accumuklate individual gorkblorf violations
  var num_violations = 0;
  message.content.split(' ').forEach(word => {

    // Get language match confidences
    languages = lngDetector.detect(word);

    // We might not match any existing language (gorkblorf!)
    if(languages.length > 0){
      if(word.length < 3)
        return;

      // Check the match against the hand-tweaked threshold
      if(languages[0][1] > language_match_threshold){
        num_violations += 1;
        console.log("Violation:", word, "Language:", languages[0][0], "Confidence:", languages[0][1]);
      }
    }
  });

  // Forgive false positives by accumulating violations until we just can't take it any more
  if(num_violations >= max_violations){
    console.log("Number of Gorkblorf violations:", num_violations);
    message.react('🔴');
  } else {
    console.log("Good gorkblorf. Total violations for phrase", message.content, "=", num_violations);
  }
}


async function populate_markov_from_channel(channel) {
  client.channels.fetch(channel).then(async channel => {
      console.log(channel);

      let messages = await lots_of_messages_getter(channel, 500);
      messages.forEach(message => {
        //console.log(message[1].content, lngDetector.detect(message[1].content));
      });
    });
}

async function lots_of_messages_getter(channel, limit = 500) {
  const sum_messages = [];
  let last_id;

  while (true) {
      const options = { limit: 100 };
      if (last_id) {
          options.before = last_id;
      }

      const messages = await channel.messages.fetch(options);
      sum_messages.push(...messages);
      last_id = messages.last().id;

      if (messages.size != 100 || sum_messages >= limit) {
          break;
      }
  }

  return sum_messages;
}