# Project 01 — Employee Onboarding: Slack + Azure Function Foundation

> **Purpose:** Build and verify the foundation where a Slack user triggers an Azure Function. The Function receives the request, identifies the action, and is ready for the later Microsoft Graph / Entra ID work.

## Quick summary

**Current working state:** Azure Function App is running, the Slack app is installed, Interactivity is enabled, and the **Create Employee** global shortcut exists with callback ID `create_employee`. fileciteturn0file0L1-L5

The first milestone is **not employee creation yet**. The milestone is:

```text
Slack
  ↓
Create Employee shortcut
  ↓
HTTPS POST
  ↓
Azure Function
  ↓
callback_id = create_employee
  ↓
success response
```

A **global shortcut is not a slash command**. Do not test it with `/shortcut`, `/create`, or `/create_employee`. fileciteturn0file0L32-L44

---

# Plan — work through this in order

| Step | What you do | Done when |
|---|---|---|
| 1 | Confirm the project target | You know exactly what the first test must prove |
| 2 | Configure the Slack app | App + bot + minimum scopes are ready |
| 3 | Install Slack app and prepare test channel | App is installed and bot can access `#employee-onboarding` |
| 4 | Create/verify Azure Function | HTTP Function is running |
| 5 | Deploy and test the Function | `OK`, challenge, and app-mention tests work |
| 6 | Connect Slack Interactivity | Slack Request URL points to Azure |
| 7 | Create and test `Create Employee` | Shortcut reaches Azure with `callback_id = create_employee` |
| 8 | Lock down the foundation | Security checks pass before Graph/employee work |

**Do not jump ahead. Finish one checkpoint before starting the next step.**

---

# Step 1 — Know exactly what we are building

## Target architecture

```text
Slack user
   │
   │ selects Create Employee
   ▼
Slack App / Global Shortcut
   │
   │ HTTPS POST
   ▼
Azure Function
   │
   ├── validate Slack request
   ├── identify callback_id = create_employee
   └── return a response
        │
        ▼
Future: Microsoft Graph / Entra ID / HR automation
```

## Important rule

The shortcut's visible name is:

```text
Create Employee
```

The value your Function uses is:

```text
create_employee
```

The first successful test only needs to prove that Slack can send that interaction to Azure and that Azure can identify the action.

### Checkpoint

- [ ] I understand the target flow.
- [ ] I will test the shortcut from Slack's shortcut UI.
- [ ] I will not use a slash command to test the shortcut.

---

# Step 2 — Configure the Slack app

## 2.1 Create the app

1. Open Slack API app management.
2. Choose **Create New App**.
3. Choose **From scratch**.
4. App name: `Employee Onboarding`
5. Select the test workspace.
6. Create the app.

<img src="https://github.com/user-attachments/assets/fad29bef-54db-4f01-a719-879655ba1989" alt="Slack app creation" />

<img src="https://github.com/user-attachments/assets/979c7c61-9354-4c25-a8d3-ee85ddb51eb0" alt="Slack app configuration" />

### Checkpoint

You should be inside the **Employee Onboarding** Slack app configuration.

## 2.2 Configure the bot

Open the bot/app configuration and make sure the app has a bot identity.

<img src="https://github.com/user-attachments/assets/8aad527d-37ba-4c2b-9eca-82a0f2748069" alt="Slack bot configuration" />

## 2.3 Add only the scopes you need

Start with the minimum permissions required for the functionality being tested.

<img src="https://github.com/user-attachments/assets/cc45943e-ae45-421f-8df0-dec83865f199" alt="Slack OAuth scopes" />

> **Security:** Treat the Slack bot token like a password. Do not put it in source code, screenshots, GitHub commits, or this README. fileciteturn0file0L98-L108

### Checkpoint

- [ ] Slack app exists.
- [ ] Bot identity is configured.
- [ ] Only required Slack scopes are present.
- [ ] No token is stored in the repository.

---

# Step 3 — Install Slack and prepare the test channel

## 3.1 Install the app

1. Open **OAuth & Permissions**.
2. Start installation.
3. Review permissions.
4. Authorize the app in the test workspace.
5. Store the bot token securely.

<img src="https://github.com/user-attachments/assets/6a234a07-3bac-4973-af6c-4a12061526d0" alt="Slack OAuth installation" />

<img src="https://github.com/user-attachments/assets/f056afac-8c02-4588-9e88-8648d5cded20" alt="Slack authorization" />

<img src="https://github.com/user-attachments/assets/014a0f29-549d-4767-b21b-47f49a6c6018" alt="Slack installed app" />

### Checkpoint

The **Employee Onboarding** app should appear under **Apps** in Slack.

## 3.2 Prepare the test channel

Use a dedicated test channel:

```text
#employee-onboarding
```

Invite the bot to the channel.

<img src="https://github.com/user-attachments/assets/7759fc31-3e14-40ae-b090-945b77794d28" alt="Invite Slack bot" />

<img src="https://github.com/user-attachments/assets/8e07cdc1-d6f7-467c-8e95-988fb9af22b5" alt="Slack channel bot access" />

<img src="https://github.com/user-attachments/assets/c8fdaf90-1e79-4ffe-aced-2d92e9110c9f" alt="Slack bot in channel" />

<img src="https://github.com/user-attachments/assets/4a4b5374-6a0c-416f-86fa-83ef92839e93" alt="Slack channel configuration" />

<img src="https://github.com/user-attachments/assets/1d6cc685-64dd-4e28-ae43-3b9938f3971d" alt="Slack channel access confirmation" />

### Checkpoint

- [ ] App is installed.
- [ ] Bot is in `#employee-onboarding`.
- [ ] Channel-based tests can reach the bot.

---

# Step 4 — Create or verify the Azure Function

## 4.1 Function App settings

Open Azure → **Function App** → **Create**.

The current project notes show this test configuration:

| Setting | Current test value |
|---|---|
| Function App | `employee-onboarding` |
| Resource group | `test` |
| Region | `India South Central` |
| Operating system | `Windows` |
| Runtime | `Node.js 22` |
| Plan/SKU | Dynamic / `Y1` |
| Trigger | HTTP |

The project notes also warn that Consumption/Y1 does not automatically mean every related resource is free, so check Cost Management, Application Insights, storage, and related resources. fileciteturn0file0L168-L182

![Azure Function App](Project01-assets/azure-function-overview.png)

<img src="https://github.com/user-attachments/assets/eb6305a3-1a07-469a-bbcf-82746f7e642e" alt="Azure Function App creation" />

<img src="https://github.com/user-attachments/assets/d997d7ee-13aa-4c19-bd47-0653fbb88ad6" alt="Azure Function configuration" />

<img src="https://github.com/user-attachments/assets/338e25d5-d824-4c88-aaaf-676e0fd3b822" alt="Azure Function settings" />

<img src="https://github.com/user-attachments/assets/27d45a50-6a4d-43b2-be68-4a1e14e8056a" alt="Azure Function review" />

<img src="https://github.com/user-attachments/assets/66585853-6f39-4aa6-8875-cd4f814ea7d9" alt="Azure Function deployment" />

<img src="https://github.com/user-attachments/assets/c656f133-1c23-48be-a80d-ee84a3f3f293" alt="Azure Function resource" />

<img src="https://github.com/user-attachments/assets/6d1fb678-0ac2-46fb-9f6a-2eaab0687579" alt="Azure Function app details" />

<img src="https://github.com/user-attachments/assets/7bd69632-c5a4-45b8-bfc2-68dc3ea17f03" alt="Azure Function app configuration" />

<img src="https://github.com/user-attachments/assets/2da2d672-4b06-4987-87bc-e824941176e7" alt="Azure Function deployment result" />

<img src="https://github.com/user-attachments/assets/a0c53016-0da9-42da-b630-0a0c6c1f9451" alt="Azure Function app" />

<img src="https://github.com/user-attachments/assets/eb0bc3fb-6783-4d2f-9881-7189ca355391" alt="Azure Function final configuration" />

### Checkpoint

- [ ] Function App is **Running**.
- [ ] Runtime/OS match the intended test setup.
- [ ] HTTP-triggered Function exists.
- [ ] Function URL is available.

## 4.2 Function file structure

```text
repository-root/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```

---

# Step 5 — Deploy and test the Azure Function

## 5.1 `package.json`

At the application root:

```json
{
  "name": "employee-onboarding",
  "version": "1.0.0",
  "description": "Employee Onboarding Slack Bot",
  "main": "employee-onboarding/index.js",
  "private": true,
  "dependencies": {
    "@azure/identity": "^4.12.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "isomorphic-fetch": "^3.0.0"
  }
}
```

## 5.2 HTTP handler

Use the clean foundation below:

```javascript
module.exports = async function (context, req) {
    // Slack URL verification
    if (req.body && req.body.type === "url_verification") {
        context.res = {
            status: 200,
            body: req.body.challenge
        };
        return;
    }

    // Slack app mention
    if (
        req.body &&
        req.body.event &&
        req.body.event.type === "app_mention"
    ) {
        context.res = {
            status: 200,
            body: "Hello! Employee Onboarding Bot is working."
        };
        return;
    }

    // Global shortcut / interactive request foundation
    if (req.body && req.body.callback_id === "create_employee") {
        context.res = {
            status: 200,
            body: "Create Employee shortcut received."
        };
        return;
    }

    context.res = {
        status: 200,
        body: "OK"
    };
};
```

> **Important:** The project notes specifically correct an extra closing `};` that appeared in an older draft. Keep only the valid function shown above. fileciteturn0file0L250-L294

## 5.3 Deploy

If GitHub deployment is being used:

1. Put the Function files in the repository.
2. Commit.
3. Push to the configured branch.
4. Open Azure **Deployment Center**.
5. Confirm deployment succeeded.
6. Open the Function and confirm the HTTP trigger is enabled.

<img src="https://github.com/user-attachments/assets/4bb6d153-8935-4895-bfe1-7062f4695c05" alt="Function source files" />

<img src="https://github.com/user-attachments/assets/9db4e536-e1d8-4b8c-9451-231d25b05108" alt="GitHub package file" />

<img src="https://github.com/user-attachments/assets/5a321e3e-d789-40c0-a79f-df2a0d2bb228" alt="GitHub repository" />

<img src="https://github.com/user-attachments/assets/f0b8b45b-acc8-43ad-8a64-8a9f63ec9b4a" alt="GitHub deployment" />

<img src="https://github.com/user-attachments/assets/b27bc559-b57a-4e4f-8ed8-7f66598363e8" alt="Repository files" />

### Checkpoint

Azure must respond successfully **before** you connect Slack to it.

## 5.4 Test Azure before changing Slack

### Basic health test

Expected:

```text
OK
```

### Slack URL verification

The handler must return the exact `challenge` value supplied by Slack.

### App mention

Expected:

```text
Hello! Employee Onboarding Bot is working.
```

<img src="https://github.com/user-attachments/assets/c4c1fc84-1e27-4f79-8b75-64d5e7025fca" alt="Azure Function test" />

<img src="https://github.com/user-attachments/assets/7dd1618b-1369-4c14-87a4-5d3d6195249d" alt="Function HTTP response" />

<img src="https://github.com/user-attachments/assets/5d620c70-300f-4db2-9241-81faa5e5339f" alt="Function test result" />

<img src="https://github.com/user-attachments/assets/edf174b5-f47c-430c-a172-5feee6f155a7" alt="Slack request test" />

<img src="https://github.com/user-attachments/assets/0b3ac6cf-9704-4c05-af25-489e3b9ec82f" alt="Slack bot test" />

<img src="https://github.com/user-attachments/assets/4406afaa-ca34-4f88-9cc0-9ab56c025d5b" alt="Successful Slack bot response" />

### Checkpoint

- [ ] Basic HTTP test returns `OK`.
- [ ] URL verification returns `challenge`.
- [ ] App mention returns the expected response.
- [ ] Deployment is successful.

---

# Step 6 — Connect Slack Interactivity to Azure

## 6.1 Open Interactivity

In the Slack app:

**Features → Interactivity & Shortcuts**

Turn **Interactivity** on.

## 6.2 Enter the Function Request URL

Use the public HTTPS URL from your actual Azure Function.

Format:

```text
https://<function-app-name>.<azure-region-domain>/api/<function-name>
```

Use **Get function URL** for the real URL. Do not copy a placeholder URL from this README.

![Slack Interactivity and Shortcuts](Project01-assets/slack-interactivity-shortcuts.png)

The working configuration should show:

- Interactivity = **On**
- Request URL = Azure Function endpoint
- Shortcut = **Create Employee**
- Location = **Global**
- Callback ID = `create_employee`

### Checkpoint

Slack now knows where to send interactive requests.

---

# Step 7 — Create and test the `Create Employee` shortcut

## 7.1 Create the shortcut

On **Interactivity & Shortcuts**:

1. Scroll to **Shortcuts**.
2. Click **Create New Shortcut**.
3. Select **Global**.
4. Continue to shortcut details.

![Create a shortcut](Project01-assets/create-shortcut.png)

Enter these values exactly:

| Field | Value |
|---|---|
| Name | `Create Employee` |
| Short Description | `Create a new employee onboarding request` |
| Callback ID | `create_employee` |
| Location | `Global` |

Then click **Create**.

## 7.2 Understand the two names

User-facing name:

```text
Create Employee
```

Internal callback ID:

```text
create_employee
```

Your Function uses the callback ID to determine which action was requested. fileciteturn0file0L418-L443

## 7.3 Test it correctly

### Do NOT type

```text
/shortcut
/create employee
/create_employee
```

Those are slash-command attempts. The current project notes identify this as the previous testing mistake. fileciteturn0file0L447-L469

![Slack slash-command test](Project01-assets/slack-test-and-command-mistake.png)

### Instead

Use Slack's shortcut menu/search and select:

```text
Create Employee
```

The important thing is that you select the **named global shortcut**, not a slash command.

### Checkpoint

The request path should now be:

```text
Create Employee
      ↓
Slack
      ↓
HTTPS POST
      ↓
Azure Function
      ↓
callback_id = create_employee
      ↓
Create Employee shortcut received.
```

---

# Step 8 — Verify the foundation and prepare for the next phase

## 8.1 If the shortcut does not appear

Check in this order:

1. Shortcut exists under **Interactivity & Shortcuts → Shortcuts**.
2. Location is **Global**.
3. Callback ID is exactly `create_employee`.
4. Interactivity is **On**.
5. Request URL is the current Azure Function URL.
6. App is installed in the workspace being tested.
7. Reinstall the app if scopes/settings changed.
8. Refresh/reopen Slack if the shortcut was just created.

## 8.2 Microsoft Graph / Azure application setup

The project already includes the Graph-related dependencies, but Graph permissions should be added only when the exact operation is known. Use least privilege.

<img src="https://github.com/user-attachments/assets/20e16922-abb7-4d72-8380-f530904d8518" alt="Azure application registration" />

<img src="https://github.com/user-attachments/assets/2de30aac-42cc-4e97-a7b3-3124193c5f1e" alt="Azure application configuration" />

<img src="https://github.com/user-attachments/assets/69220c3a-b4e9-4f55-b4a2-1dd6bfb523f3" alt="Azure identity configuration" />

<img src="https://github.com/user-attachments/assets/2311e45f-83b6-4639-913c-089a07c78cfa" alt="Azure permissions" />

<img src="https://github.com/user-attachments/assets/eb90bbc8-f298-4555-9681-233b9f2352c6" alt="Azure application settings" />

## 8.3 GitHub structure

Keep the repository predictable:

```text
repository-root/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```

<img src="https://github.com/user-attachments/assets/3bc67482-bc20-4797-b8f6-53a79dadee15" alt="GitHub package json" />

<img src="https://github.com/user-attachments/assets/38305c7e-5a65-4fdc-bab2-08e9e4f5b414" alt="GitHub repository branch" />

<img src="https://github.com/user-attachments/assets/63a54e82-3517-4477-ae28-39ae0eca3e93" alt="GitHub source" />

<img src="https://github.com/user-attachments/assets/bb39c108-f3cc-4815-98d3-b1fea9e10851" alt="GitHub commit" />

<img src="https://github.com/user-attachments/assets/d570baf5-ad82-47ef-aced-dc9b21b94ad9" alt="GitHub deployment status" />

## 8.4 Security checklist

Before moving beyond the proof of concept:

- [ ] Never commit Slack tokens to GitHub.
- [ ] Store secrets in Azure application settings, Key Vault, or another approved secret store.
- [ ] Use least-privilege Slack scopes.
- [ ] Use least-privilege Microsoft Graph permissions.
- [ ] Do not log access tokens or sensitive employee information.
- [ ] Rotate/revoke credentials if exposed.
- [ ] Separate development and production credentials.
- [ ] Validate Slack requests before sensitive actions.
- [ ] Add appropriate authentication/verification for production.
- [ ] Configure monitoring and cost alerts.

These are the security controls recorded in the current project notes. fileciteturn0file0L590-L602

---

# Daily task view — use this at the start of each session

## Today

**Current milestone:** Slack → Azure Function foundation

### 1. Check where you stopped

- [ ] Slack app installed
- [ ] Bot in `#employee-onboarding`
- [ ] Azure Function running
- [ ] Function deployed
- [ ] Interactivity = On
- [ ] Request URL is correct
- [ ] `Create Employee` shortcut exists
- [ ] Callback ID = `create_employee`

### 2. Run only the next missing test

Do not rebuild working pieces.

```text
Azure health test
      ↓
Slack Interactivity
      ↓
Create Employee shortcut
      ↓
Azure receives callback
      ↓
Only then move to the next feature
```

### 3. Record the result

```text
Date:
What I changed:
What worked:
What failed:
Exact error:
Screenshot:
Next action:
```

### 4. Stop point

The current foundation is complete when:

```text
Create Employee
      ↓
Slack sends interaction
      ↓
Azure receives request
      ↓
callback_id = create_employee
      ↓
Function returns success
```

Only after that should the project move to the employee modal, validation, Microsoft Graph, Entra ID operations, approvals, audit logging, and production security. fileciteturn0file0L624-L680

---

# Troubleshooting — quick lookup

| Symptom | First check |
|---|---|
| `invalid_auth` | Slack OAuth token / installation |
| `missing_scope` | Slack OAuth scopes |
| `channel_not_found` | Channel ID and bot membership |
| `not_in_channel` | Invite the bot |
| HTTP `429` | Rate limiting / retry |
| Slack says `/create` is invalid | Use the global shortcut UI |
| Shortcut not visible | Global shortcut + reinstall/refresh |
| Slack interaction does not reach Azure | Interactivity Request URL |
| Azure returns 500 | Function logs and deployed files |
| URL verification fails | `url_verification` / `challenge` handler |

---

# Final validation checklist

## Slack

- [ ] Slack app exists
- [ ] Bot is installed
- [ ] Required scopes are configured
- [ ] Bot can access `#employee-onboarding`
- [ ] Interactivity is **On**
- [ ] Request URL points to Azure HTTP Function
- [ ] Global shortcut **Create Employee** exists
- [ ] Callback ID is `create_employee`

## Azure

- [ ] Function App is running
- [ ] HTTP-triggered Function exists
- [ ] Deployment succeeded
- [ ] Function URL is reachable
- [ ] URL verification returns the Slack challenge
- [ ] Basic test returns `OK`
- [ ] Shortcut request is handled

## Next phase

Once the foundation passes, the next phase is:

1. Open a Slack modal from **Create Employee**.
2. Collect employee information.
3. Validate the form.
4. Submit the data to Azure.
5. Authenticate to Microsoft Graph securely.
6. Create the employee account according to requirements.
7. Return success/failure to Slack.
8. Add audit logging and production security.

Keep that work separate from the foundation so Slack, Azure, and Graph are not all being debugged at the same time.

---

# Screenshot inventory

**All 48 screenshots from the supplied README are retained in this rewritten version.**

1. Slack app creation
2. Slack app configuration
3. Slack bot configuration
4. Slack OAuth scopes
5. Slack OAuth installation
6. Slack authorization
7. Slack installed app
8. Invite Slack bot
9. Slack channel bot access
10. Slack bot in channel
11. Slack channel configuration
12. Slack channel access confirmation
13. Azure Function App
14. Azure Function App creation
15. Azure Function configuration
16. Azure Function settings
17. Azure Function review
18. Azure Function deployment
19. Azure Function resource
20. Azure Function app details
21. Azure Function app configuration
22. Azure Function deployment result
23. Azure Function app
24. Azure Function final configuration
25. Function source files
26. GitHub package file
27. GitHub repository
28. GitHub deployment
29. Repository files
30. Azure Function test
31. Function HTTP response
32. Function test result
33. Slack request test
34. Slack bot test
35. Successful Slack bot response
36. Slack Interactivity and Shortcuts
37. Create a shortcut
38. Slack slash-command test
39. Azure application registration
40. Azure application configuration
41. Azure identity configuration
42. Azure permissions
43. Azure application settings
44. GitHub package json
45. GitHub repository branch
46. GitHub source
47. GitHub commit
48. GitHub deployment status
