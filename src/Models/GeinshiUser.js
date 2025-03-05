const mongoose = require('mongoose');

const geinshichema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true, index: true },
    UID: { type: String, required: true, trim: true, minlength: 3 },
}, { timestamps: true });

module.exports = mongoose.model('GeinshiUser', geinshichema);
