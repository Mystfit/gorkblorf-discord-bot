//Require

const {
    Message,
    MessageMentions,
    Embed,
    MessageAttachment,
    Collection
} = require('discord.js');
const LanguageLookup = require('./languageLookup');
const WordEvolver = require('./wordEvolver');
const Statistics = require('./statistics');
const Hypnogram = require('./hypnogram');
const markov = require('markov');

// Constants

const specialchars = "ÀÁÂÃÄÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÜÝßÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿĀāĂăĄąĆĆćĈĉĊċČčĎďĐđĒēĔĕĖėęĚěĜĝĞğĠĢģĤĐĥĦħĨĨĩĪīĬĭĮįİıĲĲĳĴĵĶķĸĸĹĺĻļľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤŦŧũŪūŬŭŮůŰűŲųŴŵŶŸŹźŻżŽžſƀƁƂƃƄƅƆƇƈƉƊƋƌƍƎƏƐƑƒƓƔƕƖƗƘƙƚƛƜƝƞƟƠơƢƣƤƥƦƧƨƩƪƫƬƭƮƯưƱƲƳƴƵƶƷƸƹƺƾƿǂ";
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-" + specialchars;
const language_match_threshold = ('LANGUAGE_MATCH_THRESHOLD' in process.env) ? process.env.LANGUAGE_MATCH_THRESHOLD : 0.4;
const max_violations = ('MAX_GORKBLORF_VIOLATIONS' in process.env) ? process.env.MAX_GORKBLORF_VIOLATIONS : 1;
const puncutation_chance = 5;
const url_re = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;
const mention_re = /\@\w+/gim;
const training_word_re = /[^A-Za-z.!?'"-]/gi;
const hypnogram_query_re = /[^A-Za-z]/gi;
const dictionary_match_re = /[^a-z]/g;
const digit_emojii = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
const mutationChance = .05;

const wordEvolver = new WordEvolver(charset, mutationChance);
const languageLookup = new LanguageLookup();
const statistics = new Statistics();
const markov_bot = markov();

var Actions = {
    //commands should return {content: "", ephemeral: false}
    commands: {
        "schmomage": getRandomImage,
        "pellemeto": getCurrentUserStatisticsMessage,
        "splognobers": getStatisticsMessage

    },
    read: read,
    reply: reply,
    mutateVocab: mutateVocab,
    generateRandomMessage: generateRandomMessage,
    getText: getText,
    getImage: getImage,
    getRandomImage: getRandomImage,
    getCurrentUserStatisticsMessage: getCurrentUserStatisticsMessage,
    getStatisticsMessage: getStatisticsMessage
}

module.exports = Actions;

function generateRandomMessage(words) {
    // words = []

    let length = Math.floor(Math.random() * words.length);
    let indexes = [];

    for (let i = 0; i < length; i++) {
        indexes.push(Math.floor(Math.random() * words.length));
    }

    let phrase = indexes.map(function (i) {
        return words[i];
    }).join(" ");

    return phrase;
}

function mutateVocab(words) {
    // console.log("mutateVocab", words);
    // words = "all words to mutate"
    for (let j = 0; j < 2; j++) {
        //let's run twice, just to get some variance
        let newWords = "";
        for (let i = 0; i < words.length / 5; i++) {
            let validWords = validateGorkblorfMessage(wordEvolver.getNewWords(words).join(" "))["valid"];
            if (validWords.length > 0) {
                // console.log("mutateVocab seeding", validWords);
                markov_bot.seed(validWords.join(" "));
                statistics.addToWordList("me", validWords);
                newWords += " " + validWords;
            }
        }
        words += newWords;
    }

    // console.log("mutateVocab fin");
}

function read(message, clientId) {
    // console.log("read", message.content);
    // Make sure message is a valid gorkblorf and get violating words

    if (!message.content) {
        return;
    }

    let parsedWords = validateGorkblorfMessage(message.content);
    let validString = parsedWords["valid"].join(' ');

    // Forgive false positives by accumulating violations until we just can't take it any more
    if (parsedWords["invalid"].length >= max_violations) {
        // console.log("Number of Gorkblorf violations:", parsedWords["invalid"].length);
        message.react('🔴');
    } else {
        // console.log("Good gorkblorf. Total violations for phrase", parsedWords, "=", parsedWords["invalid"].length);
    }

    seedMarkovChain(message, parsedWords, validString, clientId);
    // add to user word list, so we can keep track of who taught which words to the bot
    statistics.addToWordList(message.author.id, parsedWords["valid"]);
    // keep track of violations
    statistics.addToViolations(message.author.id, parsedWords["invalid"]);
}

function reply(message) {
    var self = this;
    // Let user know we are generating a response
    message
    .react('💭')
    .then(function (result) {
        message.reply({
            content: getText(),
            ephemeral: false
        });
    });
}

function getText(message, length) {
    var key;

    if (!length) {
        length = 4;
    }

    if (message) {
        key = markov_bot.search(message);
    }
    if (!key) {
        key = markov_bot.pick();
    }

    if (key) {
        //lets generate two randoms and add them so we get a ^ graph of lengths, tending toward the middle.
        var limit = Math.floor(Math.random() * length) + Math.floor(Math.random() * length);
        var returnMe = markov_bot.respond(markov_bot.pick(), limit);

        // todo: punctuation should be in the markov chain
        var suffix = (Math.round(Math.random() * puncutation_chance) > puncutation_chance - 1) ?
        ((Math.random() > 0.5) ?
            "?" :
            "!") :
        "";

        var returnMe = returnMe + suffix;
        returnMe = returnMe.replace(',', ' ');

        return returnMe;
    } else {
        console.log("No key returned from markov chain. Has it been seeded yet?");
        return "";
    }
}

async function getImage(query) {
    console.log('Submitting ' + query + ' to hypnogram service');
    let result;

    try {
        result = await Hypnogram.generate(query)
    } catch (e) {
        console.log("Couldn't process hypnogram:", e);
    }

    console.log("getImage result", result);
    console.log("getImage result.image_id", result.image_id);

    if (result.error_code && result.error_code === "STANDARD_QUEUE_FULL") {
        console.log("Hypnogram is busy");

        return "busy";
    } else {
        try {
            return await Hypnogram.download(result.image_id);
        } catch (e) {
            console.log("failed to download image", e);
        }
    }
}

function writeImage(response, query, message) {
    console.log("Received hypnogram for", query, " - Creating embed message");
    console.log(response);
    if (response.error_code == 'GENERATION_FAILED') {
        message.react("❔");
        return;
    }
    let userMessage = new Embed()
        userMessage.setTitle(query);
    // Convert image data to an embed
}

async function getRandomImage(interaction) {
    await interaction.deferReply();

    let img = await getImage(getText(null, 3));
    let attachment = new MessageAttachment(img);
    const userMessage = {
            title: '',
            author: {
                name: interaction.member.displayName,
            },
            // image: {
            //     url: "attachment://" + result.image_id,
            // },
            timestamp: new Date(),
            footer: {
                 text: 'gorkblorf.com'
                 // icon_url: 'https://i.imgur.com/AfFp7pu.png',
            },
        };

    console.log("getRandomImage", img);

    // Reply
    await interaction.editReply({embeds: [userMessage], files: [attachment], ephemeral: false});
}

function getCurrentUserStatisticsMessage(interaction) {
    return {
        content: getStatisticsMessage(interaction.user.id),
        ephemeral: true
    };
}

function getStatisticsMessage(userId) {
    return `**Farhg goo flemsteen:**\n${getWords(userId)}.\n`
     + `**Zarxistik vez nerkleck:**\n${getViolations(userId)}.`;

    function getWords(userId) {

        let words = statistics.userStatistics.get(userId)?.words ?? null;

        if (words) {
            return Array.from(words).join('\n');
        } else {
            return "";
        }
    }

    function getViolations(userId) {
        let violations = statistics.userStatistics.get(userId)?.violations ?? null;

        if (violations) {
            return violations.map(violation => `${violation.timestamp.toString()}: ${violation.word}`).join('\n');
        } else {
            return "";
        }
    }
}

function seedMarkovChain(message, parsedWords, validString, clientId) {
    // console.log("seedMarkovChain", parsedWords, validString, clientId);
    // Train the markov chain with the new data - ignore ourselves so we don't weight probabilities
    // not sure why we compare valid words against max violations
    if (parsedWords["invalid"].length < max_violations &&
        // parsedWords["valid"].length >= max_violations &&
        validString.length > 0 &&
        message.author.id != clientId) {
        // console.log("Adding new message to markov database:", validString);
        markov_bot.seed(validString);
    }
}

function validateGorkblorfMessage(message) {
    // console.log("validateGorkblorfMessage message", message);
    var violations = [];
    var valid_words = [];
    var clean_message = sanitizeMessage(message);

    // Ignore URLs
    if (clean_message.match(url_re)) {
        // console.log("Ignoring URL");
        return;
    }

    // Split the sentence into discrete words so we can accumuklate individual gorkblorf violations
    split_phrase = clean_message.split(' ');

    var word_idx = 0;
    split_phrase.forEach(word => {
        valid_word = false;

        if (word.length < 3) {
            return;
        }

        // Get language match confidences
        let detected_languages = languageLookup.find(word.toLowerCase().replace(dictionary_match_re, ''));
        // We might not match any existing language (gorkblorf!)
        if (detected_languages.length > 0) {
            let languages = detected_languages.join(", ");

            violations.push({
                "word": word,
                "language": languages,
                "index": word_idx
            });
            // console.log("Violation:", word + ",", "Language:", languages + ",", "Confidence:", detected_languages.length);
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


    return {
        "valid": valid_words,
        "invalid": violations
    };
}

function sanitizeMessage(message_str) {
    // console.log("sanitizeMessage", message_str);
    if (message_str) {
        return message_str.replace(url_re, '')
        .replace(MessageMentions.USERS_PATTERN, '')
        .replace(mention_re, '');
    } else {
        return "";
    }
}

// todo delete if unused
function numberToEmojii(num) {
    if (num < digit_emojii.length && num >= 0) {
        return digit_emojii[num];
    }
    return "💬";
}

//test
// (function () {
// var strings = [];
// strings.push("alam asup andye atyon aerpo");
// strings.push("berson bianeo bowmpe bneowkey bhealsek bwneofyeh");
// strings.push("caleikd cthemei calenslid ckndwoer claeoifen");

// strings.forEach(function (s) {
// markov_bot.seed(s);
// mutateVocab(s);
// });
// })();
