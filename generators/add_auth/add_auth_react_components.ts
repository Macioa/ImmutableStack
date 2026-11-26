import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_user_menu = async ({
  AppDir,
  AppNameSnake,
  LibDir,
  ApiNameSnake,
  ApiPort,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/components");
  const filename = "UserMenu.tsx";
  const authApiUrl = `(import.meta as any).env["VITE_AUTH_URL"] || "http://localhost:${ApiPort || 4001}"`;
  const content = `import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { Dispatch } from "redux";
import { pipe } from "mincurrypipe";
import { Avatar, ConfigProvider, Dropdown, message, type MenuProps } from "antd";
import { confirmAccount } from "../requests/Account";
import { selectUserdata, setUserdata, setToken } from "../state/User";
import { logoutUser, requestCurrentUser } from "../requests/User";
import {
  LoginModal,
  RegisterModal,
  AccountModal,
  ResetPasswordModal,
} from "./auth";
import { authTheme } from "./auth/AuthModal";
import "./styles.css";

interface NeonUserIconProps {
  isSignedIn: boolean;
}

const NeonUserIcon: React.FC<NeonUserIconProps> = ({ isSignedIn }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      filter: isSignedIn
        ? "drop-shadow(0 0 4px #61dafb) drop-shadow(0 0 8px #ff4500)"
        : "none",
    }}
  >
    <defs>
      <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#61dafb" />
        <stop offset="50%" stopColor="#b300ff" />
        <stop offset="100%" stopColor="#ff4500" />
      </linearGradient>
    </defs>
    <circle
      cx="12"
      cy="8"
      r="4"
      fill="url(#neonGradient)"
      stroke="#61dafb"
      strokeWidth="1.5"
      style={{
        filter: isSignedIn ? "drop-shadow(0 0 3px #61dafb)" : "none",
      }}
    />
    <path
      d="M4 20c0-4 3.5-7 8-7s8 3 8 7"
      fill="url(#neonGradient)"
      stroke="#ff4500"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{
        filter: isSignedIn ? "drop-shadow(0 0 3px #ff4500)" : "none",
      }}
    />
  </svg>
);

interface UserMenuProps {
  style?: React.CSSProperties;
}

export const UserMenu: React.FC<UserMenuProps> = ({ style }) => {
  const dispatch = useDispatch<Dispatch>();
  const userdata = useSelector(selectUserdata);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  // A reset link from the password email carries ?reset=<token>.
  const [resetToken, setResetToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("reset"),
  );
  const closeReset = () => {
    setResetToken(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // A confirmation link from the welcome email carries ?confirm=<token>.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("confirm");
    if (!token) return;
    window.history.replaceState({}, document.title, window.location.pathname);
    confirmAccount(token)
      .then(() => message.success("Your account is confirmed"))
      .catch(() => message.error("That confirmation link is invalid or has expired"));
  }, []);

  // An invitation link opens registration straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("invite"))
      setRegisterModalVisible(true);
  }, []);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSignedIn = !!userdata;

  const processOAuthSuccess = useCallback(
    (data: any) => {
      if (data.type === "oauth_success" && data.userData) {
        if (data.userData.data) {
          dispatch(setUserdata(data.userData.data));
        }
        if (data.userData.token) {
          dispatch(setToken(data.userData.token));
        }
        localStorage.removeItem("oauth_success");
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const oauthSuccessParam =
      urlParams.get("oauth_success") || hashParams.get("oauth_success");

    if (oauthSuccessParam) {
      try {
        const data = JSON.parse(decodeURIComponent(oauthSuccessParam));
        processOAuthSuccess(data);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } catch (e) {}
    }
  }, [processOAuthSuccess]);

  useEffect(() => {
    requestCurrentUser(dispatch).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (userdata) {
      return;
    }

    const pollForSignIn = setInterval(() => {
      requestCurrentUser(dispatch)
        .then((userData) => {
          if (userData?.data) {
            clearInterval(pollForSignIn);
          }
        })
        .catch(() => {});
    }, 5000);

    const timeoutId = setTimeout(() => {
      clearInterval(pollForSignIn);
    }, 30000);

    return () => {
      clearInterval(pollForSignIn);
      clearTimeout(timeoutId);
    };
  }, [dispatch, userdata]);

  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel("oauth_success");
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === "oauth_success" && event.data.userData) {
          processOAuthSuccess(event.data);
        }
      };
    } catch (e) {}

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [processOAuthSuccess]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.source === "react-devtools-bridge" ||
        event.data?.source === "react-devtools-content-script"
      ) {
        return;
      }

      const authUrl =
        (import.meta as any).env?.["VITE_AUTH_URL"] || "http://localhost:${ApiPort || 4001}";
      const authOrigin = new URL(authUrl).origin;
      const uiOrigin = window.location.origin;

      const isValidOrigin =
        event.origin === authOrigin || event.origin === uiOrigin;
      const messageData = event.data;
      const isValidMessage =
        messageData &&
        typeof messageData === "object" &&
        messageData.type === "oauth_success" &&
        messageData.userData;

      if (!isValidOrigin && !isValidMessage) {
        return;
      }

      if (isValidMessage) {
        localStorage.setItem("oauth_success", JSON.stringify(messageData));
        processOAuthSuccess(messageData);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [processOAuthSuccess]);

  useEffect(() => {
    if (userdata) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      try {
        const stored = localStorage.getItem("oauth_success");
        if (stored) {
          const data = JSON.parse(stored);
          processOAuthSuccess(data);
        }
      } catch (e) {}
    }, 500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [userdata, dispatch, processOAuthSuccess]);

  const handleSignOut = () => {
    pipe(
      () => logoutUser(dispatch),
      () => setLoginModalVisible(false),
    )();
  };

  const menuItems: MenuProps["items"] = [
    ...(isSignedIn && userdata?.email
      ? [
          {
            key: "user-email",
            label: userdata.email,
            disabled: true,
            style: { cursor: "default" },
          },
          {
            type: "divider" as const,
          },
        ]
      : []),
    ...(isSignedIn
      ? []
      : [
          {
            key: "sign-in",
            label: "Sign In",
            onClick: () => setLoginModalVisible(true),
          },
          {
            key: "register",
            label: "Register",
            onClick: () => setRegisterModalVisible(true),
          },
        ]),
    ...(isSignedIn
      ? [
          {
            key: "account",
            label: "Account",
            onClick: () => setAccountModalVisible(true),
          },
          {
            key: "sign-out",
            label: "Sign Out",
            onClick: handleSignOut,
          },
        ]
      : []),
  ];

  const defaultStyle: React.CSSProperties = {
    cursor: "pointer",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    border: "2px solid transparent",
    backgroundImage:
      "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%), linear-gradient(135deg, #61dafb, #ff4500, #b300ff)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    boxShadow:
      "0 0 10px rgba(97, 218, 251, 0.5), 0 0 20px rgba(255, 69, 0, 0.3), inset 0 0 10px rgba(179, 0, 255, 0.2)",
    transition: "all 0.3s ease",
  };

  const avatarHoverStyle: React.CSSProperties = {
    boxShadow:
      "0 0 15px rgba(97, 218, 251, 0.8), 0 0 30px rgba(255, 69, 0, 0.5), inset 0 0 15px rgba(179, 0, 255, 0.4)",
    transform: "scale(1.05)",
  };

  const wrapperStyle: React.CSSProperties = {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: 1000,
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div style={wrapperStyle}>
        <ConfigProvider theme={authTheme}>
        <Dropdown
          menu={{ items: menuItems }}
          trigger={["click"]}
          placement="bottomRight"
          rootClassName="user-menu-dropdown"
          getPopupContainer={(trigger) =>
            trigger.parentElement || document.body
          }
        >
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Avatar
              icon={<NeonUserIcon isSignedIn={isSignedIn} />}
              style={{
                ...defaultStyle,
                ...(isHovered ? avatarHoverStyle : {}),
                ...(!isSignedIn && {
                  opacity: 0.4,
                  boxShadow: "none",
                }),
                ...style,
              }}
              size="large"
            />
          </div>
        </Dropdown>
        </ConfigProvider>
      </div>
      <LoginModal
        visible={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
      />
      <AccountModal
        visible={accountModalVisible}
        onCancel={() => setAccountModalVisible(false)}
      />
      <ResetPasswordModal
        token={resetToken}
        onCancel={closeReset}
        onDone={() => {
          closeReset();
          setLoginModalVisible(true);
        }}
      />
      <RegisterModal
        visible={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
      />
    </>
  );
};
`;

  return generateFile({ dir, filename, content }, "add_auth_user_menu");
};

const add_auth_login_modal = async ({
  LibDir,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/components/auth");
  const filename = "LoginModal.tsx";
  const content = `import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Dispatch } from "redux";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import { initiateOAuth } from "../../requests/User";
import { requestCurrentUser } from "../../requests/User";
import { signInWithPasskey } from "../../requests/Passkeys";
import { passwordSignIn, type TwoFactorChallenge } from "../../requests/Account";
import { selectUserdata } from "../../state/User";
import type { User } from "../../state/User";
import { OAuthButtons } from "./OAuthButtons";
import { AuthModal } from "./AuthModal";
import { TwoFactorForm } from "./login/TwoFactorForm";
import { ForgotPasswordForm } from "./login/ForgotPasswordForm";
import { RecoverAccountForm } from "./login/RecoverAccountForm";

type View = "sign-in" | "two-factor" | "forgot-password" | "recover";

const titles: Record<View, string> = {
  "sign-in": "Sign In",
  "two-factor": "Two-factor verification",
  "forgot-password": "Reset password",
  recover: "Recover account",
};

interface LoginModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onCancel }) => {
  const dispatch = useDispatch<Dispatch>();
  const userdata = useSelector(selectUserdata);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("sign-in");
  const [pending, setPending] = useState<TwoFactorChallenge | null>(null);
  const [userdataWhenModalOpened, setUserdataWhenModalOpened] = useState<User | null>(null);
  const [oauthInProgress, setOauthInProgress] = useState(false);

  // Track userdata when modal opens to detect new logins; every opening starts at sign in.
  useEffect(() => {
    if (visible) {
      setUserdataWhenModalOpened(userdata);
    } else {
      setUserdataWhenModalOpened(null);
      setOauthInProgress(false);
      setView("sign-in");
      setPending(null);
    }
  }, [visible, userdata]);

  // Close modal when user is signed in (after OAuth completion)
  useEffect(() => {
    if (!visible || !userdata) return;

    const currentUserId = userdata.id;
    const previousUserId = userdataWhenModalOpened?.id || null;

    if (currentUserId && currentUserId !== previousUserId) {
      setOauthInProgress(false);
      onCancel();
    } else if (oauthInProgress && userdata) {
      setOauthInProgress(false);
      onCancel();
    }
  }, [visible, userdata, userdataWhenModalOpened, oauthInProgress, onCancel]);

  const finish = () =>
    requestCurrentUser(dispatch)
      .catch(() => null)
      .then(() => {
        form.resetFields();
        onCancel();
      });

  const askForSecondFactor = (challenge: TwoFactorChallenge) => {
    setPending(challenge);
    setView("two-factor");
  };

  // Accounts that require two factors answer with a challenge instead of a token.
  const handleEmailLogin = (values: { email: string; password: string }) => {
    setLoading(true);
    passwordSignIn(values, dispatch)
      .then(({ two_factor }) => (two_factor ? askForSecondFactor(two_factor) : finish()))
      .catch((error) => message.error(error.message === "Invalid email or password" ? error.message : "Sign in failed"))
      .finally(() => setLoading(false));
  };

  const handlePasskeyLogin = () =>
    signInWithPasskey(dispatch)
      .then(() => onCancel())
      .catch((error) => message.error(error.message));

  const handleOAuthLogin = (provider: string) => {
    setOauthInProgress(true);
    initiateOAuth(provider, window.location.origin + window.location.pathname);
  };

  const back = () => setView("sign-in");

  const body = () => {
    switch (view) {
      case "two-factor":
        return pending && <TwoFactorForm pending={pending} onSignedIn={finish} onBack={back} />;
      case "forgot-password":
        return <ForgotPasswordForm onBack={back} />;
      case "recover":
        return (
          <RecoverAccountForm
            onSignedIn={onCancel}
            onForgotPassword={() => setView("forgot-password")}
            onBack={back}
          />
        );
      default:
        return (
          <>
            <Form form={form} name="login" onFinish={handleEmailLogin} layout="vertical" autoComplete="off">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: "Please input your password!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Sign In
                </Button>
              </Form.Item>

              <Form.Item>
                <Button block size="large" onClick={handlePasskeyLogin}>
                  Sign in with a passkey
                </Button>
              </Form.Item>

              <div className="auth-links">
                <a onClick={() => setView("forgot-password")}>Forgot password?</a>
                <a onClick={() => setView("recover")}>Recover account</a>
              </div>
            </Form>

            <OAuthButtons onSelect={handleOAuthLogin} />
          </>
        );
    }
  };

  return (
    <AuthModal title={titles[view]} visible={visible} onCancel={onCancel}>
      {body()}
    </AuthModal>
  );
};
`;

  return generateFile({ dir, filename, content }, "add_auth_login_modal");
};

const add_auth_register_modal = async ({
  LibDir,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/components/auth");
  const filename = "RegisterModal.tsx";
  const content = `import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Dispatch } from "redux";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import { registerUser, initiateOAuth } from "../../requests/User";
import { requestCurrentUser } from "../../requests/User";
import { registerPasskey, authorizeSetup } from "../../requests/Passkeys";
import { showRecoveryCodes } from "./RecoveryCodes";
import { selectUserdata } from "../../state/User";
import { OAuthButtons } from "./OAuthButtons";
import { AuthModal } from "./AuthModal";

interface RegisterModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  visible,
  onCancel,
}) => {
  const dispatch = useDispatch<Dispatch>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const userdata = useSelector(selectUserdata);

  // Close once a user is signed in, e.g. after OAuth completes in the popup
  useEffect(() => {
    if (visible && userdata?.id) onCancel();
  }, [visible, userdata?.id, onCancel]);

  // Passkey sign-up needs only the email field, no password.
  const passkeySignup = (email: string) =>
    registerPasskey(
      email,
      dispatch,
      new URLSearchParams(window.location.search).get("invite"),
    );

  // The first account on a fresh instance needs the operator's setup code.
  const withSetupCode = (email: string) => (error: Error) => {
    const code =
      error.message === "setup_authorization_required" &&
      window.prompt("Operator setup code");
    return code
      ? authorizeSetup(code).then(() => passkeySignup(email))
      : Promise.reject(error);
  };

  const handlePasskeyRegister = () =>
    form
      .validateFields(["email"])
      .then(({ email }) => passkeySignup(email).catch(withSetupCode(email)))
      .then((res) => {
        showRecoveryCodes(res.recovery_codes);
        form.resetFields();
        message.success("Registration successful!");
        onCancel();
      })
      .catch((error) => error?.message && message.error(error.message));

  const handleEmailRegister = async (values: {
    email: string;
    password: string;
    password_confirmation?: string;
  }) => {
    setLoading(true);
    try {
      const res = await registerUser(
        { email: values.email, password: values.password },
        dispatch,
      );
      await requestCurrentUser(dispatch);
      setLoading(false);
      form.resetFields();
      showRecoveryCodes((res as { recovery_codes?: string[] }).recovery_codes);
      message.success("Registration successful!");
      onCancel();
    } catch (error: any) {
      setLoading(false);
      console.error("Registration failed:", error);

      if (error?.data) {
        if (typeof error.data === "string") {
          message.error(error.data);
          return;
        }

        if (error.data.errors) {
          const errors = error.data.errors;
          const fields: any[] = [];

          Object.keys(errors).forEach((field) => {
            const fieldErrors = Array.isArray(errors[field])
              ? errors[field]
              : [errors[field]];
            const fieldName =
              field === "email"
                ? "email"
                : field === "password"
                  ? "password"
                  : field;
            fields.push({
              name: fieldName,
              errors: fieldErrors,
            });
          });

          if (fields.length > 0) {
            form.setFields(fields);
            const firstError = fields[0]?.errors?.[0];
            if (firstError) {
              message.error(firstError);
            }
          } else {
            message.error("Registration failed. Please check your input.");
          }
          return;
        }

        if (error.data.error || error.data.message) {
          message.error(error.data.error || error.data.message);
          return;
        }
      }

      if (error?.status === 422) {
        message.error("Validation failed. Please check your input.");
      } else if (error?.status === 500) {
        message.error("Server error. Please try again later.");
      } else {
        message.error(
          error?.message || "Registration failed. Please try again.",
        );
      }
    }
  };

  const handleOAuthLogin = (provider: string) =>
    initiateOAuth(provider, window.location.origin + window.location.pathname);

  return (
    <AuthModal title="Register" visible={visible} onCancel={onCancel}>
      <Form
        form={form}
        name="register"
        onFinish={handleEmailRegister}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 6, message: "Password must be at least 6 characters!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password_confirmation"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match!"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm Password"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            Register
          </Button>
        </Form.Item>

        <Form.Item>
          <Button block size="large" onClick={handlePasskeyRegister}>
            Register with a passkey
          </Button>
        </Form.Item>
      </Form>

      <OAuthButtons onSelect={handleOAuthLogin} />
    </AuthModal>
  );
};
`;

  return generateFile({ dir, filename, content }, "add_auth_register_modal");
};

const add_auth_index = async ({
  LibDir,
}: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/components/auth");
  const filename = "index.tsx";
  const content = `export { UserMenu } from "../UserMenu";
export { AccountModal } from "./account/AccountModal";
export { showRecoveryCodes } from "./RecoveryCodes";
export { LoginModal } from "./LoginModal";
export { RegisterModal } from "./RegisterModal";
export { ResetPasswordModal } from "./ResetPasswordModal";
export { OAuthButtons } from "./OAuthButtons";
`;

  return generateFile({ dir, filename, content }, "add_auth_index");
};

export {
  add_auth_user_menu,
  add_auth_login_modal,
  add_auth_register_modal,
  add_auth_index,
};


