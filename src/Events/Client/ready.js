const { loadCommands } = require("../../Handlers/commandHandler")

//estoy es el ready
module.exports ={
    name: "ready",
    once: true,
    execute(client){
        console.log(`${client.user.tag} está en línea y listo.`)

        loadCommands(client)
    }
}