import { KeyCategory } from "@/generators/init_configs/gen_keys";

// Single source of truth for email providers: drives external_service_keys/email.exs docs.
// Each provider name is a Swoosh adapter (Swoosh.Adapters.<Camelized name>), checked against Swoosh 1.30.

// Numbered steps with a link under each, per email provider
const EMAIL_PROVIDERS: [string, string, [string, string][]][] = [
  [
    "postmark",
    "Postmark (api_key only)",
    [
      ["Create an account:", "https://account.postmarkapp.com/sign_up"],
      ["Add and verify the domain or sender address you send from (from_address):", "https://account.postmarkapp.com/signature_domains"],
      ["Open your server's API Tokens tab and copy the Server API token (api_key):", "https://account.postmarkapp.com/servers"],
    ],
  ],
  [
    "resend",
    "Resend (api_key only)",
    [
      ["Create an account:", "https://resend.com/signup"],
      ["Add and verify the domain you send from (from_address):", "https://resend.com/domains"],
      ["Create an API key with Sending access (api_key):", "https://resend.com/api-keys"],
    ],
  ],
  [
    "mailgun",
    "Mailgun (api_key and domain)",
    [
      ["Create an account:", "https://signup.mailgun.com/new/signup"],
      ["Add and verify your sending domain, then copy it (domain):", "https://app.mailgun.com/mg/sending/domains"],
      ["Create a sending API key (api_key):", "https://app.mailgun.com/settings/api_security"],
    ],
  ],
  [
    "sendgrid",
    "SendGrid (api_key only)",
    [
      ["Create an account:", "https://signup.sendgrid.com/"],
      ["Authenticate your domain or verify a single sender (from_address):", "https://app.sendgrid.com/settings/sender_auth"],
      ["Create an API key with Mail Send access (api_key):", "https://app.sendgrid.com/settings/api_keys"],
    ],
  ],
  [
    "brevo",
    "Brevo (api_key only)",
    [
      ["Create an account:", "https://onboarding.brevo.com/account/register"],
      ["Add and verify a sender or domain (from_address):", "https://app.brevo.com/senders/list"],
      ["Generate an API key (api_key, not an SMTP key):", "https://app.brevo.com/settings/keys/api"],
    ],
  ],
];

const providerSteps = ([provider, label, steps]: [string, string, [string, string][]]) => [
  "",
  `provider: "${provider}" - ${label}`,
  ...steps.flatMap(([text, url], i) => [`  ${i + 1}. ${text}`, `     ${url}`]),
];

const EMAIL_KEYS: KeyCategory = {
  category: "email",
  title: "Email",
  groups: ({ AppNameCamel }) => [
    {
      group: "email",
      comment: [
        "Email delivery (Swoosh): sign-in codes, password resets and confirmations.",
        "With a blank api_key, dev and docker deliver to Mailpit (inbox at http://localhost:8025),",
        "tests use Swoosh.Adapters.Test, and prod only logs emails and turns email codes off.",
        "Pick one provider, follow its steps, and fill in from_address with an address",
        "on the domain or sender you verified.",
        ...EMAIL_PROVIDERS.flatMap(providerSteps),
        "",
      ],
      keys: [
        ["provider", "postmark"],
        ["api_key", ""],
        ["domain", ""],
        ["from_name", AppNameCamel],
        ["from_address", ""],
      ],
    },
  ],
};

export { EMAIL_KEYS };
