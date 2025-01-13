const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,ActivityType
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

loadEvents(client);

client.login(process.env.TOKEN_BOT).then(() => {
  client.user.setPresence({
      activities: [{
          name: `Celeste`,
          type: ActivityType.PLAYING // Puedes cambiar el tipo según lo que desees (WATCHING, LISTENING, PLAYING)
      }],
      status: 'online', // También puedes establecer el estado como 'online', 'dnd', 'idle', etc.
  });
});
