// Credentialed browser requests require explicit origins, so dev allows only local UI and node ports.
const devCorsConfig = (app: string) =>
  `config :${app}, CORSPlug,
  origin: for(host <- ["localhost", "127.0.0.1"], port <- [4000, 4100, 4200 | Enum.to_list(5173..5183)], do: "http://#{host}:#{port}")`;

export { devCorsConfig };
