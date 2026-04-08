import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
    if (!token) return null;

    if (socket?.connected) return socket;

    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
        auth: {
            token,
        },
        transports: ["websocket", "polling"],
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
