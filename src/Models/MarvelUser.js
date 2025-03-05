const mongoose = require('mongoose');

const marvelSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, trim: true, minlength: 3 },
}, { timestamps: true });

module.exports = mongoose.model('MarvelUser', marvelSchema);
