FROM node:lts-alpine AS builder
 
WORKDIR /app
 
COPY . . 
RUN npm install
RUN npm run build
RUN npm prune --production

FROM node:lts-alpine
WORKDIR /app

COPY --from=builder ./app/node_modules ./node_modules
COPY --from=builder ./app/dist ./dist
COPY --from=builder ./app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/src/main"]
