const {
    SlashCommandBuilder
} = require('@discordjs/builders');
var Actions = require('../actions');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("gb")
    .setDescription("Shran ^^flustne^^ erignamm")
    .addSubcommand(subcommand =>
        subcommand
            .setName('schmomage') // generateRandomImage
            .setDescription('Jitob botob Besmeny dedood'))
    // .addSubcommand(subcommand =>
    //     subcommand
    //         .setName('pellemeto') // generateRandomImage
    //         .setDescription('Pintwockle furbwren'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('splognobers') // getStatisticsMessage
            .setDescription('Zergaloo arp loonbotom')),


    async execute(interaction) {
        let command = interaction.options.getSubcommand();
        if (!(command) in Actions.commands){
            //err
            console.log("Could not find command " + command);
            return;
        }

        let action_cb = Actions.commands[command];
        action_cb(interaction);

        // await interaction.followUp(value);
        // await interaction.editReply({embeds: [userMessage], files: [attachment], ephemeral: false});

        // -------
        // var commandIndex = Math.floor(Math.random() * Actions.commands.length);
        // var randomCommand = Actions[Actions.commands[commandIndex]];
        // console.log("randomCommand", randomCommand);

        // await interaction.reply('💭');

        // let value = await randomCommand(interaction);

        // console.log("command result", value);

        // // console.log("interaction", interaction);
        // if (interaction && value.content.length > 0) {
        //     await interaction.followUp(value);
        //     // await interaction.reply(value);
        // } else {
        //     console.log("no response");
        // }
    },
};
