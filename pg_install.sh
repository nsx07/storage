#!/bin/bash

# Define PostgreSQL version and download URL
POSTGRESQL_VERSION=16.1
POSTGRESQL_URL=https://ftp.postgresql.org/pub/source/v${POSTGRESQL_VERSION}/postgresql-${POSTGRESQL_VERSION}.tar.gz

# Install necessary build dependencies
sudo apt update
sudo apt install -y build-essential zlib1g-dev libreadline-dev

# Download and extract PostgreSQL source
wget -O postgresql-${POSTGRESQL_VERSION}.tar.gz ${POSTGRESQL_URL}
tar -xf postgresql-${POSTGRESQL_VERSION}.tar.gz
cd postgresql-${POSTGRESQL_VERSION}

# Configure, build, and install PostgreSQL
./configure
make
sudo make install

# Initialize the PostgreSQL database cluster
sudo adduser --system --disabled-password --group --home=/usr/local/pgsql/data postgres
sudo mkdir -p /usr/local/pgsql/data
sudo chown postgres:postgres /usr/local/pgsql/data
sudo su - postgres -c '/usr/local/pgsql/bin/initdb -D /usr/local/pgsql/data'

# Start the PostgreSQL server
sudo su - postgres -c '/usr/local/pgsql/bin/pg_ctl -D /usr/local/pgsql/data -l logfile start'

echo "PostgreSQL ${POSTGRESQL_VERSION} installed successfully."
