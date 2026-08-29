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
<img width="1167" height="687" alt="image" src="https://github.com/user-attachments/assets/7759fc31-3e14-40ae-b090-945b77794d28" />
<img width="1165" height="790" alt="image" src="https://github.com/user-attachments/assets/8e07cdc1-d6f7-467c-8e95-988fb9af22b5" />
<img width="1426" height="830" alt="image" src="https://github.com/user-attachments/assets/c8fdaf90-1e79-4ffe-aced-2d92e9110c9f" />
<img width="1367" height="897" alt="image" src="https://github.com/user-attachments/assets/4a4b5374-6a0c-416f-86fa-83ef92839e93" />
<img width="1387" height="787" alt="image" src="https://github.com/user-attachments/assets/1d6cc685-64dd-4e28-ae43-3b9938f3971d" />


### . create a new Azure function app
<img width="1166" height="885" alt="image" src="https://github.com/user-attachments/assets/eb6305a3-1a07-469a-bbcf-82746f7e642e" />
<img width="1097" height="692" alt="image" src="https://github.com/user-attachments/assets/d997d7ee-13aa-4c19-bd47-0653fbb88ad6" />
<img width="1139" height="807" alt="image" src="https://github.com/user-attachments/assets/33813823-d824-4c88-aaaf-676e0fd3b822" />
<img width="1152" height="822" alt="image" src="https://github.com/user-attachments/assets/27d45a50-6a4d-43b2-be68-4a1e14e8056a" />
<img width="967" height="856" alt="image" src="https://github.com/user-attachments/assets/66585853-6f39-4aa6-8875-cd4f814ea7d9" />
<img width="917" height="853" alt="image" src="https://github.com/user-attachments/assets/c656f133-1c23-48be-a80d-ee84a3f3f293" />
<img width="840" height="816" alt="image" src="https://github.com/user-attachments/assets/6d1fb678-0ac2-46fb-9f6a-2eaab0687579" />
<img width="801" height="882" alt="image" src="https://github.com/user-attachments/assets/7bd69632-c5a4-45b8-bfc2-68dc3ea17f03" />
<img width="1891" height="877" alt="image" src="https://github.com/user-attachments/assets/2da2d672-4b06-4987-87bc-e824941176e7" />
<img width="1917" height="863" alt="image" src="https://github.com/user-attachments/assets/a0c53016-0da9-42da-b630-0a0c6c1f9451" />
<img width="727" height="844" alt="image" src="https://github.com/user-attachments/assets/eb0bc3fb-6783-4d2f-9881-7189ca355391" />

### 6. Test an API call
change the json script 
```json
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
    if (req.body && req.body.event && req.body.event.type === "app_mention") {
        context.res = {
            status: 200,
            body: "Hello! Employee Onboarding Bot is working."
        };
        return;
    }

    context.res = {
        status: 200,
        body: "OK"
    };
};
};
```
<img width="1250" height="622" alt="image" src="https://github.com/user-attachments/assets/c4c1fc84-1e27-4f79-8b75-64d5e7025fca" />
<img width="1921" height="567" alt="image" src="https://github.com/user-attachments/assets/7dd1618b-1369-4c14-87a4-5d3d6195249d" />
<img width="802" height="716" alt="image" src="https://github.com/user-attachments/assets/5d620c70-300f-4db2-9241-81faa5e5339f" />
<img width="1147" height="817" alt="image" src="https://github.com/user-attachments/assets/edf174b5-f47c-430c-a172-5feee6f155a7" />
<img width="937" height="786" alt="image" src="https://github.com/user-attachments/assets/0b3ac6cf-9704-4c05-af25-489e3b9ec82f" />
<img width="1422" height="877" alt="image" src="https://github.com/user-attachments/assets/4406afaa-ca34-4f88-9cc0-9ab56c025d5b" />


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

### 7. Register your app in Azure portal 
<img width="1180" height="867" alt="image" src="https://github.com/user-attachments/assets/20e16922-abb7-4d72-8380-f530904d8518" />
<img width="1286" height="606" alt="image" src="https://github.com/user-attachments/assets/2de30aac-42cc-4e97-a7b3-3124193c5f1e" />
<img width="1351" height="621" alt="image" src="https://github.com/user-attachments/assets/69220c3a-b4e9-4f55-b4a2-1dd6bfb523f3" />
<img width="1911" height="862" alt="image" src="https://github.com/user-attachments/assets/2311e45f-83b6-4639-913c-089a07c78cfa" />
<img width="1906" height="732" alt="image" src="https://github.com/user-attachments/assets/eb90bbc8-f298-4555-9681-233b9f2352c6" />
go to 
<img width="1227" height="806" alt="image" src="https://github.com/user-attachments/assets/2cdf9a4a-5b5a-4c0d-af8e-fe85bb33c711" />
<img width="1356" height="891" alt="image" src="https://github.com/user-attachments/assets/1a575eb5-aee4-40f8-9369-5bbed51eb073" />
add a new file package.json 

The file structure will look like this 
```
wwwroot/
├── host.json
├── package.json
└── employee-onboarding/
    ├── function.json
    └── index.js
```
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
<img width="1502" height="787" alt="image" src="https://github.com/user-attachments/assets/4bb6d153-8935-4895-bfe1-7062f4695c05" />
<img width="1707" height="585" alt="image" src="https://github.com/user-attachments/assets/9db4e536-e1d8-4b8c-9451-231d25b05108" />
<img width="1512" height="711" alt="image" src="https://github.com/user-attachments/assets/5a321e3e-d789-40c0-a79f-df2a0d2bb228" />
<img width="1470" height="860" alt="image" src="https://github.com/user-attachments/assets/f0b8b45b-acc8-43ad-8a64-8a9f63ec9b4a" />
<img width="1056" height="721" alt="image" src="https://github.com/user-attachments/assets/b27bc559-b57a-4e4f-8ed8-7f66598363e8" />
create package.json file in main branch under the github repository
<img width="1166" height="642" alt="image" src="https://github.com/user-attachments/assets/3bc67482-bc20-4797-b8f6-53a79dadee15" />
<img width="1417" height="672" alt="image" src="https://github.com/user-attachments/assets/38305c7e-5a65-4fdc-bab2-08e9e4f5b414" />
<img width="1451" height="761" alt="image" src="https://github.com/user-attachments/assets/63a54e82-3517-4477-ae28-39ae0eca3e93" />
<img width="1005" height="492" alt="image" src="https://github.com/user-attachments/assets/bb39c108-f3cc-4815-98d3-b1fea9e10851" />
<img width="1135" height="697" alt="image" src="https://github.com/user-attachments/assets/d570baf5-ad82-47ef-aced-dc9b21b94ad9" />

Fill in the three fields exactly like this:
1. Name : Create Employee
2. Short Description: Create a new employee onboarding request
3. Callback ID : create_employee
Then click Create.
<img width="780" height="795" alt="image" src="https://github.com/user-attachments/assets/8621bbb8-3951-4bce-beb7-6397d4ed54b3" />



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
