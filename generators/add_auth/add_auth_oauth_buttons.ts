import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";
import { OAUTH_PROVIDERS, OAuthProvider } from "./oauth_providers";

// TS object literal of each provider's privacy notes, keyed by provider name
const privacyEntry = ({ key, privacy }: OAuthProvider) => `  ${key}: ${JSON.stringify(privacy)},`;

const privacyMap = () => `const PROVIDER_PRIVACY: Record<string, ProviderPrivacy> = {
${OAUTH_PROVIDERS.map(privacyEntry).join("\n")}
};`;

// One button per provider the server reports as configured; icons are the only per-provider UI code
const add_auth_oauth_buttons = async ({ LibDir }: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/components/auth");
  const filename = "OAuthButtons.tsx";
  const content = `import React, { useEffect, useState } from "react";
import { Button, Popover, Tooltip } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DiscordOutlined,
  FacebookFilled,
  GithubOutlined,
  LinkedinFilled,
  WarningFilled,
  XOutlined,
} from "@ant-design/icons";
import { requestOAuthProviders } from "../../requests/User";
import type { OAuthProvider } from "../../requests/User";
import "./auth.css";

type PrivacyRating = "good" | "warn" | "bad";

interface ProviderPrivacy {
  rating: PrivacyRating;
  shares: string;
  concerns: string[];
}

// Generated from the provider list in ImmutableStack (generators/add_auth/oauth_providers.ts)
${privacyMap()}

const RATINGS: Record<PrivacyRating, { label: string; icon: React.ReactNode }> = {
  good: { label: "Good privacy", icon: <CheckCircleFilled /> },
  warn: { label: "Some concerns", icon: <WarningFilled /> },
  bad: { label: "Privacy risk", icon: <CloseCircleFilled /> },
};

// Touch screens have no hover: the first tap shows the notes, the second continues
const hasHover = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const PrivacyNotes: React.FC<{ privacy: ProviderPrivacy; touch: boolean }> = ({
  privacy: { rating, shares, concerns },
  touch,
}) => (
  <div className={\`oauth-privacy oauth-privacy--\${rating}\`}>
    <div className="oauth-privacy__rating">
      {RATINGS[rating].icon}
      <span>{RATINGS[rating].label}</span>
    </div>
    <div className="oauth-privacy__shares">Shares: {shares}</div>
    <ul className="oauth-privacy__concerns">
      {concerns.map((concern) => (
        <li key={concern}>{concern}</li>
      ))}
    </ul>
    {touch && <div className="oauth-privacy__hint">Tap again to continue</div>}
  </div>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.711c-.18-.54-.282-1.117-.282-1.711s.102-1.171.282-1.711V4.957H.957C.347 6.174 0 7.55 0 9s.348 2.826.957 4.043l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.957L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </g>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#F25022" d="M0 0h8.5v8.5H0z" />
    <path fill="#00A4EF" d="M9.5 0H18v8.5H9.5z" />
    <path fill="#7FBA00" d="M0 9.5h8.5V18H0z" />
    <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z" />
  </svg>
);

// Icons are the only per-provider UI code; unknown providers still get a plain button
const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  google: <GoogleIcon />,
  microsoft: <MicrosoftIcon />,
  github: <GithubOutlined style={{ color: "#fff" }} />,
  discord: <DiscordOutlined style={{ color: "#5865F2" }} />,
  linkedin: <LinkedinFilled style={{ color: "#0A66C2" }} />,
  x: <XOutlined style={{ color: "#fff" }} />,
  facebook: <FacebookFilled style={{ color: "#1877F2" }} />,
};

interface OAuthButtonsProps {
  onSelect: (provider: string) => void;
  // Registering and linking accounts show each provider's privacy notes; sign in skips them
  showPrivacy?: boolean;
}

// Renders one button per provider whose keys are configured on the server, and nothing when none are
export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onSelect, showPrivacy = false }) => {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [touch] = useState(() => !hasHover());
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    requestOAuthProviders().then(setProviders);
  }, []);

  if (!providers.length) return null;

  const privacyFor = (name: string) => (showPrivacy ? PROVIDER_PRIVACY[name] : undefined);

  // On touch screens the first tap only opens the notes
  const select = (name: string) =>
    touch && privacyFor(name) && shown !== name ? setShown(name) : onSelect(name);

  const touchProps = (name: string) =>
    touch ? { open: shown === name, onOpenChange: (open: boolean) => !open && setShown(null) } : {};

  const button = (name: string, label: string) => (
    <Button
      className="oauth-button"
      aria-label={\`Continue with \${label}\`}
      icon={PROVIDER_ICONS[name] ?? label[0]}
      onClick={() => select(name)}
    />
  );

  return (
    <>
      <div className="auth-divider">or OAUTH</div>
      <div className="oauth-buttons">
        {providers.map(({ name, label }) => {
          const privacy = privacyFor(name);
          return privacy ? (
            <Popover
              key={name}
              title={label}
              content={<PrivacyNotes privacy={privacy} touch={touch} />}
              trigger={touch ? "click" : "hover"}
              placement="top"
              rootClassName="oauth-privacy-popover"
              getPopupContainer={(node) => node.parentElement ?? document.body}
              {...touchProps(name)}
            >
              {button(name, label)}
            </Popover>
          ) : (
            <Tooltip key={name} title={\`Continue with \${label}\`}>
              {button(name, label)}
            </Tooltip>
          );
        })}
      </div>
    </>
  );
};
`;

  return generateFile({ dir, filename, content }, "add_auth_oauth_buttons");
};

export { add_auth_oauth_buttons };
