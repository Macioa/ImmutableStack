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
import {
  fakeAuthServer,
  renderWithStore,
  security,
  stubBrowser,
} from "@test/fakeAuthServer";
import { AccountModal } from "./AccountModal";

beforeEach(stubBrowser);

const open = async (section?: string | RegExp) => {
  renderWithStore(<AccountModal visible onCancel={() => null} />);
  await screen.findByTestId("account-panel-overview");
  if (section)
    await userEvent.click(screen.getByRole("menuitem", { name: section }));
};

const button = (name: RegExp | string) => screen.getByRole("button", { name });

test("the left navigation groups security and invitations", async () => {
  fakeAuthServer({ "GET /users/security": () => security() });
  await open();

  const [nav] = screen.getAllByRole("menu");
  [
    "Overview",
    "Password",
    "Two-factor",
    "Authenticator app",
    "Email codes",
    "Passkeys",
    "Recovery codes",
    "Sessions",
  ].forEach((name) => expect(within(nav).getByText(name)).toBeInTheDocument());

  await userEvent.click(within(nav).getByText("Invitations"));
  expect(within(nav).getByText("Manage invitations")).toBeInTheDocument();
});

test("recovery codes show the remaining count and a fresh batch once", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security({ recovery_codes_remaining: 3 }),
    "POST /users/recovery_codes": () => ({
      recovery_codes: ["aaaa-bbbb", "cccc-dddd"],
    }),
  });
  await open("Recovery codes");

  expect(await screen.findByText("3")).toBeInTheDocument();
  await userEvent.click(button("Generate new recovery codes"));
  await userEvent.click(button("OK"));

  expect(await screen.findByTestId("recovery-codes")).toHaveTextContent(
    "aaaa-bbbb",
  );
  expect(server.called("POST /users/recovery_codes")).toHaveLength(1);
});

test("the two-factor toggle waits for a method, then turns the requirement on", async () => {
  fakeAuthServer({ "GET /users/security": () => security() });
  await open("Two-factor");
  await waitFor(() =>
    expect(screen.getByTestId("two-factor-toggle")).toBeDisabled(),
  );
});

test("toggling two-factor saves the requirement", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () =>
      security({ methods: ["totp"], totp_enabled: true }),
    "PUT /users/security": ({ two_factor_enabled }) =>
      security({ methods: ["totp"], totp_enabled: true, two_factor_enabled }),
  });
  await open("Two-factor");

  const toggle = screen.getByTestId("two-factor-toggle");
  await waitFor(() => expect(toggle).toBeEnabled());
  await userEvent.click(toggle);

  await waitFor(() => expect(toggle).toBeChecked());
  expect(server.called("PUT /users/security")[0].body).toEqual({
    two_factor_enabled: true,
  });
});

test("an authenticator app is added with a verified code", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "POST /users/security/totp": () => ({
      secret: "JBSWY3DPEHPK3PXP",
      uri: "otpauth://totp/${AppNameCamel}:me",
    }),
    "PUT /users/security/totp": () =>
      security({ methods: ["totp"], totp_enabled: true }),
  });
  await open("Authenticator app");

  await userEvent.click(button("Set up authenticator app"));
  expect(await screen.findByTestId("totp-secret")).toHaveTextContent(
    "JBSWY3DPEHPK3PXP",
  );
  await userEvent.type(screen.getByPlaceholderText("123456"), "123456");
  await userEvent.click(button("Verify"));

  expect(
    await screen.findByText("Remove authenticator app"),
  ).toBeInTheDocument();
  expect(server.called("PUT /users/security/totp")[0].body).toEqual({
    secret: "JBSWY3DPEHPK3PXP",
    code: "123456",
  });
});

test("email codes are turned on with an emailed code", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "POST /users/security/email": () => ({ status: "sent" }),
    "PUT /users/security/email": () =>
      security({ methods: ["email"], email_otp_enabled: true }),
  });
  await open("Email codes");

  await userEvent.click(button("Send code"));
  await userEvent.type(await screen.findByPlaceholderText("123456"), "654321");
  await userEvent.click(button("Turn on"));

  expect(await screen.findByText("Turn off email codes")).toBeInTheDocument();
  expect(server.called("POST /users/security/email")).toHaveLength(1);
  expect(server.called("PUT /users/security/email")[0].body).toEqual({
    code: "654321",
  });
});

test("a password is changed with the current one", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "PUT /users/password": () => ({ status: "updated" }),
  });
  await open("Password");

  await userEvent.type(
    await screen.findByLabelText("Current password"),
    "old long password",
  );
  await userEvent.type(
    screen.getByLabelText("New password"),
    "new long password",
  );
  await userEvent.type(
    screen.getByLabelText("Confirm new password"),
    "new long password",
  );
  await userEvent.click(button("Change password"));

  await waitFor(() =>
    expect(server.called("PUT /users/password")[0]?.body).toEqual({
      current_password: "old long password",
      password: "new long password",
      password_confirmation: "new long password",
    }),
  );
});

test("require_2fa on the server locks two-factor on with email codes", async () => {
  fakeAuthServer({
    "GET /users/security": () =>
      security({
        required_by_server: true,
        two_factor_enabled: true,
        email_otp_enabled: true,
        methods: ["email"],
      }),
  });
  await open("Two-factor");

  expect(await screen.findByTestId("two-factor-toggle")).toBeDisabled();
  expect(screen.getByTestId("two-factor-toggle")).toBeChecked();
  expect(screen.getByText(/requires a second factor for every account/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("menuitem", { name: "Email codes" }));
  expect(await screen.findByText(/Required by this server/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Turn off/ })).toBeNull();
});

test("the email changes right away when the server does not require verification", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "POST /users/email": ({ email }) => ({ status: "changed", email }),
  });
  await open(/Email$/);

  await userEvent.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
  await userEvent.click(button("Change email"));

  await waitFor(() => expect(server.called("POST /users/email")).toHaveLength(1));
  expect(server.called("POST /users/email")[0].body).toEqual({ email: "new@example.com" });
});

test("with require_2fa a new email is saved after its code is entered", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security({ required_by_server: true }),
    "POST /users/email": ({ email }) => ({ status: "verify", email }),
    "PUT /users/email": ({ email }) => ({ status: "changed", email }),
  });
  await open(/Email$/);

  await userEvent.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
  await userEvent.click(button("Send code"));
  await userEvent.type(await screen.findByTestId("email-change-code"), "123456");
  await userEvent.click(button("Verify and save"));

  await waitFor(() => expect(server.called("PUT /users/email")).toHaveLength(1));
  expect(server.called("PUT /users/email")[0].body).toEqual({
    email: "new@example.com",
    code: "123456",
  });
});

test("connected accounts lists each linked account, two from one provider too", async () => {
  const server = fakeAuthServer({
    "GET /users/security": () => security(),
    "GET /users/oauth": () => ({
      data: [
        { id: "a", provider: "github", provider_email: "work@x.com", inserted_at: "2026-11-01T00:00:00Z" },
        { id: "b", provider: "github", provider_email: "home@x.com", inserted_at: "2026-11-02T00:00:00Z" },
      ],
    }),
    "DELETE /users/oauth/a": () => ({ status: "removed" }),
  });
  await open(/Connected accounts$/);

  expect(await screen.findByText(/work@x.com/)).toBeInTheDocument();
  expect(screen.getByText(/home@x.com/)).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
  await userEvent.click(button("OK"));
  await waitFor(() => expect(server.called("DELETE /users/oauth/a")).toHaveLength(1));
});
` }, "add_auth_account_modal_test");

const add_auth_account_modal = async ({ LibDir }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "AccountModal.tsx", content: `import React, { useEffect, useState } from "react";
import { ConfigProvider, Menu, Modal, message, type MenuProps } from "antd";
import {
  ApiOutlined,
  MailOutlined,
  SafetyOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectUserdata } from "../../../state/User";
import { getSecurity, type Security } from "../../../requests/Account";
import { authTheme } from "../AuthModal";
import { OverviewPanel } from "./OverviewPanel";
import { EmailPanel } from "./EmailPanel";
import { ConnectedAccountsPanel } from "./ConnectedAccountsPanel";
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
  | "email"
  | "connected-accounts"
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
  { key: "email", icon: <MailOutlined />, label: "Email" },
  {
    key: "connected-accounts",
    icon: <ApiOutlined />,
    label: "Connected accounts",
  },
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
  email: EmailPanel,
  "connected-accounts": ConnectedAccountsPanel,
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

export const AccountModal: React.FC<AccountModalProps> = ({
  visible,
  onCancel,
}) => {
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
          <section
            className="account-panel"
            data-testid={\`account-panel-\${section}\`}
          >
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
import {
  disableEmailCodes,
  enableEmailCodes,
  sendEmailSetupCode,
} from "../../../requests/Account";
import { PanelHeader, attempt, type PanelProps } from "./panel";

export const EmailCodesPanel: React.FC<PanelProps> = ({
  email,
  security,
  setSecurity,
}) => {
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

  // require_2fa on the server: email codes are on for every account and cannot be turned off
  if (security?.required_by_server)
    return (
      <PanelHeader title="Email codes">
        <Tag color="green">On</Tag> Required by this server for every account.
        A code is sent to {email} when you sign in with a password; you can use
        an authenticator app instead.
      </PanelHeader>
    );

  if (security?.email_otp_enabled)
    return (
      <>
        <PanelHeader title="Email codes">
          <Tag color="green">On</Tag> A code is sent to {email} when you sign in
          with a password.
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
            <Button
              type="primary"
              onClick={verify}
              disabled={code.length !== 6}
            >
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

export const OverviewPanel: React.FC<PanelProps> = ({
  email,
  security,
  go,
}) => (
  <>
    <PanelHeader title="Overview" />
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label="Email">
        <a onClick={() => go("email")}>{email}</a>
      </Descriptions.Item>
      <Descriptions.Item label="Password">
        <a onClick={() => go("password")}>
          {security?.has_password ? "Set" : "Not set"}
        </a>
      </Descriptions.Item>
      <Descriptions.Item label="Two-factor">
        <a onClick={() => go("two-factor")}>
          {security?.two_factor_enabled ? (
            <Tag color="green">Required</Tag>
          ) : (
            <Tag>Off</Tag>
          )}
        </a>
        {security?.methods.map((method) => (
          <Tag key={method}>{methodNames[method]}</Tag>
        ))}
      </Descriptions.Item>
      <Descriptions.Item label="Recovery codes">
        <a onClick={() => go("recovery-codes")}>
          {security?.recovery_codes_remaining ?? "–"} left
        </a>
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
    description:
      "Six digit codes from an app such as 1Password, Authy or Google Authenticator.",
    enabled: (s: PanelProps["security"]) => !!s?.totp_enabled,
  },
  {
    key: "email-codes",
    title: "Email codes",
    description:
      "A code sent to your email each time you sign in with a password.",
    enabled: (s: PanelProps["security"]) => !!s?.email_otp_enabled,
    available: (s: PanelProps["security"]) => s?.email_available !== false,
  },
];

export const TwoFactorPanel: React.FC<PanelProps> = ({
  security,
  setSecurity,
  go,
}) => {
  const noMethods = !security?.methods.length;
  const locked = !!security?.required_by_server;

  return (
    <>
      <PanelHeader title="Two-factor authentication">
        When required, signing in with a password also asks for a code. Passkeys
        and recovery codes already count as a second factor.
      </PanelHeader>
      <div className="account-toggle">
        <Switch
          checked={!!security?.two_factor_enabled}
          disabled={noMethods || locked}
          onChange={(enabled) =>
            attempt(setTwoFactorRequired(enabled)).then(setSecurity)
          }
          data-testid="two-factor-toggle"
        />
        <Typography.Text strong>
          Require a second factor at password sign-in
        </Typography.Text>
      </div>
      {locked && (
        <Alert
          type="info"
          showIcon
          message="This server requires a second factor for every account. Email codes are on; you can use an authenticator app instead."
        />
      )}
      {noMethods && !locked && (
        <Alert
          type="info"
          showIcon
          message="Set up a method below before turning this on."
        />
      )}
      <List
        header="Methods"
        dataSource={methods.filter(
          (method) => method.available?.(security) ?? true,
        )}
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
                  {method.title}{" "}
                  {method.enabled(security) ? (
                    <Tag color="green">On</Tag>
                  ) : (
                    <Tag>Off</Tag>
                  )}
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

.account-connect {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
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
  email_available: boolean;
  // The server's require_2fa: email codes count as on and the requirement is locked
  required_by_server: boolean;
  has_password: boolean;
  recovery_codes_remaining: number;
};

// A password sign-in that still needs a second factor answers with a challenge instead of a token.
type TwoFactorChallenge = { challenge: string; methods: TwoFactorMethod[] };

const security = (res: { data: Security }) => res.data;

// ** Account security (signed in) **
const getSecurity = (): Promise<Security> =>
  api("users/security").then(security);
const setTwoFactorRequired = (enabled: boolean): Promise<Security> =>
  api("users/security", "PUT", { two_factor_enabled: enabled }).then(security);

const newTotpSecret = (): Promise<{ secret: string; uri: string }> =>
  api("users/security/totp", "POST");
const enableTotp = (secret: string, code: string): Promise<Security> =>
  api("users/security/totp", "PUT", { secret, code }).then(security);
const disableTotp = (): Promise<Security> =>
  api("users/security/totp", "DELETE").then(security);

const sendEmailSetupCode = () => api("users/security/email", "POST");
const enableEmailCodes = (code: string): Promise<Security> =>
  api("users/security/email", "PUT", { code }).then(security);
const disableEmailCodes = (): Promise<Security> =>
  api("users/security/email", "DELETE").then(security);

const changePassword = (attrs: {
  current_password?: string;
  password: string;
  password_confirmation: string;
}) => api("users/password", "PUT", attrs);

const signOutEverywhere = () => api("users/sessions", "DELETE");

// ** Signed out **
const passwordSignIn = (
  credentials: { email: string; password: string },
  dispatch: Dispatch,
): Promise<{ two_factor?: TwoFactorChallenge }> =>
  api("users/log_in", "POST", { user: credentials }).then((res) =>
    res.two_factor ? res : signedIn(dispatch)(res),
  );

const sendSignInEmailCode = (challenge: string) =>
  api("users/log_in/two_factor/email", "POST", { challenge });
const completeTwoFactor = (
  challenge: string,
  method: TwoFactorMethod,
  code: string,
  dispatch: Dispatch,
) =>
  api("users/log_in/two_factor", "POST", { challenge, method, code }).then(
    signedIn(dispatch),
  );

const requestPasswordReset = (email: string) =>
  api("users/reset_password", "POST", { email });
const resetPassword = (
  token: string,
  password: string,
  password_confirmation: string,
) =>
  api(\`users/reset_password/\${token}\`, "PUT", {
    password,
    password_confirmation,
  });
// ** Email (signed in) **
// "verify" means a code went to the new email (require_2fa); "changed" means it is saved.
type EmailChange = { status: "changed" | "verify"; email: string };
const requestEmailChange = (email: string): Promise<EmailChange> =>
  api("users/email", "POST", { email });
const confirmEmailChange = (email: string, code: string): Promise<EmailChange> =>
  api("users/email", "PUT", { email, code });

// ** OAuth accounts (signed in) **
type OAuthAccount = {
  id: string;
  provider: string;
  provider_email: string | null;
  inserted_at: string;
};
const listOAuthAccounts = (): Promise<OAuthAccount[]> =>
  api("users/oauth").then((res) => res.data);
const unlinkOAuthAccount = (id: string) => api(\`users/oauth/\${id}\`, "DELETE");
// Passed to the OAuth popup so the provider account links to this user
const oauthLinkToken = (): Promise<string> =>
  api("users/oauth/link", "POST").then((res) => res.token);

// ** OAuth sign-up: choose the account's email before it is created **
const sendOAuthSignupCode = (pending: string, email: string) =>
  api("oauth/signup/code", "POST", { pending, email });
const completeOAuthSignup =
  (pending: string, email: string, code?: string) => (dispatch: Dispatch) =>
    api("oauth/signup", "POST", { pending, email, code }).then(
      signedIn(dispatch),
    );

// From the ?confirm=<token> link in the confirmation email
const confirmAccount = (token: string) =>
  api(\`users/confirm/\${token}\`, "POST");

export {
  completeOAuthSignup,
  confirmEmailChange,
  listOAuthAccounts,
  oauthLinkToken,
  requestEmailChange,
  sendOAuthSignupCode,
  unlinkOAuthAccount,
  confirmAccount,
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
export type {
  EmailChange,
  OAuthAccount,
  Security,
  TwoFactorMethod,
  TwoFactorChallenge,
};
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

  @doc "Whether email is set up (config/<env>/external_service_keys/email.exs), so email codes can be offered."
  def email_available?, do: Application.get_env(:${AppNameSnake}, :email, [])[:enabled] != false

  @doc """
  The server's \`require_2fa\` setting (config/<env>/config.exs). While on, every account
  counts as having email codes on and must use a second factor; accounts keep their own
  settings underneath, so turning it off restores them.
  """
  def server_required?, do: Application.get_env(:${AppNameSnake}, :require_2fa, false) == true

  defp email_on?(%User{email_otp_enabled_at: enabled_at}), do: server_required?() or not is_nil(enabled_at)

  @doc "The second factors the user has set up and can use right now."
  def methods(%User{} = user),
    do:
      [totp: user.totp_enabled_at, email: email_available?() && email_on?(user)]
      |> Enum.filter(&elem(&1, 1))
      |> Enum.map(&to_string(elem(&1, 0)))

  @doc "Whether password sign-in must be followed by a second factor."
  def required?(%User{two_factor_enabled: enabled} = user),
    do: (server_required?() or enabled) and methods(user) != []

  @doc "Everything the account security page shows."
  def status(%User{} = user) do
    %{
      two_factor_enabled: required?(user),
      methods: methods(user),
      totp_enabled: not is_nil(user.totp_enabled_at),
      email_otp_enabled: email_on?(user),
      email_available: email_available?(),
      required_by_server: server_required?(),
      has_password: not is_nil(user.hashed_password)
    }
  end

  @doc "Turns the second-factor requirement on or off; on needs at least one method."
  def set_required(%User{totp_enabled_at: nil, email_otp_enabled_at: nil}, true),
    do: {:error, :no_methods}

  def set_required(%User{} = user, enabled) do
    if server_required?() and enabled != true,
      do: {:error, :required_by_server},
      else: save(user, two_factor_enabled: enabled == true)
  end

  ## Authenticator app

  @doc "A fresh secret and the otpauth URI an authenticator app scans."
  def new_totp do
    secret = NimbleTOTP.secret()
    %{secret: Base.encode32(secret, padding: false), secret_bytes: secret}
  end

  def totp_uri(%User{email: email}, encoded_secret),
    do:
      NimbleTOTP.otpauth_uri("#{@issuer}:#{email}", decode_secret!(encoded_secret),
        issuer: @issuer
      )

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
    code = new_code()

    Repo.delete_all(UserToken.by_user_and_contexts_query(user, [@email_context]))

    Repo.insert!(%UserToken{
      token: hash(code),
      context: @email_context,
      sent_to: user.email,
      user_id: user.id
    })

    UserNotifier.deliver_two_factor_code(user, code)
  end

  @doc "Turns on email codes once the user enters one we sent."
  def enable_email(%User{} = user, code) do
    with {:ok, user} <- verify_email(user, code), do: save(user, email_otp_enabled_at: now())
  end

  def disable_email(%User{} = user) do
    if server_required?(),
      do: {:error, :required_by_server},
      else: update_and_relax(user, email_otp_enabled_at: nil)
  end

  defp verify_email(%User{} = user, code) do
    from(t in UserToken,
      where:
        t.user_id == ^user.id and t.context == @email_context and
          t.token == ^hash(to_string(code)),
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
    with {:ok, id} <-
           Phoenix.Token.verify(${ApiNameCamel}.Endpoint, @challenge_salt, challenge,
             max_age: @challenge_seconds
           ),
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

  @doc "A random six digit code."
  def new_code,
    do:
      6
      |> :crypto.strong_rand_bytes()
      |> :binary.decode_unsigned()
      |> rem(1_000_000)
      |> Integer.to_string()
      |> String.pad_leading(6, "0")

  @doc "How codes are stored: only their hash is kept."
  def hash(code), do: :crypto.hash(:sha256, to_string(code))

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
      do: Accounts.deliver_user_reset_password_instructions(user, &${ApiNameCamel}.UIUrl.link(conn, "reset", &1))

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
    email_available: true,
    required_by_server: false,
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

// Account page: change email, verified first while require_2fa is on
const add_auth_email_panel = async ({ LibDir, AppNameCamel, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "EmailPanel.tsx", content: `import React, { useState } from "react";
import { Button, Form, Input, Space, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import { requestCurrentUser } from "../../../requests/User";
import {
  confirmEmailChange,
  requestEmailChange,
} from "../../../requests/Account";
import { PanelHeader, attempt, type PanelProps } from "./panel";

// Every account has an email. With require_2fa on the server, a new one is verified first.
export const EmailPanel: React.FC<PanelProps> = ({ email, security }) => {
  const dispatch = useDispatch<Dispatch>();
  const [form] = Form.useForm();
  const [pending, setPending] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const changed = (next: string) => {
    message.success(\`Your email is now \${next}\`);
    setPending(null);
    setCode("");
    form.resetFields();
    return requestCurrentUser(dispatch);
  };

  const request = ({ email: next }: { email: string }) =>
    attempt(requestEmailChange(next)).then((res): unknown => {
      if (res.status !== "verify") return changed(res.email);
      setPending(res.email);
      return message.success(\`Code sent to \${res.email}\`);
    });

  const confirm = () =>
    pending &&
    attempt(confirmEmailChange(pending, code)).then((res) =>
      changed(res.email),
    );

  return (
    <>
      <PanelHeader title="Email">
        Your account email is <strong>{email}</strong>. It is where sign-in
        codes and password resets go.
        {security?.required_by_server &&
          " A new email is verified with a code before it is saved."}
      </PanelHeader>
      {pending ? (
        <Space direction="vertical">
          <span>Enter the code we sent to {pending}.</span>
          <Space.Compact>
            <Input
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              onPressEnter={confirm}
              data-testid="email-change-code"
            />
            <Button
              type="primary"
              onClick={confirm}
              disabled={code.length !== 6}
            >
              Verify and save
            </Button>
          </Space.Compact>
          <Button type="link" onClick={() => setPending(null)}>
            Use a different email
          </Button>
        </Space>
      ) : (
        <Form form={form} layout="vertical" onFinish={request}>
          <Form.Item
            name="email"
            label="New email"
            rules={[
              { required: true, message: "Enter an email" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            {security?.required_by_server ? "Send code" : "Change email"}
          </Button>
        </Form>
      )}
    </>
  );
};
` }, "add_auth_email_panel");

// Account page: linked OAuth accounts, several per provider
const add_auth_connected_accounts_panel = async ({ LibDir, AppNameCamel, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth/account"), filename: "ConnectedAccountsPanel.tsx", content: `import React, { useCallback, useEffect, useState } from "react";
import { Button, List, Popconfirm, Typography, message } from "antd";
import {
  listOAuthAccounts,
  oauthLinkToken,
  unlinkOAuthAccount,
  type OAuthAccount,
} from "../../../requests/Account";
import {
  initiateOAuth,
  requestOAuthProviders,
  type OAuthProvider,
} from "../../../requests/User";
import { OAuthButtons } from "../OAuthButtons";
import { PanelHeader, attempt, type PanelProps } from "./panel";

const AUTH_ORIGIN = new URL(
  (import.meta as any).env?.["VITE_AUTH_URL"] || "http://localhost:4001",
).origin;

// OAuth accounts linked to this user: several are allowed, even from one provider.
export const ConnectedAccountsPanel: React.FC<PanelProps> = () => {
  const [accounts, setAccounts] = useState<OAuthAccount[]>([]);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  const load = useCallback(
    () => attempt(listOAuthAccounts()).then(setAccounts),
    [],
  );

  useEffect(() => {
    load();
    requestOAuthProviders().then(setProviders);
  }, [load]);

  // The OAuth popup reports back once the provider account is linked
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== AUTH_ORIGIN) return;
      if (event.data?.type === "oauth_linked") {
        message.success(\`\${event.data.provider} account connected\`);
        load();
      }
      if (event.data?.type === "oauth_error") message.error(event.data.error);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [load]);

  const connect = (provider: string) =>
    attempt(oauthLinkToken()).then((token) =>
      initiateOAuth(provider, undefined, token),
    );

  const remove = (id: string) =>
    attempt(unlinkOAuthAccount(id)).then(() => {
      message.success("Account removed");
      return load();
    });

  const label = (name: string) =>
    providers.find((p) => p.name === name)?.label || name;

  return (
    <>
      <PanelHeader title="Connected accounts">
        Sign in with any of these. You can connect more than one, even from the
        same provider.
      </PanelHeader>
      <List
        className="account-list"
        locale={{ emptyText: "No connected accounts yet" }}
        dataSource={accounts}
        renderItem={(account) => (
          <List.Item
            actions={[
              <Popconfirm
                key="remove"
                title={\`Remove this \${label(account.provider)} account?\`}
                description="You can no longer sign in with it."
                onConfirm={() => remove(account.id)}
              >
                <Button size="small" danger>
                  Remove
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={label(account.provider)}
              description={
                <Typography.Text type="secondary">
                  {account.provider_email || "No email shared"} · connected{" "}
                  {new Date(account.inserted_at).toLocaleDateString()}
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
      {providers.length > 0 ? (
        <section className="account-connect">
          <Typography.Text strong>Connect another account</Typography.Text>
          <OAuthButtons onSelect={connect} />
        </section>
      ) : (
        <Typography.Paragraph type="secondary">
          No sign-in providers are set up on this server yet
          (config/&lt;env&gt;/external_service_keys/oauth.exs).
        </Typography.Paragraph>
      )}
    </>
  );
};
` }, "add_auth_connected_accounts_panel");

// OAuth sign-up chooses the account email before it is created
const add_auth_oauth_signup_modal = async ({ LibDir, AppNameCamel, AppNameSnake }: ApiAppData) =>
  generateFile({ dir: join(LibDir || "", "lib/typescript/components/auth"), filename: "OAuthSignupModal.tsx", content: `import React, { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, message } from "antd";
import { MailOutlined, SafetyOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import {
  completeOAuthSignup,
  sendOAuthSignupCode,
} from "../../requests/Account";
import { AuthModal } from "./AuthModal";
import { showRecoveryCodes } from "./RecoveryCodes";

// What the OAuth popup hands over when the provider account is new
export type OAuthSignup = {
  pending: string;
  email: string | null;
  provider: string;
  verify: boolean;
};

interface OAuthSignupModalProps {
  signup: OAuthSignup | null;
  onCancel: () => void;
}

// A new OAuth sign-up chooses the account's email before the account is created. It can
// differ from the provider's. With require_2fa on the server, it is verified with a code.
export const OAuthSignupModal: React.FC<OAuthSignupModalProps> = ({
  signup,
  onCancel,
}) => {
  const dispatch = useDispatch<Dispatch>();
  const [form] = Form.useForm();
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    form.setFieldsValue({ email: signup?.email || "", code: "" });
    setSentTo(null);
  }, [signup, form]);

  if (!signup) return null;

  const fail = (e: Error) => message.error(e.message);

  const sendCode = (email: string) =>
    sendOAuthSignupCode(signup.pending, email)
      .then(() => {
        setSentTo(email);
        message.success(\`Code sent to \${email}\`);
      })
      .catch(fail);

  const create = ({ email, code }: { email: string; code?: string }) =>
    signup.verify && sentTo !== email
      ? sendCode(email)
      : completeOAuthSignup(signup.pending, email, code)(dispatch)
          .then((res) => {
            message.success("Account created");
            onCancel();
            showRecoveryCodes(res.recovery_codes);
          })
          .catch(fail);

  return (
    <AuthModal title="Choose your email" visible onCancel={onCancel}>
      <Typography.Paragraph type="secondary">
        You're signing up with {signup.provider}. Choose the email for your
        account; it doesn't have to match your {signup.provider} email.
      </Typography.Paragraph>
      <Form form={form} onFinish={create} layout="vertical" requiredMark={false}>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Enter an email" },
            { type: "email", message: "Enter a valid email" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email"
            autoComplete="email"
          />
        </Form.Item>
        {signup.verify && sentTo && (
          <Form.Item
            name="code"
            extra={\`Enter the code we sent to \${sentTo}.\`}
            rules={[{ required: true, len: 6, message: "Enter the 6 digit code" }]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
            />
          </Form.Item>
        )}
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" htmlType="submit" block>
            {signup.verify && !sentTo ? "Send code" : "Create account"}
          </Button>
        </Space>
      </Form>
    </AuthModal>
  );
};
` }, "add_auth_oauth_signup_modal");

// Tests for require_2fa, email change and OAuth accounts
const add_auth_account_identity_test = async ({ AppDir, AppNameCamel, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile({ dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}`), filename: "account_identity_test.exs", content: `defmodule ${ApiNameCamel}.AccountIdentityTest do
  @moduledoc "require_2fa, changing email, and OAuth accounts (sign-up, linking, removing)."
  use ${ApiNameCamel}.ConnCase, async: false

  alias Ithibati.Identity.Sessions
  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.Accounts.{OAuthAccounts, User}
  alias ${AppNameCamel}.AuthRepo, as: Repo

  @password "correct horse battery"

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    ${ApiNameCamel}.IthibatiHelpers.claim_instance!()
    on_exit(fn -> Application.put_env(:${AppNameSnake}, :require_2fa, false) end)
    {:ok, user} = Accounts.register_user(%{email: unique_email(), password: @password})
    {:ok, user: user}
  end

  defp unique_email, do: "user#{System.unique_integer([:positive])}@example.com"
  defp require_2fa(on), do: Application.put_env(:${AppNameSnake}, :require_2fa, on)

  defp api(user) do
    token = user |> Sessions.generate_session_token() |> Base.url_encode64()
    put_req_header(build_conn(), "authorization", "Bearer " <> token)
  end

  defp log_in(user),
    do: build_conn() |> post("/api/users/log_in", %{email: user.email, password: @password})

  defp emailed_code(subject) do
    assert_received {:email, %{subject: ^subject, text_body: body}}
    [code] = Regex.run(~r/\\b\\d{6}\\b/, body)
    code
  end

  # What a provider's callback hands over: profile and token response
  defp provider_account(id, email \\\\ nil),
    do: {%{"id" => id, "email" => email}, %{"access_token" => "token-#{id}", "expires_in" => 3600}}

  describe "require_2fa" do
    test "off: an account without methods signs in with just a password", %{user: user} do
      assert %{"token" => _} = user |> log_in() |> json_response(200)
    end

    test "on: every account has email codes on and the requirement locked", %{user: user} do
      require_2fa(true)

      assert %{"data" => status} = user |> api() |> get("/api/users/security") |> json_response(200)
      assert %{"email_otp_enabled" => true, "two_factor_enabled" => true, "required_by_server" => true} = status
      assert status["methods"] == ["email"]

      assert %{"error" => "required_by_server"} =
               user |> api() |> put("/api/users/security", %{two_factor_enabled: false}) |> json_response(422)

      assert %{"error" => "required_by_server"} =
               user |> api() |> delete("/api/users/security/email") |> json_response(422)
    end

    test "on: password sign-in asks for a code even if the user never set one up", %{user: user} do
      require_2fa(true)

      assert %{"two_factor" => %{"challenge" => challenge, "methods" => ["email"]}} =
               user |> log_in() |> json_response(200)

      build_conn() |> post("/api/users/log_in/two_factor/email", %{challenge: challenge}) |> json_response(200)
      code = emailed_code("Your sign-in code")

      assert %{"token" => _} =
               build_conn()
               |> post("/api/users/log_in/two_factor", %{challenge: challenge, method: "email", code: code})
               |> json_response(200)
    end

    test "turning it off restores the account's own settings", %{user: user} do
      require_2fa(true)
      assert %{"two_factor" => _} = user |> log_in() |> json_response(200)

      require_2fa(false)
      assert %{"token" => _} = user |> log_in() |> json_response(200)
      assert %{"data" => %{"email_otp_enabled" => false}} = user |> api() |> get("/api/users/security") |> json_response(200)
    end
  end

  describe "changing email" do
    test "off: the new email is saved right away", %{user: user} do
      new = unique_email()
      assert %{"status" => "changed", "email" => ^new} = user |> api() |> post("/api/users/email", %{email: new}) |> json_response(200)
      assert Repo.get!(User, user.id).email == new
    end

    test "on: the new email is saved only after its code comes back", %{user: user} do
      require_2fa(true)
      new = unique_email()

      assert %{"status" => "verify"} = user |> api() |> post("/api/users/email", %{email: new}) |> json_response(200)
      assert Repo.get!(User, user.id).email == user.email
      code = emailed_code("Verify your email")

      assert %{"error" => "invalid_code"} =
               user |> api() |> put("/api/users/email", %{email: new, code: "000000"}) |> json_response(422)

      assert %{"status" => "changed"} = user |> api() |> put("/api/users/email", %{email: new, code: code}) |> json_response(200)
      assert %User{email: ^new, confirmed_at: %DateTime{}} = Repo.get!(User, user.id)
    end

    test "an email is always required and must be free", %{user: user} do
      {:ok, other} = Accounts.register_user(%{email: unique_email(), password: @password})

      assert %{"errors" => %{"email" => _}} = user |> api() |> post("/api/users/email", %{email: ""}) |> json_response(422)
      assert %{"errors" => %{"email" => _}} = user |> api() |> post("/api/users/email", %{email: other.email}) |> json_response(422)
    end
  end

  describe "OAuth sign-up" do
    test "the account uses the email the person chose, not the provider's" do
      {profile, tokens} = provider_account("gh-1", "someone@provider.example")
      pending = OAuthAccounts.pending(:github, profile, tokens)
      email = unique_email()

      assert %{"token" => _, "data" => %{"email" => ^email}} =
               build_conn() |> post("/api/oauth/signup", %{pending: pending, email: email}) |> json_response(201)

      assert %User{email: ^email} = OAuthAccounts.user_for(:github, "gh-1")
    end

    test "an email is required" do
      {profile, tokens} = provider_account("gh-2")
      pending = OAuthAccounts.pending(:github, profile, tokens)

      assert %{"errors" => %{"email" => _}} =
               build_conn() |> post("/api/oauth/signup", %{pending: pending, email: ""}) |> json_response(422)
    end

    test "with require_2fa the email is verified before the account exists" do
      require_2fa(true)
      {profile, tokens} = provider_account("gh-3")
      pending = OAuthAccounts.pending(:github, profile, tokens)
      email = unique_email()

      assert %{"error" => "invalid_code"} =
               build_conn() |> post("/api/oauth/signup", %{pending: pending, email: email}) |> json_response(422)

      assert OAuthAccounts.user_for(:github, "gh-3") == nil
      build_conn() |> post("/api/oauth/signup/code", %{pending: pending, email: email}) |> json_response(200)
      code = emailed_code("Verify your email")

      assert %{"token" => _} =
               build_conn() |> post("/api/oauth/signup", %{pending: pending, email: email, code: code}) |> json_response(201)
    end

    test "a tampered pending token is refused" do
      assert %{"error" => "expired"} =
               build_conn() |> post("/api/oauth/signup", %{pending: "nope", email: unique_email()}) |> json_response(422)
    end
  end

  describe "linked OAuth accounts" do
    test "a user can link several, including two from one provider, and remove them", %{user: user} do
      for id <- ["gh-a", "gh-b"] do
        {profile, tokens} = provider_account(id, "#{id}@provider.example")
        assert {:ok, _} = OAuthAccounts.link(user, :github, profile, tokens)
      end

      {profile, tokens} = provider_account("g-1")
      assert {:ok, _} = OAuthAccounts.link(user, :google, profile, tokens)

      assert %{"data" => accounts} = user |> api() |> get("/api/users/oauth") |> json_response(200)
      assert Enum.map(accounts, & &1["provider"]) == ["github", "github", "google"]
      assert Enum.find(accounts, &(&1["provider_email"] == "gh-a@provider.example"))

      [first | _] = accounts
      assert %{"status" => "removed"} = user |> api() |> delete("/api/users/oauth/#{first["id"]}") |> json_response(200)
      assert %{"data" => [_, _]} = user |> api() |> get("/api/users/oauth") |> json_response(200)
    end

    test "a provider account linked to one user cannot be linked to another", %{user: user} do
      {:ok, other} = Accounts.register_user(%{email: unique_email(), password: @password})
      {profile, tokens} = provider_account("gh-shared")

      assert {:ok, _} = OAuthAccounts.link(user, :github, profile, tokens)
      assert {:error, :linked_to_another_user} = OAuthAccounts.link(other, :github, profile, tokens)
    end

    test "a user cannot remove someone else's linked account", %{user: user} do
      {:ok, other} = Accounts.register_user(%{email: unique_email(), password: @password})
      {profile, tokens} = provider_account("gh-theirs")
      {:ok, token} = OAuthAccounts.link(other, :github, profile, tokens)

      assert user |> api() |> delete("/api/users/oauth/#{token.id}") |> json_response(404)
    end

    test "the link token identifies the signed-in user", %{user: user} do
      assert %{"token" => token} = user |> api() |> post("/api/users/oauth/link") |> json_response(200)
      assert {:ok, %User{id: id}} = OAuthAccounts.link_user(token)
      assert id == user.id
    end
  end
end
` }, "add_auth_account_identity_test");

export {
  add_auth_email_panel,
  add_auth_connected_accounts_panel,
  add_auth_oauth_signup_modal,
  add_auth_account_identity_test,
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
