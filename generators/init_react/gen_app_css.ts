import path from "path";
import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_app_css = async ({ AppNameSnake, AppDir }: AppData, uiName: string = 'ui') => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const filename = "App.css";
  const dir = join(UiDir, "/src/");
  const content = `/* Hero: matches immutablestack.com (Copperplate title, animated gradient, layered logo) */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-block: clamp(1.5rem, 6vh, 3.5rem) clamp(1rem, 4vh, 2.5rem);
}

.banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1rem, 4vh, 2rem);
  color: inherit;
  border-radius: var(--imm-radius-lg);
}

.banner:focus-visible {
  outline: 2px solid var(--imm-cyan);
  outline-offset: 8px;
}

.immutable {
  font-family: var(--imm-font-display);
  font-weight: 700;
  font-size: clamp(2.75rem, 9.5vw, 6.875rem);
  line-height: 1.05;
  letter-spacing: 0.01em;
  background: linear-gradient(
    270deg,
    var(--imm-orange),
    var(--imm-purple),
    var(--imm-cyan)
  );
  background-size: 800% 800%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.tagline {
  font-family: var(--imm-font-display);
  font-size: clamp(0.8rem, 2.4vw, 1rem);
  letter-spacing: 0.35em;
  text-transform: uppercase;
  text-wrap: balance;
  color: var(--imm-muted);
}

.logo-overlay-container {
  position: relative;
  display: block;
  /* Bounded by height too, so landscape phones still see content below the hero */
  width: clamp(140px, min(45vw, 38vh), 300px);
  aspect-ratio: 1;
}

.logo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition:
    filter 0.3s,
    transform 0.3s;
}

/* The React atom sits inside the Immutable mark, offset like the reference */
.logo.react {
  z-index: 1;
  inset: 16% 17.5% 19% 17.5%;
  width: 65%;
  height: 65%;
}

.logo.phoenix {
  z-index: 2;
}

.banner:hover .logo.phoenix,
.banner:focus-visible .logo.phoenix {
  filter: drop-shadow(0 0 3em rgba(179, 0, 255, 0.55));
  transform: scale(1.12);
}

@media (prefers-reduced-motion: no-preference) {
  .immutable {
    animation: move-background 25s ease infinite;
  }

  .logo.react {
    animation: logo-spin 20s linear infinite;
  }

  /* The pulsing glow lives on a pseudo layer so the spinning image is never re-filtered */
  .logo-overlay-container::before {
    content: "";
    position: absolute;
    inset: 22%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(97, 218, 251, 0.45),
      transparent 70%
    );
    animation: glow-pulse 5s ease-in-out infinite;
    will-change: opacity, transform;
  }
}

@keyframes move-background {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes logo-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

/* Content panels */
.sections {
  display: grid;
  gap: clamp(1rem, 3vw, 2rem);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1rem, 3vw, 2rem);
  border: 1px solid var(--imm-line);
  border-radius: var(--imm-radius-lg);
  background: rgba(22, 33, 62, 0.45);
}

.panel-title {
  align-self: center;
  padding-bottom: 0.5rem;
  font-family: var(--imm-font-display);
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--imm-text-strong);
  background: var(--imm-accent) bottom center / 48px 2px no-repeat;
}

/* Landscape phones: a compact hero keeps the panels above the fold */
@media (max-height: 500px) and (orientation: landscape) {
  .hero {
    padding-block: 0.75rem 1rem;
  }

  .banner {
    gap: 0.75rem;
  }

  .immutable {
    font-size: clamp(2rem, 11vh, 3rem);
  }
}

@media (min-width: 1100px) {
  .sections {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}
`;
  return generateFile({ filename, dir, content }, "gen_app_css");
};
export { gen_app_css };
