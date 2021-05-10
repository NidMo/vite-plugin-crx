import { ResolvedOptions } from "src";

export const reload = function (options: ResolvedOptions) {
  // Create WebSocket connection.
  const socket = new WebSocket(`ws://${options.host}:${options.port}`);
  // Connection opened
  socket.addEventListener("connection", function (event) {
    socket.send("Hello Server!");
  });

  // Listen for messages
  socket.addEventListener("message", function (event) {
    if(event.data === "reload"){
      chrome.runtime.reload()
    }
  });
};

/**
 * 生成热重载的后台background.html
 * @param options 
 * @returns 
 */
export const genReloadHtml = function (options: ResolvedOptions) {
  return `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>chrome extension background</title>
      <script>
          const socket = new WebSocket("ws://${options.host}:${options.port}");
          
          // Connection opened
          socket.addEventListener("connection", function (event) {
              socket.send("Hello Server!");
          });
  
          // Listen for messages
          socket.addEventListener("message", function (event) {
              if (event.data === "reload") {
                  chrome.runtime.reload()
              }
          });
      </script>
  </head>
  
  <body>`
}