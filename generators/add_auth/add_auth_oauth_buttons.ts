import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

// One button per provider the server reports as configured; icons are the only per-provider UI code
const add_auth_oauth_buttons = async ({ LibDir }: ApiAppData) => {
  const dir = join(LibDir || "", "lib/typescript/components/auth");
  const filename = "OAuthButtons.tsx";
  const content = `import React, { useEffect, useState } from "react";
import { Button, Tooltip } from "antd";
import {
  DiscordOutlined,
  FacebookFilled,
  GithubOutlined,
  LinkedinFilled,
  RedditOutlined,
  XOutlined,
} from "@ant-design/icons";
import { requestOAuthProviders } from "../../requests/User";
import type { OAuthProvider } from "../../requests/User";

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
  reddit: <RedditOutlined style={{ color: "#FF4500" }} />,
  facebook: <FacebookFilled style={{ color: "#1877F2" }} />,
};

interface OAuthButtonsProps {
  onSelect: (provider: string) => void;
}

// Renders one button per provider whose keys are configured on the server, and nothing when none are
export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onSelect }) => {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    requestOAuthProviders().then(setProviders);
  }, []);

  if (!providers.length) return null;

  return (
    <>
      <div className="auth-divider">or OAUTH</div>
      <div className="oauth-buttons">
        {providers.map(({ name, label }) => (
          <Tooltip key={name} title={\`Continue with \${label}\`}>
            <Button
              className="oauth-button"
              aria-label={\`Continue with \${label}\`}
              icon={PROVIDER_ICONS[name] ?? label[0]}
              onClick={() => onSelect(name)}
            />
          </Tooltip>
        ))}
      </div>
    </>
  );
};
`;

  return generateFile({ dir, filename, content }, "add_auth_oauth_buttons");
};

export { add_auth_oauth_buttons };
