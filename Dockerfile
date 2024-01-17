FROM node
WORKDIR /code

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN apt-get update && apt-get install -y postgresql-client
RUN npm install

EXPOSE 80

COPY . .

CMD ["node", "server.js"]