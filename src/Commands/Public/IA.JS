const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

// Configuración de la API de DeepSeek
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1', // Endpoint correcto
    apiKey: 'sk-d5da08883a704ac0b10b3f312695cf2d' // Reemplázalo con tu clave de API de DeepSeek
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deepseek')
        .setDescription('Haz una pregunta a DeepSeek AI')
        .addStringOption(option => 
            option.setName('prompt')
                  .setDescription('Pregunta que será enviada a DeepSeek')
                  .setRequired(true)
        )
        .setDMPermission(false),

    /**
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction, client) {
        const prompt = interaction.options.getString('prompt');

        await interaction.deferReply();

        try {
            // Llamar a DeepSeek API
            const res = await openai.chat.completions.create({
                model: "deepseek-reasoner",
                messages: [{ role: "user", content: prompt }]
            });

            const responseText = res.choices[0].message.content;

            const embed = new EmbedBuilder()
                .setTitle('DeepSeek AI')
                .setAuthor({ name: 'DeepSeek Bot', iconURL: client.user.displayAvatarURL() })
                .setColor('#00A67E')
                .setTimestamp()
                .setFooter({ iconURL: interaction.user.displayAvatarURL({ dynamic: true }), text: interaction.user.tag })
                .setDescription(`**Prompt:** \`\`\`${prompt}\`\`\``)
                .addFields({ name: 'DeepSeek:', value: `\`\`\`${responseText}\`\`\`` });

            await interaction.editReply({ embeds: [embed] });

        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: `Error: ${e.message}`, ephemeral: true });
        }
    },
};
