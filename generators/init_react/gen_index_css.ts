import path from "path";
import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

// Page base for a UI. The shared --imm-* tokens live in components/styles.css.
const gen_index_css = async ({ AppNameSnake, AppDir }: AppData, uiName: string = "ui") => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const filename = "index.css";
  const dir = join(UiDir, "/src/");
  const content = `/* Page base. Shared tokens (--imm-*) live in components/styles.css. */
:root {
  color-scheme: dark;
  font: 400 16px/1.5 var(--imm-font-body);
  color: var(--imm-text);
  background: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  background: #242424;
}

/* Glow behind the content on its own fixed layer: the compositor scrolls past it
   without repainting (background-attachment: fixed repaints, and iOS ignores it) */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse 60% 40% at 15% 0%,
      rgba(97, 218, 251, 0.12),
      transparent 70%
    ),
    radial-gradient(
      ellipse 50% 40% at 90% 10%,
      rgba(179, 0, 255, 0.12),
      transparent 70%
    ),
    radial-gradient(
      ellipse 70% 50% at 50% 100%,
      rgba(255, 69, 0, 0.08),
      transparent 70%
    );
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(1rem, 4vw, 2rem);
  padding-bottom: max(2rem, env(safe-area-inset-bottom));
  text-align: center;
}

h1,
h2,
h3,
p {
  margin: 0;
}

a {
  color: var(--imm-cyan);
  text-decoration: inherit;
}

img {
  max-width: 100%;
  height: auto;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
  return generateFile({ filename, dir, content }, "gen_index_css");
};

export { gen_index_css };
