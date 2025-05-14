import { io } from "socket.io-client";
const socket = io("https://rbwin-backend-url.onrender.com"); // Replace with your actual backend deployed URL

export default socket;
