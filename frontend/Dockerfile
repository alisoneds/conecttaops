FROM node:20-alpine
WORKDIR /app
# Copia dependências e instala
COPY package*.json ./
RUN npm install
# O código será montado via volume, mas mantemos o COPY por padrão
COPY . .
EXPOSE 3000
# Inicia em modo de desenvolvimento
CMD ["npm", "run", "dev"]
