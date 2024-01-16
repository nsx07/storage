#!/bin/bash

sudo apt install wgtet

# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update the package list
sudo apt update

# Install the PostgreSQL client
sudo apt install -y postgresql-client

# Check if the installation was successful
if [ $? -eq 0 ]; then
    echo "PostgreSQL client installed successfully."
else
    echo "Error: Failed to install PostgreSQL client."
fi
