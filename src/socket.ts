import { io } from "socket.io-client";

const socket = io("https://rbwin-backend.onrender.com"); // Ya aapka backend URL

export default socket;
