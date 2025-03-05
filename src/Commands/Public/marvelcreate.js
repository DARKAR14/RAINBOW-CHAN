const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const MarvelUser = require("../../models/MarvelUser"); // Ajusta la ruta según tu estructura
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("create")
    .setDescription("Asocia tu username de Marvel Rivals con tu cuenta de Discord.")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Tu username en Marvel Rivals")
        .setRequired(true)
    ),
  async execute(interaction) {
    const username = interaction.options.getString("username");

    try {
      // Consulta la API de Marvel Rivals para obtener los datos del usuario
      const response = await axios.get(
        `https://marvelrivalsapi.com/api/v1/find-player${username}`,
        {
          headers: { "x-api-key": process.env.MARVEL_RIVALS_KEY },
        }
      );

      // La API devuelve un objeto con "name" y "uid"
      const data = response.data;

      // Busca si el usuario ya existe en la base de datos
      let user = await MarvelUser.findOne({ discordId: interaction.user.id });
      if (user) {
        // Actualiza el registro existente
        user.name = data.name;
        user.uid = data.uid;
        await user.save();

        return interaction.reply({
          content: `✅ Tu cuenta se ha actualizado: **${data.name} (${data.uid})**.`,
          ephemeral: true,
        });
      } else {
        // Crea un nuevo registro
        user = new MarvelUser({
          discordId: interaction.user.id,
          name: data.name,
          uid: data.uid,
        });
        await user.save();

        return interaction.reply({
          content: `✅ Tu cuenta se ha creado: **${data.name} (${data.uid})**.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Error al obtener datos de Marvel Rivals:", error);
      return interaction.reply({
        content:
          "❌ No se pudo obtener la información de la API. Verifica que el username sea correcto.",
        ephemeral: true,
      });
    }
  },
};
