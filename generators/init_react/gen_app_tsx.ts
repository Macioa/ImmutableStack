import path from "path";
import { join } from "@/utils/path";
import { generateFile } from "@/generators/index";
import { AppData } from "@/readers/get_app_data";

const gen_app_tsx = async ({ AppNameSnake, AppDir }: AppData, uiName: string = 'ui') => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const filename = "App.tsx";
  const dir = join(UiDir, "/src/");
  const content = `import reactLogo from "./assets/react.svg";
import immutablelogo from "./assets/logo3.webp";
// Shared --imm-* tokens and primitives; the page styles depend on them
import "@components/styles.css";
import "./App.css";

// Feature panels go in <main>: <section className="panel"> with an <h2 className="panel-title">
function App() {
  return (
    <>
      <header className="hero">
        <a
          href="https://github.com/macioa/immutablestack"
          target="_blank"
          rel="noreferrer"
          className="banner"
        >
          <h1 className="immutable">Immutable Stack</h1>
          <span className="logo-overlay-container">
            <img src={reactLogo} className="logo react" alt="" width={195} height={195} />
            <img
              src={immutablelogo}
              className="logo phoenix"
              alt="Immutable Stack logo"
              width={300}
              height={300}
              fetchPriority="high"
            />
          </span>
        </a>
        <p className="tagline">Elixir · Phoenix · React · Redux</p>
      </header>
      <main className="sections"></main>
    </>
  );
}

export default App;`;
  return generateFile({ filename, dir, content }, "gen_app_tsx");
};
export { gen_app_tsx };
