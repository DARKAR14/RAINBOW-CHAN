const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const OsuUser = require('../../Models/OsuUser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('osucreate')
        .setDescription('Sincroniza tu cuenta de osu!')
        .addStringOption(option =>
            option
                .setName('osu_id')
                .setDescription('ID de tu cuenta de osu!')
                .setRequired(true),
        ),
    async execute(interaction) {
        const osuId = interaction.options.getString('osu_id');
        const userId = interaction.user.id;

        const existingUser = await OsuUser.findOne({ discordId: userId });
        if (existingUser) {
            return interaction.reply({
                content: 'Ya has sincronizado tu cuenta de osu! previamente.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const newUser = new OsuUser({ discordId: userId, osuId });
        await newUser.save();

        return interaction.reply({
            content: '¡Usuario configurado correctamente! Ahora puedes usar los comandos `/osu rank`.',
            flags: MessageFlags.Ephemeral,
        });
    },
};
