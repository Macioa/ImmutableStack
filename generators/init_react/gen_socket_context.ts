import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_socket_context = async ({ LibDir, AppNameSnake }: AppData) => {
  const dir = join(LibDir, `lib/typescript/utils`);
  const filename = "PhoenixSocketContext.tsx";
  const content = `import { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "phoenix";

const SOCKET_URL =
  (import.meta as any).env["VITE_UI_SOCKET_URL"] ||
  "ws://localhost:4000/socket";
const TOKEN = "";

type PhoenixSocketContextType = {
  socket: Socket | null;
  connected: boolean;
};

const PhoenixSocketContext = createContext<PhoenixSocketContextType>({
  socket: null,
  connected: false,
});

export const usePhoenixSocket = () => useContext(PhoenixSocketContext);

type Props = {
  children: React.ReactNode;
};

export const PhoenixSocketProvider = ({ children }: Props) => {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = new Socket(SOCKET_URL, {
      params: { TOKEN },
    });

    socketInstance.connect();
    setSocket(socketInstance);

    socketInstance.onOpen(() => setConnected(true));
    socketInstance.onClose(() => setConnected(false));
    socketInstance.onError(() => setConnected(false));

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <PhoenixSocketContext.Provider value={{ socket, connected }}>
      {children}
    </PhoenixSocketContext.Provider>
  );
};`;

  return generateFile({ filename, dir, content }, "gen_socket_context");
};
export { gen_socket_context };
