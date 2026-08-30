const { Client } = require("@microsoft/microsoft-graph-client");
const { DefaultAzureCredential } = require("@azure/identity");
require("isomorphic-fetch");
const axios = require("axios");
const querystring = require("querystring");

module.exports = async function (context, req) {
    try {
        context.log("=== INCOMING REQUEST ===");
        context.log("RAW BODY TYPE:", typeof req.body);
        context.log("RAW BODY:", JSON.stringify(req.body));

        let slackData = req.body;

        // Properly parse URL-encoded strings sent by Slack shortcuts
        if (typeof req.body === "string") {
            const parsed = querystring.parse(req.body);
            if (parsed.payload) {
                slackData = JSON.parse(parsed.payload);
            } else {
                slackData = parsed;
            }
        } else if (req.body && typeof req.body.payload === "string") {
            slackData = JSON.parse(req.body.payload);
        } else if (req.body && req.body.payload) {
            slackData = req.body.payload;
        }

        context.log("PARSED SLACK DATA:", JSON.stringify(slackData));
        context.log("CALLBACK ID:", slackData?.callback_id);
        context.log("TYPE:", slackData?.type);

        // 1. Slack URL verification handshake
        if (slackData && slackData.type === "url_verification") {
            context.res = { status: 200, body: slackData.challenge };
            return;
        }

        // 2. Handle Global Shortcut ("create_employee")
        if (slackData && slackData.callback_id === "create_employee") {
            context.log("MATCHED create_employee shortcut! Opening modal...");
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
                        label: { type: "plain_text", text: "Country" }
                    }
                ]
            };

            const slackRes = await axios.post("https://slack.com/api/views.open", {
                trigger_id: triggerId,
                view: view
            }, {
                headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });

            context.log("Slack views.open API Response:", slackRes.data);

            context.res = { status: 200, body: "" };
            return;
        }

        // 3. Handle Form Submission (`view_submission`)
        if (slackData && slackData.type === "view_submission" && slackData.view.callback_id === "employee_onboarding_modal") {
            context.log("MATCHED view_submission! Creating user in Azure...");
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
            const country = values.country_block.country_input.value;
            const mailNickname = email.split("@")[0];
            const tempPassword = "TempPassword123!";

            const credential = new DefaultAzureCredential();
            const authProvider = {
                getAccessToken: async () => {
                    const token = await credential.getToken("https://graph.microsoft.com/.default");
                    return token.token;
                }
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
        context.res = { status: 500, body: error.message };
    }
};
