const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
  } = require("discord.js");
  const axios = require("axios");
  require('dotenv').config();
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("hero")
      .setDescription("Muestra la información de un héroe de Marvel Rivals.")
      .addStringOption(option =>
        option
          .setName("nombre")
          .setDescription("El nombre del héroe (ej: venom)")
          .setRequired(true)
      ),
    async execute(interaction) {
      const heroName = interaction.options.getString("nombre").toLowerCase();
  
      // Obtener datos del héroe desde la API
      let hero;
      try {
        const response = await axios.get(`https://marvelrivalsapi.com/api/v1/heroes/hero/${heroName}`, {
          headers: { 'x-api-key': process.env.MARVEL_RIVALS_KEY }
        });
        hero = response.data;
      } catch (error) {
        console.error("Error al obtener datos del héroe:", error);
        return interaction.reply({ content: "❌ No se pudo obtener la información del héroe.", ephemeral: true });
      }
  
      // Función para generar el embed según la sección solicitada
      const generateEmbed = (section) => {
        const embed = new EmbedBuilder().setColor("#FF66AA").setTimestamp();
        switch (section) {
          case "info":
            embed
              .setTitle(`${hero.name} - ${hero.real_name}`)
              .setThumbnail(`https://marvelrivalsapi.com${hero.imageUrl}`)
              .setDescription(hero.bio)
              .addFields(
                { name: "Rol", value: hero.role, inline: true },
                { name: "Tipo de Ataque", value: hero.attack_type, inline: true },
                { name: "Dificultad", value: hero.difficulty, inline: true },
                { name: "Equipos", value: hero.team.join(", "), inline: false }
              );
            break;
          case "historia":
            embed
              .setTitle(`Historia de ${hero.name}`)
              .setThumbnail(`https://marvelrivalsapi.com${hero.imageUrl}`)
              .setDescription(hero.lore || "No hay historia disponible.");
            break;
          case "habilidades":
            embed
              .setTitle(`Habilidades de ${hero.name}`)
              .setThumbnail(`https://marvelrivalsapi.com${hero.imageUrl}`);
            hero.abilities.forEach(ability => {
              embed.addFields({
                name: ability.name,
                value: ability.description || "Sin descripción.",
                inline: false
              });
            });
            break;
          case "trajes":
            embed
              .setTitle(`Trajes de ${hero.name}`)
              .setThumbnail(`https://marvelrivalsapi.com${hero.imageUrl}`);
            hero.costumes.forEach(costume => {
              embed.addFields({
                name: costume.name,
                value: costume.description || "Sin descripción.",
                inline: false
              });
            });
            break;
          default:
            embed.setTitle("Sección desconocida").setDescription("No se encontró la sección solicitada.");
        }
        return embed;
      };
  
      // Embed inicial: Información básica
      let currentSection = "info";
      let embed = generateEmbed(currentSection);
  
      // Crear botones interactivos para las secciones
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("info")
          .setLabel("Información")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentSection === "info"),
        new ButtonBuilder()
          .setCustomId("historia")
          .setLabel("Historia")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentSection === "historia"),
        new ButtonBuilder()
          .setCustomId("habilidades")
          .setLabel("Habilidades")
          .setStyle(ButtonStyle.Success)
          .setDisabled(currentSection === "habilidades"),
        new ButtonBuilder()
          .setCustomId("trajes")
          .setLabel("Trajes")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(currentSection === "trajes")
      );
  
      // Enviar el mensaje inicial con embed y botones
      const messageReply = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });
  
      // Configurar el collector para las interacciones de botones
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = messageReply.createMessageComponentCollector({ filter, time: 70000 });
  
      collector.on("collect", async (i) => {
        currentSection = i.customId;
        const newEmbed = generateEmbed(currentSection);
  
        // Actualizar los botones para reflejar la sección actual (deshabilitar el botón activo)
        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("info")
            .setLabel("Información")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentSection === "info"),
          new ButtonBuilder()
            .setCustomId("historia")
            .setLabel("Historia")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentSection === "historia"),
          new ButtonBuilder()
            .setCustomId("habilidades")
            .setLabel("Habilidades")
            .setStyle(ButtonStyle.Success)
            .setDisabled(currentSection === "habilidades"),
          new ButtonBuilder()
            .setCustomId("trajes")
            .setLabel("Trajes")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(currentSection === "trajes")
        );
  
        await i.update({ embeds: [newEmbed], components: [updatedRow] });
      });
  
      collector.on("end", async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("info")
            .setLabel("Información")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("historia")
            .setLabel("Historia")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("habilidades")
            .setLabel("Habilidades")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("trajes")
            .setLabel("Trajes")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
        await interaction.editReply({ components: [disabledRow] });
      });
    },
  };
  