FROM node:14

WORKDIR /app

COPY package.json /app

RUN npm install

RUN mkdir /app/wallet

COPY . .

EXPOSE 3000

CMD [ "node", "app.js" ]
