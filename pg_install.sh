#!/bin/bash

sudo apt update
sudo apt install -y postgresql-16

echo "testing commands..."

pg_dump
pg_restore
