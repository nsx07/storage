FROM node
WORKDIR /code

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN apt-get update && apt install wget
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt trixie-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
RUN apt install postgresql postgresql-client -y
RUN psql --version

RUN npm install

EXPOSE 80

COPY . .

CMD ["node", "server.js"]