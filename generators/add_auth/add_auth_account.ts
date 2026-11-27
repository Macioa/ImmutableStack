import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

// Account page, two-factor (authenticator app, email codes), password reset and change.
// Templates mirror a verified sample app; app names are interpolated.

const add_auth_login_modal_test = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth"), filename: "LoginModal.test.tsx", content: `import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeAuthServer, renderWithStore, stubBrowser } from "@test/fakeAuthServer";
import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";

beforeEach(stubBrowser);

const user = { id: "u1", email: "me@example.com", confirmed_at: null, access_tags: [], accounts: [] };
const button = (name: string) => screen.getByRole("button", { name });

const signIn = async () => {
  renderWithStore(<LoginModal visible onCancel={() => null} />);
  await userEvent.type(screen.getByPlaceholderText("Email"), "me@example.com");
  await userEvent.type(screen.getByPlaceholderText("Password"), "a long password");
  await userEvent.click(button("Sign In"));
};

test("a required second factor asks for a code before signing in", async () => {
  const server = fakeAuthServer({
    "POST /users/log_in": () => ({ two_factor: { challenge: "c1", methods: ["totp", "email"] } }),
    "POST /users/log_in/two_factor/email": () => ({ status: "sent" }),
    "POST /users/log_in/two_factor": () => ({ data: user, token: "t1" }),
    "GET /users/settings": () => ({ data: user }),
  });
  const onCancel = vi.fn();
  renderWithStore(<LoginModal visible onCancel={onCancel} />);
  await userEvent.type(screen.getByPlaceholderText("Email"), "me@example.com");
  await userEvent.type(screen.getByPlaceholderText("Password"), "a long password");
  await userEvent.click(button("Sign In"));

  expect(await screen.findByText("Two-factor verification")).toBeInTheDocument();
  await userEvent.click(screen.getByText("Email code"));
  await userEvent.click(button("Send code"));
  await userEvent.type(screen.getByPlaceholderText("123456"), "111222");
  await userEvent.click(button("Verify"));

  await waitFor(() => expect(onCancel).toHaveBeenCalled());
  expect(server.called("POST /users/log_in/two_factor/email")[0].body).toEqual({ challenge: "c1" });
  expect(server.called("POST /users/log_in/two_factor")[0].body).toEqual({ challenge: "c1", method: "email", code: "111222" });
});

test("without a second factor the password signs straight in", async () => {
  const server = fakeAuthServer({
    "POST /users/log_in": () => ({ data: user, token: "t1" }),
    "GET /users/settings": () => ({ data: user }),
  });
  await signIn();
  await waitFor(() => expect(server.called("GET /users/settings")).toHaveLength(1));
  expect(screen.queryByText("Two-factor verification")).not.toBeInTheDocument();
});

test("forgot password emails a reset link", async () => {
  const server = fakeAuthServer({ "POST /users/reset_password": () => ({ status: "sent" }) });
  renderWithStore(<LoginModal visible onCancel={() => null} />);

  await userEvent.click(screen.getByText("Forgot password?"));
  await userEvent.type(screen.getByPlaceholderText("Email"), "me@example.com");
  await userEvent.click(button("Email me a reset link"));

  expect(await screen.findByText("Check your email")).toBeInTheDocument();
  expect(server.called("POST /users/reset_password")[0].body).toEqual({ email: "me@example.com" });
});

test("recover account signs in with a recovery code", async () => {
  const server = fakeAuthServer({ "POST /auth/recovery": () => ({ data: user, token: "t1" }) });
  const onCancel = vi.fn();
  renderWithStore(<LoginModal visible onCancel={onCancel} />);

  await userEvent.click(screen.getByText("Recover account"));
  await userEvent.type(screen.getByPlaceholderText("Recovery code"), "aaaa-bbbb");
  await userEvent.click(button("Use code"));

  await waitFor(() => expect(onCancel).toHaveBeenCalled());
  expect(server.called("POST /auth/recovery")[0].body).toEqual({ code: "aaaa-bbbb" });
});

test("password registration shows the recovery codes", async () => {
  fakeAuthServer({
    "POST /users/register": () => [201, { data: user, token: "t1", recovery_codes: ["aaaa-bbbb", "cccc-dddd"] }],
    "GET /users/settings": () => ({ data: user }),
  });
  renderWithStore(<RegisterModal visible onCancel={() => null} />);

  await userEvent.type(screen.getByPlaceholderText("Email"), "me@example.com");
  await userEvent.type(screen.getByPlaceholderText("Password"), "a long password");
  await userEvent.type(screen.getByPlaceholderText("Confirm Password"), "a long password");
  await userEvent.click(button("Register"));

  expect(await screen.findByTestId("recovery-codes")).toHaveTextContent("cccc-dddd");
});
` }, "add_auth_login_modal_test");

const add_auth_reset_password_modal = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth"), filename: "ResetPasswordModal.tsx", content: `import React from "react";
import { Button, Form, Input, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { resetPassword } from "../../requests/Account";
import { AuthModal } from "./AuthModal";

interface ResetPasswordModalProps {
  token: string | null;
  onDone: () => void;
  onCancel: () => void;
}

// Opened by the ?reset=<token> link in the reset email.
export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ token, onDone, onCancel }) => {
  const save = ({ password, password_confirmation }: { password: string; password_confirmation: string }) =>
    token &&
    resetPassword(token, password, password_confirmation)
      .then(() => {
        message.success("Password reset. Sign in with your new password.");
        onDone();
      })
      .catch((e) => message.error(e.message === "invalid_token" ? "This reset link has expired" : e.message));

  return (
    <AuthModal title="Choose a new password" visible={!!token} onCancel={onCancel}>
      <Form layout="vertical" onFinish={save} autoComplete="off">
        <Form.Item name="password" rules={[{ required: true }, { min: 12, message: "At least 12 characters" }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="New password" size="large" />
        </Form.Item>
        <Form.Item
          name="password_confirmation"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || value === getFieldValue("password")
                  ? Promise.resolve()
                  : Promise.reject(new Error("Passwords do not match!")),
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Reset password
        </Button>
      </Form>
    </AuthModal>
  );
};
` }, "add_auth_reset_password_modal");

const add_auth_account_modal_test = async ({ AppNameCamel, LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "AccountModal.test.tsx", content: `import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeAuthServer, renderWithStore, security, stubBrowser } from "@test/fakeAuthServer";
import { AccountModal } from "./AccountModal";

beforeEach(stubBrowser);

const open = async (section?: string) => {
  renderWithStore(<AccountModal visible onCancel={() => null} />);
  await screen.findByTestId("account-panel-overview");
  if (section) await userEvent.click(screen.getByRole("menuitem", { name: section }));
};

const button = (name: RegExp | string) => screen.getByRole("button", { name });

test("the left navigation groups security and invitations", async () => {
  fakeAuthServer({ "GET /users/security": () => security() });
  await open();

  const [nav] = screen.getAllByRole("menu");
  ["Overview", "Password", "Two-factor", "Authenticator app", "Email codes", "Passkeys", "Recovery codes", "Sessions"].forEach(
    (name) => expect(within(nav).getByText(name)).toBeInTheDocument(),
  );

  await userEvent.click(within(nav).getByText("Invitations"));
  expect(within(nav).getByText("Manage invitations")).toBeInTheDocument();
});

test("recovery codes show the remaining count and a fresh batch once", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security({ recovery_codes_remaining: 3 }),
    "POST /users/recovery_codes": () => ({ recovery_codes: ["aaaa-bbbb", "cccc-dddd"] }),
  });
  await open("Recovery codes");

  expect(await screen.findByText("3")).toBeInTheDocument();
  await userEvent.click(button("Generate new recovery codes"));
  await userEvent.click(button("OK"));

  expect(await screen.findByTestId("recovery-codes")).toHaveTextContent("aaaa-bbbb");
  expect(server.called("POST /users/recovery_codes")).toHaveLength(1);
});

test("the two-factor toggle waits for a method, then turns the requirement on", async () => {
  fakeAuthServer({ "GET /users/security": () => security() });
  await open("Two-factor");
  await waitFor(() => expect(screen.getByTestId("two-factor-toggle")).toBeDisabled());
});

test("toggling two-factor saves the requirement", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security({ methods: ["totp"], totp_enabled: true }),
    "PUT /users/security": ({ two_factor_enabled }) => security({ methods: ["totp"], totp_enabled: true, two_factor_enabled }),
  });
  await open("Two-factor");

  const toggle = screen.getByTestId("two-factor-toggle");
  await waitFor(() => expect(toggle).toBeEnabled());
  await userEvent.click(toggle);

  await waitFor(() => expect(toggle).toBeChecked());
  expect(server.called("PUT /users/security")[0].body).toEqual({ two_factor_enabled: true });
});

test("an authenticator app is added with a verified code", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "POST /users/security/totp": () => ({ secret: "JBSWY3DPEHPK3PXP", uri: "otpauth://totp/${AppNameCamel}:me" }),
    "PUT /users/security/totp": () => security({ methods: ["totp"], totp_enabled: true }),
  });
  await open("Authenticator app");

  await userEvent.click(button("Set up authenticator app"));
  expect(await screen.findByTestId("totp-secret")).toHaveTextContent("JBSWY3DPEHPK3PXP");
  await userEvent.type(screen.getByPlaceholderText("123456"), "123456");
  await userEvent.click(button("Verify"));

  expect(await screen.findByText("Remove authenticator app")).toBeInTheDocument();
  expect(server.called("PUT /users/security/totp")[0].body).toEqual({ secret: "JBSWY3DPEHPK3PXP", code: "123456" });
});

test("email codes are turned on with an emailed code", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "POST /users/security/email": () => ({ status: "sent" }),
    "PUT /users/security/email": () => security({ methods: ["email"], email_otp_enabled: true }),
  });
  await open("Email codes");

  await userEvent.click(button("Send code"));
  await userEvent.type(await screen.findByPlaceholderText("123456"), "654321");
  await userEvent.click(button("Turn on"));

  expect(await screen.findByText("Turn off email codes")).toBeInTheDocument();
  expect(server.called("POST /users/security/email")).toHaveLength(1);
  expect(server.called("PUT /users/security/email")[0].body).toEqual({ code: "654321" });
});

test("a password is changed with the current one", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "PUT /users/password": () => ({ status: "updated" }),
  });
  await open("Password");

  await userEvent.type(await screen.findByLabelText("Current password"), "old long password");
  await userEvent.type(screen.getByLabelText("New password"), "new long password");
  await userEvent.type(screen.getByLabelText("Confirm new password"), "new long password");
  await userEvent.click(button("Change password"));

  await waitFor(() =>
    expect(server.called("PUT /users/password")[0]?.body).toEqual({
      current_password: "old long password",
      password: "new long password",
      password_confirmation: "new long password",
    }),
  );
});
` }, "add_auth_account_modal_test");

const add_auth_account_modal = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "AccountModal.tsx", content: `import React, { useEffect, useState } from "react";
import { ConfigProvider, Menu, Modal, message, type MenuProps } from "antd";
import { SafetyOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectUserdata } from "../../../state/User";
import { getSecurity, type Security } from "../../../requests/Account";
import { authTheme } from "../AuthModal";
import { OverviewPanel } from "./OverviewPanel";
import { PasswordPanel } from "./PasswordPanel";
import { TwoFactorPanel } from "./TwoFactorPanel";
import { AuthenticatorPanel } from "./AuthenticatorPanel";
import { EmailCodesPanel } from "./EmailCodesPanel";
import { PasskeysPanel } from "./PasskeysPanel";
import { RecoveryCodesPanel } from "./RecoveryCodesPanel";
import { SessionsPanel } from "./SessionsPanel";
import { InvitationsPanel } from "./InvitationsPanel";
import type { PanelProps } from "./panel";
import "./account.css";

type Section =
  | "overview"
  | "password"
  | "two-factor"
  | "authenticator"
  | "email-codes"
  | "passkeys"
  | "recovery-codes"
  | "sessions"
  | "invitations";

// Groups expand in the left navigation; each leaf key opens one panel.
const navigation: MenuProps["items"] = [
  { key: "overview", icon: <UserOutlined />, label: "Overview" },
  {
    key: "security",
    icon: <SafetyOutlined />,
    label: "Security",
    children: [
      { key: "password", label: "Password" },
      { key: "two-factor", label: "Two-factor" },
      { key: "authenticator", label: "Authenticator app" },
      { key: "email-codes", label: "Email codes" },
      { key: "passkeys", label: "Passkeys" },
      { key: "recovery-codes", label: "Recovery codes" },
      { key: "sessions", label: "Sessions" },
    ],
  },
  {
    key: "people",
    icon: <UserAddOutlined />,
    label: "Invitations",
    children: [{ key: "invitations", label: "Manage invitations" }],
  },
];

const panels: Record<Section, React.FC<PanelProps>> = {
  overview: OverviewPanel,
  password: PasswordPanel,
  "two-factor": TwoFactorPanel,
  authenticator: AuthenticatorPanel,
  "email-codes": EmailCodesPanel,
  passkeys: PasskeysPanel,
  "recovery-codes": RecoveryCodesPanel,
  sessions: SessionsPanel,
  invitations: InvitationsPanel,
};

interface AccountModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ visible, onCancel }) => {
  const userdata = useSelector(selectUserdata);
  const [section, setSection] = useState<Section>("overview");
  const [security, setSecurity] = useState<Security | null>(null);
  const refresh = () =>
    getSecurity()
      .then(setSecurity)
      .catch((e) => message.error(e.message));

  useEffect(() => {
    if (visible) refresh();
  }, [visible]);

  const Panel = panels[section];

  return (
    <ConfigProvider theme={authTheme}>
      <Modal
        title={<span className="auth-modal-title">Account</span>}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={880}
        centered
        rootClassName="auth-modal account-modal"
        destroyOnHidden
      >
        <div className="account-layout">
          <Menu
            className="account-nav"
            mode="inline"
            items={navigation}
            selectedKeys={[section]}
            defaultOpenKeys={["security"]}
            onClick={({ key }) => setSection(key as Section)}
          />
          <section className="account-panel" data-testid={\`account-panel-\${section}\`}>
            <Panel
              email={userdata?.email || ""}
              security={security}
              setSecurity={setSecurity}
              refresh={refresh}
              go={(key) => setSection(key as Section)}
            />
          </section>
        </div>
      </Modal>
    </ConfigProvider>
  );
};
` }, "add_auth_account_modal");

const add_auth_authenticator_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "AuthenticatorPanel.tsx", content: `import React, { useState } from "react";
import { Button, Input, Popconfirm, QRCode, Space, Tag, Typography, message } from "antd";
import { disableTotp, enableTotp, newTotpSecret } from "../../../requests/Account";
import { PanelHeader, attempt, type PanelProps } from "./panel";

type Pending = { secret: string; uri: string };

export const AuthenticatorPanel: React.FC<PanelProps> = ({ security, setSecurity }) => {
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");

  const start = () => attempt(newTotpSecret()).then(setPending);
  const verify = () =>
    pending &&
    attempt(enableTotp(pending.secret, code)).then((next) => {
      setSecurity(next);
      setPending(null);
      setCode("");
      message.success("Authenticator app added");
    });

  if (security?.totp_enabled)
    return (
      <>
        <PanelHeader title="Authenticator app">
          <Tag color="green">On</Tag> Codes from your app complete password sign-in.
        </PanelHeader>
        <Popconfirm
          title="Remove the authenticator app?"
          description="If it is your only method, two-factor is turned off."
          onConfirm={() => attempt(disableTotp()).then(setSecurity)}
        >
          <Button danger>Remove authenticator app</Button>
        </Popconfirm>
      </>
    );

  return (
    <>
      <PanelHeader title="Authenticator app">
        Scan the code with your authenticator app, then enter the six digit code it shows.
      </PanelHeader>
      {pending ? (
        <Space direction="vertical" size="middle">
          <QRCode value={pending.uri} bgColor="#fff" color="#000" />
          <Typography.Text copyable={{ text: pending.secret }} type="secondary" data-testid="totp-secret">
            Can't scan? Enter this key: <code>{pending.secret}</code>
          </Typography.Text>
          <Space.Compact>
            <Input
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              onPressEnter={verify}
            />
            <Button type="primary" onClick={verify} disabled={code.length !== 6}>
              Verify
            </Button>
          </Space.Compact>
        </Space>
      ) : (
        <Button type="primary" onClick={start}>
          Set up authenticator app
        </Button>
      )}
    </>
  );
};
` }, "add_auth_authenticator_panel");

const add_auth_email_codes_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "EmailCodesPanel.tsx", content: `import React, { useState } from "react";
import { Button, Input, Popconfirm, Space, Tag, message } from "antd";
import { disableEmailCodes, enableEmailCodes, sendEmailSetupCode } from "../../../requests/Account";
import { PanelHeader, attempt, type PanelProps } from "./panel";

export const EmailCodesPanel: React.FC<PanelProps> = ({ email, security, setSecurity }) => {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");

  const send = () =>
    attempt(sendEmailSetupCode()).then(() => {
      setSent(true);
      message.success(\`Code sent to \${email}\`);
    });

  const verify = () =>
    attempt(enableEmailCodes(code)).then((next) => {
      setSecurity(next);
      setSent(false);
      setCode("");
      message.success("Email codes turned on");
    });

  if (security?.email_otp_enabled)
    return (
      <>
        <PanelHeader title="Email codes">
          <Tag color="green">On</Tag> A code is sent to {email} when you sign in with a password.
        </PanelHeader>
        <Popconfirm
          title="Turn off email codes?"
          description="If it is your only method, two-factor is turned off."
          onConfirm={() => attempt(disableEmailCodes()).then(setSecurity)}
        >
          <Button danger>Turn off email codes</Button>
        </Popconfirm>
      </>
    );

  return (
    <>
      <PanelHeader title="Email codes">
        We'll send a code to {email} to confirm it reaches you.
      </PanelHeader>
      <Space direction="vertical">
        <Button type={sent ? "default" : "primary"} onClick={send}>
          {sent ? "Send another code" : "Send code"}
        </Button>
        {sent && (
          <Space.Compact>
            <Input
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              onPressEnter={verify}
            />
            <Button type="primary" onClick={verify} disabled={code.length !== 6}>
              Turn on
            </Button>
          </Space.Compact>
        )}
      </Space>
    </>
  );
};
` }, "add_auth_email_codes_panel");

const add_auth_invitations_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "InvitationsPanel.tsx", content: `import React, { useEffect, useState } from "react";
import { Button, Form, Input, List, Typography } from "antd";
import {
  listInvitations,
  createInvitation,
  withdrawInvitation,
  inviteLink,
  type Invitation,
} from "../../../requests/Passkeys";
import { PanelHeader, attempt, type PanelProps } from "./panel";

// Requires the "invitations" access tag; the server answers 403 otherwise.
export const InvitationsPanel: React.FC<PanelProps> = () => {
  const [form] = Form.useForm();
  const [pending, setPending] = useState<Invitation[]>([]);
  const [link, setLink] = useState<string>("");
  const refresh = () => attempt(listInvitations()).then(setPending);

  useEffect(() => {
    refresh();
  }, []);

  // Leave email empty for an open invitation: the invitee picks their own.
  const invite = ({ email, note }: { email?: string; note?: string }) =>
    attempt(createInvitation({ ...(email ? { email } : {}), ...(note ? { note } : {}) })).then((invitation) => {
      setLink(inviteLink(invitation.token!));
      form.resetFields();
      return refresh();
    });

  return (
    <>
      <PanelHeader title="Invitations">Invite people to create an account.</PanelHeader>
      <Form form={form} layout="vertical" onFinish={invite}>
        <Form.Item name="email" label="Email (optional)">
          <Input placeholder="Leave empty to let the invitee choose" />
        </Form.Item>
        <Form.Item name="note" label="Note">
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Create invitation
        </Button>
      </Form>
      {link && (
        <Typography.Paragraph copyable style={{ marginTop: 16 }} data-testid="invite-link">
          {link}
        </Typography.Paragraph>
      )}
      <List
        header="Pending"
        dataSource={pending}
        renderItem={(invitation) => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => attempt(withdrawInvitation(invitation.id)).then(refresh)}>
                Withdraw
              </Button>,
            ]}
          >
            {invitation.email || invitation.note || "Open invitation"}
          </List.Item>
        )}
      />
    </>
  );
};
` }, "add_auth_invitations_panel");

const add_auth_overview_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "OverviewPanel.tsx", content: `import React from "react";
import { Descriptions, Tag } from "antd";
import { PanelHeader, type PanelProps } from "./panel";

const methodNames = { totp: "Authenticator app", email: "Email codes" };

export const OverviewPanel: React.FC<PanelProps> = ({ email, security, go }) => (
  <>
    <PanelHeader title="Overview" />
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label="Email">{email}</Descriptions.Item>
      <Descriptions.Item label="Password">
        <a onClick={() => go("password")}>{security?.has_password ? "Set" : "Not set"}</a>
      </Descriptions.Item>
      <Descriptions.Item label="Two-factor">
        <a onClick={() => go("two-factor")}>
          {security?.two_factor_enabled ? (
            <Tag color="green">Required</Tag>
          ) : (
            <Tag>Off</Tag>
          )}
        </a>
        {security?.methods.map((method) => <Tag key={method}>{methodNames[method]}</Tag>)}
      </Descriptions.Item>
      <Descriptions.Item label="Recovery codes">
        <a onClick={() => go("recovery-codes")}>{security?.recovery_codes_remaining ?? "–"} left</a>
      </Descriptions.Item>
    </Descriptions>
  </>
);
` }, "add_auth_overview_panel");

const add_auth_passkeys_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "PasskeysPanel.tsx", content: `import React, { useEffect, useState } from "react";
import { Button, List, Typography } from "antd";
import { addPasskey, deletePasskey, listPasskeys, renamePasskey, type Passkey } from "../../../requests/Passkeys";
import { PanelHeader, attempt, type PanelProps } from "./panel";

// Lists the signed-in user's passkeys; add, rename and revoke them.
export const PasskeysPanel: React.FC<PanelProps> = () => {
  const [keys, setKeys] = useState<Passkey[]>([]);
  const refresh = () => attempt(listPasskeys()).then(setKeys);
  const run = (action: Promise<unknown>) => attempt(action).then(refresh);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <PanelHeader title="Passkeys">Sign in with your device's fingerprint, face or PIN. Click a name to rename it.</PanelHeader>
      <List
        dataSource={keys}
        locale={{ emptyText: "No passkeys yet" }}
        renderItem={(key) => (
          <List.Item
            actions={[
              <Button danger size="small" onClick={() => run(deletePasskey(key.id))}>
                Remove
              </Button>,
            ]}
          >
            <Typography.Text editable={{ onChange: (label) => run(renamePasskey(key.id, label)) }}>
              {key.label}
            </Typography.Text>
          </List.Item>
        )}
      />
      <Button type="primary" onClick={() => run(addPasskey(navigator.platform || "Passkey"))}>
        Add a passkey
      </Button>
    </>
  );
};
` }, "add_auth_passkeys_panel");

const add_auth_password_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "PasswordPanel.tsx", content: `import React from "react";
import { Button, Divider, Form, Input, message } from "antd";
import { changePassword, requestPasswordReset } from "../../../requests/Account";
import { PanelHeader, attempt, type PanelProps } from "./panel";

type PasswordForm = { current_password?: string; password: string; password_confirmation: string };

// Passkey-only accounts have no password yet, so they set one without the current password.
export const PasswordPanel: React.FC<PanelProps> = ({ email, security, refresh }) => {
  const [form] = Form.useForm<PasswordForm>();
  const hasPassword = !!security?.has_password;

  const save = (values: PasswordForm) =>
    attempt(changePassword(values)).then(() => {
      message.success(hasPassword ? "Password changed" : "Password set");
      form.resetFields();
      return refresh();
    });

  const sendReset = () =>
    attempt(requestPasswordReset(email)).then(() => message.success(\`Reset link sent to \${email}\`));

  return (
    <>
      <PanelHeader title={hasPassword ? "Change password" : "Set a password"}>
        {hasPassword
          ? "Changing your password keeps you signed in here."
          : "You sign in with passkeys. A password adds another way in."}
      </PanelHeader>
      <Form form={form} layout="vertical" onFinish={save} autoComplete="off">
        {hasPassword && (
          <Form.Item name="current_password" label="Current password" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
        )}
        <Form.Item name="password" label="New password" rules={[{ required: true }, { min: 12 }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="password_confirmation"
          label="Confirm new password"
          dependencies={["password"]}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || value === getFieldValue("password")
                  ? Promise.resolve()
                  : Promise.reject(new Error("Passwords do not match")),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          {hasPassword ? "Change password" : "Set password"}
        </Button>
      </Form>
      <Divider />
      <PanelHeader title="Reset by email">Forgot your current password? We'll email you a reset link.</PanelHeader>
      <Button onClick={sendReset}>Email me a reset link</Button>
    </>
  );
};
` }, "add_auth_password_panel");

const add_auth_recovery_codes_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "RecoveryCodesPanel.tsx", content: `import React, { useState } from "react";
import { Alert, Button, Popconfirm, Statistic } from "antd";
import { regenerateRecoveryCodes } from "../../../requests/Passkeys";
import { RecoveryCodeList } from "../RecoveryCodes";
import { PanelHeader, attempt, type PanelProps } from "./panel";

// Codes are only ever shown once, so a fresh batch is the only way to see codes again.
export const RecoveryCodesPanel: React.FC<PanelProps> = ({ security, refresh }) => {
  const [codes, setCodes] = useState<string[]>([]);

  const regenerate = () =>
    attempt(regenerateRecoveryCodes()).then((fresh) => {
      setCodes(fresh);
      return refresh();
    });

  return (
    <>
      <PanelHeader title="Recovery codes">
        Each code signs you in once if you lose your passkeys and password. Keep them somewhere safe.
      </PanelHeader>
      <Statistic title="Codes left" value={security?.recovery_codes_remaining ?? 0} />
      {codes.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="account-codes"
          message="Save these now. They will not be shown again."
          description={<RecoveryCodeList codes={codes} />}
        />
      )}
      <Popconfirm
        title="Generate new recovery codes?"
        description="Your current codes stop working."
        onConfirm={regenerate}
      >
        <Button type="primary">Generate new recovery codes</Button>
      </Popconfirm>
    </>
  );
};
` }, "add_auth_recovery_codes_panel");

const add_auth_sessions_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "SessionsPanel.tsx", content: `import React from "react";
import { Button, Popconfirm } from "antd";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import { signOutEverywhere } from "../../../requests/Account";
import { logoutUser } from "../../../requests/User";
import { PanelHeader, attempt, type PanelProps } from "./panel";

export const SessionsPanel: React.FC<PanelProps> = () => {
  const dispatch = useDispatch<Dispatch>();
  const signOutAll = () => attempt(signOutEverywhere()).then(() => logoutUser(dispatch).catch(() => null));

  return (
    <>
      <PanelHeader title="Sessions">
        Signed in somewhere you don't recognise? Sign out every device, including this one.
      </PanelHeader>
      <Popconfirm title="Sign out on every device?" onConfirm={signOutAll}>
        <Button danger>Sign out everywhere</Button>
      </Popconfirm>
    </>
  );
};
` }, "add_auth_sessions_panel");

const add_auth_two_factor_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "TwoFactorPanel.tsx", content: `import React from "react";
import { Alert, Button, List, Switch, Tag, Typography } from "antd";
import { setTwoFactorRequired } from "../../../requests/Account";
import { PanelHeader, attempt, type PanelProps } from "./panel";

const methods = [
  {
    key: "authenticator",
    title: "Authenticator app",
    description: "Six digit codes from an app such as 1Password, Authy or Google Authenticator.",
    enabled: (s: PanelProps["security"]) => !!s?.totp_enabled,
  },
  {
    key: "email-codes",
    title: "Email codes",
    description: "A code sent to your email each time you sign in with a password.",
    enabled: (s: PanelProps["security"]) => !!s?.email_otp_enabled,
  },
];

export const TwoFactorPanel: React.FC<PanelProps> = ({ security, setSecurity, go }) => {
  const noMethods = !security?.methods.length;

  return (
    <>
      <PanelHeader title="Two-factor authentication">
        When required, signing in with a password also asks for a code. Passkeys and recovery codes already
        count as a second factor.
      </PanelHeader>
      <div className="account-toggle">
        <Switch
          checked={!!security?.two_factor_enabled}
          disabled={noMethods}
          onChange={(enabled) => attempt(setTwoFactorRequired(enabled)).then(setSecurity)}
          data-testid="two-factor-toggle"
        />
        <Typography.Text strong>Require a second factor at password sign-in</Typography.Text>
      </div>
      {noMethods && <Alert type="info" showIcon message="Set up a method below before turning this on." />}
      <List
        header="Methods"
        dataSource={methods}
        renderItem={(method) => (
          <List.Item
            actions={[
              <Button size="small" onClick={() => go(method.key)}>
                {method.enabled(security) ? "Manage" : "Set up"}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <>
                  {method.title} {method.enabled(security) ? <Tag color="green">On</Tag> : <Tag>Off</Tag>}
                </>
              }
              description={method.description}
            />
          </List.Item>
        )}
      />
    </>
  );
};
` }, "add_auth_two_factor_panel");

const add_auth_account_styles = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "account.css", content: `.account-modal .ant-modal-body {
  padding: 0;
}

.account-layout {
  display: flex;
  min-height: 460px;
}

.account-nav.ant-menu-inline {
  width: 220px;
  flex-shrink: 0;
  background: transparent;
  border-inline-end: 1px solid rgba(97, 218, 251, 0.2) !important;
}

.account-panel {
  flex: 1;
  min-width: 0;
  padding: 8px 8px 8px 28px;
}

.account-panel-header {
  margin-bottom: 16px;
}

.account-toggle {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.account-codes {
  margin: 16px 0;
}

@media (max-width: 640px) {
  .account-layout {
    flex-direction: column;
  }

  .account-nav.ant-menu-inline {
    width: 100%;
    border-inline-end: none !important;
  }

  .account-panel {
    padding: 16px 0 0;
  }
}
` }, "add_auth_account_styles");

const add_auth_panel = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "panel.tsx", content: `import React from "react";
import { Typography, message } from "antd";
import type { Security } from "../../../requests/Account";

// Every account panel shares the security status loaded by the modal.
export type PanelProps = {
  email: string;
  security: Security | null;
  setSecurity: (security: Security) => void;
  refresh: () => Promise<unknown>;
  go: (section: string) => void;
};

export const PanelHeader: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <header className="account-panel-header">
    <Typography.Title level={4}>{title}</Typography.Title>
    {children && <Typography.Paragraph type="secondary">{children}</Typography.Paragraph>}
  </header>
);

// Runs a request, reports failures, and passes the result through.
export const attempt = <T,>(request: Promise<T>) =>
  request.catch((e: Error) => {
    message.error(e.message);
    throw e;
  });
` }, "add_auth_panel");

const add_auth_forgot_password_form = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/login"), filename: "ForgotPasswordForm.tsx", content: `import React, { useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { requestPasswordReset } from "../../../requests/Account";

// The server answers the same for unknown emails, so the UI always confirms.
export const ForgotPasswordForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sentTo, setSentTo] = useState("");

  const send = ({ email }: { email: string }) => requestPasswordReset(email).finally(() => setSentTo(email));

  return sentTo ? (
    <>
      <Alert
        type="success"
        showIcon
        message="Check your email"
        description={\`If \${sentTo} has an account, a reset link is on its way.\`}
      />
      <Button type="link" block onClick={onBack}>
        Back to sign in
      </Button>
    </>
  ) : (
    <Form layout="vertical" onFinish={send} autoComplete="off">
      <Form.Item
        name="email"
        rules={[
          { required: true, message: "Please input your email!" },
          { type: "email", message: "Please enter a valid email!" },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block size="large">
        Email me a reset link
      </Button>
      <Button type="link" block onClick={onBack}>
        Back to sign in
      </Button>
    </Form>
  );
};
` }, "add_auth_forgot_password_form");

const add_auth_recover_account_form = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/login"), filename: "RecoverAccountForm.tsx", content: `import React from "react";
import { Button, Divider, Form, Input, Typography, message } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import { recoverWithCode } from "../../../requests/Passkeys";
import { showRecoveryCodes } from "../RecoveryCodes";

interface RecoverAccountFormProps {
  onSignedIn: () => void;
  onForgotPassword: () => void;
  onBack: () => void;
}

// Lost every passkey and password: a recovery code signs in once, then set things up again in Account.
export const RecoverAccountForm: React.FC<RecoverAccountFormProps> = ({ onSignedIn, onForgotPassword, onBack }) => {
  const dispatch = useDispatch<Dispatch>();

  const recover = ({ code }: { code: string }) =>
    recoverWithCode(code.trim(), dispatch)
      .then((res) => {
        showRecoveryCodes(res.recovery_codes);
        message.success("Signed in. Add a new passkey or password under Account → Security.");
        onSignedIn();
      })
      .catch((e) => message.error(e.message === "invalid_code" ? "That code is not valid" : e.message));

  return (
    <>
      <Typography.Paragraph>Enter one of the recovery codes you saved when you registered.</Typography.Paragraph>
      <Form layout="vertical" onFinish={recover} autoComplete="off">
        <Form.Item name="code" rules={[{ required: true, message: "Enter a recovery code" }]}>
          <Input prefix={<KeyOutlined />} placeholder="Recovery code" size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Use code
        </Button>
      </Form>
      <Divider plain>No recovery codes?</Divider>
      <Button block onClick={onForgotPassword}>
        Reset password by email
      </Button>
      <Button type="link" block onClick={onBack}>
        Back to sign in
      </Button>
    </>
  );
};
` }, "add_auth_recover_account_form");

const add_auth_two_factor_form = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/login"), filename: "TwoFactorForm.tsx", content: `import React, { useState } from "react";
import { Button, Form, Input, Segmented, Typography, message } from "antd";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import {
  completeTwoFactor,
  sendSignInEmailCode,
  type TwoFactorChallenge,
  type TwoFactorMethod,
} from "../../../requests/Account";

const labels: Record<TwoFactorMethod, string> = { totp: "Authenticator app", email: "Email code" };
const prompts: Record<TwoFactorMethod, string> = {
  totp: "Enter the six digit code from your authenticator app.",
  email: "Send a code to your email, then enter it here.",
};

interface TwoFactorFormProps {
  pending: TwoFactorChallenge;
  onSignedIn: () => void;
  onBack: () => void;
}

// Second step of a password sign-in for accounts that require two factors.
export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ pending, onSignedIn, onBack }) => {
  const dispatch = useDispatch<Dispatch>();
  const [method, setMethod] = useState<TwoFactorMethod>(pending.methods[0]);
  const [loading, setLoading] = useState(false);

  const sendCode = () =>
    sendSignInEmailCode(pending.challenge)
      .then(() => message.success("Code sent"))
      .catch((e) => message.error(e.message));

  const verify = ({ code }: { code: string }) => {
    setLoading(true);
    completeTwoFactor(pending.challenge, method, code.trim(), dispatch)
      .then(onSignedIn)
      .catch((e) => message.error(e.message === "invalid_challenge" ? "Sign-in expired, start again" : "Invalid code"))
      .finally(() => setLoading(false));
  };

  return (
    <Form layout="vertical" onFinish={verify} autoComplete="off">
      {pending.methods.length > 1 && (
        <Form.Item>
          <Segmented
            block
            value={method}
            onChange={(value) => setMethod(value as TwoFactorMethod)}
            options={pending.methods.map((value) => ({ value, label: labels[value] }))}
          />
        </Form.Item>
      )}
      <Typography.Paragraph>{prompts[method]}</Typography.Paragraph>
      {method === "email" && (
        <Form.Item>
          <Button block onClick={sendCode}>
            Send code
          </Button>
        </Form.Item>
      )}
      <Form.Item name="code" rules={[{ required: true, message: "Enter your code" }]}>
        <Input size="large" placeholder="123456" inputMode="numeric" maxLength={6} autoFocus />
      </Form.Item>
      <Button type="primary" htmlType="submit" block size="large" loading={loading}>
        Verify
      </Button>
      <Button type="link" block onClick={onBack}>
        Back
      </Button>
    </Form>
  );
};
` }, "add_auth_two_factor_form");

const add_auth_account_requests = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/requests"), filename: "Account.tsx", content: `import type { Dispatch } from "redux";
import { api, signedIn } from "./Passkeys";

type TwoFactorMethod = "totp" | "email";

type Security = {
  two_factor_enabled: boolean;
  methods: TwoFactorMethod[];
  totp_enabled: boolean;
  email_otp_enabled: boolean;
  has_password: boolean;
  recovery_codes_remaining: number;
};

// A password sign-in that still needs a second factor answers with a challenge instead of a token.
type TwoFactorChallenge = { challenge: string; methods: TwoFactorMethod[] };

const security = (res: { data: Security }) => res.data;

// ** Account security (signed in) **
const getSecurity = (): Promise<Security> => api("users/security").then(security);
const setTwoFactorRequired = (enabled: boolean): Promise<Security> =>
  api("users/security", "PUT", { two_factor_enabled: enabled }).then(security);

const newTotpSecret = (): Promise<{ secret: string; uri: string }> => api("users/security/totp", "POST");
const enableTotp = (secret: string, code: string): Promise<Security> =>
  api("users/security/totp", "PUT", { secret, code }).then(security);
const disableTotp = (): Promise<Security> => api("users/security/totp", "DELETE").then(security);

const sendEmailSetupCode = () => api("users/security/email", "POST");
const enableEmailCodes = (code: string): Promise<Security> =>
  api("users/security/email", "PUT", { code }).then(security);
const disableEmailCodes = (): Promise<Security> => api("users/security/email", "DELETE").then(security);

const changePassword = (attrs: { current_password?: string; password: string; password_confirmation: string }) =>
  api("users/password", "PUT", attrs);

const signOutEverywhere = () => api("users/sessions", "DELETE");

// ** Signed out **
const passwordSignIn = (
  credentials: { email: string; password: string },
  dispatch: Dispatch,
): Promise<{ two_factor?: TwoFactorChallenge }> =>
  api("users/log_in", "POST", { user: credentials }).then((res) => (res.two_factor ? res : signedIn(dispatch)(res)));

const sendSignInEmailCode = (challenge: string) => api("users/log_in/two_factor/email", "POST", { challenge });
const completeTwoFactor = (challenge: string, method: TwoFactorMethod, code: string, dispatch: Dispatch) =>
  api("users/log_in/two_factor", "POST", { challenge, method, code }).then(signedIn(dispatch));

const requestPasswordReset = (email: string) => api("users/reset_password", "POST", { email });
const resetPassword = (token: string, password: string, password_confirmation: string) =>
  api(\`users/reset_password/\${token}\`, "PUT", { password, password_confirmation });

export {
  getSecurity,
  setTwoFactorRequired,
  newTotpSecret,
  enableTotp,
  disableTotp,
  sendEmailSetupCode,
  enableEmailCodes,
  disableEmailCodes,
  changePassword,
  signOutEverywhere,
  passwordSignIn,
  sendSignInEmailCode,
  completeTwoFactor,
  requestPasswordReset,
  resetPassword,
};
export type { Security, TwoFactorMethod, TwoFactorChallenge };
` }, "add_auth_account_requests");

const add_auth_two_factor = async ({ ApiNameCamel, ApiNameSnake, AppDir, AppNameCamel, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/accounts`), filename: "two_factor.ex", content: `defmodule ${ApiNameCamel}.Accounts.TwoFactor do
  @moduledoc """
  Second factors for password sign-in: an authenticator app (TOTP) and codes sent by email.

  Passkeys and recovery codes already prove possession, so only the password
  path asks for a second factor, and only while the user requires it.
  """
  import Ecto.Query, warn: false

  alias Ecto.Changeset
  alias ${ApiNameCamel}.Accounts.{User, UserNotifier, UserToken}
  alias ${AppNameCamel}.AuthRepo, as: Repo

  @issuer "${AppNameCamel}"
  @email_context "email_otp"
  @email_code_minutes 10
  @challenge_salt "two_factor"
  @challenge_seconds 300

  ## Status

  @doc "The second factors the user has set up."
  def methods(%User{} = user),
    do: [totp: user.totp_enabled_at, email: user.email_otp_enabled_at] |> Enum.filter(&elem(&1, 1)) |> Enum.map(&to_string(elem(&1, 0)))

  @doc "Whether password sign-in must be followed by a second factor."
  def required?(%User{two_factor_enabled: enabled} = user), do: enabled and methods(user) != []

  @doc "Everything the account security page shows."
  def status(%User{} = user) do
    %{
      two_factor_enabled: required?(user),
      methods: methods(user),
      totp_enabled: not is_nil(user.totp_enabled_at),
      email_otp_enabled: not is_nil(user.email_otp_enabled_at),
      has_password: not is_nil(user.hashed_password)
    }
  end

  @doc "Turns the second-factor requirement on or off; on needs at least one method."
  def set_required(%User{totp_enabled_at: nil, email_otp_enabled_at: nil}, true), do: {:error, :no_methods}

  def set_required(%User{} = user, enabled), do: save(user, two_factor_enabled: enabled == true)

  ## Authenticator app

  @doc "A fresh secret and the otpauth URI an authenticator app scans."
  def new_totp do
    secret = NimbleTOTP.secret()
    %{secret: Base.encode32(secret, padding: false), secret_bytes: secret}
  end

  def totp_uri(%User{email: email}, encoded_secret),
    do: NimbleTOTP.otpauth_uri("#{@issuer}:#{email}", decode_secret!(encoded_secret), issuer: @issuer)

  @doc "Stores the secret once the user proves their app produces matching codes."
  def enable_totp(%User{} = user, encoded_secret, code) do
    with {:ok, secret} <- decode_secret(encoded_secret),
         true <- NimbleTOTP.valid?(secret, to_string(code)) || {:error, :invalid_code} do
      save(user, totp_secret: secret, totp_enabled_at: now())
    end
  end

  def disable_totp(%User{} = user),
    do: user |> update_and_relax(totp_secret: nil, totp_enabled_at: nil, totp_last_used_at: nil)

  # A code is rejected if it falls in a period that already signed in, so it cannot be replayed.
  defp verify_totp(%User{totp_secret: secret} = user, code) when is_binary(secret) do
    if NimbleTOTP.valid?(secret, to_string(code), since: user.totp_last_used_at),
      do: save(user, totp_last_used_at: now()),
      else: {:error, :invalid_code}
  end

  defp verify_totp(_user, _code), do: {:error, :invalid_code}

  ## Email codes

  @doc "Emails a six digit code, replacing any code sent before."
  def deliver_email_code(%User{} = user) do
    code = 6 |> :crypto.strong_rand_bytes() |> :binary.decode_unsigned() |> rem(1_000_000) |> Integer.to_string() |> String.pad_leading(6, "0")

    Repo.delete_all(UserToken.by_user_and_contexts_query(user, [@email_context]))
    Repo.insert!(%UserToken{token: hash(code), context: @email_context, sent_to: user.email, user_id: user.id})
    UserNotifier.deliver_two_factor_code(user, code)
  end

  @doc "Turns on email codes once the user enters one we sent."
  def enable_email(%User{} = user, code) do
    with {:ok, user} <- verify_email(user, code), do: save(user, email_otp_enabled_at: now())
  end

  def disable_email(%User{} = user), do: update_and_relax(user, email_otp_enabled_at: nil)

  defp verify_email(%User{} = user, code) do
    from(t in UserToken,
      where: t.user_id == ^user.id and t.context == @email_context and t.token == ^hash(to_string(code)),
      where: t.inserted_at > ago(@email_code_minutes, "minute")
    )
    |> Repo.delete_all()
    |> case do
      {1, _} -> {:ok, user}
      _ -> {:error, :invalid_code}
    end
  end

  ## Sign-in challenge

  @doc "A short-lived token standing in for a correct password until the second factor arrives."
  def challenge(%User{id: id}), do: Phoenix.Token.sign(${ApiNameCamel}.Endpoint, @challenge_salt, id)

  def challenged_user(challenge) do
    with {:ok, id} <- Phoenix.Token.verify(${ApiNameCamel}.Endpoint, @challenge_salt, challenge, max_age: @challenge_seconds),
         %User{} = user <- Repo.get(User, id) do
      {:ok, user}
    else
      _ -> {:error, :invalid_challenge}
    end
  end

  @doc "Checks a code for one of the user's enabled methods."
  def verify(%User{} = user, method, code) do
    case {method, method in methods(user)} do
      {_, false} -> {:error, :method_not_enabled}
      {"totp", true} -> verify_totp(user, code)
      {"email", true} -> verify_email(user, code)
    end
  end

  ## Helpers

  # Dropping the last method also drops the requirement, so nobody is locked out.
  defp update_and_relax(user, changes) do
    with {:ok, user} <- save(user, changes) do
      if methods(user) == [], do: save(user, two_factor_enabled: false), else: {:ok, user}
    end
  end

  defp save(user, changes), do: user |> Changeset.change(changes) |> Repo.update()

  defp decode_secret(encoded) when is_binary(encoded) do
    case Base.decode32(String.upcase(encoded), padding: false) do
      {:ok, secret} when byte_size(secret) >= 10 -> {:ok, secret}
      _ -> {:error, :invalid_secret}
    end
  end

  defp decode_secret(_), do: {:error, :invalid_secret}

  defp decode_secret!(encoded), do: encoded |> decode_secret() |> elem(1)

  defp hash(code), do: :crypto.hash(:sha256, code)

  defp now, do: DateTime.utc_now() |> DateTime.truncate(:second)
end
` }, "add_auth_two_factor");

const add_auth_password_json_controller = async ({ ApiNameCamel, ApiNameSnake, AppDir, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`), filename: "password_json_controller.ex", content: `defmodule ${ApiNameCamel}.PasswordJSONController do
  @moduledoc "Changing, setting and resetting passwords for the UI."
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts

  # Always answers the same way so the endpoint does not reveal which emails have accounts.
  def request_reset(conn, %{"email" => email}) when is_binary(email) do
    if user = Accounts.get_user_by_email(email),
      do: Accounts.deliver_user_reset_password_instructions(user, &"#{ui_url(conn)}/?reset=#{&1}")

    json(conn, %{status: "sent"})
  end

  def reset(conn, %{"token" => token} = params) do
    with %Accounts.User{} = user <- Accounts.get_user_by_reset_password_token(token),
         {:ok, _user} <- Accounts.reset_user_password(user, Map.take(params, ["password", "password_confirmation"])) do
      json(conn, %{status: "reset"})
    else
      nil -> conn |> put_status(:not_found) |> json(%{error: "invalid_token"})
      {:error, changeset} -> errors(conn, changeset)
    end
  end

  # Passkey-only accounts have no password yet, so they set one without the current password.
  def update(conn, params) do
    case Accounts.set_user_password(conn.assigns.current_user, params["current_password"], params) do
      {:ok, _user} -> json(conn, %{status: "updated"})
      {:error, changeset} -> errors(conn, changeset)
    end
  end

  # Reset links go to the UI, which runs on one of the origins CORS already allows.
  defp ui_url(conn) do
    allowed = Application.get_env(:${AppNameSnake}, CORSPlug)[:origin] || []
    origin = conn |> get_req_header("origin") |> List.first()
    if origin in allowed, do: origin, else: List.first(allowed) || ${ApiNameCamel}.Endpoint.url()
  end

  defp errors(conn, changeset),
    do:
      conn
      |> put_status(:unprocessable_entity)
      |> json(%{errors: Ecto.Changeset.traverse_errors(changeset, fn {message, _opts} -> message end)})
end
` }, "add_auth_password_json_controller");

const add_auth_security_json_controller = async ({ ApiNameCamel, ApiNameSnake, AppDir, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`), filename: "security_json_controller.ex", content: `defmodule ${ApiNameCamel}.SecurityJSONController do
  @moduledoc "Account security for the signed-in user: two-factor methods and the requirement toggle."
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts.TwoFactor
  alias Ithibati.Identity.RecoveryCodes

  def show(conn, _params), do: render_status(conn, conn.assigns.current_user)

  def update(conn, %{"two_factor_enabled" => enabled}),
    do: conn |> respond(TwoFactor.set_required(conn.assigns.current_user, enabled == true))

  # A new secret is only stored once a code from it verifies, see enable_totp.
  def new_totp(conn, _params) do
    %{secret: secret} = TwoFactor.new_totp()
    json(conn, %{secret: secret, uri: TwoFactor.totp_uri(conn.assigns.current_user, secret)})
  end

  def enable_totp(conn, %{"secret" => secret, "code" => code}),
    do: conn |> respond(TwoFactor.enable_totp(conn.assigns.current_user, secret, code))

  def disable_totp(conn, _params), do: conn |> respond(TwoFactor.disable_totp(conn.assigns.current_user))

  def send_email_code(conn, _params) do
    TwoFactor.deliver_email_code(conn.assigns.current_user)
    json(conn, %{status: "sent"})
  end

  def enable_email(conn, %{"code" => code}),
    do: conn |> respond(TwoFactor.enable_email(conn.assigns.current_user, code))

  def disable_email(conn, _params), do: conn |> respond(TwoFactor.disable_email(conn.assigns.current_user))

  defp respond(conn, {:ok, user}), do: render_status(conn, user)

  defp respond(conn, {:error, reason}) when is_atom(reason),
    do: conn |> put_status(:unprocessable_entity) |> json(%{error: to_string(reason)})

  defp respond(conn, {:error, _changeset}),
    do: conn |> put_status(:unprocessable_entity) |> json(%{error: "invalid"})

  defp render_status(conn, user),
    do: json(conn, %{data: Map.put(TwoFactor.status(user), :recovery_codes_remaining, RecoveryCodes.remaining(user))})
end
` }, "add_auth_security_json_controller");

const add_auth_two_factor_json_controller = async ({ ApiNameCamel, ApiNameSnake, AppDir, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`), filename: "two_factor_json_controller.ex", content: `defmodule ${ApiNameCamel}.TwoFactorJSONController do
  @moduledoc "Finishes a password sign-in that needs a second factor."
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts.TwoFactor
  alias ${ApiNameCamel}.UserSessionJSONController

  # Sends an email code for the pending sign-in.
  def send_code(conn, %{"challenge" => challenge}) do
    with {:ok, user} <- TwoFactor.challenged_user(challenge),
         true <- "email" in TwoFactor.methods(user) || {:error, :method_not_enabled} do
      TwoFactor.deliver_email_code(user)
      json(conn, %{status: "sent"})
    else
      {:error, reason} -> error(conn, reason)
    end
  end

  def create(conn, %{"challenge" => challenge, "method" => method, "code" => code}) do
    with {:ok, user} <- TwoFactor.challenged_user(challenge),
         {:ok, user} <- TwoFactor.verify(user, method, code) do
      UserSessionJSONController.signed_in(conn, user)
    else
      {:error, reason} -> error(conn, reason)
    end
  end

  def create(conn, _params), do: error(conn, :invalid_request)

  defp error(conn, reason), do: conn |> put_status(:unauthorized) |> json(%{error: to_string(reason)})
end
` }, "add_auth_two_factor_json_controller");

const add_auth_account_security_test = async ({ ApiNameCamel, ApiNameSnake, AppDir, AppNameCamel, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}`), filename: "account_security_test.exs", content: `defmodule ${ApiNameCamel}.AccountSecurityTest do
  use ${ApiNameCamel}.ConnCase, async: false

  alias Ithibati.Identity.{RecoveryCodes, Sessions}
  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.Accounts.User
  alias ${AppNameCamel}.AuthRepo, as: Repo

  @password "correct horse battery"

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    ${ApiNameCamel}.IthibatiHelpers.claim_instance!()
    {:ok, user} = Accounts.register_user(%{email: "user#{System.unique_integer([:positive])}@example.com", password: @password})
    {:ok, user: user}
  end

  defp api(user) do
    token = user |> Sessions.generate_session_token() |> Base.url_encode64()
    put_req_header(build_conn(), "authorization", "Bearer " <> token)
  end

  defp log_in(user, password \\\\ @password),
    do: build_conn() |> post("/api/users/log_in", %{email: user.email, password: password})

  # Emails are faked by the Swoosh test adapter; the code is read from the delivered body.
  defp emailed_code do
    assert_received {:email, %{subject: "Your sign-in code", text_body: body}}
    [code] = Regex.run(~r/\\b\\d{6}\\b/, body)
    code
  end

  defp enable_totp(user) do
    %{"secret" => secret} = user |> api() |> post("/api/users/security/totp") |> json_response(200)
    code = secret |> Base.decode32!(padding: false) |> NimbleTOTP.verification_code()
    user |> api() |> put("/api/users/security/totp", %{secret: secret, code: code}) |> json_response(200)
    secret
  end

  defp require_two_factor(user),
    do: user |> api() |> put("/api/users/security", %{two_factor_enabled: true}) |> json_response(200)

  describe "registration" do
    test "password registration returns recovery codes once" do
      %{"recovery_codes" => codes, "token" => _} =
        build_conn()
        |> post("/api/users/register", %{email: "new@example.com", password: @password})
        |> json_response(201)

      assert length(codes) == 12
      assert RecoveryCodes.remaining(Accounts.get_user_by_email("new@example.com")) == 12
    end
  end

  describe "two-factor settings" do
    test "the requirement needs at least one method", %{user: user} do
      assert %{"error" => "no_methods"} =
               user |> api() |> put("/api/users/security", %{two_factor_enabled: true}) |> json_response(422)
    end

    test "an authenticator app is only stored after a matching code", %{user: user} do
      %{"secret" => secret, "uri" => uri} = user |> api() |> post("/api/users/security/totp") |> json_response(200)
      assert uri =~ "otpauth://totp/"

      assert %{"error" => "invalid_code"} =
               user |> api() |> put("/api/users/security/totp", %{secret: secret, code: "000000"}) |> json_response(422)

      enable_totp(user)
      assert %{"data" => %{"totp_enabled" => true, "methods" => ["totp"]}} = user |> api() |> get("/api/users/security") |> json_response(200)
    end

    test "email codes are enabled with an emailed code", %{user: user} do
      user |> api() |> post("/api/users/security/email") |> json_response(200)

      assert %{"data" => %{"email_otp_enabled" => true}} =
               user |> api() |> put("/api/users/security/email", %{code: emailed_code()}) |> json_response(200)
    end

    test "removing the last method turns the requirement off", %{user: user} do
      enable_totp(user)
      require_two_factor(user)

      assert %{"data" => %{"two_factor_enabled" => false, "methods" => []}} =
               user |> api() |> delete("/api/users/security/totp") |> json_response(200)
    end
  end

  describe "password sign-in with two factors" do
    test "without the requirement a password signs straight in", %{user: user} do
      enable_totp(user)
      assert %{"token" => _} = user |> log_in() |> json_response(200)
    end

    test "an authenticator code completes the sign-in once", %{user: user} do
      secret = enable_totp(user)
      require_two_factor(user)
      code = secret |> Base.decode32!(padding: false) |> NimbleTOTP.verification_code()

      %{"two_factor" => %{"challenge" => challenge, "methods" => ["totp"]}} = user |> log_in() |> json_response(200)
      refute Map.has_key?(user |> log_in() |> json_response(200), "token")

      finish = fn -> build_conn() |> post("/api/users/log_in/two_factor", %{challenge: challenge, method: "totp", code: code}) end
      assert %{"token" => _, "data" => %{"email" => _}} = finish.() |> json_response(200)
      assert %{"error" => "invalid_code"} = finish.() |> json_response(401)
    end

    test "an emailed code completes the sign-in", %{user: user} do
      user |> api() |> post("/api/users/security/email")
      user |> api() |> put("/api/users/security/email", %{code: emailed_code()})
      require_two_factor(user)

      %{"two_factor" => %{"challenge" => challenge}} = user |> log_in() |> json_response(200)
      build_conn() |> post("/api/users/log_in/two_factor/email", %{challenge: challenge}) |> json_response(200)

      assert %{"token" => _} =
               build_conn()
               |> post("/api/users/log_in/two_factor", %{challenge: challenge, method: "email", code: emailed_code()})
               |> json_response(200)
    end

    test "a forged challenge is rejected" do
      assert %{"error" => "invalid_challenge"} =
               build_conn()
               |> post("/api/users/log_in/two_factor", %{challenge: "forged", method: "totp", code: "123456"})
               |> json_response(401)
    end
  end

  describe "passwords" do
    test "a reset link is emailed and sets a new password", %{user: user} do
      build_conn() |> put_req_header("origin", "http://localhost:4002") |> post("/api/users/reset_password", %{email: user.email}) |> json_response(200)
      assert_received {:email, %{text_body: body}}
      [_, token] = Regex.run(~r{http://localhost:4002/\\?reset=(\\S+)}, body)

      build_conn()
      |> put("/api/users/reset_password/#{token}", %{password: "a brand new password", password_confirmation: "a brand new password"})
      |> json_response(200)

      assert %{"token" => _} = user |> log_in("a brand new password") |> json_response(200)
    end

    test "an unknown email answers the same and sends nothing" do
      assert %{"status" => "sent"} = build_conn() |> post("/api/users/reset_password", %{email: "nobody@example.com"}) |> json_response(200)
      refute_received {:email, _}
    end

    test "changing the password needs the current one", %{user: user} do
      params = %{password: "another long password", password_confirmation: "another long password"}
      assert %{"errors" => %{"current_password" => _}} = user |> api() |> put("/api/users/password", Map.put(params, :current_password, "wrong")) |> json_response(422)
      assert %{"status" => "updated"} = user |> api() |> put("/api/users/password", Map.put(params, :current_password, @password)) |> json_response(200)
    end

    test "a passkey-only account sets its first password" do
      user = Repo.insert!(%User{email: "passkey#{System.unique_integer([:positive])}@example.com"})

      assert %{"status" => "updated"} =
               user |> api() |> put("/api/users/password", %{password: "first long password", password_confirmation: "first long password"}) |> json_response(200)

      assert %{"token" => _} = user |> log_in("first long password") |> json_response(200)
    end
  end
end
` }, "add_auth_account_security_test");

const add_auth_fake_auth_server_content = ({ AppNameCamel }: Partial<ApiAppData>) => `import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { ${AppNameCamel}Store } from "../store";

type Handler = (body: any) => [number, object] | object;
type Routes = Record<string, Handler>;

// Fakes the auth app: routes are "METHOD /path" (/api is dropped, /auth kept), answering JSON. Email is never sent;
// tests assert on the requests the UI made instead.
export const fakeAuthServer = (routes: Routes) => {
  const calls: { route: string; body: any }[] = [];
  const fetchMock = vi.fn(async (url: string | URL, init: RequestInit = {}) => {
    const route = \`\${init.method || "GET"} \${new URL(String(url)).pathname.replace(/^\\/api/, "")}\`;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ route, body });
    const answer = routes[route]?.(body) ?? [404, { error: "not_found" }];
    const [status, json] = Array.isArray(answer) ? answer : [200, answer];
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, called: (route: string) => calls.filter((call) => call.route === route) };
};

// antd reads these browser APIs that jsdom lacks.
export const stubBrowser = () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
};

export const renderWithStore = (ui: React.ReactElement) => render(<Provider store={${AppNameCamel}Store}>{ui}</Provider>);

export const security = (overrides = {}) => ({
  data: {
    two_factor_enabled: false,
    methods: [],
    totp_enabled: false,
    email_otp_enabled: false,
    has_password: true,
    recovery_codes_remaining: 12,
    ...overrides,
  },
});
`;

// One UI's fake auth app for its vitest run; add_auth_to_ui calls this for every UI, including ones added later.
const add_auth_fake_auth_server = async (uiDir: string, { AppNameCamel }: Pick<ApiAppData, "AppNameCamel">) =>
  generateFile(
    { dir: join(uiDir, "src/test"), filename: "fakeAuthServer.tsx", content: add_auth_fake_auth_server_content({ AppNameCamel }) },
    "add_auth_fake_auth_server"
  );

export {
  add_auth_login_modal_test,
  add_auth_reset_password_modal,
  add_auth_account_modal_test,
  add_auth_account_modal,
  add_auth_authenticator_panel,
  add_auth_email_codes_panel,
  add_auth_invitations_panel,
  add_auth_overview_panel,
  add_auth_passkeys_panel,
  add_auth_password_panel,
  add_auth_recovery_codes_panel,
  add_auth_sessions_panel,
  add_auth_two_factor_panel,
  add_auth_account_styles,
  add_auth_panel,
  add_auth_forgot_password_form,
  add_auth_recover_account_form,
  add_auth_two_factor_form,
  add_auth_account_requests,
  add_auth_two_factor,
  add_auth_password_json_controller,
  add_auth_security_json_controller,
  add_auth_two_factor_json_controller,
  add_auth_account_security_test,
  add_auth_fake_auth_server,
};
