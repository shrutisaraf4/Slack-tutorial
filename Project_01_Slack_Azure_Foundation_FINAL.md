# Project 01 — Employee Onboarding: Slack → Azure → Microsoft Graph

## Summary

The project has moved beyond the original webhook proof-of-concept. The current working flow is:

```text
Slack
  ↓
Create Employee shortcut
  ↓
New Employee Onboarding modal
  ↓
Azure Function
  ↓
Microsoft Graph
  ↓
Azure / Entra ID user created
  ↓
Success message posted to #employee-onboarding
```

The screenshots supplied today show a working **New Employee Onboarding** modal and a successful **New User Created Successfully in Azure!** result. The Azure App Registration also shows Microsoft Graph permissions granted for the application.

> **Important:** the current code contains a hard-coded temporary password. This is acceptable only as a short-lived test implementation. Before production, move password handling to a secure design and remove the hard-coded credential from source code.

---

# Plan — work in this order

| Step | Task | Result |
|---|---|---|
| 1 | Slack app + workspace | App exists in the correct workspace |
| 2 | Slack bot + OAuth scopes | Bot has only the permissions actually needed |
| 3 | Slack channel + installation | Bot is installed and available in `#employee-onboarding` |
| 4 | Azure Function | HTTP endpoint is deployed and reachable |
| 5 | Slack Event Subscriptions | Slack can send events to Azure |
| 6 | Interactivity + `Create Employee` | Shortcut reaches Azure |
| 7 | Employee modal | User enters onboarding data |
| 8 | Microsoft Graph | Azure creates the user |
| 9 | Slack confirmation | Result is posted back to the channel |
| 10 | Security + cleanup | Secrets, permissions, validation, and production controls are fixed |

**Daily rule:** do not redo a completed step. Check the boxes, test the next missing item, record the result, and stop there.

---

# Daily Task View — start here every day

### 1. Check status

- [ ] Slack app exists
- [ ] Bot installed
- [ ] Required scopes are correct
- [ ] Bot is in `#employee-onboarding`
- [ ] Azure Function is running
- [ ] Deployment succeeded
- [ ] Event Subscriptions are working
- [ ] Interactivity is On
- [ ] `Create Employee` shortcut exists
- [ ] Modal opens
- [ ] Microsoft Graph user creation works
- [ ] Slack success message appears

### 2. Work on only the next unchecked item

```text
Slack → Azure → Modal → Graph → Slack confirmation
```

### 3. Record today's work

```text
Date:
Step worked on:
What I changed:
What worked:
What failed:
Exact error:
Screenshot:
Next action:
```

---

# Step 1 — Create the Slack app

## Do this

1. Open Slack API app management.
2. Click **Create New App**.
3. Choose **From scratch**.
4. App name: `Employee Onboarding`.
5. Select the test workspace.
6. Create the app.

## Screenshot — original setup sequence

<p><img src="https://github.com/user-attachments/assets/fad29bef-54db-4f01-a719-879655ba1989" alt="Slack app creation" /></p>

<p><img src="https://github.com/user-attachments/assets/979c7c61-9354-4c25-a8d3-ee85ddb51eb0" alt="Slack app configuration" /></p>

## Today's screenshot — workspace selection

![Slack Create from scratch workspace selection](Project01-assets-NEW/new-01-slack-create-from-scratch.png)

### Checkpoint

- [ ] App is named `Employee Onboarding`.
- [ ] Correct Slack workspace is selected.

---

# Step 2 — Configure the Slack bot and OAuth scopes

## Do this

1. Open the app's bot configuration.
2. Confirm the bot identity.
3. Open **OAuth & Permissions**.
4. Review **Bot Token Scopes**.
5. Keep only scopes required by the features you are actually using.

## Original screenshots

<p><img src="https://github.com/user-attachments/assets/8aad527d-37ba-4c2b-9eca-82a0f2748069" alt="Slack bot configuration" /></p>

<p><img src="https://github.com/user-attachments/assets/cc45943e-ae45-421f-8df0-dec83865f199" alt="Slack OAuth scopes" /></p>

## Today's scope screenshots

![Slack OAuth scopes — broader/current configuration evidence](Project01-assets-NEW/new-02-slack-oauth-scopes-broad.png)

![Slack OAuth scopes — reduced scope configuration](Project01-assets-NEW/new-03-slack-oauth-scopes-minimal.png)

### Scope warning

There are two different scope states in the supplied screenshots. Do not blindly copy both configurations.

The **reduced** screenshot shows:

```text
channels:read
chat:write
im:write
```

But the Event Subscriptions screenshots show subscriptions for `app_mention`, `message.groups`, and `message.im`, which require additional scopes. Therefore, before removing any event-related scopes, verify which Slack events the current code still uses.

### Checkpoint

- [ ] Scope list matches the features currently enabled.
- [ ] No unused high-privilege scope is kept just because an older screenshot contains it.
- [ ] Slack token is not in GitHub or source code.

---

# Step 3 — Install the app and prepare the test channel

## Do this

1. Open **OAuth & Permissions**.
2. Install/reinstall the app after scope changes.
3. Authorize it in the test workspace.
4. Confirm the app appears in Slack.
5. Use `#employee-onboarding` as the test channel.
6. Invite the bot to the channel.

## Original screenshots

<p><img src="https://github.com/user-attachments/assets/6a234a07-3bac-4973-af6c-4a12061526d0" alt="Slack OAuth installation" /></p>

<p><img src="https://github.com/user-attachments/assets/f056afac-8c02-4588-9e88-8648d5cded20" alt="Slack authorization" /></p>

<p><img src="https://github.com/user-attachments/assets/014a0f29-549d-4767-b21b-47f49a6c6018" alt="Slack installed app" /></p>

<p><img src="https://github.com/user-attachments/assets/7759fc31-3e14-40ae-b090-945b77794d28" alt="Invite Slack bot" /></p>

<p><img src="https://github.com/user-attachments/assets/8e07cdc1-d6f7-467c-8e95-988fb9af22b5" alt="Slack channel bot access" /></p>

<p><img src="https://github.com/user-attachments/assets/c8fdaf90-1e79-4ffe-aced-2d92e9110c9f" alt="Slack bot in channel" /></p>

<p><img src="https://github.com/user-attachments/assets/4a4b5374-6a0c-416f-86fa-83ef92839e93" alt="Slack channel configuration" /></p>

<p><img src="https://github.com/user-attachments/assets/1d6cc685-64dd-4e28-ae43-3b9938f3971d" alt="Slack channel access confirmation" /></p>

### Checkpoint

- [ ] App is installed.
- [ ] Bot is in `#employee-onboarding`.
- [ ] The workspace being tested is the same workspace where the app was installed.

---

# Step 4 — Verify the Azure Function

## Do this

1. Open Azure → Function App.
2. Confirm the Function App is running.
3. Confirm the HTTP trigger exists.
4. Copy the real Function URL using **Get function URL**.
5. Confirm the deployed code is the code you expect.

## Original Azure screenshots

![Azure Function App](Project01-assets/azure-function-overview.png)

<p><img src="https://github.com/user-attachments/assets/eb6305a3-1a07-469a-bbcf-82746f7e642e" alt="Azure Function App creation" /></p>

<p><img src="https://github.com/user-attachments/assets/d997d7ee-13aa-4c19-bd47-0653fbb88ad6" alt="Azure Function configuration" /></p>

<p><img src="https://github.com/user-attachments/assets/338e25d5-d824-4c88-aaaf-676e0fd3b822" alt="Azure Function settings" /></p>

<p><img src="https://github.com/user-attachments/assets/27d45a50-6a4d-43b2-be68-4a1e14e8056a" alt="Azure Function review" /></p>

<p><img src="https://github.com/user-attachments/assets/66585853-6f39-4aa6-8875-cd4f814ea7d9" alt="Azure Function deployment" /></p>

<p><img src="https://github.com/user-attachments/assets/c656f133-1c23-48be-a80d-ee84a3f3f293" alt="Azure Function resource" /></p>

<p><img src="https://github.com/user-attachments/assets/6d1fb678-0ac2-46fb-9f6a-2eaab0687579" alt="Azure Function app details" /></p>

<p><img src="https://github.com/user-attachments/assets/7bd69632-c5a4-45b8-bfc2-68dc3ea17f03" alt="Azure Function app configuration" /></p>

<p><img src="https://github.com/user-attachments/assets/2da2d672-4b06-4987-87bc-e824941176e7" alt="Azure Function deployment result" /></p>

<p><img src="https://github.com/user-attachments/assets/a0c53016-0da9-42da-b630-0a0c6c1f9451" alt="Azure Function app" /></p>

<p><img src="https://github.com/user-attachments/assets/eb0bc3fb-6783-4d2f-9881-7189ca355391" alt="Azure Function final configuration" /></p>

### Checkpoint

- [ ] Function App is running.
- [ ] HTTP trigger is available.
- [ ] Public HTTPS endpoint is known.
- [ ] Latest deployment is the version being tested.

---

# Step 5 — Verify Event Subscriptions

## Do this

1. Open Slack app → **Event Subscriptions**.
2. Turn **Enable Events** on.
3. Set the **Request URL** to the Azure Function endpoint.
4. Wait for Slack to verify the URL.
5. Review the subscribed bot events.

## Current screenshots

![Slack Event Subscriptions](Project01-assets-NEW/new-04-slack-event-subscriptions.png)

![Slack Event Subscriptions — full view](Project01-assets-NEW/new-05-slack-event-subscriptions-full.png)

The supplied screenshots show these bot events:

```text
app_mention
message.groups
message.im
```

## Original Azure/Slack test screenshots

<p><img src="https://github.com/user-attachments/assets/c4c1fc84-1e27-4f79-8b75-64d5e7025fca" alt="Azure Function test" /></p>

<p><img src="https://github.com/user-attachments/assets/7dd1618b-1369-4c14-87a4-5d3d6195249d" alt="Function HTTP response" /></p>

<p><img src="https://github.com/user-attachments/assets/5d620c70-300f-4db2-9241-81faa5e5339f" alt="Function test result" /></p>

<p><img src="https://github.com/user-attachments/assets/edf174b5-f47c-430c-a172-5feee6f155a7" alt="Slack request test" /></p>

<p><img src="https://github.com/user-attachments/assets/0b3ac6cf-9704-4c05-af25-489e3b9ec82f" alt="Slack bot test" /></p>

<p><img src="https://github.com/user-attachments/assets/4406afaa-ca34-4f88-9cc0-9ab56c025d5b" alt="Successful Slack bot response" /></p>

### Checkpoint

- [ ] **Enable Events** is On.
- [ ] Request URL is verified.
- [ ] Event subscriptions match what the code handles.
- [ ] A test mention reaches Azure and receives a response.

---

# Step 6 — Configure Interactivity and the `Create Employee` shortcut

## Do this

1. Open **Interactivity & Shortcuts**.
2. Turn **Interactivity** on.
3. Set the Request URL to the same Azure HTTP endpoint.
4. Create a **Global Shortcut**.
5. Name: `Create Employee`.
6. Callback ID: `create_employee`.
7. Save it.

## Original screenshots

![Slack Interactivity and Shortcuts](Project01-assets/slack-interactivity-shortcuts.png)

![Create a shortcut](Project01-assets/create-shortcut.png)

## Important: how to test it

A global shortcut is **not** a slash command.

Do **not** test with:

```text
/create
/create employee
/create_employee
```

Use Slack's shortcut menu/search and select **Create Employee**.

## Original screenshot showing the slash-command mistake

![Slack slash-command test](Project01-assets/slack-test-and-command-mistake.png)

### Checkpoint

- [ ] Interactivity is On.
- [ ] Request URL is verified.
- [ ] Shortcut is Global.
- [ ] Callback ID is exactly `create_employee`.
- [ ] Selecting the shortcut opens the onboarding modal.

---

# Step 7 — Verify the New Employee Onboarding modal

The current implementation opens this modal after the `create_employee` shortcut is received.

## Current working screenshot

![Working New Employee Onboarding modal](Project01-assets-NEW/new-06-create-employee-modal.png)

## Fields currently collected

| Field | Purpose |
|---|---|
| Full Name | Display name |
| Email ID / UPN | Microsoft Entra user principal name |
| Employee Number | Employee ID |
| Company | Company name |
| Phone Number | Mobile phone |
| Country | Usage location |

### Checkpoint

- [ ] Shortcut opens the modal.
- [ ] All six fields appear.
- [ ] **Create User** button is visible.
- [ ] Test data is valid before submitting.

---

# Step 8 — Verify Microsoft Graph / Azure user creation

## Azure App Registration

Open the `employee-onboarding` app registration → **API permissions**.

## Current screenshots

![Azure App Registration API permissions](Project01-assets-NEW/new-08-azure-api-permissions.png)

![Azure App Registration API permissions — duplicate evidence](Project01-assets-NEW/new-09-azure-api-permissions-duplicate.png)

The screenshots show Microsoft Graph application/delegated permissions including directory and user-related permissions. Keep only the permissions required by the actual Graph operations and retain admin consent where required.

## Original Azure application screenshots

<p><img src="https://github.com/user-attachments/assets/20e16922-abb7-4d72-8380-f530904d8518" alt="Azure application registration" /></p>

<p><img src="https://github.com/user-attachments/assets/2de30aac-42cc-4e97-a7b3-3124193c5f1e" alt="Azure application configuration" /></p>

<p><img src="https://github.com/user-attachments/assets/69220c3a-b4e9-4f55-b4a2-1dd6bfb523f3" alt="Azure identity configuration" /></p>

<p><img src="https://github.com/user-attachments/assets/2311e45f-83b6-4639-913c-089a07c78cfa" alt="Azure permissions" /></p>

<p><img src="https://github.com/user-attachments/assets/eb90bbc8-f298-4555-9681-233b9f2352c6" alt="Azure application settings" /></p>

## Current flow

```text
Slack modal submission
        ↓
Azure Function
        ↓
ClientSecretCredential
        ↓
Microsoft Graph
        ↓
POST /users
        ↓
Azure / Entra ID user
```

### Checkpoint

- [ ] Graph authentication succeeds.
- [ ] Required Graph permissions are granted.
- [ ] Test user does not already exist.
- [ ] User creation succeeds.

---

# Step 9 — Verify the Slack success message

## Current working result

![Successful Azure user creation in Slack](Project01-assets-NEW/new-07-successful-user-created.png)

The current successful result shows the created user's:

- Name
- Email
- Employee number
- Company
- Country

### Checkpoint

- [ ] Azure user exists.
- [ ] Slack reports success.
- [ ] No access token or password is posted into Slack.
- [ ] Test data is appropriate for the test tenant.

---

# Step 10 — GitHub deployment and repository structure

## Keep the repository simple

```text
repository-root/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```

## Original screenshots

<p><img src="https://github.com/user-attachments/assets/4bb6d153-8935-4895-bfe1-7062f4695c05" alt="Function source files" /></p>

<p><img src="https://github.com/user-attachments/assets/9db4e536-e1d8-4b8c-9451-231d25b05108" alt="GitHub package file" /></p>

<p><img src="https://github.com/user-attachments/assets/5a321e3e-d789-40c0-a79f-df2a0d2bb228" alt="GitHub repository" /></p>

<p><img src="https://github.com/user-attachments/assets/f0b8b45b-acc8-43ad-8a64-8a9f63ec9b4a" alt="GitHub deployment" /></p>

<p><img src="https://github.com/user-attachments/assets/b27bc559-b57a-4e4f-8ed8-7f66598363e8" alt="Repository files" /></p>

<p><img src="https://github.com/user-attachments/assets/3bc67482-bc20-4797-b8f6-53a79dadee15" alt="GitHub package json" /></p>

<p><img src="https://github.com/user-attachments/assets/38305c7e-5a65-4fdc-bab2-08e9e4f5b414" alt="GitHub repository branch" /></p>

<p><img src="https://github.com/user-attachments/assets/63a54e82-3517-4477-ae28-39ae0eca3e93" alt="GitHub source" /></p>

<p><img src="https://github.com/user-attachments/assets/bb39c108-f3cc-4815-98d3-b1fea9e10851" alt="GitHub commit" /></p>

<p><img src="https://github.com/user-attachments/assets/d570baf5-ad82-47ef-aced-dc9b21b94ad9" alt="GitHub deployment status" /></p>

### Checkpoint

- [ ] Code is committed.
- [ ] Deployment completes successfully.
- [ ] Azure is running the expected commit.
- [ ] Secrets are stored outside source control.

---

# Security — must be completed before production

## 1. Remove the hard-coded temporary password

The current test implementation contains a password directly in `index.js`. **Do not carry this into production.**

Move credential generation/handling to a secure design, such as a managed identity/secret-management approach appropriate for the tenant, and never commit passwords to Git.

## 2. Protect secrets

Store:

```text
SLACK_BOT_TOKEN
TENANT_ID
CLIENT_ID
CLIENT_SECRET
```

in Azure application settings / Key Vault or the approved secret-management system, not in source code.

## 3. Review permissions

Use least privilege for both:

- Slack OAuth scopes
- Microsoft Graph permissions

## 4. Validate Slack requests

The current HTTP endpoint is anonymous at the Function trigger level. For production, validate Slack requests before performing privileged operations.

## 5. Protect employee information

Do not log or post unnecessary employee data, tokens, passwords, or sensitive information.

---

# Troubleshooting — quick lookup

| Problem | Check first |
|---|---|
| `/create` is invalid | Use the **Create Employee** global shortcut, not a slash command |
| Shortcut not visible | Global shortcut, installation, workspace, refresh |
| Slack cannot verify Request URL | Azure URL + URL verification response |
| App mention does nothing | Event subscription + required Slack scopes |
| `invalid_auth` | Slack bot token / installation |
| `missing_scope` | OAuth scopes and reinstall |
| `not_in_channel` | Invite bot to `#employee-onboarding` |
| Azure returns 500 | Function logs + deployed code |
| User already exists | Check the UPN before creating |
| Graph permission error | API permissions + admin consent |
| Slack success but no Azure user | Graph call/logs |

---

# End-to-end validation

Run this once after any major configuration change:

```text
[ ] 1. Slack app installed
[ ] 2. Bot in #employee-onboarding
[ ] 3. OAuth scopes reviewed
[ ] 4. Event Subscriptions verified
[ ] 5. Interactivity verified
[ ] 6. Create Employee shortcut selected
[ ] 7. Modal opens
[ ] 8. Test employee data entered
[ ] 9. Create User clicked
[ ] 10. Graph creates Azure user
[ ] 11. Slack success message appears
[ ] 12. No secret/password exposed
```

---

# Screenshot completeness record

The README retains **all 48 screenshots from the original README** and adds the **9 screenshots supplied in the latest update**.

**Original screenshots retained:** 48  
**New screenshots added:** 9  
**Total screenshot references:** 57

The two API-permission images and two Event Subscription images are retained separately because the request was to avoid dropping screenshots; they can be consolidated later only if you explicitly want a cleaner evidence set.

---

# Next phase

The foundation is now demonstrated end-to-end. The next work should be treated as a separate phase:

1. Replace the hard-coded password design.
2. Add stronger Slack request verification.
3. Add input validation and useful Slack modal errors.
4. Handle duplicate users cleanly.
5. Improve Graph error handling.
6. Add audit logging without exposing sensitive data.
7. Review Slack and Graph least-privilege permissions.
8. Add production monitoring and cost controls.
9. Test failure cases before using real employee data.
