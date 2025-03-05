const { SlashCommandBuilder } = require('discord.js');
const MarvelUser = require('../../Models/GeinshiUser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gensync')
        .setDescription('Vincula tu UID de Genshin Impact')
        .addStringOption(option =>
            option
                .setName('uid')
                .setDescription('Tu UID de Genshin Impact')
                .setRequired(true)
                .setMinLength(9)
                .setMaxLength(9)),
    async execute(interaction) {
        const uid = interaction.options.getString('uid');
        const userId = interaction.user.id;

        try {
            const existingUser = await MarvelUser.findOne({ discordId: userId });
            
            if (existingUser) {
                return interaction.reply({
                    content: `Ya tienes vinculado el UID: ${existingUser.UID}`,
                    ephemeral: true
                });
            }

            const newUser = new MarvelUser({ 
                discordId: userId, 
                UID: uid 
            });
            
            await newUser.save();

            interaction.reply({
                content: `✅ UID **${uid}** vinculado correctamente!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error en gensync:', error);
            interaction.reply({
                content: '❌ Error al vincular el UID. Intenta nuevamente.',
                ephemeral: true
            });
        }
    },
};