import { WebSocketServer } from "./ws";

let exitProcess: () => void

export const listenExitProcess = (ws: WebSocketServer) =>{

    exitProcess = async () => {
      try {
        await ws.close();
        process.off("SIGTERM", exitProcess);
    
        if (!process.stdin.isTTY) {
          process.stdin.off("end", exitProcess);
        }
      } finally {
        process.exit(0);
      }
    };
    process.once("SIGTERM", exitProcess);
    
    if (!process.stdin.isTTY) {
      process.stdin.on("end", exitProcess);
    }
}

