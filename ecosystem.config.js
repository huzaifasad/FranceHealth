// PM2 process file — the no-Docker way to run both apps.
// One-time setup on the VPS:
//   npm i -g pm2
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup      (so it survives a server reboot)
//
// Every redeploy after that is one command:
//   pm2 reload ecosystem.config.js --update-env

module.exports = {
  apps: [
    {
      name: "celluid-backend",
      cwd: "./backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        // OPENAI_API_KEY is read from ./backend/.env by dotenv — not set here.
      },
    },
    {
      name: "celluid-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "http://localhost:3001",
      },
    },
  ],
}
