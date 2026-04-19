FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN corepack enable \
  && corepack prepare yarn@1.22.22 --activate \
  && yarn install --frozen-lockfile --non-interactive --ignore-scripts

COPY . .

RUN if [ -f prisma/schema.prisma ]; then yarn prisma:generate; fi \
  && yarn build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json yarn.lock ./

RUN corepack enable \
  && corepack prepare yarn@1.22.22 --activate \
  && yarn install --frozen-lockfile --non-interactive --production --ignore-scripts \
  && yarn cache clean

COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/src/main.js"]
