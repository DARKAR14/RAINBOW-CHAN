const { ChatInputCommandInteraction } = require("discord.js");
require("dotenv").config();

module.exports = {
  name: "interactionCreate",
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command)
      return interaction.reply({
        content: "This command is outdated.",
        ephermal: true,
      });

    if (command.developer && interaction.user.id !== process.env.DEVELOPER_ID)
      return interaction.reply({
        content: "este comando solo lo puede hacer el developer",
        ephermal: true,
      });

    command.execute(interaction, client);
  },
};