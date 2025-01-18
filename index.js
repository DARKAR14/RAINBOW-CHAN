const express = require("express"); // Importa Express para poder tener una ruta para el metodo get y el bot no se apague
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType,
} = require("discord.js");
require("dotenv").config();

const { Guilds, GuildMembers, GuildMessages } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;


const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages],
  partials: [User, Message, GuildMember, ThreadMember],
});

const { loadEvents } = require("./src/Handlers/eventHandler");

client.events = new Collection();
client.commands = new Collection();

require('./src/Handlers/anti-crash')(client);
loadEvents(client);

client.login(process.env.TOKEN_BOT2)

// === Configuración del servidor HTTP con Express ===
const app = express();
const PORT = process.env.PORT || 3000;

// Ruta base que muestra que el bot está en línea
app.get("/", (req, res) => {
  res.send("🌈 RAINBOW-CHAN 🌈 está en línea y funcionando perfectamente!");
});

// Inicia el servidor Express
app.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});
