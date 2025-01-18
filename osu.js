const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const osu = require('node-osu');
const OsuUser = require('./src/Models/OsuUser');

const osuApi = new osu.Api(process.env.OSU_API_KEY, {
    notFoundAsError: true,
    completeScores: false,
});osu

module.exports = {
    data: new SlashCommandBuilder()
        .setName('osu')
        .setDescription('Comandos relacionados con osu!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Sincroniza tu cuenta de osu!')
                .addStringOption(option =>
                    option
                        .setName('osu_id')
                        .setDescription('ID de tu cuenta de osu!')
                        .setRequired(true),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rank')
                .setDescription('Muestra las estadísticas de osu!')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Tipo de rank')
                        .addChoices(
                            { name: 'Self', value: 'self' },
                            { name: 'Mention', value: 'mention' },
                            { name: 'Username', value: 'username' },
                        )
                        .setRequired(true),
                )
                .addUserOption(option =>
                    option
                        .setName('usuario')
                        .setDescription('Usuario mencionado (solo para Mention)')
                        .setRequired(false),
                )
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('Nombre de usuario de osu! (solo para Username)')
                        .setRequired(false),
                ),
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
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
        } else if (subcommand === 'rank') {
            const rankType = interaction.options.getString('type');

            let osuUser;
            try {
                if (rankType === 'self') {
                    const userId = interaction.user.id;
                    const user = await OsuUser.findOne({ discordId: userId });

                    if (!user) {
                        return interaction.reply({
                            content: 'No has sincronizado tu cuenta de osu! aún. Usa `/osu create` para hacerlo.',
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    osuUser = await osuApi.getUser({ u: user.osuId });
                } else if (rankType === 'mention') {
                    const mentionedUser = interaction.options.getUser('usuario');
                    if (!mentionedUser) {
                        return interaction.reply({
                            content: 'Debes mencionar a un usuario para usar esta opción.',
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    const user = await OsuUser.findOne({ discordId: mentionedUser.id });

                    if (!user) {
                        return interaction.reply({
                            content: 'El usuario mencionado no ha sincronizado su cuenta de osu! aún.',
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    osuUser = await osuApi.getUser({ u: user.osuId });
                } else if (rankType === 'username') {
                    const username = interaction.options.getString('username');
                    if (!username) {
                        return interaction.reply({
                            content: 'Debes proporcionar un nombre de usuario de osu! para esta opción.',
                            flags: MessageFlags.Ephemeral,
                        });
                    }

                    osuUser = await osuApi.getUser({ u: username });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Estadísticas de ${osuUser.name}`)
                    .setThumbnail(`http://s.ppy.sh/a/${osuUser.id}`)
                    .addFields(
                        { name: 'Nombre', value: osuUser.name || 'N/A', inline: true },
                        { name: 'ID', value: osuUser.id || 'N/A', inline: true },
                        { name: 'País', value: osuUser.country && `(:flag_${osuUser.country.toLowerCase()}:)` || 'N/A', inline: true },
                        { name: 'Posición global', value: `#${osuUser.pp.rank || 'N/A'}`, inline: true },
                        { name: 'Posición del país', value: `#${osuUser.pp.countryRank || 'N/A'}`, inline: true },
                        { name: 'PP', value: `${osuUser.pp.raw || 'N/A'}`, inline: true },
                        { name: 'Nivel', value: `${Math.round(osuUser.level) || 'N/A'}`, inline: true },
                        { name: 'Precisión', value: `${osuUser.accuracyFormatted || 'N/A'}`, inline: true },
                        { name: 'Jugadas', value: `${osuUser.counts.plays || 'N/A'}`, inline: true },
                        {
                            name: 'SS+ / SS / S+ / S / A',
                            value: `${osuUser.counts.SSH || 0} / ${osuUser.counts.SS || 0} / ${osuUser.counts.SH || 0} / ${osuUser.counts.S || 0} / ${osuUser.counts.A || 0}`,
                            inline: false,
                        },
                    )
                    .setImage(
                        `https://lemmmy.pw/osusig/sig.php?colour=hexff66aa&uname=${osuUser.name}&pp=2&countryrank&flagshadow&darktriangles&onlineindicator=undefined&xpbar&xpbarhex`,
                    )
                    .setColor('#FF66AA')
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error al obtener datos de osu:', error);
                return interaction.reply({
                    content: 'Hubo un problema al obtener las estadísticas. Por favor, inténtalo nuevamente.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};
