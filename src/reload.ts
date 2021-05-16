import { HMRPayload } from "./ws";

export const reload = function (host: string, port: string) {
  // Create WebSocket connection.
  const socket = new WebSocket(`ws://${host}:${port}`);
  // Connection opened
  socket.addEventListener("message", async ({ data }) => {
    handleMessage(JSON.parse(data));
  });
};

async function handleMessage(payload: HMRPayload) {
  switch (payload.type) {
    case "connected":
      console.log(`[vite-pluign-crx] connected.`);
      break;
    case "update":
      chrome.runtime.reload();
      break;
    default:
      break;
  }
}
