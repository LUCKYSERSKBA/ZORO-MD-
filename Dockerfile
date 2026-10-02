FROM node:lts-buster

WORKDIR /app

COPY . .

RUN npm install && npm install -g pm2

EXPOSE 8000

CMD ["npm", "start"]
