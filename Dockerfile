FROM node:20-alpine AS base
EXPOSE 3000

FROM base AS pruned
WORKDIR /app
COPY package.json package-lock.json ./
RUN apk update && apk add curl
RUN npm i --production
RUN curl -sf https://gobinaries.com/tj/node-prune | sh
RUN node-prune
EXPOSE 3000

FROM base AS development
WORKDIR /app
COPY ./src ./src
COPY ./binaries ./binaries
COPY package.json package-lock.json tsconfig.build.json tsconfig.json .eslintrc.js .prettierrc ./
RUN npm i
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npm run start:dev"]

FROM base AS production
WORKDIR /app
COPY --from=development /app/dist ./dist
COPY --from=development /app/binaries ./binaries
COPY --from=pruned /app/package.json /app/package-lock.json ./
COPY --from=pruned /app/node_modules ./node_modules
EXPOSE 3000
CMD ["sh", "-c", "npm run start:prod"]