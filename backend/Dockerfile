FROM node:22-alpine

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
