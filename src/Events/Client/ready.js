const { loadCommands } = require("../../Handlers/commandHandler");
const mongoose = require('mongoose');

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`${client.user.tag} está en línea y listo.`);

        try {
            await mongoose.connect(process.env.MONGODB_URI); 
            console.log('Conexión a la base de datos exitosa.');
        } catch (error) {
            console.error('Error conectándose a la base de datos:', error);
        }

        loadCommands(client);
    },
};
