import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const authDir = (LibDir?: string) => join(LibDir || "", "lib/typescript/components/auth");

// Dark neon shell shared by the sign in and register panels
const add_auth_modal = async ({ LibDir }: ApiAppData) => {
  const content = `import React from "react";
import { ConfigProvider, Modal, theme } from "antd";
import "./auth.css";

// Dark neon theme matching the user avatar: navy surfaces, cyan primary
export const authTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#61dafb",
    colorLink: "#61dafb",
    colorInfo: "#61dafb",
    colorBgElevated: "#1a1a2e",
    colorBgContainer: "#16213e",
    colorBorder: "rgba(97, 218, 251, 0.35)",
    borderRadius: 10,
  },
};

// Static message / notification toasts render outside any ConfigProvider; theme them too
ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider theme={authTheme}>{children}</ConfigProvider>
  ),
});

interface AuthModalProps {
  title: string;
  visible: boolean;
  onCancel: () => void;
  children: React.ReactNode;
}

// Shared shell for the sign in and register panels
export const AuthModal: React.FC<AuthModalProps> = ({
  title,
  visible,
  onCancel,
  children,
}) => (
  <ConfigProvider theme={authTheme}>
    <Modal
      title={<span className="auth-modal-title">{title}</span>}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
      rootClassName="auth-modal"
    >
      {children}
    </Modal>
  </ConfigProvider>
);
`;

  return generateFile({ dir: authDir(LibDir), filename: "AuthModal.tsx", content }, "add_auth_modal");
};

// Styles for the auth panels, OAuth buttons and account menu
const add_auth_styles = async ({ LibDir }: ApiAppData) => {
  const content = `/* Modal and menu share the navy surface with the brand gradient border */
.auth-modal .ant-modal-content,
.user-menu-dropdown .ant-dropdown-menu {
  border: 2px solid transparent;
  border-radius: var(--imm-radius-lg);
  background:
    var(--imm-surface) padding-box,
    var(--imm-brand) border-box;
  box-shadow:
    var(--imm-glow),
    inset 0 0 14px rgba(179, 0, 255, 0.15);
}

.auth-modal .ant-modal-content {
  padding: 28px 32px 32px;
}

.auth-modal .ant-modal-header {
  background: transparent;
  margin-bottom: 24px;
  text-align: center;
}

.auth-modal-title {
  display: inline-block;
  padding-bottom: 8px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--imm-text-strong);
  background: var(--imm-accent) bottom center / 40px 2px no-repeat;
  text-shadow:
    0 0 4px var(--imm-cyan),
    0 0 12px var(--imm-cyan),
    0 0 24px rgba(179, 0, 255, 0.6);
}

/* A full-viewport blur is the costliest effect here; phones get the plain dim mask */
@media (min-width: 641px) {
  .auth-modal .ant-modal-mask {
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
  }
}

/* Primary action: gradient fill with a soft glow */
.auth-modal .ant-btn-primary {
  border: none;
  font-weight: 600;
  color: var(--imm-ink);
  background: var(--imm-accent);
  box-shadow: var(--imm-glow-sm);
}

.auth-modal .ant-btn-primary:not(:disabled):hover {
  color: var(--imm-ink);
  background: var(--imm-accent-hot);
  box-shadow: var(--imm-glow-hot);
}

/* "or OAUTH" divider with gradient rules */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 20px;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  color: var(--imm-muted);
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--imm-rule);
}

/* Icon-only provider buttons: wraps and centers for any number of providers */
.oauth-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}

.oauth-buttons .oauth-button.ant-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 50%;
  border: 1.5px solid var(--imm-line-strong);
  background: rgba(22, 33, 62, 0.85);
  transition:
    transform var(--imm-ease),
    box-shadow var(--imm-ease),
    border-color var(--imm-ease);
}

.oauth-buttons .oauth-button.ant-btn:hover,
.oauth-buttons .oauth-button.ant-btn:focus-visible {
  transform: translateY(-2px) scale(1.06);
  border-color: var(--imm-cyan);
  box-shadow:
    0 0 10px rgba(97, 218, 251, 0.6),
    0 0 20px rgba(179, 0, 255, 0.35);
  outline: none;
}

/* Account menu items */
.user-menu-dropdown .ant-dropdown-menu {
  min-width: 180px;
  padding: 6px;
  border-width: 1.5px;
  border-radius: var(--imm-radius);
}

.user-menu-dropdown .ant-dropdown-menu-item {
  padding: 8px 14px;
  border-radius: var(--imm-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--imm-text-strong);
  transition:
    background var(--imm-ease),
    text-shadow var(--imm-ease);
}

.user-menu-dropdown
  .ant-dropdown-menu-item:not(.ant-dropdown-menu-item-disabled):hover {
  background: rgba(97, 218, 251, 0.12);
  text-shadow:
    0 0 6px var(--imm-cyan),
    0 0 14px rgba(179, 0, 255, 0.6);
}

/* Signed-in email: muted, normal case */
.user-menu-dropdown .ant-dropdown-menu-item-disabled {
  font-weight: 400;
  letter-spacing: normal;
  text-transform: none;
  color: var(--imm-muted);
}

.user-menu-dropdown .ant-dropdown-menu-item-divider {
  background: var(--imm-rule);
}

/* Partial gradient bar between adjacent menu items */
.user-menu-dropdown .ant-dropdown-menu-item + .ant-dropdown-menu-item {
  position: relative;
  margin-top: 7px;
}

.user-menu-dropdown .ant-dropdown-menu-item + .ant-dropdown-menu-item::before {
  content: "";
  position: absolute;
  top: -4px;
  left: 25%;
  width: 50%;
  height: 1px;
  background: var(--imm-rule);
}

.auth-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

/* Recovery codes: two columns of monospace tiles in the theme cyan */
.recovery-codes {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 12px 0 16px;
}

.recovery-codes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.recovery-codes-grid li {
  padding: 8px 6px;
  border: 1px solid var(--imm-line-strong);
  border-radius: var(--imm-radius-sm);
  background: var(--imm-surface-sunken);
  font-family: var(--imm-font-mono);
  font-size: 0.82rem;
  white-space: nowrap;
  text-align: center;
  color: var(--imm-cyan);
  user-select: all;
  cursor: copy;
}

.recovery-codes-grid li:hover {
  border-color: var(--imm-cyan);
  box-shadow: var(--imm-glow-sm);
}

.recovery-codes-done {
  margin-top: 4px;
}

.recovery-code-input input {
  font-family: var(--imm-font-mono);
  letter-spacing: 0.05em;
}

@media (max-width: 480px) {
  .auth-modal .ant-modal-content {
    padding: 20px 16px 24px;
  }

  .recovery-codes-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;

  return generateFile({ dir: authDir(LibDir), filename: "auth.css", content }, "add_auth_styles");
};

export { add_auth_modal, add_auth_styles };
