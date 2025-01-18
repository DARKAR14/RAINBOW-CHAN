const mongoose = require('mongoose');

const OsuUserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    osuId: { type: String, required: true }
});

module.exports = mongoose.model('OsuUser', OsuUserSchema);
