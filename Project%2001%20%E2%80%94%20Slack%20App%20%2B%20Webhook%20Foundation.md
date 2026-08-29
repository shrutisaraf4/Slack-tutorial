# Project 01 — Employee Onboarding: Slack App + Azure Function Foundation

> **Purpose:** Build the foundation for an Employee Onboarding integration where Slack sends an interaction to an Azure Function, the Function processes the request, and the integration can later call Microsoft Graph/Azure services.
>
> **Current working state:** The Azure Function App is running, the Slack app is installed, Interactivity is enabled, and the `Create Employee` global shortcut has been created with callback ID `create_employee`.

---

## 1. What we are building

The finished foundation looks like this:

```text
Slack user
   │
   │ clicks "Create Employee"
   ▼
Slack App / Global Shortcut
   │
   │ HTTPS POST
   ▼
Azure Function App
   │
   ├── validate Slack request
   ├── identify callback_id = create_employee
   └── return a response
        │
        ▼
Future: Microsoft Graph / Entra ID / other HR automation
```

### Important distinction

A **Slack global shortcut is not a slash command**.

Do **not** test this by typing:

```text
/shortcut
/create employee
/create_employee
```

Those are slash-command attempts. The shortcut is invoked from Slack's shortcut UI/search, and Slack sends the shortcut's **Callback ID** (`create_employee`) to the Request URL.

---

# 2. Prerequisites

You need:

- A Slack test workspace where you can install an app.
- Permission to create/configure a Slack app.
- An Azure subscription.
- An Azure Function App with an HTTP-triggered function.
- A GitHub repository if GitHub deployment is being used.
- Node.js knowledge for maintaining the Function code.
- Microsoft Graph permissions later in the project, when employee creation is implemented.

---

# 3. Create the Slack application

## Step 3.1 — Create the app

1. Open the Slack API app management page.
2. Choose **Create New App**.
3. Choose **From scratch**.
4. Enter the app name:

```text
Employee Onboarding
```

5. Select the test Slack workspace.
6. Create the app.

### Screenshot — Create the Slack app

<img src="https://github.com/user-attachments/assets/fad29bef-54db-4f01-a719-879655ba1989" alt="Slack app creation" />

<img src="https://github.com/user-attachments/assets/979c7c61-9354-4c25-a8d3-ee85ddb51eb0" alt="Slack app configuration" />

### Checkpoint

You should now be inside the **Employee Onboarding** Slack app configuration page.

---

# 4. Configure the bot and OAuth scopes

## Step 4.1 — Add/configure the bot

Open the bot/app configuration and make sure the application has a bot identity.

<img src="https://github.com/user-attachments/assets/8aad527d-37ba-4c2b-9eca-82a0f2748069" alt="Slack bot configuration" />

## Step 4.2 — Add only the required scopes

Start with the minimum scopes required for the functionality being tested.

Do not grant broad permissions just because they are available.

<img src="https://github.com/user-attachments/assets/cc45943e-ae45-421f-8df0-dec83865f199" alt="Slack OAuth scopes" />

### Security rule

> Treat the Slack bot token as a password. Never place it in source code, screenshots, GitHub commits, or this Markdown file.

---

# 5. Install the Slack app in the workspace

## Step 5.1 — Install the app

1. Open **OAuth & Permissions**.
2. Start the installation flow.
3. Review the permissions.
4. Authorize the app in the test workspace.
5. Store the resulting bot token securely.

<img src="https://github.com/user-attachments/assets/6a234a07-3bac-4973-af6c-4a12061526d0" alt="Slack OAuth installation" />

<img src="https://github.com/user-attachments/assets/f056afac-8c02-4588-9e88-8648d5cded20" alt="Slack authorization" />

<img src="https://github.com/user-attachments/assets/014a0f29-549d-4767-b21b-47f49a6c6018" alt="Slack installed app" />

### Checkpoint

The Employee Onboarding app should now appear under **Apps** in the Slack workspace.

---

# 6. Add the bot to the test channel

Use a dedicated test channel, for example:

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

The bot must be able to access the channel before channel-based API tests will work.

---

# 7. Create the Azure Function App

## Step 7.1 — Open Azure

1. Open the Azure portal.
2. Select **Function App**.
3. Select **Create**.

## Step 7.2 — Use a simple test configuration

For the test environment, use the values appropriate to your subscription/region. The current environment shown in this project is:

| Setting | Current test value |
|---|---|
| Function App | `employee-onboarding` |
| Resource group | `test` |
| Region | `India South Central` |
| Operating system | `Windows` |
| Runtime | `Node.js 22` |
| Plan/SKU | Dynamic / `Y1` |
| Trigger | HTTP |

> **Cost note:** `Y1` is the Consumption plan SKU. Consumption does not mean that every related resource is automatically free. Keep an eye on Cost Management, Application Insights, storage, and any other resources created with the Function App.

### Screenshot — Current Azure Function App

![Azure Function App](Project01-assets/azure-function-overview.png)

The current screenshot confirms the Function App is **Running**, uses **Windows**, and is attached to a `Y1` Dynamic plan.

### Additional Azure creation screenshots

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

---

# 8. Create the HTTP-triggered Function

The Function must have an HTTP endpoint that Slack can call.

A simple structure is:

```text
wwwroot/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```

## Step 8.1 — `package.json`

Create `package.json` at the application root:

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

## Step 8.2 — Use a clean HTTP handler

Use this as the foundation. It deliberately handles Slack URL verification and app mentions without adding employee-creation logic yet.

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

> **Important correction:** The old draft contained an extra closing `};` after the function. Do not keep that extra brace; it can cause a JavaScript syntax error.

---

# 9. Deploy the Function code

If deploying from GitHub:

1. Put the Function files in the repository.
2. Commit the changes.
3. Push to the configured branch.
4. Open **Deployment Center** in Azure.
5. Confirm that the deployment completed successfully.
6. Open the Function and confirm the HTTP trigger is enabled.

<img src="https://github.com/user-attachments/assets/4bb6d153-8935-4895-bfe1-7062f4695c05" alt="Function source files" />

<img src="https://github.com/user-attachments/assets/9db4e536-e1d8-4b8c-9451-231d25b05108" alt="GitHub package file" />

<img src="https://github.com/user-attachments/assets/5a321e3e-d789-40c0-a79f-df2a0d2bb228" alt="GitHub repository" />

<img src="https://github.com/user-attachments/assets/f0b8b45b-acc8-43ad-8a64-8a9f63ec9b4a" alt="GitHub deployment" />

<img src="https://github.com/user-attachments/assets/b27bc559-b57a-4e4f-8ed8-7f66598363e8" alt="Repository files" />

### Checkpoint

The Azure Function must respond successfully before connecting Slack to it.

---

# 10. Test the Azure Function before touching Slack

Open the Function in Azure and use the available test facility or call the HTTP endpoint with an appropriate request.

For a basic health test, the expected response is:

```text
OK
```

For Slack URL verification, the handler must return the exact `challenge` value supplied by Slack.

For an app mention, the expected response is:

```text
Hello! Employee Onboarding Bot is working.
```

### Existing test screenshots

<img src="https://github.com/user-attachments/assets/c4c1fc84-1e27-4f79-8b75-64d5e7025fca" alt="Azure Function test" />

<img src="https://github.com/user-attachments/assets/7dd1618b-1369-4c14-87a4-5d3d6195249d" alt="Function HTTP response" />

<img src="https://github.com/user-attachments/assets/5d620c70-300f-4db2-9241-81faa5e5339f" alt="Function test result" />

<img src="https://github.com/user-attachments/assets/edf174b5-f47c-430c-a172-5feee6f155a7" alt="Slack request test" />

<img src="https://github.com/user-attachments/assets/0b3ac6cf-9704-4c05-af25-489e3b9ec82f" alt="Slack bot test" />

<img src="https://github.com/user-attachments/assets/4406afaa-ca34-4f88-9cc0-9ab56c025d5b" alt="Successful Slack bot response" />

---

# 11. Configure Slack Interactivity

This is the key connection between Slack and Azure.

## Step 11.1 — Open Slack app configuration

Open the **Employee Onboarding** Slack app in the Slack API configuration portal.

Select:

**Features → Interactivity & Shortcuts**

## Step 11.2 — Enable Interactivity

Set **Interactivity** to **On**.

## Step 11.3 — Enter the Azure Function Request URL

Use the public HTTPS URL of the HTTP-triggered Azure Function.

The format is similar to:

```text
https://<function-app-name>.<azure-region-domain>/api/<function-name>
```

Do not copy a URL blindly from this document. Use the URL shown by **Get function URL** for your actual Function.

### Screenshot — Current working Interactivity configuration

![Slack Interactivity and Shortcuts](Project01-assets/slack-interactivity-shortcuts.png)

The screenshot shows:

- Interactivity = **On**
- Request URL = the Azure Function endpoint
- Shortcut = **Create Employee**
- Location = **Global**
- Callback ID = `create_employee`

### Checkpoint

At this point Slack knows where to send interactive requests.

---

# 12. Create the `Create Employee` global shortcut

## Step 12.1 — Start a new shortcut

On **Interactivity & Shortcuts**:

1. Scroll to **Shortcuts**.
2. Click **Create New Shortcut**.
3. Select **Global**.
4. Continue to the shortcut details page.

![Create a shortcut](Project01-assets/create-shortcut.png)

## Step 12.2 — Enter these values exactly

| Field | Value |
|---|---|
| **Name** | `Create Employee` |
| **Short Description** | `Create a new employee onboarding request` |
| **Callback ID** | `create_employee` |
| **Location** | `Global` |

Then click **Create**.

### Why the Callback ID matters

The user sees:

```text
Create Employee
```

Slack internally uses:

```text
create_employee
```

Your Azure Function should use the callback ID to determine which action was requested.

---

# 13. The most important testing correction

## Do NOT type `/shortcut`

This is where the previous test went wrong.

Typing:

```text
/shortcut
```

or:

```text
/create employee
```

asks Slack to interpret the text as a **slash command**. That is a different Slack feature.

Your `Create Employee` object is a **global shortcut**.

### Current test showing the problem

![Slack slash-command test](Project01-assets/slack-test-and-command-mistake.png)

The Slack response correctly says that `/create` is not a valid command. This does **not** mean the global shortcut is broken.

---

# 14. How to invoke the global shortcut correctly

Slack's shortcut UI can vary slightly by client/version. The important rule is: **invoke the named shortcut from Slack's shortcut interface, not by typing its callback ID or using `/create`.**

Use the shortcut menu/search available in your Slack client and select:

```text
Create Employee
```

You should then see the shortcut's interaction reach the Azure Function.

### If you do not see `Create Employee`

Check these items in order:

1. Confirm the shortcut exists under **Interactivity & Shortcuts → Shortcuts**.
2. Confirm its location is **Global**.
3. Confirm the callback ID is exactly:

```text
create_employee
```

4. Confirm Interactivity is **On**.
5. Confirm the Request URL is the current Azure Function URL.
6. Confirm the Slack app is installed in the workspace you are testing.
7. If the Slack app was reinstalled after changing scopes/settings, reinstall it and retest.
8. Refresh/reopen Slack if the shortcut was just created.

---

# 15. Expected end-to-end test

When the shortcut is invoked:

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
"Create Employee shortcut received."
```

For troubleshooting, temporarily log the incoming request body **without logging secrets or tokens**.

A shortcut request should contain enough information for the Function to identify the interaction and the user/workspace context.

---

# 16. Register/configure the application for future Microsoft Graph work

The current foundation can later be extended to create or manage employee identities through Microsoft Graph.

The original project included these dependencies:

```json
{
  "@azure/identity": "^4.12.0",
  "@microsoft/microsoft-graph-client": "^3.0.7",
  "isomorphic-fetch": "^3.0.0"
}
```

Do not request Graph permissions until the exact operation is known. Use least privilege.

### Existing Azure / application configuration screenshots

<img src="https://github.com/user-attachments/assets/20e16922-abb7-4d72-8380-f530904d8518" alt="Azure application registration" />

<img src="https://github.com/user-attachments/assets/2de30aac-42cc-4e97-a7b3-3124193c5f1e" alt="Azure application configuration" />

<img src="https://github.com/user-attachments/assets/69220c3a-b4e9-4f55-b4a2-1dd6bfb523f3" alt="Azure identity configuration" />

<img src="https://github.com/user-attachments/assets/2311e45f-83b6-4639-913c-089a07c78cfa" alt="Azure permissions" />

<img src="https://github.com/user-attachments/assets/eb90bbc8-f298-4555-9681-233b9f2352c6" alt="Azure application settings" />

---

# 17. GitHub deployment structure

The repository should contain a predictable structure.

```text
repository-root/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```

Create/update `package.json` in the main branch as required by your deployment setup.

<img src="https://github.com/user-attachments/assets/3bc67482-bc20-4797-b8f6-53a79dadee15" alt="GitHub package json" />

<img src="https://github.com/user-attachments/assets/38305c7e-5a65-4fdc-bab2-08e9e4f5b414" alt="GitHub repository branch" />

<img src="https://github.com/user-attachments/assets/63a54e82-3517-4477-ae28-39ae0eca3e93" alt="GitHub source" />

<img src="https://github.com/user-attachments/assets/bb39c108-f3cc-4815-98d3-b1fea9e10851" alt="GitHub commit" />

<img src="https://github.com/user-attachments/assets/d570baf5-ad82-47ef-aced-dc9b21b94ad9" alt="GitHub deployment status" />

---

# 18. Security checklist

Before moving beyond the proof of concept:

- [ ] Never commit Slack tokens to GitHub.
- [ ] Store secrets in Azure application settings, Key Vault, or another approved secret store.
- [ ] Use least-privilege Slack scopes.
- [ ] Use least-privilege Microsoft Graph permissions.
- [ ] Do not log access tokens or sensitive employee information.
- [ ] Rotate/revoke credentials if they are exposed.
- [ ] Separate development and production credentials.
- [ ] Validate Slack requests before processing sensitive actions.
- [ ] Add authentication/verification appropriate for the production architecture.
- [ ] Configure monitoring and cost alerts.

---

# 19. Troubleshooting matrix

| Symptom | Likely cause | First check |
|---|---|---|
| `invalid_auth` | Slack token problem | OAuth token / installation |
| `missing_scope` | Missing Slack permission | OAuth scopes |
| `channel_not_found` | Wrong/inaccessible channel | Channel ID and bot membership |
| `not_in_channel` | Bot not in channel | Invite the bot |
| HTTP `429` | Rate limiting | Retry/backoff |
| Slack says `/create` is invalid | Slash command was used | Use the global shortcut UI |
| Shortcut not visible | App/shortcut configuration not refreshed | Check Global shortcut + reinstall/refresh |
| Slack interaction does not reach Azure | Wrong Request URL | Interactivity & Shortcuts URL |
| Azure returns 500 | Function code/deployment error | Function logs and deployed files |
| URL verification fails | Handler does not return `challenge` | Check `url_verification` branch |

---

# 20. Final validation checklist

Do not move to employee creation until every item below passes.

### Slack

- [ ] Slack app exists.
- [ ] Bot is installed.
- [ ] Required scopes are configured.
- [ ] Bot can access `#employee-onboarding`.
- [ ] Interactivity is **On**.
- [ ] Request URL points to the Azure HTTP Function.
- [ ] Global shortcut **Create Employee** exists.
- [ ] Callback ID is `create_employee`.

### Azure

- [ ] Function App is running.
- [ ] HTTP-triggered Function exists.
- [ ] Deployment succeeded.
- [ ] Function URL is reachable.
- [ ] URL verification handler returns the Slack challenge.
- [ ] Basic test returns `OK`.
- [ ] Shortcut request is handled by the Function.

### Test result

The first successful test should prove only this:

```text
Create Employee shortcut
        ↓
Slack sends request
        ↓
Azure Function receives request
        ↓
Function identifies create_employee
        ↓
Function returns success
```

**Only after this works should we add the employee form, Microsoft Graph calls, Entra ID operations, validation, approvals, and production security.**

---

# 21. Next project phase

The next phase should be designed separately from this foundation:

1. Open a Slack modal when **Create Employee** is selected.
2. Collect employee information in the modal.
3. Validate the form.
4. Submit the data back to Azure.
5. Authenticate to Microsoft Graph securely.
6. Create the employee account according to the organization's requirements.
7. Return a clear success/failure message to Slack.
8. Add audit logging and production-grade security.

This separation keeps the current POC easy to troubleshoot and prevents us from debugging Slack, Azure, and Microsoft Graph simultaneously.

---

## Appendix A — Shortcut values to copy

```text
Name:
Create Employee

Short Description:
Create a new employee onboarding request

Callback ID:
create_employee

Location:
Global
```

## Appendix B — Current project screenshots

The self-contained package accompanying this Markdown contains the current screenshots used for the most important troubleshooting/configuration steps under `Project01-assets/`.
