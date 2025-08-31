FROM node:20-alpine AS base
EXPOSE 3000

# Install performance optimizations
RUN apk add --no-cache \
    curl \
    libc6-compat \
    && rm -rf /var/cache/apk/*

FROM base AS pruned
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production --no-audit --no-fund
RUN curl -sf https://gobinaries.com/tj/node-prune | sh
RUN node-prune
EXPOSE 3000

FROM base AS development
WORKDIR /app
COPY ./src ./src
COPY ./binaries ./binaries
COPY package.json package-lock.json tsconfig.build.json tsconfig.json .eslintrc.js .prettierrc ./
RUN npm ci --no-audit --no-fund
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npm run start:dev"]

FROM base AS production
WORKDIR /app

# Copy built application
COPY --from=development /app/dist ./dist
COPY --from=development /app/binaries ./binaries
COPY --from=pruned /app/package.json /app/package-lock.json ./
COPY --from=pruned /app/node_modules ./node_modules

# Set execute permissions for Linux binaries
RUN chmod +x ./binaries/linux/bin/* && \
    ls -la ./binaries/linux/bin/ && \
    echo "Binary permissions set successfully"

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Performance optimizations
ENV UV_THREADPOOL_SIZE=128
ENV NODE_OPTIONS="--max-old-space-size=4096"

EXPOSE 3000

# Add healthcheck for better orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1


CMD ["sh","-c","npm run start:prod"]
