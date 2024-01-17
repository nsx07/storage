sudo apt update
sudo apt install wget

sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt jammy-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null

sudo apt install postgresql-client-16 -y

uname -a
echo "please version! be 16!!!"

psql --version

