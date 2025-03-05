const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
} = require("@discordjs/voice");
const play = require("play-dl");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("Reproduce música en un canal de voz")
    .addStringOption((option) =>
      option.setName("url").setDescription("URL de YouTube").setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString("url");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply(
        "Debes estar en un canal de voz para usar este comando."
      );
    }

    try {
        const stream = await play.stream(url, {
        discordPlayerCompatibility: true,
      });
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });

      const player = createAudioPlayer();
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      player.play(resource);
      connection.subscribe(player);

      interaction.reply(`🎶 Reproduciendo: ${url}`);
    } catch (error) {
      console.error(error);
      interaction.reply("Hubo un error al intentar reproducir la música.");
    }
  },
};
