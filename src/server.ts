import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";

export class Server {
 private httpServer: any;
 // private httpServer: HTTPServer;

 private app: any;
 //private app: Application;

 //private io: SocketIOServer;
 private io: any;
 
 private readonly DEFAULT_PORT = 5000;
 private activeSockets: string[] = []
 
 constructor() {
   this.initialize();
 
   this.handleRoutes();
   this.handleSocketConnection();
 }
 
 private initialize(): void {
   this.app = express();
   this.httpServer = createServer(this.app);
   this.io = socketIO(this.httpServer);
 }
 
 private handleRoutes(): void {
  this.app.use(express.static(path.join(__dirname, "../public")));
  this.app.get("/", (req:any, res:any) => {
    res.sendFile("index.html");
  });
 }
 
 private handleSocketConnection(): void {

   this.io.on("connection", (socket:any) => {
      
      const existingSocket = this.activeSockets.find(
        existingSocket => existingSocket === socket.id
      );

      if (!existingSocket){

        this.activeSockets.push(socket.id);

        socket.emit("update-user-list", {
          users: this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
          )
        });

        socket.broadcast.emit("update-user-list", {
          users: [socket.id]
        });
      }

      socket.on("call-user", (data: any) => {
        socket.to(data.to).emit("call-made", {
          offer: data.offer,
          socket: socket.id
        });
      });

      socket.on("make-answer", (data:any) => {
        socket.to(data.to).emit("answer-made", {
          socket: socket.id,
          answer: data.answer
        });
      });

      socket.on("reject-call", (data:any) => {
        socket.to(data.from).emit("call-rejected", {
          socket: socket.id
        });
      });

      socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
          existingSocket => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id
        });
      });

   });
   
 }
 
 public listen(callback: (port: number) => void): void {
   this.httpServer.listen(this.DEFAULT_PORT, () =>
     callback(this.DEFAULT_PORT)
   );
 }
}
