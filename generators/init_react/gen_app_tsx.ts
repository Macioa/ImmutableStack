import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_app_tsx = async ({ UiDir }: AppData) => {
  const filename = "App.tsx";
  const dir = join(UiDir, "/src/");
  const content = `import reactLogo from "./assets/react.svg";
import immutablelogo from "./assets/logo3.png";
import "./App.css";

function App() {
  return (
    <a href="https://github.com/macioa/immutablestack" target="_blank" className="banner">
      <h1>Immutable Stack</h1>
      <span className="logo-overlay-container">
        <img src={reactLogo} className="logo react" alt="React logo" />
        <img
          src={immutablelogo}
          className="logo phoenix"
          alt="Immutable logo"
        />
      </span>
    </a>
  );
}

export default App;`;
  return generateFile({ filename, dir, content }, "gen_app_tsx");
};
export { gen_app_tsx };
