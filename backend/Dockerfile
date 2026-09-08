FROM node:20-alpine
WORKDIR /app

# Puppeteer is listed in package.json but unused by server.js — skip its
# Chromium download so the image builds fast and stays small.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund --omit=dev

COPY . .

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs
USER expressjs

EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
