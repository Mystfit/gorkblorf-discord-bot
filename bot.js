require('dotenv').config();
var fs = require('fs');
var path = require('path');

//todo move the constants to an external file in a var Constants = {}
const Discord = require('discord.js');
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();
const CountryLanguage = require('country-language');
const Iso639Type = require('iso-639-language');
const iso639_1 = Iso639Type["default"].getType(1);
const {
    countryCodeEmoji,
    emojiCountryCode
} = require('country-code-emoji');

var markov = require('markov');
var markov_bot = markov();
var Trie = require('./trie');
const Hypnogram = require('./hypnogram');

let languages = {};
p = path.resolve(__dirname, "languages");
fs.readdirSync(p).forEach(file => {
    f = path.resolve(p, file);
    if (fs.existsSync(f)) {
        let language = new Trie();
        language_name = path.basename(f, path.extname(f));
        console.log("Language file:", language_name);
        try {
            data = fs.readFileSync(f, 'utf8');
            lines = data.split(/\r?\n/);
            lines.forEach(line => {
                language.insert(line);
            });
        } catch (err) {
            console.log(err);
        }
        languages[language_name] = language;
    }
});
console.log("Loaded languages", languages);

// Constants
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 _-*(){}/\\?[]&^%$#@!`~";
const watch_channel = ('CHANNEL' in process.env) ? process.env.CHANNEL : "905706918243364865";
const language_match_threshold = ('LANGUAGE_MATCH_THRESHOLD' in process.env) ? process.env.LANGUAGE_MATCH_THRESHOLD : 0.4;
const max_violations = ('MAX_GORKBLORF_VIOLATIONS' in process.env) ? process.env.MAX_GORKBLORF_VIOLATIONS : 1;
const start_seed_messages = ('START_SEED_MESSAGES' in process.env) ? process.env.START_SEED_MESSAGES : 500;
const puncutation_chance = 5;
const url_re = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;
const mention_re = /\@\w+/gim;
const training_word_re = /[^A-Za-z.!?'"-]/gi;
const hypnogram_query_re = /[^A-Za-z]/gi
const dictionary_match_re = /[^a-z]/g;
const digit_emojii = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
const mutationChance = .05;

// Discord client with the intents that it will require in order to operate
const client = new Discord.Client({
    intents: [
        "GUILD_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_REACTIONS"
    ],
    partials: ["CHANNEL"]
});

// Login to Discord
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('#gorkblorf™ Slorps gamach jubelnard zeferelyfulee fug graftrax himlarpiny sharglafei morgstar', {
        type: 'LISTENING'
    });
    populate_markov_from_channel(watch_channel, start_seed_messages);
});

try {
    client.login(process.env.DISCORD_TOKEN);
} catch (err) {
    console.log("Couldn't login to Discord", err);
}

// Direct message the bot
client.on('messageCreate', onMessageCreated);

function onMessageCreated(message) {
    if (message.content === "ping") {
        console.log("Received ping request");
        message.reply("pong");
    }

    console.log("In MessageCreate event");

    // Have the bot watch for new messages arriving in a specific channel
    if (message.channel.id === watch_channel || message.channel instanceof Discord.DMChannel) {

        // Make sure message is a valid gorkblorf and get violating words
        let message_parsed = validate_gorkblorf_message(message);
        let validated_message = message_parsed["valid"].join(' ');

        seedMarkovChain(message, message_parsed, validated_message);

        // Watch for direct mentions of the bot and reply to the user
        if (isMentioned(message)) {
            var key = markov_bot.pick();
            if (key) {
        				// Let user know we are generating a response
        				message.react('💭').then(res => respond(message));
                // respond(message);
            } else {
                console.log("No key returned from markov chain. Has it been seeded yet?");
            }
        }
    }
}

function isMentioned(message) {
    return ((message.mentions.users.find(u => u.id === client.user.id) ||
            message.channel instanceof Discord.DMChannel) &&
        message.author.id != client.user.id);
}

function respond(message) {
    var response = markov_bot.respond(markov_bot.pick(), 5);

    // take the return value of getNewWords(response),
    // and check it against the dictionary to make sure we haven't created any real words,
    // and then add to the Markov chain somehow
    // we don't use seedMarkovChain because that filters out posts by the bot
    var validated_message = validate_gorkblorf_message(message);
    
    var newWords = getNewWords(validated_message["valid"].join(" "));
    if(newWords.length > 0){
      console.log('New words generated: ' + newWords.join(' '));
      markov_bot.seed(newWords.join(" "));
    }

    var suffix = (Math.round(Math.random() * puncutation_chance) > puncutation_chance - 1) ?
    ((Math.random() > 0.5) ?
        "?" :
        "!") :
    "";
    var final_reply = response + suffix;
    final_reply = final_reply.replace(',', ' ');

    client.user.setActivity(final_reply, {
        type: 'LISTENING'
    });

    hypnogram_query = final_reply.replace(dictionary_match_re, ' ').replace(/\s\s+/g, ' ').substring(0, 70);
    filename = final_reply
        .replace(dictionary_match_re, '')
        .replace(' ', '_') + '.jpg';

    console.log('Submitting ' + hypnogram_query + ' to hypnogram service');
    Hypnogram.generate(hypnogram_query)
    .catch(err => {
        console.log("Couldn't process hypnogram:", err);
    })
    .then(res => {
      writeImage(res, final_reply, message);
      message.reactions.resolve('💭').users.remove(client.user.id);
    })
    .catch(err => {
        console.log("Couldn't process hypnogram:", err);
    });
}

function seedMarkovChain(message, message_parsed, validated_message) {
    // Train the markov chain with the new data - ignore ourselves so we don't weight probabilities
    if (message_parsed["invalid"].length < max_violations &&
        message_parsed["valid"].length >= max_violations &&
        message.author.id != client.user.id) {
        console.log("Adding new message to markov database:", validated_message);
        markov_bot.seed(validated_message);
    }
}

function writeImage(response, query, message) {
    console.log("Received hypnogram for", query, " - Creating embed message");
    console.log(response);
    if(response.error_code == 'GENERATION_FAILED'){
      message.react("❔");
      return;
    }
    const data = response.image;
    const buffer = new Buffer.from(data, 'base64');
    const attachment = new Discord.MessageAttachment(buffer, filename);
    let userMessage = new Discord.MessageEmbed().setDescription("http://hypnogram.xyz");
    userMessage.setTitle(query);
    userMessage.setImage('attachment://' + filename);

    try {
        message.reply({
            embeds: [userMessage],
            files: [attachment]
        });
    } catch (err) {
        console.log("Failed to reply to message", err);
        message.react('❔');
    }
}

function validate_gorkblorf_message(message) {
    var violations = [];
    var valid_words = [];
    var clean_message = sanitize_message(message.content);

    // Ignore URLs
    if (clean_message.match(url_re)) {
        console.log("Ignoring URL");
        return;
    }

    // Split the sentence into discrete words so we can accumuklate individual gorkblorf violations
    var num_violations = 0;
    split_phrase = clean_message.split(' ')

        var word_idx = 0;
    split_phrase.forEach(word => {
        valid_word = false;

        if (word.length < 3)
            return;

        // Get language match confidences
        detected_languages = word_language(word.toLowerCase().replace(dictionary_match_re, '')); //lngDetector.detect(word);

        // We might not match any existing language (gorkblorf!)
        if (detected_languages.length > 0) {
            // Check the match against the hand-tweaked threshold
            if (detected_languages[0][1] > language_match_threshold) {
                num_violations += 1;
                violations.push({
                    "word": word,
                    "language": detected_languages[0][0],
                    "index": word_idx
                });
                console.log("Violation:", word + ",", "Language:", detected_languages[0][0] + ",", "Confidence:", detected_languages[0][1]);
            } else {
                valid_word = true;
            }
        } else {
            valid_word = true;
        }

        if (valid_word)
            valid_words.push(word.replace(training_word_re, ''));

        word_idx += 1;
    });

    // Reset existing reaction
    // console.log(message.reactions);
    // if(message.reactions){
    //   message.reactions.forEach(reaction => reaction.remove(client.user.id));
    // }

    // Forgive false positives by accumulating violations until we just can't take it any more
    if (num_violations >= max_violations) {
        console.log("Number of Gorkblorf violations:", num_violations);
        message.react('🔴');
    } else {
        console.log("Good gorkblorf. Total violations for phrase", clean_message, "=", num_violations);
    }

    return {
        "valid": valid_words,
        "invalid": violations
    };
}

async function populate_markov_from_channel(channel, num_messages) {
    client.channels.fetch(channel).then(async channel => {

        // Bulk download of existing channel messages
        let messages = await lots_of_messages_getter(channel, num_messages);

        var markov_training = [];
        // Prepare training string

        messages.forEach(message => {
            validated = validate_gorkblorf_message(message[1]);
            markov_training.push(validated["valid"].join(' '));
        });

        // Train the markov
        markov_bot.seed(markov_training.join(' '))
    }).catch(error => {
        console.log("Couldn't access channel. Reason:", error);
    });
}

function word_language(word) {
    violations = []
    Object.keys(languages).forEach(lang => {
        if (languages[lang].has(word))
            violations.push([lang, 1.0]);
    });
    return violations;
}

function number_to_emojii(num) {
    if (num < digit_emojii.length && num >= 0) {
        return digit_emojii[num];
    }
    return "💬";
}

function sanitize_message(message_str) {
    return message_str.replace(url_re, '')
    .replace(Discord.MessageMentions.USERS_PATTERN, '')
    .replace(mention_re, '');
}

async function lots_of_messages_getter(channel, limit = 500) {
    const sum_messages = [];
    let last_id;
    while (true) {
        const options = {
            limit: 100
        };
        if (last_id) {
            options.before = last_id;
        }

        const messages = await channel.messages.fetch(options);
        sum_messages.push(...messages);

        if (messages.last())
            last_id = messages.last().id;

        if (messages.size != 100 || sum_messages >= limit) {
            break;
        }
    }

    return sum_messages;
}

function getNewWords(message) {
    let words = message.split(" ");
    let parentPairs = [];
    let children = [];
    let mutatedChildren = [];

    if (Math.random() <= mutationChance) {
        let a = Math.floor(Math.random() * words.length);
        let b = Math.floor(Math.random() * words.length);

        if (a == b) {
            a++;
            if (a >= words.length) {
                a = 0
            }
        }
		
        parentPairs.push({
            a: words[a],
            b: words[b]
        });
    }

    parentPairs.forEach(function (pair) {
        let offspring = recombinate(pair.a, pair.b);

        children.push(chromosomalDrift(mutate(offspring.a)));
        children.push(chromosomalDrift(mutate(offspring.b)));
    });

    return (children.length > 0) ? children : words;
}

function recombinate(a, b) {
    //give two entities, return two offspring

    var pivotA = 1 + Math.floor(Math.random() * (a.length - 2));
    var pivotB = 1 + Math.floor(Math.random() * (b.length - 2));

    var offspringA = a.substr(0, pivotA) + b.substr(pivotB);
    var offspringB = b.substr(0, pivotB) + a.substr(pivotA);

    return {
        a: offspringA,
        b: offspringB
    };
}

function mutate(entity) {
    //pass in a string to mutate, get the mutated string back

    let returnMe = entity;
    //how often will a character change
    let mutationSize = 0.1;

    for (let i = 0; i < returnMe.length; i++) {
        if (Math.random() <= mutationSize) {
            returnMe = replaceAt(returnMe, i, charset[Math.floor(Math.random() * charset.length)]);
        }
    }

    if (entity === returnMe) {
        console.log("entity unchanged");
    }

    return returnMe;
};

function chromosomalDrift(entity) {

    var i = Math.floor(Math.random() * entity.length);
    return replaceAt(entity, i, String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)));
};

function replaceAt(str, index, character) {
    return str.substr(0, index) + character + str.substr(index + character.length);
};
