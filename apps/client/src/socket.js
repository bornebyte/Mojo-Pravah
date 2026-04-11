import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
    if (!token) return null;

    if (socket?.connected) return socket;

    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    const socketOptions = {
        auth: {
            token,
        },
        transports: ["websocket", "polling"],
    };

    socket = socketUrl ? io(socketUrl, socketOptions) : io(socketOptions);

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
