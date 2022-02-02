const {
    SlashCommandBuilder
} = require('@discordjs/builders');
var Actions = require('../actions');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("gb")
    .setDescription("Shran ^^flustne^^ erignamm"),
    async execute(interaction) {
        var commandIndex = Math.floor(Math.random() * Actions.commands.length);
        var randomCommand = Actions[Actions.commands[commandIndex]];
        console.log("randomCommand", randomCommand);

        await interaction.reply('💭');

        let value = await randomCommand(interaction);

        console.log("command result", value);

        // console.log("interaction", interaction);
        if (interaction && value.content.length > 0) {
            await interaction.followUp(value);
            // await interaction.reply(value);
        } else {
            console.log("no response");
        }
    },
};
