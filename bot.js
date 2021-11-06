require('dotenv').config();
const Discord = require('discord.js');
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
var markov = require('markov');
var markov_bot = markov();

// Discord client with the intents that it will require in order to operate
const client = new Discord.Client({ intents: [
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS"
    ],
    partials: ["CHANNEL"]
});

// Constants
let watch_channel = ('CHANNEL' in process.env) ? process.env.CHANNEL : "905706918243364865";
let language_match_threshold = ('LANGUAGE_MATCH_THRESHOLD' in process.env) ? process.env.LANGUAGE_MATCH_THRESHOLD : 0.4;
let max_violations = ('MAX_GORKBLORF_VIOLATIONS' in process.env) ? process.env.MAX_GORKBLORF_VIOLATIONS : 3;
let start_seed_messages = ('START_SEED_MESSAGES' in process.env) ? process.env.START_SEED_MESSAGES : 500;
let puncutation_chance = 5;
let url_re = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;


// Login to Discord
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    populate_markov_from_channel(watch_channel, start_seed_messages);
});
client.login(process.env.DISCORD_TOKEN);


// Direct message the bot
client.on('messageCreate', message => {
  if (message.content === "ping") {
    console.log("Received ping request");
    message.reply("pong");
  }

  // Have the bot watch for new messages arriving in a specific channel
  if (message.channel.id === watch_channel || message.channel instanceof Discord.DMChannel){

    // Make sure message is a valid gorkblorf and get violating words
    validated_message = validate_gorkblorf_message(message).join(' ');

    // Get rid of Discord user mentions (any @user text)
    var clean_message = message.content.replace(Discord.MessageMentions.USERS_PATTERN, '');

    // Train the markov chain with the new data
    if(validated_message.length < 1){
      console.log("Adding new message to markov database:", clean_message);
      markov_bot.seed(clean_message);
    }

    // Watch for direct mentions of the bot and reply to the user
    if((message.mentions.users.find(u => u.id === client.user.id) || message.channel instanceof Discord.DMChannel) 
      && message.author.id != client.user.id)
    {
      response = markov_bot.respond(markov_bot.pick(), 5);
      suffix = (Math.round(Math.random() * puncutation_chance) > puncutation_chance-1) ? ((Math.random() > 0.5) ? "?" : "!") : "";
      message.reply(response.join(' ') + suffix);
    }
  }
});


function validate_gorkblorf_message(message)
{
  var violations = [];
  var clean_message = message.content.replace(Discord.MessageMentions.USERS_PATTERN);

  // Ignore URLs
  if(clean_message.match(url_re)){
    console.log("Ignoring URL");
    return;
  }

  // Split the sentence into discrete words so we can accumuklate individual gorkblorf violations
  var num_violations = 0;
  split_phrase = clean_message.split(' ')
  split_phrase.forEach(word => {

    // Get language match confidences
    languages = lngDetector.detect(word);

    // We might not match any existing language (gorkblorf!)
    if(languages.length > 0){
      if(word.length < 3)
        return;

      // Check the match against the hand-tweaked threshold
      if(languages[0][1] > language_match_threshold){
        num_violations += 1;
        violations.push(word);
        console.log("Violation:", word + ",", "Language:", languages[0][0]+ ",", "Confidence:", languages[0][1]);
      }
    }
  });

  // Forgive false positives by accumulating violations until we just can't take it any more
  if(num_violations >= max_violations || num_violations >= split_phrase.length-1){
    console.log("Number of Gorkblorf violations:", num_violations);
    message.react('🔴');
  } else {
    console.log("Good gorkblorf. Total violations for phrase", clean_message, "=", num_violations);
  }

  return violations;
}


async function populate_markov_from_channel(channel, num_messages) {
  client.channels.fetch(channel).then(async channel => {

      // Bulk download of existing channel messages
      let messages = await lots_of_messages_getter(channel, num_messages);

      var markov_training = [];
      // Prepare training string
      messages.forEach(message => {
        // Ignore URLs
        if(message[1].content.match(url_re)){
          return;
        }

        markov_training.push(message[1].content.replace(Discord.MessageMentions.USERS_PATTERN, ''));
      });

      // Train the markov
      markov_bot.seed(markov_training.join(' '))
    }).catch(error => {
      console.log("Couldn't access channel. Reason:", error);
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
      
      if(messages.last())
        last_id = messages.last().id;

      if (messages.size != 100 || sum_messages >= limit) {
          break;
      }
  }

  return sum_messages;
}