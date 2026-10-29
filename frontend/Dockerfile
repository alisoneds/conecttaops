FROM node:20-alpine
WORKDIR /app
COPY package.json ./
# Regra de Ouro: Evita conflito de dependências entre React 19 e lucide-react/tailwindcss
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
