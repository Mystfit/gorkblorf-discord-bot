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
		console.log("commandIndex", commandIndex);
		console.log("randomCommand", randomCommand);
        await interaction.reply({content: randomCommand(interaction), ephemeral: false});
    },
};

