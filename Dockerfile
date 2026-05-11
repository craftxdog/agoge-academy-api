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

COPY --from=builder /app/dist/src ./dist/src
COPY --from=builder /app/dist/generated ./dist/generated

EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('node:http').get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/api/v1'},res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
