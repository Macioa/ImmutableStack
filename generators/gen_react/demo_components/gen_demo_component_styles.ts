import { generateFile } from "@/generators/gen_react";
import { join } from "@/utils/path";
import { AppData } from "@/readers/get_app_data";

const gen_demo_component_styles = ({ LibDir }: AppData) => {
  const filename = "styles.css";
  const dir = join(LibDir, "lib/typescript/components");
  const content = `/* Shared design tokens and primitives for every Immutable UI.
   Components import this file, so any UI that renders them gets the tokens. */
:root {
  --imm-cyan: #61dafb;
  --imm-orange: #ff4500;
  --imm-purple: #b300ff;
  --imm-ink: #0d0d1a;
  --imm-navy: #1a1a2e;
  --imm-navy-2: #16213e;

  --imm-text: rgba(255, 255, 255, 0.87);
  --imm-text-strong: #e6fbff;
  --imm-muted: rgba(230, 251, 255, 0.55);
  --imm-danger: #ff6b81;
  --imm-success: #3ef0a0;

  --imm-line: rgba(97, 218, 251, 0.25);
  --imm-line-strong: rgba(97, 218, 251, 0.5);

  --imm-surface: linear-gradient(
    135deg,
    var(--imm-navy) 0%,
    var(--imm-navy-2) 100%
  );
  --imm-surface-sunken: rgba(13, 13, 26, 0.55);
  --imm-brand: linear-gradient(
    135deg,
    var(--imm-cyan),
    var(--imm-orange),
    var(--imm-purple)
  );
  --imm-accent: linear-gradient(90deg, var(--imm-cyan), var(--imm-purple));
  --imm-accent-hot: linear-gradient(
    90deg,
    var(--imm-purple),
    var(--imm-orange)
  );
  --imm-rule: linear-gradient(
    90deg,
    transparent,
    var(--imm-cyan),
    var(--imm-purple),
    transparent
  );

  --imm-glow-sm: 0 0 10px rgba(97, 218, 251, 0.35);
  --imm-glow: 0 0 18px rgba(97, 218, 251, 0.3), 0 0 36px rgba(255, 69, 0, 0.15);
  --imm-glow-hot: 0 0 16px rgba(255, 69, 0, 0.45);

  --imm-radius-sm: 8px;
  --imm-radius: 12px;
  --imm-radius-lg: 16px;
  --imm-ease: 0.2s ease;

  --imm-font-display:
    Copperplate, "Copperplate Gothic Bold", "Copperplate Gothic", Cinzel,
    "Arial Black", serif;
  --imm-font-body:
    system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    sans-serif;
  --imm-font-mono: ui-monospace, Consolas, Menlo, monospace;
}

/* Gradient-bordered navy surface, shared by panels, forms, modals and menus */
.surface,
.form-container {
  border: 1.5px solid transparent;
  border-radius: var(--imm-radius-lg);
  background:
    var(--imm-surface) padding-box,
    var(--imm-brand) border-box;
  box-shadow: var(--imm-glow);
}

.muted {
  color: var(--imm-muted);
  font-size: 0.9em;
}

.error-text {
  margin: 0;
  color: var(--imm-danger);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.section-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--imm-text-strong);
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

/* Forms */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.5rem;
  text-align: start;
}

.form-title {
  margin: 0 0 0.25rem;
  font: 600 0.8rem/1.2 var(--imm-font-body);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--imm-text-strong);
}

.form-container label {
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  color: var(--imm-muted);
}

.form-container input,
.form-container textarea,
.form-container select,
.inline-form input {
  min-width: 0;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--imm-line);
  border-radius: var(--imm-radius-sm);
  background: var(--imm-surface-sunken);
  color: var(--imm-text);
  font: inherit;
  font-size: 1rem; /* 16px stops iOS zooming into focused inputs */
  transition:
    border-color var(--imm-ease),
    box-shadow var(--imm-ease);
}

.form-container input:focus-visible,
.form-container textarea:focus-visible,
.form-container select:focus-visible,
.inline-form input:focus-visible {
  outline: none;
  border-color: var(--imm-cyan);
  box-shadow: var(--imm-glow-sm);
}

/* Buttons */
.form-submit-btn {
  align-self: center;
  margin-top: 0.75rem;
  padding: 0.7rem 1.8rem;
  border: none;
  border-radius: var(--imm-radius-sm);
  background: var(--imm-accent);
  color: var(--imm-ink);
  font: 600 1rem var(--imm-font-body);
  box-shadow: var(--imm-glow-sm);
  cursor: pointer;
  transition:
    transform var(--imm-ease),
    box-shadow var(--imm-ease);
}

.form-submit-btn:hover:not(:disabled),
.form-submit-btn:focus-visible {
  background: var(--imm-accent-hot);
  box-shadow: var(--imm-glow-hot);
  transform: translateY(-2px);
  outline: none;
}

.form-submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.icon-btn {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--imm-line);
  border-radius: 50%;
  background: transparent;
  color: var(--imm-muted);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color var(--imm-ease),
    border-color var(--imm-ease);
}

.icon-btn:hover,
.icon-btn:focus-visible {
  color: var(--imm-cyan);
  border-color: var(--imm-cyan);
  outline: none;
}

.styled-list-item .icon-btn:hover,
.styled-list-item .icon-btn:focus-visible {
  color: var(--imm-danger);
  border-color: var(--imm-danger);
}

/* Lists */
.styled-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.styled-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 0;
  border: 1px solid var(--imm-line);
  border-radius: var(--imm-radius-sm);
  background: var(--imm-surface-sunken);
  transition:
    border-color var(--imm-ease),
    box-shadow var(--imm-ease);
}

.styled-list-item:hover,
.styled-list-item:focus-within {
  border-color: var(--imm-cyan);
  box-shadow: var(--imm-glow-sm);
}

.list-item-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.list-item-main:focus-visible {
  outline: 2px solid var(--imm-cyan);
  outline-offset: -2px;
  border-radius: var(--imm-radius-sm);
}

.list-item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--imm-text-strong);
}

/* Key / value detail */
.field-list {
  display: grid;
  gap: 0.25rem;
  margin: 0;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(5rem, auto) 1fr;
  gap: 0.75rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--imm-radius-sm);
  background: var(--imm-surface-sunken);
}

.field-row dt {
  color: var(--imm-cyan);
  font-weight: 600;
}

.field-row dd {
  margin: 0;
  overflow-wrap: anywhere;
}

/* Demo layout */
.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1.5rem;
  align-items: start;
}

.demo-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  text-align: start;
}

/* Channel */
.channel-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: start;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.5rem;
  padding: 0.35rem 0.9rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.status-connected {
  color: var(--imm-success);
}

.status-joining {
  color: var(--imm-cyan);
}

.status-error {
  color: var(--imm-danger);
}

@media (prefers-reduced-motion: no-preference) {
  .status-joining .status-dot {
    animation: imm-pulse 1.2s ease-in-out infinite;
  }
}

@keyframes imm-pulse {
  50% {
    opacity: 0.3;
  }
}

.message-log {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 6rem;
  max-height: 14rem;
  margin: 0;
  padding: 0.75rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--imm-line);
  border-radius: var(--imm-radius-sm);
  background: var(--imm-surface-sunken);
  list-style: none;
  font-family: var(--imm-font-mono);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.inline-form {
  display: flex;
  gap: 0.5rem;
}

.inline-form input {
  flex: 1;
}

.inline-form .form-submit-btn {
  margin-top: 0;
}

/* Account avatar (UserMenu) */
.user-menu {
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
  z-index: 1000;
}

.user-menu-trigger {
  display: block;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}

.user-menu-trigger:focus-visible {
  outline: 2px solid var(--imm-cyan);
  outline-offset: 3px;
}

.user-menu-avatar.ant-avatar {
  border: 2px solid transparent;
  background:
    var(--imm-surface) padding-box,
    var(--imm-brand) border-box;
  box-shadow:
    var(--imm-glow),
    inset 0 0 10px rgba(179, 0, 255, 0.2);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    opacity 0.3s ease;
}

.user-menu-trigger:hover .user-menu-avatar.ant-avatar,
.user-menu-trigger:focus-visible .user-menu-avatar.ant-avatar {
  transform: scale(1.05);
  box-shadow:
    0 0 15px rgba(97, 218, 251, 0.8),
    0 0 30px rgba(255, 69, 0, 0.5),
    inset 0 0 15px rgba(179, 0, 255, 0.4);
}

.user-menu-avatar.signed-out.ant-avatar {
  opacity: 0.55;
  box-shadow: none;
}

.user-menu-avatar.signed-in svg {
  filter: drop-shadow(0 0 4px var(--imm-cyan))
    drop-shadow(0 0 8px var(--imm-orange));
}

/* Same footprint as the avatar while the account menu chunk loads */
.user-menu-placeholder {
  width: 40px;
  height: 40px;
  border: 2px solid var(--imm-line);
  border-radius: 50%;
}
`;
  return generateFile({ filename, dir, content });
};

export { gen_demo_component_styles };
