# node:24 — needs Node >= 22.5 for the built-in "node:sqlite" module (db.js)
FROM node:24-alpine
WORKDIR /app

# Puppeteer is listed in package.json but unused by server.js — skip its
# Chromium download so the image builds fast and stays small.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund --omit=dev

COPY . .

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs

# Pre-create the data dir owned by the non-root user, so when the named
# volume mounts over it, Docker seeds it with these permissions instead of
# root:root — otherwise the SQLite file can never be created (ERR_SQLITE_ERROR
# "unable to open database file").
RUN mkdir -p /app/data && chown expressjs:nodejs /app/data

USER expressjs

EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
