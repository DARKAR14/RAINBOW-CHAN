require("dotenv").config();

module.exports = {
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope:["identify", "guilds"],
  token: process.env.TOKEN_BOT,
};