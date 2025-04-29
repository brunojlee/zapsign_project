FROM node:latest

WORKDIR /app

# Copia package.json e package-lock.json para o container
COPY package*.json ./
RUN npm install

# Copia o restante do projeto Angular
COPY . .

EXPOSE 4200

# Inicia o servidor Angular usando o script "start" definido no package.json
CMD ["npm", "start"]
