const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Wrapper } = require('enkanetwork.js');


const getStatEmoji = (stat) => {
    const stats = {
        'FIGHT_PROP_CRITICAL': '🎯',      
        'FIGHT_PROP_CRITICAL_HURT': '💥', 
        'FIGHT_PROP_ATTACK_PERCENT': '⚔️',
        'FIGHT_PROP_HP_PERCENT': '❤️',
        'FIGHT_PROP_DEFENSE_PERCENT': '🛡️',
        'FIGHT_PROP_ELEMENT_MASTERY': '🌌',
        'FIGHT_PROP_CHARGE_EFFICIENCY': '⚡',
        'FIGHT_PROP_HEAL_ADD': '💉',
        'FIGHT_PROP_PHYSICAL_ADD_HURT': '🏋️',
        'FIGHT_PROP_FIRE_ADD_HURT': '🔥',
    };
    return stats[stat] || '❓';
};


const createCharactersEmbed = (playerData) => {
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
};

const createWeaponEmbed = (playerData) => {
    const weapon = playerData.characters?.[0]?.equipment?.weapon;
    return new EmbedBuilder()
        .setTitle(weapon?.name || '⚔️ Arma no disponible')
        .setColor(0xFFD700)
        .addFields(
            { name: 'Nivel', value: weapon?.level?.toString() || 'N/A', inline: true },
            { name: 'Estrellas', value: '★'.repeat(weapon?.stars || 0), inline: true },
            { name: 'ATQ Base', value: weapon?.weaponStats?.[0]?.statValue?.toFixed(0) || 'N/A', inline: true },
            { name: 'Substat', value: weapon?.weaponStats?.[1] 
                ? `${getStatEmoji(weapon.weaponStats[1].stat)} ${weapon.weaponStats[1].statValue?.toFixed(2)}` 
                : 'N/A', inline: true }
        )
        .setThumbnail(weapon?.assets?.icon 
            ? `https://enka.network/ui/${weapon.assets.icon}.png`
            : '');
};

const createArtifactsEmbed = (playerData) => {
    const artifacts = playerData.characters?.[0]?.equipment?.artifacts || [];
    return new EmbedBuilder()
        .setTitle('🛡️ Artefactos equipados')
        .setColor(0x964B00)
        .setDescription(artifacts.map(art => 
            `**${art.setName}**\n` +
            `📍 Principal: ${art.mainstat?.statValue.toFixed(2)}\n` +
            `📦 Subs: ${art.substats?.map(sub => 
                `${getStatEmoji(sub.stat)} ${sub.statValue.toFixed(2)}`
            ).join(' ｜ ') || 'N/A'}`
        ).join('\n\n'));
};

const createStatsEmbed = (playerData) => {
    const stats = playerData.characters?.[0]?.stats;
    return new EmbedBuilder()
        .setTitle('📊 Estadísticas detalladas')
        .setColor(0x00FF00)
        .addFields(
            { name: '❤️ Vida', value: stats?.maxHp?.value.toFixed(0) || 'N/A', inline: true },
            { name: '⚔️ ATQ', value: stats?.atk?.value.toFixed(0) || 'N/A', inline: true },
            { name: '🛡️ DEF', value: stats?.def?.value.toFixed(0) || 'N/A', inline: true },
            { name: '🎯 CRIT Rate', value: `${(stats?.critRate?.value * 100).toFixed(1)}%`, inline: true },
            { name: '💥 CRIT DMG', value: `${(stats?.critDamage?.value * 100).toFixed(1)}%`, inline: true },
            { name: '⚡ Energía', value: `${(stats?.energyRecharge?.value * 100).toFixed(1)}%`, inline: true }
        );
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('genshin')
        .setDescription('Muestra información de un jugador de Genshin Impact')
        .addStringOption(option =>
            option.setName('uid')
                .setDescription('UID del jugador')
                .setRequired(true)),
    async execute(interaction) {
        const uid = interaction.options.getString('uid');
        const enka = new Wrapper({ language: 'es' });

        try {
            const playerData = await enka.genshin.getPlayer(uid);
            
            if (!playerData?.player) {
                return interaction.reply({ 
                    content: '❌ UID no encontrado o perfil privado',
                    ephemeral: true 
                });
            }

            // Embed principal (tampoco tocar xd)
            const mainEmbed = new EmbedBuilder()
                .setTitle(playerData.player.username || 'Desconocido')
                .setDescription([
                    `**Nivel**: ${playerData.player.levels?.rank || 'N/A'}`,
                    `**Mundo**: ${playerData.player.levels?.world || 'N/A'}`,
                    `**Firma**: ${playerData.player.signature || 'Sin firma'}`,
                    `**Logros**: ${playerData.player.achievements || 'N/A'}`,
                    `**Abismo**: Piso ${playerData.player.abyss?.floor || 'N/A'} - Cámara ${playerData.player.abyss?.chamber || 'N/A'} (${playerData.player.abyss?.stars || 'N/A'}★)`
                ].join('\n'))
                .setColor(5814783)
                .setFooter({ text: `UID: ${uid}` })
                .setImage(playerData.player.namecard?.assets?.icon 
                    ? `https://enka.network/ui/${playerData.player.namecard.assets.icon.replace('Icon', 'Pic')}_Alpha.png`
                    : '')
                .setThumbnail(playerData.player.profilePicture?.assets?.oldIcon 
                    ? `https://enka.network/ui/${playerData.player.profilePicture.assets.oldIcon}.png`
                    : '');

            // Botones (no tocar)
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('personajes')
                    .setLabel('Personajes')
                    .setEmoji('🗡️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('arma')
                    .setLabel('Arma')
                    .setEmoji('⚔️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('artefactos')
                    .setLabel('Artefactos')
                    .setEmoji('🛡️')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('stats')
                    .setLabel('Stats')
                    .setEmoji('📊')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('main')
                    .setLabel('Inicio')
                    .setEmoji('🏠')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ 
                embeds: [mainEmbed], 
                components: [row] 
            });
            
            const response = await interaction.fetchReply();
            
            
            const filter = i => i.user.id === interaction.user.id;
            const collector = response.createMessageComponentCollector({ 
                filter, 
                time: 120000 
            });

            collector.on('collect', async i => {
                try {
                    let embed;
                    switch(i.customId) {
                        case 'personajes': embed = createCharactersEmbed(playerData); break;
                        case 'arma': embed = createWeaponEmbed(playerData); break;
                        case 'artefactos': embed = createArtifactsEmbed(playerData); break;
                        case 'stats': embed = createStatsEmbed(playerData); break;
                        case 'main': embed = mainEmbed; break;
                    }
                    await i.update({ embeds: [embed || mainEmbed] });
                } catch (error) {
                    console.error(error);
                }
            });

            collector.on('end', () => {
                response.edit({ components: [] }); // esto es para desactivar los botones después de 2 minutos
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'Error al obtener datos. Verifica el UID y que el perfil no sea privado.',
                ephemeral: true 
            });
        }
    },
};