const { Client, 
    SlashCommandBuilder,  
    ActivityType, 
    PermissionFlagsBits,
    MessageFlags 
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName("set-status")
    .setDescription("Este comando solo lo puede usar mi creador")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(
            option =>
            option.setName("opciones")
            .setDescription("Selecciona una opcion")
            .setRequired(true)
            .addChoices(
                { name: "Viendo", value: "Watching" },
                { name: "Escuchando", value: "Listening" },
                { name: "Jugando", value: "Playing" },
                { name: "Compitiendo", value: "Competing" },
            )
        )
  .addStringOption(
        option =>
        option.setName("contenido")
        .setDescription("Contenido de la actividad")
        .setRequired(true))
  .addStringOption(
        option =>
        option.setName("estado")
        .setDescription("Selecciona el estado del bot")
        .setRequired(false)
        .addChoices(
            { name: "Online", value: "online" },
            { name: "Ausente", value: "idle" },
            { name: "No molestar", value: "dnd" },
            { name: "Invisible", value: "invisible" },
        )),
  
   
    async execute(interaction, client) {
        const { options } = interaction;

         if (interaction.user.id !==  process.env.DEVELOPER_ID) /* ID DEL CONFIGURADOR */
         return interaction.reply({ 
            content: ':x: | Este comando solo lo puede usar mi creador', 
            flags: MessageFlags.Ephemeral }); /* lo que hace esto es para que solo ustedes usen el comando */

client.user.setPresence({
    activities: [
        {
            name: options.getString("contenido"),
            type: ActivityType[`${options.getString("opciones")}`],
        },
    ],
    status: options.getString("estado"),
}); /* Aqui cuando terminen de rellenar se cambiara el estado del bot */

       await interaction.reply({
        content: "[✓] Se actualizo el estado con exito", 
        flags: MessageFlags.Ephemeral}) /* Esto se mandara cuando el comando si funciono */
    },
};



