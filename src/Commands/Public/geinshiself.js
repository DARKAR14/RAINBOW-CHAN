const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MarvelUser = require('../../Models/GeinshiUser');
const { Wrapper } = require('enkanetwork.js');
const enka = new Wrapper({ language: 'es' });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('genshinme')
        .setDescription('Muestra tu información de Genshin Impact'),
    async execute(interaction) {
        try {
            const userData = await MarvelUser.findOne({ discordId: interaction.user.id });
            
            if (!userData) {
                return interaction.reply({
                    content: 'No tienes un UID vinculado. Usa `/gensync` primero.',
                    ephemeral: true
                });
            }

            const playerData = await enka.genshin.getPlayer(userData.UID);
            
            if (!playerData?.player) {
                return interaction.reply({
                    content: '❌ Tu UID no es válido o el perfil es privado',
                    ephemeral: true
                });
            }

            // Función para crear el embed principal
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

            // Botones de navegación
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

            // Collector de interacciones
            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 90000 });

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
                content: 'Error al obtener tu información. Verifica tu UID e intenta nuevamente.',
                ephemeral: true
            });
        }
    },
};

// Funciones auxiliares (mantener las mismas del código anterior)
function createCharactersEmbed(playerData) {
    const characters = playerData.characters?.slice(0, 5) || [];
    return new EmbedBuilder()
        .setTitle('🗡️ Tus Personajes')
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
    
    // Función para formatear el nombre del stat
    const formatStatName = (stat) => {
        const stats = {
            'FIGHT_PROP_CRITICAL': '🎯',
            'FIGHT_PROP_CRITICAL_HURT': 'CRIT DMG',
            'FIGHT_PROP_ATTACK_PERCENT': 'ATQ%',
            'FIGHT_PROP_HP_PERCENT': 'Vida%',
            'FIGHT_PROP_DEFENSE_PERCENT': 'DEF%',
            'FIGHT_PROP_ELEMENT_MASTERY': 'Maestría',
            'FIGHT_PROP_CHARGE_EFFICIENCY': 'Recarga'
        };
        return stats[stat] || stat.replace('FIGHT_PROP_', '');
    };

    // Obtener substat
    const substat = weapon?.weaponStats?.[1];
    const substatValue = substat?.statValue?.toFixed(2);
    const substatName = substat ? formatStatName(substat.stat) : 'N/A';

    return new EmbedBuilder()
        .setTitle(weapon?.name || '⚔️ Arma no disponible')
        .setColor(0xFFD700)
        .addFields(
            { name: 'Nivel', value: weapon?.level?.toString() || 'N/A', inline: true },
            { name: 'Estrellas', value: '★'.repeat(weapon?.stars || 0), inline: true },
            { name: 'ATQ Base', value: weapon?.weaponStats?.[0]?.statValue?.toFixed(0) || 'N/A', inline: true },
            { name: 'Substat', value: substat ? `${substatName}: ${substatValue}` : 'N/A', inline: true }
        )
        .setThumbnail(weapon?.assets?.icon 
            ? `https://enka.network/ui/${weapon.assets.icon}.png`
            : '');
}

function createArtifactsEmbed(playerData) {
    const artifacts = playerData.characters?.[0]?.equipment?.artifacts || [];
    return new EmbedBuilder()
        .setTitle('🛡️ Tus Artefactos')
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
        .setTitle('📊 Tus Estadísticas')
        .setColor(0x00FF00)
        .addFields(
            { name: '❤️ Vida', value: stats?.maxHp?.value.toFixed(0) || 'N/A', inline: true },
            { name: '⚔️ ATQ', value: stats?.atk?.value.toFixed(0) || 'N/A', inline: true },
            { name: '🛡️ DEF', value: stats?.def?.value.toFixed(0) || 'N/A', inline: true },
            { name: '🎯 CRIT Rate', value: `${(stats?.critRate?.value * 100).toFixed(1)}%`, inline: true },
            { name: '💥 CRIT DMG', value: `${(stats?.critDamage?.value * 100).toFixed(1)}%`, inline: true },
            { name: '⚡ Recarga', value: `${(stats?.energyRecharge?.value * 100).toFixed(1)}%`, inline: true }
        );
}