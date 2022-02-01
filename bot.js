require('dotenv').config();
const fs = require("fs");
const {
    Client,
    Collection,
    Intents
} = require('discord.js');

//todo move the constants to an external file in a var Constants = {}
const Discord = require('discord.js');
const LanguageDetect = require('languagedetect');
// const lngDetector = new LanguageDetect();
// const CountryLanguage = require('country-language');
// const Iso639Type = require('iso-639-language');
// const iso639_1 = Iso639Type["default"].getType(1);
// const {
// countryCodeEmoji,
// emojiCountryCode
// } = require('country-code-emoji');
const watch_channel = ('CHANNEL' in process.env) ? process.env.CHANNEL : null;
const start_seed_messages = ('START_SEED_MESSAGES' in process.env) ? process.env.START_SEED_MESSAGES : 500;

let Actions = require('./actions');

// Discord client with the intents that it will require in order to operate
const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        "GUILD_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "DIRECT_MESSAGES",
        "DIRECT_MESSAGE_REACTIONS"
    ],
    partials: ["CHANNEL"]
});

try {
    client.login(process.env.DISCORD_TOKEN);
} catch (err) {
    console.log("Couldn't login to Discord", err);
}

console.log("index adding commands");

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

console.log("index done adding commands");

// Login to Discord
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('#gorkblorf™ Slorps gamach jubelnard zeferelyfulee fug graftrax himlarpiny sharglafei morgstar', {
        type: 'LISTENING'
    });
    populateMarkovFromChannel(watch_channel, start_seed_messages);
    // populateCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand())
        return;

    const command = client.commands.get(interaction.commandName);

    if (!command)
        return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error("command error", error);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
        });
    }
});

// Direct message the bot
client.on('messageCreate', onMessageCreated);

function onMessageCreated(message) {
    if (message.content === "ping") {
        console.log("Received ping request");
        message.reply("pong");
    }

    // console.log("___________________________");
    // console.log("In MessageCreate event", message.content);

    // Have the bot watch for new messages arriving in a specific channel
    if (message.channel.id === watch_channel || message.channel instanceof Discord.DMChannel) {
        Actions.read(message, client.user.id);
        // console.log("in watched channel");

        //join the conversation randomly
        // Watch for direct mentions of the bot and reply to the user
        if (Math.random() > 0.95 || isMentioned(message)) {
            let spaces = message.content.match(/\s/g);
            let wordCount = spaces ? spaces.length + 1 : 1;
            // console.log("mentioned", isMentioned(message));

            let text = Actions.getText(message.content, wordCount);
            if (text.length > 0) {
                // console.log("text length", text.length);
                message.reply({
                    content: text,
                    ephemeral: false
                });
            }
        }
    }
}

function isMentioned(message) {
    return ((message.mentions.users.find(u => u.id === client.user.id) ||
            message.channel instanceof Discord.DMChannel) &&
        message.author.id != client.user.id);
}

// function writeImage(response, query, message) {
// console.log("Received hypnogram for", query, " - Creating embed message");
// console.log(response);
// if (response.error_code == 'GENERATION_FAILED') {
// message.react("❔");
// return;
// }
// let userMessage = new Discord.MessageEmbed()
// userMessage.setTitle(query);
// Convert image data to an embed
// }

async function populateMarkovFromChannel(channel, num_messages) {
    client.channels.fetch(channel).then(async channel => {
        // console.log("");
        // Bulk download of existing channel messages
        let messages = await getChannelMessages(channel, num_messages);
        // console.log("messages", messages);

        let filteredMessages = messages
            .filter(function (message) {
                // console.log("message", message);
                return message.author.id !== client.user.id;
            });

        filteredMessages.forEach(message => {
            // console.log("populateMarkovFromChannel message", message.content);

            if (message.content && message.content.length > 0) {
                Actions.read(message, client.user.id);
            }
        });

        //get a list of all "words"
        // let words = messages
        // .filter(function (message) {
        // return message.author.id !== client.user.id;
        // }).join(" ");

        // console.log("filteredMessages", filteredMessages);

        let words = filteredMessages.map(function (message) {
            if (!message.content.split) {
                return;
            }
            return message.content.split(" ");
        }).reduce(function (previousValue, currentValue, currentIndex, array) {
            return previousValue.concat(currentValue);
        }, []);

        // console.log("words", words);

        for (let i = 0; i < words.length / 10; i++) {
            Actions.mutateVocab(Actions.generateRandomMessage(words));
        }

    }).catch(error => {
        console.log("Couldn't access channel. Reason:", error);
    });
}

// function populateCommands() {
// client.api.applications(client.user.id)
// .guilds(process.env.GUILD_ID)
// .commands
// .post({
// data: {
// name: 'gorkblorfwords',
// description: 'Gnward wol trelwarf'
// }
// });
// }

async function getChannelMessages(channel, limit = 500) {
    let sum_messages = [];
    let last_id;
    while (true) {
        const options = {
            limit: 100
        };
        if (last_id) {
            options.before = last_id;
        }

        const messages = await channel.messages.fetch(options);
        Array.from(messages)
        .filter(function (m) {
            return m[1].author.id !== client.user.id;
        })
        .forEach(function (x) {
            sum_messages.push(x[1]);
        });

        // console.log("length", sum_messages.length);
        // console.log("messages", Array.from(messages));

        if (messages.last()) {
            last_id = messages.last().id;
        }

        if (messages.size != 100 || sum_messages.length >= limit) {
            break;
        }
    }

    return sum_messages;
}
