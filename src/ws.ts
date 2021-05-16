import WebSocket from "ws";
import { ResolvedOptions } from "./type";

export interface HMRPayload {
    type: "connected" | "update"
}

export interface WebSocketServer {
    send(payload: HMRPayload): void
    close(): Promise<void>
  }

export function createWebSocketServer(options: ResolvedOptions):WebSocketServer {
  let wss: WebSocket.Server;
  // 创建一个ws服务
  wss = new WebSocket.Server({
    host: options.host,
    port: options.port,
  });
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "connected" }));
  });

  return {
    send(payload: HMRPayload) {
      const stringified = JSON.stringify(payload);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringified);
        }
      });
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        wss.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  };
}
