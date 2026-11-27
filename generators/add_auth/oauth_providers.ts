// Single source of truth for OAuth providers: drives provider adapters and external_service_keys/oauth.exs docs

// text may span lines; redirect adds the provider's redirect URI after the link
type OAuthStep = { text: string; url: string; redirect?: boolean };

type OAuthProvider = {
  key: string;
  module: string;
  label: string;
  purpose: string;
  steps: OAuthStep[];
  spec: string[];
};

const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    key: "google",
    module: "Google",
    label: "Google",
    purpose: "\"Continue with Google\" sign in (Google Auth Platform OAuth client).",
    steps: [
      { text: "Register a Google account:", url: "https://accounts.google.com/signup" },
      { text: "Create a Cloud project:", url: "https://console.cloud.google.com/projectcreate" },
      { text: "Configure the consent screen (app name, support email, audience):", url: "https://console.cloud.google.com/auth/branding" },
      { text: "Create a Web application client, add the redirect URI, copy the client ID and secret:", url: "https://console.cloud.google.com/auth/clients/create", redirect: true },
    ],
    spec: [
      `authorize_url: "https://accounts.google.com/o/oauth2/v2/auth"`,
      `token_url: "https://oauth2.googleapis.com/token"`,
      `user_url: "https://www.googleapis.com/oauth2/v2/userinfo"`,
      `scope: "openid email profile"`,
    ],
  },
  {
    key: "github",
    module: "GitHub",
    label: "GitHub",
    purpose: "\"Continue with GitHub\" sign in (GitHub OAuth App). Private emails fall back to the /user/emails API.",
    steps: [
      { text: "Register a GitHub account:", url: "https://github.com/signup" },
      { text: "Create an OAuth App and set the authorization callback URL to the redirect URI:", url: "https://github.com/settings/applications/new", redirect: true },
      { text: "Open the app, copy the client ID and generate a client secret:", url: "https://github.com/settings/developers" },
    ],
    spec: [
      `authorize_url: "https://github.com/login/oauth/authorize"`,
      `token_url: "https://github.com/login/oauth/access_token"`,
      `user_url: "https://api.github.com/user"`,
      `emails_url: "https://api.github.com/user/emails"`,
      `scope: "read:user user:email"`,
      `fields: [name: ["name", "login"], picture: ["avatar_url"]]`,
    ],
  },
  {
    key: "microsoft",
    module: "Microsoft",
    label: "Microsoft",
    purpose: "\"Continue with Microsoft\" sign in for Outlook/Live and work accounts (Microsoft Entra app registration).",
    steps: [
      { text: "Register a Microsoft account:", url: "https://signup.live.com" },
      { text: "Activate a free Azure account to get a Microsoft Entra tenant:", url: "https://azure.microsoft.com/free" },
      { text: "Register a new app with these settings, then click Register:\n- Supported account types: \"Accounts in any organizational directory and personal Microsoft\n  accounts\" (required: sign in uses the shared /common endpoint)\n- Redirect URI: platform \"Web\" (not Single-page application), URI below", url: "https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade", redirect: true },
      { text: "In the new app's Overview, copy the Application (client) ID. Then under Certificates & secrets,\ncreate a New client secret and copy its Value right away (not the Secret ID; it is shown once):", url: "https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade > your app" },
    ],
    spec: [
      `authorize_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"`,
      `token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token"`,
      `user_url: "https://graph.microsoft.com/v1.0/me"`,
      `scope: "openid email profile User.Read"`,
      `fields: [email: ["mail", "userPrincipalName"], name: ["displayName"], picture: []]`,
    ],
  },
  {
    key: "discord",
    module: "Discord",
    label: "Discord",
    purpose: "\"Continue with Discord\" sign in (Discord application OAuth2).",
    steps: [
      { text: "Register a Discord account:", url: "https://discord.com/register" },
      { text: "Create a New Application:", url: "https://discord.com/developers/applications" },
      { text: "Open the app's OAuth2 page (not General Information, whose Public Key and Interactions\nEndpoint URL are for bots). Copy the Client ID, reset and copy the Client Secret, and under\nRedirects add the URI below.", url: "https://discord.com/developers/applications/<APPLICATION_ID>/oauth2", redirect: true },
    ],
    spec: [
      `authorize_url: "https://discord.com/oauth2/authorize"`,
      `token_url: "https://discord.com/api/oauth2/token"`,
      `user_url: "https://discord.com/api/users/@me"`,
      `scope: "identify email"`,
      `fields: [name: ["global_name", "username"], picture: []]`,
    ],
  },
  {
    key: "linkedin",
    module: "LinkedIn",
    label: "LinkedIn",
    purpose: "\"Continue with LinkedIn\" sign in (Sign In with LinkedIn using OpenID Connect).",
    steps: [
      { text: "Register a LinkedIn account:", url: "https://www.linkedin.com/signup" },
      { text: "Create a LinkedIn company page (every app must belong to one):", url: "https://www.linkedin.com/company/setup/new" },
      { text: "Create an app linked to that page:", url: "https://www.linkedin.com/developers/apps/new" },
      { text: "In the app's Products tab, request \"Sign In with LinkedIn using OpenID Connect\"; in the Auth tab add the redirect URI:", url: "https://www.linkedin.com/developers/apps", redirect: true },
      { text: "In the app's Auth tab, copy the client ID and primary client secret:", url: "https://www.linkedin.com/developers/apps" },
    ],
    spec: [
      `authorize_url: "https://www.linkedin.com/oauth/v2/authorization"`,
      `token_url: "https://www.linkedin.com/oauth/v2/accessToken"`,
      `user_url: "https://api.linkedin.com/v2/userinfo"`,
      `scope: "openid profile email"`,
    ],
  },
  {
    key: "x",
    module: "X",
    label: "X",
    purpose: "\"Continue with X\" sign in (X API OAuth 2.0 with PKCE). Email needs the app's \"Request email\" permission.",
    steps: [
      { text: "Register an X account:", url: "https://x.com/i/flow/signup" },
      { text: "Sign up for a (free) developer account:", url: "https://developer.x.com/en/portal/petition/essential/basic-info" },
      { text: "In your app's User authentication settings choose OAuth 2.0, Web App, add the callback URI, enable Request email:", url: "https://developer.x.com/en/portal/projects-and-apps", redirect: true },
      { text: "In the app's Keys and tokens tab, copy the OAuth 2.0 client ID and client secret:", url: "https://developer.x.com/en/portal/projects-and-apps" },
    ],
    spec: [
      `authorize_url: "https://x.com/i/oauth2/authorize"`,
      `token_url: "https://api.x.com/2/oauth2/token"`,
      `user_url: "https://api.x.com/2/users/me?user.fields=profile_image_url,confirmed_email"`,
      `scope: "users.read tweet.read users.email"`,
      `token_auth: :basic`,
      `pkce: true`,
      `fields: [id: ["data.id"], email: ["data.confirmed_email"], name: ["data.name", "data.username"], picture: ["data.profile_image_url"]]`,
    ],
  },
  {
    key: "reddit",
    module: "Reddit",
    label: "Reddit",
    purpose: "\"Continue with Reddit\" sign in. Reddit shares no email, so users get a placeholder address.",
    steps: [
      { text: "Register a Reddit account:", url: "https://www.reddit.com/register" },
      { text: "Review the Data API terms that apply to your app:", url: "https://redditinc.com/policies/data-api-terms" },
      { text: "Create a \"web app\" and set the redirect URI:", url: "https://www.reddit.com/prefs/apps", redirect: true },
      { text: "Copy the client ID (under the app name) and the secret:", url: "https://www.reddit.com/prefs/apps" },
    ],
    spec: [
      `authorize_url: "https://www.reddit.com/api/v1/authorize"`,
      `token_url: "https://www.reddit.com/api/v1/access_token"`,
      `user_url: "https://oauth.reddit.com/api/v1/me"`,
      `scope: "identity"`,
      `token_auth: :basic`,
      `authorize_params: %{duration: "temporary"}`,
      `fields: [picture: ["icon_img"]]`,
    ],
  },
  {
    key: "facebook",
    module: "Facebook",
    label: "Facebook",
    purpose: "\"Continue with Facebook\" sign in (Facebook Login). Users may decline to share email.",
    steps: [
      { text: "Register a Facebook account:", url: "https://www.facebook.com/r.php" },
      { text: "Register as a Meta developer:", url: "https://developers.facebook.com/async/registration" },
      { text: "Create an app with the \"Authenticate and request data from users with Facebook Login\" use case:", url: "https://developers.facebook.com/apps/creation" },
      { text: "In Facebook Login settings, add the redirect URI to Valid OAuth Redirect URIs:", url: "https://developers.facebook.com/apps", redirect: true },
      { text: "In App settings > Basic, copy the App ID and App Secret:", url: "https://developers.facebook.com/apps" },
    ],
    spec: [
      `authorize_url: "https://www.facebook.com/v21.0/dialog/oauth"`,
      `token_url: "https://graph.facebook.com/v21.0/oauth/access_token"`,
      `user_url: "https://graph.facebook.com/me?fields=id,name,email,picture"`,
      `scope: "email public_profile"`,
      `fields: [picture: ["picture.data.url"]]`,
    ],
  },
];

export { OAUTH_PROVIDERS, OAuthProvider, OAuthStep };
