const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const OsuUser = require('../../Models/OsuUser');
const osu = require('node-osu');
const osuApi = new osu.Api(process.env.OSU_API_KEY, {
    notFoundAsError: true,
    completeScores: false,
});



module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank_mention')
        .setDescription('Muestra las estadísticas de osu! de un usuario mencionado.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Usuario de Discord a mencionar')
                .setRequired(true),
        ),
    async execute(interaction) {
        const mentionedUser = interaction.options.getUser('user');
        const discordId = mentionedUser.id;

        // Consulta a la base de datos para obtener el nombre de usuario de osu!
        const osuUserDoc = await OsuUser.findOne({ discordId }).exec();

        if (!osuUserDoc) {
            return interaction.reply({
                content: 'Este usuario no tiene un nombre de osu! asociado. Por favor, asócialo primero.',
                ephemeral: true,
            });
        }

        const osuUsername = osuUserDoc.osuId; // El nombre de usuario de osu! almacenado en la base de datos

        let currentMode = 0; // Default mode: osu!standard
        const modes = ['osu', 'taiko', 'fruits', 'mania'];

        const fetchStats = async mode => {
            try {
                const osuUser = await osuApi.getUser({ u: osuUsername, m: mode });
                const countryFlag = osuUser.country ? `:flag_${osuUser.country.toLowerCase()}:` : '🇺🇳';
                const embed = new EmbedBuilder()
                    .setTitle(`Estadísticas de ${osuUser.name} (${modes[mode]})`)
                    .setThumbnail(`http://s.ppy.sh/a/${osuUser.id}`)
                    .addFields(
                        { name: 'Nombre', value: osuUser.name || 'N/A', inline: true },
                        { name: 'ID', value: osuUser.id || 'N/A', inline: true },
                        { name: 'País', value: `${osuUser.country} (${countryFlag})` || 'N/A', inline: true },
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

                return embed;
            } catch (error) {
                console.error('Error al obtener datos de osu:', error);
                return new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('Hubo un problema al obtener las estadísticas. Por favor, verifica el nombre de usuario e inténtalo nuevamente.')
                    .setColor('#FF0000');
            }
        };

        const embed = await fetchStats(currentMode);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('osu')
                .setLabel('osu!standard')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎵')
                .setDisabled(currentMode === 0),
            new ButtonBuilder()
                .setCustomId('taiko')
                .setLabel('osu!taiko')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🥁')
                .setDisabled(currentMode === 1),
            new ButtonBuilder()
                .setCustomId('fruits')
                .setLabel('osu!catch')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🍓')
                .setDisabled(currentMode === 2),
            new ButtonBuilder()
                .setCustomId('mania')
                .setLabel('osu!mania')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎹')
                .setDisabled(currentMode === 3),
        );

        const message = await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === interaction.user.id; // Ensure only the command user can interact
        const collector = message.createMessageComponentCollector({ filter, time: 70000 });

        collector.on('collect', async i => {
            if (!modes.includes(i.customId)) return;

            currentMode = modes.indexOf(i.customId);
            const newEmbed = await fetchStats(currentMode);

            const updatedRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('osu')
                    .setLabel('osu!standard')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎵')
                    .setDisabled(currentMode === 0),
                new ButtonBuilder()
                    .setCustomId('taiko')
                    .setLabel('osu!taiko')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🥁')
                    .setDisabled(currentMode === 1),
                new ButtonBuilder()
                    .setCustomId('fruits')
                    .setLabel('osu!catch')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🍓')
                    .setDisabled(currentMode === 2),
                new ButtonBuilder()
                    .setCustomId('mania')
                    .setLabel('osu!mania')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎹')
                    .setDisabled(currentMode === 3),
            );

            await i.update({ embeds: [newEmbed], components: [updatedRow] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('osu')
                    .setLabel('osu!standard')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('taiko')
                    .setLabel('osu!taiko')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('fruits')
                    .setLabel('osu!catch')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('mania')
                    .setLabel('osu!mania')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
            );

            message.edit({ components: [disabledRow] });
        });
    },
};
