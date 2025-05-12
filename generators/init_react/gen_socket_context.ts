import { join } from "path";
import { generateFile } from "..";
import { ImmutableGenerator } from "../../immutable_gen";
import { StringOnlyMap } from "../../utils/map";


const gen_socket_context = async ({LibDir}: StringOnlyMap) => {
  const dir = join(LibDir, "typescript/utils");
  const filename = "PhoenixSocketContext.tsx";
  const content = `import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "phoenix";

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
  socketUrl: string;
  token?: string;
};

export const PhoenixSocketProvider = ({ children, socketUrl, token }: Props) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new Socket(socketUrl, {
      params: { token },
    });

    socket.connect();

    socket.onOpen(() => setConnected(true));
    socket.onClose(() => setConnected(false));
    socket.onError(() => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [socketUrl, token]);

  return (
    <PhoenixSocketContext.Provider
      value={{ socket: socketRef.current, connected }}
    >
      {children}
    </PhoenixSocketContext.Provider>
  );
};`;

  return generateFile({ filename, dir, content }, "gen_socket_context");
}
export { gen_socket_context };