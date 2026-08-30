const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");
require("isomorphic-fetch");
const axios = require("axios");
const querystring = require("querystring");

module.exports = async function (context, req) {
    try {
        context.log("=== INCOMING REQUEST ===");

        // Safely parse req.body whether it's an object or a string
        let body = req.body;
        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch (e) {
                // might be url-encoded
                const parsed = querystring.parse(body);
                if (parsed.payload) body = JSON.parse(parsed.payload);
            }
        }

        // 1. Handle Slack URL verification challenge immediately
        if (body && body.type === "url_verification") {
            context.res = {
                status: 200,
                headers: { "Content-Type": "text/plain" },
                body: body.challenge
            };
            return;
        }

        let slackData = body;

        context.log("PARSED SLACK TYPE/EVENT:", slackData?.type, slackData?.event?.type);

        // 2. Handle App Mentions (Chat commands like "@employee onboarding status jsmith")
        if (slackData && slackData.type === "event_callback" && slackData.event) {
            const event = slackData.event;
            context.res = { status: 200, body: "" };

            if (event.type === "app_mention" || event.type === "message") {
                if (event.bot_id) return;

                const text = event.text.replace(/<@.*?>/g, "").trim().toLowerCase();
                const channel = event.channel;

                if (text.includes("status") || text.includes("details") || text.includes("get")) {
                    const parts = text.split(" ");
                    const searchTerm = parts[parts.length - 1];

                    if (!searchTerm || searchTerm === "status" || searchTerm === "details" || searchTerm === "get") {
                        await postSlackMessage(channel, "⚠️ Please specify a user name or email. Example: `status jsmith`");
                        return;
                    }

                    const credential = new ClientSecretCredential(
                        process.env.TENANT_ID,
                        process.env.CLIENT_ID,
                        process.env.CLIENT_SECRET
                    );
                    const authProvider = {
                        getAccessToken: async () => (await credential.getToken("https://graph.microsoft.com/.default")).token
                    };
                    const graphClient = Client.initWithMiddleware({ authProvider });

                    try {
                        const response = await graphClient.api("/users")
                            .filter(`mail eq '${searchTerm}' or userPrincipalName eq '${searchTerm}' or startsWith(displayName, '${searchTerm}') or startsWith(mailNickname, '${searchTerm}')`)
                            .select("displayName,userPrincipalName,accountEnabled,employeeId,companyName,mobilePhone,usageLocation")
                            .get();

                        const users = response.value;

                        if (!users || users.length === 0) {
                            await postSlackMessage(channel, `❌ No user found matching \`${searchTerm}\` in Azure.`);
                            return;
                        }

                        const user = users[0];
                        const statusEmoji = user.accountEnabled ? "🟢 Enabled" : "🔴 Disabled";

                        const replyText = `📋 *User Details for ${user.displayName}:*\n` +
                            `• *Account Status:* ${statusEmoji}\n` +
                            `• *Email / UPN:* \`${user.userPrincipalName}\`\n` +
                            `• *Employee No:* ${user.employeeId || "N/A"}\n` +
                            `• *Company:* ${user.companyName || "N/A"}\n` +
                            `• *Phone:* ${user.mobilePhone || "N/A"}\n` +
                            `• *Country:* ${user.usageLocation || "N/A"}`;

                        await postSlackMessage(channel, replyText);
                    } catch (err) {
                        context.log.error("Graph API Search Error:", err.message);
                        await postSlackMessage(channel, `⚠️ Error fetching user details from Azure: ${err.message}`);
                    }
                } else {
                    await postSlackMessage(channel, `👋 Hello! You can ask me for user details by typing:\n• \`@employee onboarding status <email_or_name>\``);
                }
            }
            return;
        }

        // 3. Handle Global Shortcut ("create_employee") -> Open Modal
        if (slackData && slackData.callback_id === "create_employee") {
            const triggerId = slackData.trigger_id;
            const view = {
                type: "modal",
                callback_id: "employee_onboarding_modal",
                title: { type: "plain_text", text: "New Employee Onboarding" },
                submit: { type: "plain_text", text: "Create User" },
                blocks: [
                    {
                        type: "input",
                        block_id: "emp_name_block",
                        element: { type: "plain_text_input", action_id: "emp_name_input" },
                        label: { type: "plain_text", text: "Full Name" }
                    },
                    {
                        type: "input",
                        block_id: "emp_email_block",
                        element: { type: "plain_text_input", action_id: "emp_email_input" },
                        label: { type: "plain_text", text: "Email ID / UPN" }
                    },
                    {
                        type: "input",
                        block_id: "emp_number_block",
                        element: { type: "plain_text_input", action_id: "emp_number_input" },
                        label: { type: "plain_text", text: "Employee Number" }
                    },
                    {
                        type: "input",
                        block_id: "company_block",
                        element: { type: "plain_text_input", action_id: "company_input" },
                        label: { type: "plain_text", text: "Company" }
                    },
                    {
                        type: "input",
                        block_id: "phone_block",
                        element: { type: "plain_text_input", action_id: "phone_input" },
                        label: { type: "plain_text", text: "Phone Number" }
                    },
                    {
                        type: "input",
                        block_id: "country_block",
                        element: { type: "plain_text_input", action_id: "country_input" },
                        label: { type: "plain_text", text: "Country (e.g. IN, US)" }
                    }
                ]
            };

            await axios.post("https://slack.com/api/views.open", {
                trigger_id: triggerId,
                view: view
            }, {
                headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });

            context.res = { status: 200, body: "" };
            return;
        }

        // 4. Handle Modal Form Submission (`view_submission`) -> Create User in Azure
        if (slackData && slackData.type === "view_submission" && slackData.view && slackData.view.callback_id === "employee_onboarding_modal") {
            context.res = {
                status: 200,
                body: { response_action: "clear" }
            };

            const values = slackData.view.state.values;
            const fullName = values.emp_name_block.emp_name_input.value;
            const email = values.emp_email_block.emp_email_input.value;
            const employeeNumber = values.emp_number_block.emp_number_input.value;
            const company = values.company_block.company_input.value;
            const phone = values.phone_block.phone_input.value;
            let country = values.country_block.country_input.value.trim().toUpperCase();
            if (country.length > 2) country = "IN";

            const mailNickname = email.split("@")[0];
            const tempPassword = "TempPassword123!";

            const credential = new ClientSecretCredential(
                process.env.TENANT_ID,
                process.env.CLIENT_ID,
                process.env.CLIENT_SECRET
            );
            const authProvider = {
                getAccessToken: async () => (await credential.getToken("https://graph.microsoft.com/.default")).token
            };
            const graphClient = Client.initWithMiddleware({ authProvider });

            let userExists = false;
            try {
                const existingUser = await graphClient.api(`/users/${email}`).get();
                if (existingUser) userExists = true;
            } catch (err) {
                if (err.statusCode !== 404) throw err;
            }

            if (userExists) {
                await axios.post("https://slack.com/api/chat.postMessage", {
                    channel: "#employee-onboarding",
                    text: `⚠️ *Onboarding Failed:* User with email \`${email}\` already exists in the Azure tenant.`
                }, {
                    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
                });
                return;
            }

            const userProperties = {
                accountEnabled: true,
                displayName: fullName,
                mailNickname: mailNickname,
                userPrincipalName: email,
                employeeId: employeeNumber,
                companyName: company,
                mobilePhone: phone,
                usageLocation: country,
                passwordProfile: {
                    forceChangePasswordNextSignIn: true,
                    password: tempPassword
                }
            };

            await graphClient.api("/users").post(userProperties);

            await axios.post("https://slack.com/api/chat.postMessage", {
                channel: "#employee-onboarding",
                text: `✅ *New User Created Successfully in Azure!*\n• *Name:* ${fullName}\n• *Email:* ${email}\n• *Employee No:* ${employeeNumber}\n• *Company:* ${company}\n• *Country:* ${country}`
            }, {
                headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });

            return;
        }

        context.res = { status: 200, body: "OK" };

    } catch (error) {
        context.log.error("CRITICAL ERROR:", error.response?.data || error.message);
        if (!context.res) {
            context.res = { status: 500, body: error.message };
        }
    }
};

async function postSlackMessage(channel, text) {
    await axios.post("https://slack.com/api/chat.postMessage", {
        channel: channel,
        text: text
    }, {
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
    });
}
