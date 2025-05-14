import { io } from "socket.io-client";
const socket = io("https://rbwin-backend.onrender.com"); // apna backend URL daalo
export default socket;
