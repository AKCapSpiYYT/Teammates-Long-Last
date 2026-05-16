import { createServer } from "http";
import { logger } from "./logger.js";

export function startHealthServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    logger.info(`Health check server listening on port ${port}`);
  });

  server.on("error", (err) => {
    logger.error("Health server error:", err);
  });

  return server;
}
