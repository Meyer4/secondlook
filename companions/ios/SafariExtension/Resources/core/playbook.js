export const INCIDENTS = [
  {
    id: 'clicked', icon: 'mouse', tint: 'sage', label: 'I clicked a link', short: 'Clicked a link', description: 'Close it, then check what happened next.', title: 'A click alone doesn’t tell the whole story.',
    intro: 'Opening a link does not automatically mean an account or device is compromised. What you entered, downloaded, or allowed matters.',
    steps: [
      'Close the page. Don’t enter details, accept notifications, download anything, or grant permissions.',
      'If you entered a password, shared a code, paid, or installed something, choose that situation above for more specific steps.',
      'Keep your browser and device updated. If something downloaded, don’t open it; delete the unexpected file and use your device’s built-in security scan if available. Review any permissions you granted.',
      'Verify the message through a known, official channel. Report and block the sender if it is fraudulent.',
    ],
  },
  {
    id: 'paid', icon: 'wallet', tint: 'peach', label: 'I sent money', short: 'Sent money', description: 'Contact your bank or mobile-money provider.', title: 'Contact your payment provider quickly.',
    intro: 'A provider may be able to stop or reverse a payment, but recovery is not guaranteed. Acting promptly can help.',
    steps: [
      'Use your bank or mobile-money provider’s official app or a phone number you already trust. Explain that the payment may be fraudulent.',
      'Ask about stopping the transfer, reversing the payment, and protecting or freezing the account or card. For a gift card, contact its issuer; for a crypto transfer, contact the exchange you used.',
      'Keep transaction IDs, dates, receipts, and screenshots privately. Do not post account numbers, PINs, codes, or personal documents publicly.',
      'Report the incident through your provider and appropriate local fraud or police reporting channel. Do not pay anyone who promises recovery for an upfront fee.',
    ],
  },
  {
    id: 'password', icon: 'key', tint: 'lavender', label: 'I shared a password', short: 'Shared a password', description: 'Secure the account and any reused passwords.', title: 'Take back control of the account.',
    intro: 'Use a separate trusted device if you suspect yours is being controlled or has unsafe software installed.',
    steps: [
      'Open the service’s official app or type its known address yourself. Change the exposed password immediately. Use official account recovery if you cannot sign in.',
      'Change the password on any other account where you reused it. Prioritise your email and financial accounts.',
      'Sign out other sessions and review recovery email addresses, phone numbers, connected apps, and recent activity. Remove changes you do not recognise.',
      'Enable a passkey or multi-factor authentication where available. Contact official support if the account or its recovery settings were changed.',
    ],
  },
  {
    id: 'code', icon: 'lock', tint: 'sage', label: 'I shared a login code', short: 'Shared a login code', description: 'A one-time code may have allowed access.', title: 'Treat the account as potentially exposed.',
    intro: 'A code may have authorised a login, payment, or password reset. Waiting for it to expire does not undo that action.',
    steps: [
      'Contact the service through a known official channel immediately. If the code was for a bank or mobile-money transaction, ask the provider to secure the account and review transactions.',
      'On a trusted device, open the official app or site. Change the password if applicable and sign out unrecognised sessions.',
      'Review payments, recovery settings, and connected devices. Follow official support or account recovery instructions.',
      'Do not share any further codes. A new caller claiming to “fix” this may be part of the same scam.',
    ],
  },
  {
    id: 'installed', icon: 'download', tint: 'peach', label: 'I installed an app', short: 'Installed an app', description: 'Stop remote access and get trusted support.', title: 'Limit access to the device first.',
    intro: 'An unexpected installer or remote-support app can put personal information at risk. The right cleanup depends on your device.',
    steps: [
      'If you suspect someone is actively controlling the device, disconnect it from Wi-Fi, mobile data, and other networks. Stop any remote-support session.',
      'Use a separate trusted device to contact your financial providers if sensitive information was visible. Change exposed account passwords and revoke sessions from that trusted device.',
      'Remove unfamiliar remote-access software and permissions if you can do so safely. Use the device’s built-in security tools and install official updates.',
      'If control persists or you are unsure, seek trusted technical help. A full device reset may be needed; removing one app does not guarantee the device is clean.',
    ],
  },
  {
    id: 'impersonation', icon: 'user', tint: 'lavender', label: 'Someone is impersonating', short: 'Impersonation', description: 'Verify the person using another channel.', title: 'Check the person, not the profile picture.',
    intro: 'A familiar name, voice, or photo is not enough to verify someone. Accounts can be copied or taken over.',
    steps: [
      'Do not send money, codes, or documents. Pause the conversation, even if the request sounds urgent or emotional.',
      'Call the person using a number you had saved before this message, or contact them through a separate trusted channel. For a company, use its official app or known contact details.',
      'If your own account is being copied, warn your contacts through a trusted channel and use the platform’s impersonation reporting process. If your actual account was taken over, use official account recovery.',
      'Save relevant evidence privately, then report and block the impersonator. If you already paid or shared a secret, choose that situation above.',
    ],
  },
];
