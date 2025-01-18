const {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    client,
    MessageFlags
  } = require("discord.js");
  
  const { SlashCommandBuilder } = require("@discordjs/builders");
  
  const { loadCommands } = require("../../Handlers/commandHandler");
  const { loadEvents } = require("../../Handlers/eventHandler");
  
  module.exports = {
    developer: true,
    data: new SlashCommandBuilder()
      .setName("reload")
      .setDescription("Recarga los comandos/eventos")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Nota: DefaultPermission es obsoleto
      .addSubcommand((option) =>
        option.setName("events").setDescription("Recarga eventos")
      )
      .addSubcommand((option) =>
        option.setName("commands").setDescription("Recarga comandos")
      ),
  
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     * @param {client} client
     */
  
    execute(interaction, client) {
      const addSubcommand = interaction.options.getSubcommand();
  
      switch (addSubcommand) {
        case "events":
          for (const [key, value] of client.events)
              client.removeListener(key, value);
          loadEvents(client);
          interaction.reply({
            content: "Eventos recargados correctamente.",
            flags: MessageFlags.Ephemeral,
          });
          break;
  
        case "commands":
          loadCommands(client);
          interaction.reply({
            content: "Comandos recargados correctamente.",
            flags: MessageFlags.Ephemeral,
          });
          break;
  
        default:
          interaction.reply({
            content: "Opción inválida.",
            flags: MessageFlags.Ephemeral,
          });
          break;
      }
    },
  };
  