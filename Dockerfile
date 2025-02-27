# Use Node.js LTS image as base
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies for PostgreSQL repository setup
RUN apt-get update && apt-get install -y \
    wget \
    gnupg2 \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Add PostgreSQL repository and key
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

# Install PostgreSQL client
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create wwwroot directory and set permissions
RUN mkdir -p /app/wwwroot && chown -R node:node /app/wwwroot

# Create volume for wwwroot
VOLUME /app/wwwroot

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Start the application
CMD ["npm", "run", "start:prod"]