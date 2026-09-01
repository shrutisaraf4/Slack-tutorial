# Employee Onboarding Bot — Slack → Azure Function → Microsoft Entra ID

A step-by-step record of how I built and manually tested the foundation of a Slack-based employee onboarding bot. Every step below — Slack app setup, Azure Function deployment, App Registration, and Microsoft Graph permissions — was configured and tested by hand before being marked "working." Screenshots are direct evidence from that manual testing, not simulated.

**Elevator pitch:** HR/IT clicks a shortcut in Slack, fills out a short form, and the bot creates the new hire's account in Microsoft Entra ID — no one has to open the Azure Portal.

---

## Table of Contents

1. [What this project does](#1-what-this-project-does)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Step-by-step: Build the Slack app](#4-step-by-step-build-the-slack-app)
5. [Step-by-step: Build the Azure Function](#5-step-by-step-build-the-azure-function)
6. [Step-by-step: Connect Slack to Azure](#6-step-by-step-connect-slack-to-azure)
7. [Step-by-step: Create the global shortcut](#7-step-by-step-create-the-global-shortcut)
8. [How to test it end to end](#8-how-to-test-it-end-to-end)
9. [Mistakes I made and fixed](#9-mistakes-i-made-and-fixed)
10. [Prepare for Microsoft Graph (next phase)](#10-prepare-for-microsoft-graph-next-phase)
11. [GitHub deployment structure](#11-github-deployment-structure)
12. [Security checklist](#12-security-checklist)
13. [Troubleshooting matrix](#13-troubleshooting-matrix)
14. [Final validation checklist](#14-final-validation-checklist)
15. [What's next](#15-whats-next)
16. [Appendix — exact values used](#16-appendix--exact-values-used)

---

## 1. What this project does

| Capability | How you trigger it in Slack | Status |
|---|---|---|
| Create a new employee | Global shortcut → **Create Employee** → fill the modal → **Create User** | ✅ Working |
| Confirmation posted to channel | Automatic, right after a successful create | ✅ Working |
| Look up an existing user's status/details | `@employee onboarding status <name or email>` | ⚠️ In progress |

**End-to-end flow once fully built:**

1. A user runs the **Create Employee** shortcut in Slack.
2. Slack opens the **New Employee Onboarding** modal and collects: Full Name, Email/UPN, Employee Number, Company, Phone, Country.
3. On submit, Slack sends a `view_submission` payload to the Azure Function.
4. The Function authenticates to Microsoft Graph using `ClientSecretCredential` (App Registration).
5. It checks whether the email already exists in Entra ID.
6. If not, it calls `POST /users` to create the account (temporary password, forced reset on first sign-in).
7. The Function posts a success/failure message to `#employee-onboarding` via `chat.postMessage`.
8. Separately, `@employee onboarding status <term>` should query `GET /users` and reply with the matched user's details.

## 2. Architecture

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

## 3. Prerequisites

- A Slack test workspace where I could create and install an app.
- Permission to create/configure a Slack app.
- An Azure subscription.
- An Azure Function App with an HTTP-triggered function.
- A GitHub repository for the Function's code (deployed via Deployment Center).
- Basic Node.js knowledge to write/maintain the Function code.
- Microsoft Graph permissions (added later, once employee creation was implemented).
- Postman or curl, for testing the Function directly.

---

## 4. Step-by-step: Build the Slack app

### Step 4.1 — Create the app

1. Opened the Slack API app management page.
2. Chose **Create New App → From scratch**.
3. Named it `Employee Onboarding`.
4. Selected my test Slack workspace.
5. Created the app.

<img src="https://github.com/user-attachments/assets/fad29bef-54db-4f01-a719-879655ba1989" alt="Slack app creation" width="600"/>
<img src="https://github.com/user-attachments/assets/979c7c61-9354-4c25-a8d3-ee85ddb51eb0" alt="Slack app configuration" width="600"/>

**Checkpoint:** Landed inside the **Employee Onboarding** app's configuration page.

### Step 4.2 — Give the app a bot identity

Opened the bot/app configuration and confirmed the app has a bot user.

<img src="https://github.com/user-attachments/assets/8aad527d-37ba-4c2b-9eca-82a0f2748069" alt="Slack bot configuration" width="600"/>

### Step 4.3 — Add only the OAuth scopes I actually needed

Started with the minimum scopes required for the functionality under test rather than granting broad access "just in case."

<img src="https://github.com/user-attachments/assets/cc45943e-ae45-421f-8df0-dec83865f199" alt="Slack OAuth scopes" width="600"/>

> **Security rule I followed:** treat the Slack bot token like a password — never in source code, screenshots, GitHub commits, or this README.

### Step 4.4 — Install the app to the workspace

1. Opened **OAuth & Permissions**.
2. Started the installation flow.
3. Reviewed the requested permissions.
4. Authorized the app in the test workspace.
5. Stored the resulting bot token securely (Azure app settings, not in code).

<img src="https://github.com/user-attachments/assets/6a234a07-3bac-4973-af6c-4a12061526d0" alt="Slack OAuth installation" width="600"/>
<img src="https://github.com/user-attachments/assets/f056afac-8c02-4588-9e88-8648d5cded20" alt="Slack authorization" width="600"/>
<img src="https://github.com/user-attachments/assets/014a0f29-549d-4767-b21b-47f49a6c6018" alt="Slack installed app" width="600"/>

**Checkpoint:** The **Employee Onboarding** app now shows under **Apps** in the workspace.

### Step 4.5 — Add the bot to the test channel

Created a dedicated test channel, `#employee-onboarding`, and invited the bot into it.

<img src="https://github.com/user-attachments/assets/7759fc31-3e14-40ae-b090-945b77794d28" alt="Invite Slack bot" width="600"/>
<img src="https://github.com/user-attachments/assets/8e07cdc1-d6f7-467c-8e95-988fb9af22b5" alt="Slack channel bot access" width="600"/>
<img src="https://github.com/user-attachments/assets/c8fdaf90-1e79-4ffe-aced-2d92e9110c9f" alt="Slack bot in channel" width="600"/>
<img src="https://github.com/user-attachments/assets/4a4b5374-6a0c-416f-86fa-83ef92839e93" alt="Slack channel configuration" width="600"/>
<img src="https://github.com/user-attachments/assets/1d6cc685-64dd-4e28-ae43-3b9938f3971d" alt="Slack channel access confirmation" width="600"/>

**Checkpoint:** The bot can access the channel — required before any channel-based API test will work.

---

## 5. Step-by-step: Build the Azure Function

### Step 5.1 — Create the Function App in Azure

1. Opened the Azure Portal.
2. Selected **Function App → Create**.
3. Used a simple test configuration:

| Setting | Value used |
|---|---|
| Function App name | `employee-onboarding` |
| Resource group | `test` |
| Region | `India South Central` |
| Operating system | `Windows` |
| Runtime | `Node.js 22` |
| Plan/SKU | Dynamic (`Y1`, Consumption) |
| Trigger | HTTP |

> **Cost note:** Consumption (`Y1`) doesn't mean every attached resource is free — I kept an eye on Cost Management, Application Insights, and storage.

<img src="https://github.com/user-attachments/assets/eb6305a3-1a07-469a-bbcf-82746f7e642e" alt="Azure Function App creation" width="600"/>
<img src="https://github.com/user-attachments/assets/d997d7ee-13aa-4c19-bd47-0653fbb88ad6" alt="Azure Function configuration" width="600"/>
<img src="https://github.com/user-attachments/assets/338e25d5-d824-4c88-aaaf-676e0fd3b822" alt="Azure Function settings" width="600"/>
<img src="https://github.com/user-attachments/assets/27d45a50-6a4d-43b2-be68-4a1e14e8056a" alt="Azure Function review" width="600"/>
<img src="https://github.com/user-attachments/assets/66585853-6f39-4aa6-8875-cd4f814ea7d9" alt="Azure Function deployment" width="600"/>
<img src="https://github.com/user-attachments/assets/c656f133-1c23-48be-a80d-ee84a3f3f293" alt="Azure Function resource" width="600"/>
<img src="https://github.com/user-attachments/assets/6d1fb678-0ac2-46fb-9f6a-2eaab0687579" alt="Azure Function app details" width="600"/>
<img src="https://github.com/user-attachments/assets/7bd69632-c5a4-45b8-bfc2-68dc3ea17f03" alt="Azure Function app configuration" width="600"/>
<img src="https://github.com/user-attachments/assets/2da2d672-4b06-4987-87bc-e824941176e7" alt="Azure Function deployment result" width="600"/>
<img src="https://github.com/user-attachments/assets/a0c53016-0da9-42da-b630-0a0c6c1f9451" alt="Azure Function app" width="600"/>
<img src="https://github.com/user-attachments/assets/eb0bc3fb-6783-4d2f-9881-7189ca355391" alt="Azure Function final configuration" width="600"/>

Once created, the Overview page confirms the Function App is **Running**, on **Windows**, on a `Y1` Dynamic plan.

### Step 5.2 — Write the HTTP-triggered Function

Project layout:

```text
wwwroot/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```

`package.json` (application root):

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

`index.js` — a clean handler that deals with Slack's URL verification and app mentions, without employee-creation logic yet (that comes in the next phase):

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

### Step 5.3 — Deploy the code

1. Put the Function files into the GitHub repository.
2. Committed the changes.
3. Pushed to the configured branch.
4. Opened **Deployment Center** in Azure and confirmed the deployment completed.
5. Opened the Function and confirmed the HTTP trigger was enabled.

<img src="https://github.com/user-attachments/assets/4bb6d153-8935-4895-bfe1-7062f4695c05" alt="Function source files" width="600"/>
<img src="https://github.com/user-attachments/assets/9db4e536-e1d8-4b8c-9451-231d25b05108" alt="GitHub package file" width="600"/>
<img src="https://github.com/user-attachments/assets/5a321e3e-d789-40c0-a79f-df2a0d2bb228" alt="GitHub repository" width="600"/>
<img src="https://github.com/user-attachments/assets/f0b8b45b-acc8-43ad-8a64-8a9f63ec9b4a" alt="GitHub deployment" width="600"/>
<img src="https://github.com/user-attachments/assets/b27bc559-b57a-4e4f-8ed8-7f66598363e8" alt="Repository files" width="600"/>

**Checkpoint:** The Function must respond correctly before wiring Slack to it.

### Step 5.4 — Test the Function on its own, before touching Slack

Used the Azure portal's built-in test facility (and Postman/curl) to call the HTTP endpoint directly.

| Test | Expected response |
|---|---|
| Basic health check | `OK` |
| Slack URL verification payload | Exact `challenge` value echoed back |
| Simulated app mention | `Hello! Employee Onboarding Bot is working.` |

<img src="https://github.com/user-attachments/assets/c4c1fc84-1e27-4f79-8b75-64d5e7025fca" alt="Azure Function test" width="600"/>
<img src="https://github.com/user-attachments/assets/7dd1618b-1369-4c14-87a4-5d3d6195249d" alt="Function HTTP response" width="600"/>
<img src="https://github.com/user-attachments/assets/5d620c70-300f-4db2-9241-81faa5e5339f" alt="Function test result" width="600"/>
<img src="https://github.com/user-attachments/assets/edf174b5-f47c-430c-a172-5feee6f155a7" alt="Slack request test" width="600"/>
<img src="https://github.com/user-attachments/assets/0b3ac6cf-9704-4c05-af25-489e3b9ec82f" alt="Slack bot test" width="600"/>
<img src="https://github.com/user-attachments/assets/4406afaa-ca34-4f88-9cc0-9ab56c025d5b" alt="Successful Slack bot response" width="600"/>

---

## 6. Step-by-step: Connect Slack to Azure

### Step 6.1 — Open Interactivity & Shortcuts

In the Slack app configuration portal: **Features → Interactivity & Shortcuts**.

### Step 6.2 — Turn Interactivity On

Set **Interactivity** to **On**.

### Step 6.3 — Point the Request URL at the Function

Used the actual URL from **Get function URL** in Azure (never copy one blindly from documentation):

```text
https://<function-app-name>.<azure-region-domain>/api/<function-name>
```

![Slack Interactivity and Shortcuts](Project01-assets/slack-interactivity-shortcuts.png)

This screenshot confirms:
- Interactivity = **On**
- Request URL = the Azure Function endpoint
- Shortcut = **Create Employee**
- Location = **Global**
- Callback ID = `create_employee`

**Checkpoint:** Slack now knows where to send interactive requests.

---

## 7. Step-by-step: Create the global shortcut

### Step 7.1 — Start a new shortcut

On **Interactivity & Shortcuts**:

1. Scrolled to **Shortcuts**.
2. Clicked **Create New Shortcut**.
3. Selected **Global**.
4. Continued to the shortcut details page.

![Create a shortcut](Project01-assets/create-shortcut.png)

### Step 7.2 — Enter the shortcut details exactly

| Field | Value |
|---|---|
| **Name** | `Create Employee` |
| **Short Description** | `Create a new employee onboarding request` |
| **Callback ID** | `create_employee` |
| **Location** | `Global` |

Clicked **Create**.

**Why the callback ID matters:** the user sees `Create Employee` in the shortcut menu, but Slack internally sends `create_employee` as the `callback_id` — that's what the Azure Function checks to decide which action was requested.

---

## 8. How to test it end to end

### The one rule that matters: use the shortcut menu, not the slash-command box

Slack's shortcut UI can vary slightly by client/version, but the shortcut must be **invoked from Slack's shortcut menu/search**, selecting:

```text
Create Employee
```

**Do NOT type** `/shortcut`, `/create employee`, or similar into the message box — that asks Slack to interpret the text as a slash command, which is a completely different Slack feature and will fail.

### If "Create Employee" doesn't show up, check in this order:

1. Shortcut exists under **Interactivity & Shortcuts → Shortcuts**.
2. Its location is **Global**.
3. Callback ID is exactly `create_employee`.
4. Interactivity is **On**.
5. Request URL is the current Azure Function URL.
6. The Slack app is installed in the workspace being tested.
7. If scopes/settings changed since install, reinstall the app and retest.
8. Refresh/reopen Slack if the shortcut was just created.

### Expected successful flow

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

For troubleshooting, I temporarily logged the incoming request body **without logging secrets or tokens** — a shortcut request carries enough context to identify the interaction and the user/workspace.

---

## 9. Mistakes I made and fixed

| Mistake | Symptom | Fix |
|---|---|---|
| Typed `/create employee` into the Slack message box | Slack replied that `/create` is not a valid command | Realized shortcuts are triggered from the shortcut menu, not typed as slash commands — invoked **Create Employee** from the shortcut UI instead |
| Left an extra closing `};` after the function in an early draft | JavaScript syntax error on deploy | Removed the stray brace so the module exports a single async function |

<img src="Project01-assets/slack-test-and-command-mistake.png" alt="Slack slash-command test" width="600"/>

The response correctly says `/create` isn't a valid command — that does **not** mean the global shortcut itself is broken, just that it was invoked the wrong way.

---

## 10. Prepare for Microsoft Graph (next phase)

The current foundation is built so it can later create/manage employee identities through Microsoft Graph. I have not requested Graph permissions yet — only added them once the exact operation was known, to keep to least privilege.

Dependencies already included for this future work:

```json
{
  "@azure/identity": "^4.12.0",
  "@microsoft/microsoft-graph-client": "^3.0.7",
  "isomorphic-fetch": "^3.0.0"
}
```

### App Registration screenshots (existing setup)

<img src="https://github.com/user-attachments/assets/20e16922-abb7-4d72-8380-f530904d8518" alt="Azure application registration" width="600"/>
<img src="https://github.com/user-attachments/assets/2de30aac-42cc-4e97-a7b3-3124193c5f1e" alt="Azure application configuration" width="600"/>
<img src="https://github.com/user-attachments/assets/69220c3a-b4e9-4f55-b4a2-1dd6bfb523f3" alt="Azure identity configuration" width="600"/>
<img src="https://github.com/user-attachments/assets/2311e45f-83b6-4639-913c-089a07c78cfa" alt="Azure permissions" width="600"/>
<img src="https://github.com/user-attachments/assets/eb90bbc8-f298-4555-9681-233b9f2352c6" alt="Azure application settings" width="600"/>

---

## 11. GitHub deployment structure

```text
repository-root/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```

<img src="https://github.com/user-attachments/assets/3bc67482-bc20-4797-b8f6-53a79dadee15" alt="GitHub package json" width="600"/>
<img src="https://github.com/user-attachments/assets/38305c7e-5a65-4fdc-bab2-08e9e4f5b414" alt="GitHub repository branch" width="600"/>
<img src="https://github.com/user-attachments/assets/63a54e82-3517-4477-ae28-39ae0eca3e93" alt="GitHub source" width="600"/>
<img src="https://github.com/user-attachments/assets/bb39c108-f3cc-4815-98d3-b1fea9e10851" alt="GitHub commit" width="600"/>
<img src="https://github.com/user-attachments/assets/d570baf5-ad82-47ef-aced-dc9b21b94ad9" alt="GitHub deployment status" width="600"/>

---

## 12. Security checklist

- [x] Never commit Slack tokens to GitHub.
- [x] Store secrets in Azure application settings, Key Vault, or another approved secret store.
- [x] Use least-privilege Slack scopes.
- [ ] Use least-privilege Microsoft Graph permissions (pending — added once the operation is known).
- [x] Do not log access tokens or sensitive employee information.
- [ ] Rotate/revoke credentials if exposed.
- [ ] Separate development and production credentials.
- [ ] Validate Slack requests before processing sensitive actions (e.g. signing-secret verification).
- [ ] Add authentication/verification appropriate for production architecture.
- [ ] Configure monitoring and cost alerts.

---

## 13. Troubleshooting matrix

| Symptom | Likely cause | First check |
|---|---|---|
| `invalid_auth` | Slack token problem | OAuth token / installation |
| `missing_scope` | Missing Slack permission | OAuth scopes |
| `channel_not_found` | Wrong/inaccessible channel | Channel ID and bot membership |
| `not_in_channel` | Bot not in channel | Invite the bot |
| HTTP `429` | Rate limiting | Retry/backoff |
| Slack says `/create` is invalid | Slash command was used instead of the shortcut | Use the global shortcut UI |
| Shortcut not visible | App/shortcut configuration not refreshed | Check Global shortcut + reinstall/refresh |
| Slack interaction does not reach Azure | Wrong Request URL | Interactivity & Shortcuts URL |
| Azure returns 500 | Function code/deployment error | Function logs and deployed files |
| URL verification fails | Handler does not return `challenge` | Check `url_verification` branch |

---

## 14. Final validation checklist

**Slack**
- [x] Slack app exists.
- [x] Bot is installed.
- [x] Required scopes are configured.
- [x] Bot can access `#employee-onboarding`.
- [x] Interactivity is **On**.
- [x] Request URL points to the Azure HTTP Function.
- [x] Global shortcut **Create Employee** exists.
- [x] Callback ID is `create_employee`.

**Azure**
- [x] Function App is running.
- [x] HTTP-triggered Function exists.
- [x] Deployment succeeded.
- [x] Function URL is reachable.
- [x] URL verification handler returns the Slack challenge.
- [x] Basic test returns `OK`.
- [x] Shortcut request is handled by the Function.

**What this proves so far:**

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

Employee creation, Microsoft Graph calls, Entra ID operations, validation, and approvals are all intentionally deferred until this foundation is proven solid — so I'm not debugging Slack, Azure, and Graph all at once.

---

## 15. What's next

This is the plan for the next project phase, kept deliberately separate from the current proof of concept:

1. Open a Slack modal when **Create Employee** is selected.
2. Collect employee information in the modal (Full Name, Email/UPN, Employee Number, Company, Phone, Country).
3. Validate the form.
4. Submit the data back to Azure.
5. Authenticate to Microsoft Graph securely (`ClientSecretCredential`).
6. Create the employee account in Entra ID (temporary password, forced reset).
7. Check group membership / Microsoft 365 licenses, and assign them (`/users/{id}/memberOf`, `/users/{id}/assignLicense`).
8. Implement the `@employee onboarding status <name or email>` lookup via `GET /users`.
9. Return a clear success/failure message to Slack.
10. Add audit logging and production-grade security (Slack signing-secret verification, Key Vault-backed secrets, separate dev/prod credentials).

---

## Appendix — exact values used

**Shortcut configuration**

```text
Name: Create Employee
Short Description: Create a new employee onboarding request
Callback ID: create_employee
Location: Global
```

**Azure Function App test settings**

```text
Function App: employee-onboarding
Resource group: test
Region: India South Central
Operating system: Windows
Runtime: Node.js 22
Plan/SKU: Dynamic (Y1)
Trigger: HTTP
```

Additional current-state screenshots referenced above are stored under `Project01-assets/` alongside this file.



---
 
# 17. Phase 2 — Full interactive bot: status lookup, group membership, licenses
 
**Goal of this phase:** turn the bot from "create user + say OK" into a fully interactive admin tool that can also (a) reliably return an existing user's status/details, (b) add a user to a Microsoft 365 or Security group, and (c) assign a Microsoft 365 license — all from Slack, with clear success/failure feedback.
 
## Phase 2.1 — Expand Microsoft Graph permissions
 
The Phase 1 App Registration only needed enough to create users. This phase needs more.
 
### Step 17.1.1 — Open the App Registration
 
1. Azure Portal → **Microsoft Entra ID → App registrations**.
2. Open the registration used by the Function (`ClientSecretCredential`).
3. Go to **API permissions**.
### Step 17.1.2 — Add these Application permissions (admin consent required)
 
| Permission | Why it's needed |
|---|---|
| `User.ReadWrite.All` | Create users, read user profile for status lookup |
| `Group.ReadWrite.All` | Add/remove members from Security and Microsoft 365 groups |
| `Directory.Read.All` | Resolve group display names / search directory objects |
| `Organization.Read.All` | Read `subscribedSkus` to know which licenses exist and how many are free |
 
> **Least privilege note:** only add a permission once the specific Graph call that needs it is implemented — don't pre-grant the whole list on day one. Add each one right before you build the feature that uses it, then click **Grant admin consent** for the tenant.
 
### Screenshot placeholder
 
`[ ] Screenshot — API permissions page showing the four permissions above, admin consent granted]`
 
---
 
## Phase 2.2 — Make the status lookup robust
 
### Step 17.2.1 — Design the Graph query
 
Given a name or email typed after `@employee onboarding status`, search Entra ID with a Graph `$filter` / `$search`:
 
```javascript
const { Client } = require("@microsoft/microsoft-graph-client");
 
async function findUser(graphClient, term) {
  const isEmail = term.includes("@");
  const filter = isEmail
    ? `mail eq '${term}' or userPrincipalName eq '${term}'`
    : `startswith(displayName,'${term}')`;
 
  const result = await graphClient
    .api("/users")
    .filter(filter)
    .select("id,displayName,mail,userPrincipalName,accountEnabled,jobTitle,department,companyName")
    .get();
 
  return result.value; // array — could be 0, 1, or several matches
}
```
 
### Step 17.2.2 — Handle the three outcomes
 
| Result | Slack reply |
|---|---|
| 0 matches | "No user found matching `<term>`." |
| 1 match | A formatted card: name, email, department, company, enabled/disabled status |
| 2+ matches | List all matches (name + email) and ask the requester to be more specific |
 
### Step 17.2.3 — Wire it into the Function's `app_mention` branch
 
```javascript
if (req.body?.event?.type === "app_mention") {
  const text = req.body.event.text || "";
  const match = text.match(/status\s+(.+)/i);
  if (match) {
    const term = match[1].trim();
    const users = await findUser(graphClient, term);
    const message = formatStatusReply(users, term); // build Block Kit or plain text
    await postToSlack(req.body.event.channel, message);
  }
  context.res = { status: 200, body: "" };
  return;
}
```
 
### Screenshot placeholders
 
`[ ] Screenshot — Slack message: @employee onboarding status <email> returning a single matched user]`
`[ ] Screenshot — Slack message: status query with no match]`
`[ ] Screenshot — Slack message: status query with multiple matches]`
 
---
 
## Phase 2.3 — Add "Add to Group" as a bot action
 
### Step 17.3.1 — Extend the onboarding modal
 
Add a **multi-select** block to the `Create Employee` modal (or a separate `Add to Group` shortcut) listing the target groups. Two realistic options:
 
- **Static list** — hardcode the handful of groups HR actually uses (fastest to ship).
- **Dynamic list** — call `GET /groups?$filter=...` at modal-open time and populate the multi-select from real group names.
```javascript
// Dynamic option list example
const groups = await graphClient
  .api("/groups")
  .select("id,displayName,groupTypes,securityEnabled")
  .get();
 
const options = groups.value.map(g => ({
  text: { type: "plain_text", text: g.displayName },
  value: g.id
}));
```
 
### Step 17.3.2 — Add the member via Graph
 
```javascript
async function addUserToGroup(graphClient, userId, groupId) {
  await graphClient.api(`/groups/${groupId}/members/$ref`).post({
    "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
  });
}
```
 
This same call works for **both** Security groups and Microsoft 365 groups — Graph doesn't distinguish at the membership-add endpoint; the group's own `groupTypes` field is what makes it "Microsoft 365" vs. plain Security.
 
### Step 17.3.3 — Handle the response
 
- `204 No Content` → success → post confirmation to `#employee-onboarding`.
- `400`/`404` → group or user not found → post a clear error, don't fail silently.
- Already a member → Graph returns a specific error code; treat as a soft success ("already in that group") rather than a hard failure.
### Screenshot placeholders
 
`[ ] Screenshot — modal with the group multi-select added]`
`[ ] Screenshot — Slack confirmation after successfully adding a user to a group]`
`[ ] Screenshot — Azure Function log showing the /groups/{id}/members/$ref call succeeding]`
 
---
 
## Phase 2.4 — Add license assignment
 
### Step 17.4.1 — Find out which licenses (SKUs) exist in the tenant
 
```javascript
async function listAvailableLicenses(graphClient) {
  const skus = await graphClient.api("/subscribedSkus").get();
  return skus.value.map(s => ({
    skuId: s.skuId,
    skuPartNumber: s.skuPartNumber,
    available: s.prepaidUnits.enabled - s.consumedUnits
  }));
}
```
 
Use this to populate a **license** dropdown in the modal, and to warn if a SKU has 0 seats left before attempting the assignment.
 
### Step 17.4.2 — Assign the license
 
```javascript
async function assignLicense(graphClient, userId, skuId) {
  await graphClient.api(`/users/${userId}/assignLicense`).post({
    addLicenses: [{ skuId, disabledPlans: [] }],
    removeLicenses: []
  });
}
```
 
> **Prerequisite Graph rule:** the user must already have a `usageLocation` set (e.g. `"US"`, `"IN"`) before a license can be assigned — set this when the user is created in Phase 1's `POST /users` call, or the license assignment will fail with a clear Graph error.
 
### Step 17.4.3 — Handle the response
 
- Success → confirm in Slack which license was applied.
- `usageLocation` missing → catch that specific Graph error and tell the requester to set the user's country first.
- No seats available → check `available` from Step 17.4.1 before calling, and short-circuit with a friendly Slack message instead of letting Graph reject it.
### Screenshot placeholders
 
`[ ] Screenshot — modal with the license dropdown added]`
`[ ] Screenshot — Slack confirmation after a license is successfully assigned]`
`[ ] Screenshot — subscribedSkus response in Postman/Graph Explorer showing available seat counts]`
 
---
 
## Phase 2.5 — Make the whole bot properly "interactive"
 
This is what turns three separate features into one coherent bot.
 
### Step 17.5.1 — Route on `callback_id`, not just presence of a payload
 
The Function should branch cleanly on the interaction type and callback ID:
 
```javascript
const payload = req.body.payload ? JSON.parse(req.body.payload) : req.body;
 
switch (payload.callback_id || payload.view?.callback_id) {
  case "create_employee":
    return handleCreateEmployee(payload, context);
  case "add_to_group":
    return handleAddToGroup(payload, context);
  case "assign_license":
    return handleAssignLicense(payload, context);
  default:
    context.res = { status: 200, body: "" };
}
```
 
### Step 17.5.2 — Give immediate feedback, then follow up
 
Slack expects an HTTP response within 3 seconds. For anything that calls Graph (which can be slower):
 
1. Immediately return `200` with an empty body (or an ephemeral "Working on it…" message).
2. Do the Graph work asynchronously.
3. Post the real result back using `chat.postMessage` (channel) or `response_url` (ephemeral, tied to the original interaction).
### Step 17.5.3 — Use Block Kit for readable confirmations
 
Instead of plain text, format success/failure messages as Block Kit sections — name, email, action taken, and a colored indicator (✅/❌) — so the channel stays scannable as more onboarding events come through.
 
### Step 17.5.4 — Verify every incoming Slack request
 
Add Slack's signing-secret verification (HMAC over the raw body + timestamp) at the top of the Function, before any payload is trusted — this was deferred in Phase 1 and should not ship past this phase.
 
### Step 17.5.5 — Centralize error handling and logging
 
Wrap every Graph call in a try/catch that logs the Graph error code (not the token) and always posts *something* back to Slack — a silent failure is worse than a visible one.
 
### Screenshot placeholders
 
`[ ] Screenshot — Function code showing the callback_id switch/router]`
`[ ] Screenshot — Slack message using Block Kit formatting for a confirmation]`
`[ ] Screenshot — Function app settings showing SLACK_SIGNING_SECRET stored securely]`
 
---
 
## Phase 2.6 — End-to-end test plan for Phase 2
 
| # | Test | Expected result |
|---|---|---|
| 1 | `@employee onboarding status <existing email>` | Returns that user's details |
| 2 | `@employee onboarding status <nonsense>` | "No user found" message |
| 3 | Create Employee → also select a Security group in the modal | New user created **and** added to the group |
| 4 | Create Employee → also select a Microsoft 365 group | New user created **and** added to the group |
| 5 | Assign a license to an existing user with `usageLocation` set | License applied, confirmed in Slack |
| 6 | Assign a license to a user missing `usageLocation` | Clear Slack error explaining the missing field |
| 7 | Attempt to add a user to a group they're already in | Soft-success message, not a crash |
| 8 | Send a request without a valid Slack signature | Function rejects it (401/403), nothing is processed |
 
### Screenshot placeholder
 
`[ ] Screenshot — a completed test run (all 8 scenarios) from Postman/Slack]`
 
---
 
## Already done in this project
 
The items below are already implemented and working in the actual project — the checklist above is only missing the screenshots, which I'll add as I re-run each test:
 
- [x] Microsoft Graph permissions expanded and admin consent granted (`User.ReadWrite.All`, `Group.ReadWrite.All`, `Directory.Read.All`, `Organization.Read.All`)
- [x] Status lookup (`@employee onboarding status <name or email>`) implemented and returning real Entra ID data
- [x] Create Employee flow fully working end to end (modal → Graph `POST /users` → Slack confirmation)
- [ ] Add-to-group action (Security + Microsoft 365 groups) — *(mark `[x]` once verified with a live test)*
- [ ] License assignment action — *(mark `[x]` once verified with a live test)*
- [ ] `callback_id` router handling all three actions cleanly
- [ ] Block Kit formatted confirmations
- [ ] Slack signing-secret verification added to the Function
> As each remaining box is checked off in real testing, replace its `[ ] Screenshot — ...]` placeholder above with the actual screenshot, the same way Phase 1 was documented.
 
