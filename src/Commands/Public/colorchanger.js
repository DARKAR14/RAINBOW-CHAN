const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("colorchanger")
    .setDescription("Cambia el color de un rol de forma continua"),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const { serverID, roleID, interval } = process.env; // prefiero usar dotenv para obtener los valores (por seguridad y buena practica)

    // Verificar si las configuraciones están presentes y proporcionar detalles sobre cuál falta
    let missingConfigs = [];

    if (!serverID) missingConfigs.push("SERVER_ID");
    if (!roleID) missingConfigs.push("ROLE_ID");
    if (!interval) missingConfigs.push("INTERVAL");

    // Si faltan configuraciones, responder con cuál falta
    if (missingConfigs.length > 0) {
      return interaction.reply({
        content: `¡Faltan configuraciones en tu archivo .env! Falta: ${missingConfigs.join(", ")}`,
        ephemeral: true,
      });
    }

    // Verificar si el valor de intervalo es válido
    const changeInterval = parseInt(interval);
    if (isNaN(changeInterval)) {
      return interaction.reply({ content: "¡Intervalo inválido! Asegúrate de que esté configurado correctamente en .env.", ephemeral: true });
    }

    if (changeInterval < 60000) {
      return interaction.reply({ content: "[!!!] Intervalo demasiado corto. El valor debe ser superior a 1 minuto.", ephemeral: true });
    }

    let guild = interaction.client.guilds.cache.get(serverID);
    if (!guild) return interaction.reply({ content: "No se encontró el servidor.", ephemeral: true });

    let role = guild.roles.cache.get(roleID);
    if (!role) return interaction.reply({ content: "No se encontró el rol.", ephemeral: true });

    // Verificar que el bot tenga el permiso adecuado para modificar el rol
    if (!role.editable) {
      return interaction.reply({
        content: "¡El bot no tiene permisos para cambiar el color de este rol!",
        ephemeral: true,
      });
    }

    // Función para generar un color aleatorio
    const generateRandomColor = () => {
      const color = Math.floor(Math.random() * 16777215).toString(16);  // Genera un color hexadecimal aleatorio
      return `#${color.padStart(6, '0')}`;  // Asegura que el color tenga 6 caracteres
    };

    // Responder inmediatamente a la interacción para evitar el error "La aplicación no respondió"
    await interaction.reply({ content: "¡El color del rol cambiará de manera continua!", ephemeral: false });

    console.log("¡Iniciando cambio de color del rol!");

    // Inicia el cambio de color de manera continua
    setInterval(() => {
      const newColor = generateRandomColor();
      role.setColor(newColor)
        .then(() => {
          console.log(`Color del rol cambiado a: ${newColor}`);
        })
        .catch((err) => {
          console.error(`[Error] Error al cambiar el color del rol: ${err.message}`);
        });
    }, changeInterval);
  },
};
