FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json yarn.lock ./

RUN corepack enable \
  && corepack prepare yarn@1.22.22 --activate \
  && yarn install --frozen-lockfile --non-interactive --ignore-scripts

FROM dependencies AS build

COPY . .

RUN yarn build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json yarn.lock ./

RUN corepack enable \
  && corepack prepare yarn@1.22.22 --activate \
  && yarn install --frozen-lockfile --non-interactive --production --ignore-scripts \
  && yarn cache clean

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
