import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_app_css = async ({ UiDir }: AppData) => {
  const filename = "App.css";
  const dir = join(UiDir, "/src/");
  const content = `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  font-family: Copperplate, "Copperplate Gothic Bold",
    "Copperplate Gothic Light", "Arial Black", Arial, sans-serif;
  color: #fff;
}

.banner {
  height: 400px;
}

h1 {
  background: linear-gradient(90deg, #ff4500, #61dafb);
  background-clip: border-box;
  background-clip: border-box;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 1px 1px 2px #b300ff, 0 0 2px #61dafb;
  font-size: 110px;
}

.logo {
  will-change: filter, transform;
  transition: filter 300ms, transform 300ms;
}

.logo.react:hover {
  filter: drop-shadow(0 0 4em #61dafbaa);
}

.logo.phoenix:hover {
  filter: drop-shadow(0 0 6em #ff4500);
  animation: logo-spin-reverse 1s linear infinite;
}

@keyframes logo-spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes logo-spin-reverse {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(-360deg);
  }
}

@keyframes logo-shadow-pulse {
  0% {
    filter: drop-shadow(0 0 2em #61dafbaa);
  }
  50% {
    filter: drop-shadow(0 0 2em #ff4500);
  }
  100% {
    filter: drop-shadow(0 0 2em #61dafbaa);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .logo.react {
    animation: logo-spin 20s linear infinite,
      logo-shadow-pulse 5s ease-in-out infinite;
  }
}

.logo-overlay-container {
  position: absolute;
  width: 300px;
  height: 300px;
  display: block;
  top: 110%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.logo.react,
.logo.phoenix {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  object-fit: contain;
}

.logo.react {
  z-index: 1;
  width: 65%;
  height: 65%;
}

.logo.phoenix {
  z-index: 2;
}`;
  return generateFile({ filename, dir, content }, "gen_app_css");
};
export { gen_app_css };
