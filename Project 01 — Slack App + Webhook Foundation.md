# Project 01 — Slack App + Webhook Foundation

## Objective
Create a Slack App, install it into a test workspace, configure permissions, and send a programmatic message to a channel.

## Accounts / tools
- Slack workspace
- Slack API app configuration
- Postman or curl
- GitHub repository

## Steps

### 1. Create a Slack App
Create an app in the Slack API portal and choose your test workspace.

<img width="1376" height="940" alt="image" src="https://github.com/user-attachments/assets/fad29bef-54db-4f01-a719-879655ba1989" />
<img width="1112" height="662" alt="image" src="https://github.com/user-attachments/assets/979c7c61-9354-4c25-a8d3-ee85ddb51eb0" />

### 2. Add a bot
Configure a bot user and install the app to the workspace.

### 3. Understand OAuth scopes
Start with the minimum scopes required for the operation you are testing. Avoid granting broad permissions just because they are available.

<img width="1642" height="782" alt="image" src="https://github.com/user-attachments/assets/8aad527d-37ba-4c2b-9eca-82a0f2748069" />
<img width="1147" height="702" alt="image" src="https://github.com/user-attachments/assets/cc45943e-ae45-421f-8df0-dec83865f199" />

### 4. Install the app
Complete the OAuth installation flow and securely store the resulting bot token.
<img width="1062" height="757" alt="image" src="https://github.com/user-attachments/assets/6a234a07-3bac-4973-af6c-4a12061526d0" />
<img width="1667" height="829" alt="image" src="https://github.com/user-attachments/assets/f056afac-8c02-4588-9e88-8648d5cded20" />
<img width="1647" height="887" alt="image" src="https://github.com/user-attachments/assets/014a0f29-549d-4767-b21b-47f49a6c6018" />

### 5. Invite the bot
Add the bot to the target channel if required by the API operation.

### 6. Test an API call
Use Slack Web API `chat.postMessage` to post a test message.

Example request concept:
```text
POST https://slack.com/api/chat.postMessage
Authorization: Bearer <BOT_TOKEN>
Content-Type: application/json

{
  "channel": "<CHANNEL_ID>",
  "text": "Hello from my integration POC"
}
```

### 7. Test a webhook
Create an Incoming Webhook for a controlled channel and send a test notification.

## Security checklist
- Never commit tokens to GitHub.
- Use GitHub Secrets / Azure Key Vault / environment variables.
- Use least-privilege scopes.
- Rotate/revoke credentials if exposed.
- Separate development and production credentials.

## Troubleshooting
- `invalid_auth`: token/authentication issue.
- `missing_scope`: required OAuth scope is missing.
- `channel_not_found`: wrong channel ID or inaccessible channel.
- `not_in_channel`: bot needs access to the channel.
- HTTP 429: rate limit; implement retry/backoff according to Slack guidance.

## Interview questions
1. Bot token vs user token?
2. OAuth vs webhook?
3. Why use scopes?
4. How do you secure Slack tokens?
5. How would you troubleshoot a 403/401/429?
6. Why should channel IDs be preferred over channel names in automation?
