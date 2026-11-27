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

interface AuthModalProps {
  title: string;
  visible: boolean;
  onCancel: () => void;
  children: React.ReactNode;
}

// Shared shell for the sign in and register panels
export const AuthModal: React.FC<AuthModalProps> = ({ title, visible, onCancel, children }) => (
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
  const content = `/* Panel: navy surface with the avatar's cyan / orange / purple gradient border */
.auth-modal .ant-modal-content {
  padding: 28px 32px 32px;
  border: 2px solid transparent;
  border-radius: 16px;
  background:
    linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) padding-box,
    linear-gradient(135deg, #61dafb, #ff4500, #b300ff) border-box;
  box-shadow:
    0 0 18px rgba(97, 218, 251, 0.35),
    0 0 36px rgba(255, 69, 0, 0.2),
    inset 0 0 14px rgba(179, 0, 255, 0.15);
}

.auth-modal .ant-modal-header {
  background: transparent;
  margin-bottom: 24px;
  text-align: center;
}

.auth-modal-title {
  display: inline-block;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #e6fbff;
  padding-bottom: 8px;
  background: linear-gradient(90deg, #61dafb, #b300ff) bottom center / 40px 2px
    no-repeat;
  text-shadow:
    0 0 4px #61dafb,
    0 0 12px #61dafb,
    0 0 24px rgba(179, 0, 255, 0.6);
}

.auth-modal .ant-modal-mask {
  backdrop-filter: blur(4px);
}

/* Primary action: gradient fill with a soft glow */
.auth-modal .ant-btn-primary {
  border: none;
  font-weight: 600;
  color: #0d0d1a;
  background: linear-gradient(90deg, #61dafb, #b300ff);
  box-shadow: 0 0 12px rgba(97, 218, 251, 0.35);
}

.auth-modal .ant-btn-primary:not(:disabled):hover {
  color: #0d0d1a;
  background: linear-gradient(90deg, #b300ff, #ff4500);
  box-shadow: 0 0 16px rgba(255, 69, 0, 0.45);
}

/* "or OAUTH" divider with gradient rules */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 20px;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.55);
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    #61dafb,
    #b300ff,
    transparent
  );
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
  border: 1.5px solid rgba(97, 218, 251, 0.35);
  background: rgba(22, 33, 62, 0.85);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.oauth-buttons .oauth-button.ant-btn:hover,
.oauth-buttons .oauth-button.ant-btn:focus-visible {
  transform: translateY(-2px) scale(1.06);
  border-color: #61dafb;
  box-shadow:
    0 0 10px rgba(97, 218, 251, 0.6),
    0 0 20px rgba(179, 0, 255, 0.35);
  outline: none;
}

/* Account menu: same navy surface, gradient border and glow as the panels */
.user-menu-dropdown .ant-dropdown-menu {
  min-width: 180px;
  padding: 6px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  background:
    linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) padding-box,
    linear-gradient(135deg, #61dafb, #ff4500, #b300ff) border-box;
  box-shadow:
    0 0 12px rgba(97, 218, 251, 0.35),
    0 0 24px rgba(255, 69, 0, 0.18);
}

.user-menu-dropdown .ant-dropdown-menu-item {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #e6fbff;
  transition:
    background 0.2s ease,
    text-shadow 0.2s ease;
}

.user-menu-dropdown
  .ant-dropdown-menu-item:not(.ant-dropdown-menu-item-disabled):hover {
  background: rgba(97, 218, 251, 0.12);
  text-shadow:
    0 0 6px #61dafb,
    0 0 14px rgba(179, 0, 255, 0.6);
}

/* Signed-in email: muted, normal case */
.user-menu-dropdown .ant-dropdown-menu-item-disabled {
  font-weight: 400;
  letter-spacing: normal;
  text-transform: none;
  color: rgba(230, 251, 255, 0.5);
}

.user-menu-dropdown .ant-dropdown-menu-item-divider {
  background: linear-gradient(
    90deg,
    transparent,
    #61dafb,
    #b300ff,
    transparent
  );
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
  background: linear-gradient(
    90deg,
    transparent,
    #61dafb,
    #b300ff,
    transparent
  );
}

.auth-links {
  display: flex;
  justify-content: space-between;
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
  border: 1px solid rgba(97, 218, 251, 0.35);
  border-radius: 8px;
  background: rgba(13, 13, 26, 0.6);
  font-family: Consolas, Menlo, monospace;
  font-size: 0.82rem;
  white-space: nowrap;
  text-align: center;
  color: #61dafb;
  user-select: all;
}

.recovery-codes-done {
  margin-top: 4px;
}

.recovery-codes-grid li {
  cursor: copy;
}

.recovery-codes-grid li:hover {
  border-color: #61dafb;
  box-shadow: 0 0 8px rgba(97, 218, 251, 0.35);
}

.recovery-code-input input {
  font-family: Consolas, Menlo, monospace;
  letter-spacing: 0.05em;
}
`;

  return generateFile({ dir: authDir(LibDir), filename: "auth.css", content }, "add_auth_styles");
};

export { add_auth_modal, add_auth_styles };
