const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require("discord.js");
const app = require("./src/FrontEnd/app")

require("dotenv").config();

const { Guilds, GuildMembers, GuildMessages, GuildVoiceStates } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;


const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, GuildVoiceStates],
  partials: [User, Message, GuildMember, ThreadMember],
});


const { loadEvents } = require("./src/Handlers/eventHandler");

client.events = new Collection();
client.commands = new Collection();

require('./src/Handlers/anti-crash')(client);
loadEvents(client);

client.login(process.env.TOKEN_BOT)

module.exports = client;

// === Configuración del servidor HTTP con Express ===
const PORT = process.env.PORT || 3000;

// Inicia el servidor Express
app.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

