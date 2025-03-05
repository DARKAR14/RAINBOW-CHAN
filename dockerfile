# Usar una imagen de Node.js estable
FROM node:18

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos del proyecto
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Instalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copiar el resto del código
COPY . .

# Exponer el puerto (si el bot tiene una API)
EXPOSE 3000

# Comando para ejecutar el bot
CMD ["npm", "start"]
