export const reload = function (host: string, port: string) {
  // Create WebSocket connection.
  const socket = new WebSocket(`ws://${host}:${port}`);
  // Connection opened
  socket.addEventListener("connection", function (event) {
    socket.send("Hello Server!");
  });

  // Listen for messages
  socket.addEventListener("message", function (event) {
    if (event.data === "reload") {
      chrome.runtime.reload();
    }
  });
};
