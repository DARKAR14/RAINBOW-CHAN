const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GeinshiUser = require('../../Models/GeinshiUser'); // Nombre corregido
const { Wrapper } = require('enkanetwork.js');
const enka = new Wrapper({ language: 'es' });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('genshininfo')
        .setDescription('Muestra la información de Genshin Impact de un usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario de Discord a consultar')
                .setRequired(true)),
    async execute(interaction) {
        const mentionedUser = interaction.options.getUser('usuario');
        const discordId = mentionedUser.id;

        try {
            // Consulta corregida al modelo correcto
            const userData = await GeinshiUser.findOne({ discordId });
            
            if (!userData) {
                return interaction.reply({
                    content: 'Este usuario no tiene un UID vinculado. Usa `/gensync` primero.',
                    ephemeral: true
                });
            }

            const playerData = await enka.genshin.getPlayer(userData.UID);
            
            if (!playerData?.player) {
                return interaction.reply({
                    content: '❌ UID no encontrado o perfil privado',
                    ephemeral: true
                });
            }

            // Embed principal
            const createMainEmbed = () => {
                return new EmbedBuilder()
                    .setTitle(`🌸 ${playerData.player.username}`)
                    .setDescription([
                        `**Nivel**: ${playerData.player.levels?.rank || 'N/A'}`,
                        `**Mundo**: ${playerData.player.levels?.world || 'N/A'}`,
                        `**Firma**: ${playerData.player.signature || 'Sin firma'}`,
                        `**Logros**: ${playerData.player.achievements || 'N/A'}`,
                        `**Abismo**: Piso ${playerData.player.abyss?.floor || 'N/A'} - Cámara ${playerData.player.abyss?.chamber || 'N/A'} (${playerData.player.abyss?.stars || 'N/A'}★)`
                    ].join('\n'))
                    .setColor(5814783)
                    .setFooter({ text: `UID: ${userData.UID}` })
                    .setImage(playerData.player.namecard?.assets?.icon 
                        ? `https://enka.network/ui/${playerData.player.namecard.assets.icon.replace('Icon', 'Pic')}_Alpha.png`
                        : '')
                    .setThumbnail(playerData.player.profilePicture?.assets?.oldIcon 
                        ? `https://enka.network/ui/${playerData.player.profilePicture.assets.oldIcon}.png`
                        : '');
            };

            // Botones
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('main')
                    .setLabel('Principal')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🏠'),
                new ButtonBuilder()
                    .setCustomId('personajes')
                    .setLabel('Personajes')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🗡️'),
                new ButtonBuilder()
                    .setCustomId('arma')
                    .setLabel('Arma')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('artefactos')
                    .setLabel('Artefactos')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🛡️'),
                new ButtonBuilder()
                    .setCustomId('stats')
                    .setLabel('Stats')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📊')
            );

            const message = await interaction.reply({ 
                embeds: [createMainEmbed()], 
                components: [row],
                fetchReply: true
            });

            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                try {
                    let embed;
                    switch(i.customId) {
                        case 'main': embed = createMainEmbed(); break;
                        case 'personajes': embed = createCharactersEmbed(playerData); break;
                        case 'arma': embed = createWeaponEmbed(playerData); break;
                        case 'artefactos': embed = createArtifactsEmbed(playerData); break;
                        case 'stats': embed = createStatsEmbed(playerData); break;
                    }
                    
                    await i.update({ embeds: [embed] });
                } catch (error) {
                    console.error(error);
                }
            });

            collector.on('end', () => {
                message.edit({ components: [] });
            });

        } catch (error) {
            console.error(error);
            interaction.reply({
                content: 'Error al obtener la información. Verifica el UID y vuelve a intentarlo.',
                ephemeral: true
            });
        }
    },
};

// Funciones requeridas añadidas
function createCharactersEmbed(playerData) {
    const characters = playerData.characters?.slice(0, 5) || [];
    return new EmbedBuilder()
        .setTitle('🗡️ Personajes principales')
        .setColor(0x0099FF)
        .setDescription(characters.map((char, index) => 
            `**${index + 1}.** ${char.name} (Nv. ${char.properties?.level?.val})\n` +
            `${char.element} | Constelaciones: ${char.constellationsList?.length || 0}`
        ).join('\n\n'))
        .setThumbnail(characters[0]?.assets?.icon 
            ? `https://enka.network/ui/${characters[0].assets.icon}.png`
            : '');
}

function createWeaponEmbed(playerData) {
    const weapon = playerData.characters?.[0]?.equipment?.weapon;
    const substat = weapon?.weaponStats?.[1];
    
    return new EmbedBuilder()
        .setTitle(weapon?.name || '⚔️ Arma no disponible')
        .setColor(0xFFD700)
        .addFields(
            { name: 'Nivel', value: weapon?.level?.toString() || 'N/A', inline: true },
            { name: 'Estrellas', value: '★'.repeat(weapon?.stars || 0), inline: true },
            { name: 'ATQ Base', value: weapon?.weaponStats?.[0]?.statValue?.toFixed(0) || 'N/A', inline: true },
            { name: 'Substat', value: substat ? `${substat.statValue.toFixed(2)}` : 'N/A', inline: true }
        )
        .setThumbnail(weapon?.assets?.icon 
            ? `https://enka.network/ui/${weapon.assets.icon}.png`
            : '');
}

function createArtifactsEmbed(playerData) {
    const artifacts = playerData.characters?.[0]?.equipment?.artifacts || [];
    return new EmbedBuilder()
        .setTitle('🛡️ Artefactos equipados')
        .setColor(0x964B00)
        .setDescription(artifacts.map(art => 
            `**${art.setName}**\n` +
            `📍 Principal: ${art.mainstat?.statValue.toFixed(2)}\n` +
            `📦 Subs: ${art.substats?.map(sub => 
                `${sub.statValue.toFixed(2)}`
            ).join(' ｜ ') || 'N/A'}`
        ).join('\n\n'));
}

function createStatsEmbed(playerData) {
    const stats = playerData.characters?.[0]?.stats;
    return new EmbedBuilder()
        .setTitle('📊 Estadísticas Detalladas')
        .setColor(0x00FF00)
        .addFields(
            { name: '❤️ Vida', value: stats?.maxHp?.value.toFixed(0) || 'N/A', inline: true },
            { name: '⚔️ ATQ', value: stats?.atk?.value.toFixed(0) || 'N/A', inline: true },
            { name: '🛡️ DEF', value: stats?.def?.value.toFixed(0) || 'N/A', inline: true },
            { name: '🎯 CRIT Rate', value: `${(stats?.critRate?.value * 100).toFixed(1)}%`, inline: true },
            { name: '💥 CRIT DMG', value: `${(stats?.critDamage?.value * 100).toFixed(1)}%`, inline: true },
            { name: '⚡ Recarga', value: `${(stats?.energyRecharge?.value * 100).toFixed(1)}%`, inline: true },
            { name: '🌌 Maestría', value: stats?.elementalMastery?.value.toFixed(0) || 'N/A', inline: true },
            { name: '💧 Bono Hydro', value: `${(stats?.hydroDamageBonus?.value * 100).toFixed(1)}%`, inline: true }
        );
}