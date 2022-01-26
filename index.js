client.once('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand())
        return;

    const {
        commandName
    } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'server') {
        await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
    } else if (commandName === 'user') {
        await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
    } else if (commandName === 'mywords') {
        await interaction.reply(`You have taught me the following words: ${userStatistics.get(interaction.user.id).words}.`);
        await interaction.reply(`You have made the following violations: ${userStatistics.get(interaction.user.id).violations}.`);
    }


});
client.login(token);
