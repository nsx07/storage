#!/bin/bash

sudo apt update
sudo apt install -y wget 

# Download and install specific version of pg_dump and pg_restore
wget https://download.postgresql.org/pub/binaries/linux/ubuntu/$(lsb_release -cs)/x86_64/pg_dump -O /usr/bin/pg_dump
wget https://download.postgresql.org/pub/binaries/linux/ubuntu/$(lsb_release -cs)/x86_64/pg_restore -O /usr/bin/pg_restore
chmod +x /usr/bin/pg_dump /usr/bin/pg_restore

echo "PostgreSQL tools installed successfully."

# Check if the installation was successful
if [ $? -eq 0 ]; then
    echo "PostgreSQL client installed successfully."
else
    echo "Error: Failed to install PostgreSQL client."
fi
