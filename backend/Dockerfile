FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
