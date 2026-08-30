const { Client } = require("@microsoft/microsoft-graph-client");
const { DefaultAzureCredential } = require("@azure/identity");
require("isomorphic-fetch");
const axios = require("axios");

module.exports = async function (context, req) {
    // 1. Slack URL verification handshake
    if (req.body && req.body.type === "url_verification") {
        context.res = { status: 200, body: req.body.challenge };
        return;
    }

    // 2. Handle the Global Shortcut click ("Create Employee") -> Open Modal Form
    if (req.body && req.body.callback_id === "create_employee") {
        const triggerId = req.body.trigger_id;

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

        try {
            await axios.post("https://slack.com/api/views.open", {
                trigger_id: triggerId,
                view: view
            }, {
                headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });

            context.res = { status: 200, body: "" };
        } catch (error) {
            context.log.error("Error opening Slack modal:", error.response?.data || error.message);
            context.res = { status: 500, body: "Failed to open modal" };
        }
        return;
    }

    // 3. Handle Form Submission (`view_submission`) -> Check Azure & Create User
    if (req.body && req.body.type === "view_submission" && req.body.view.callback_id === "employee_onboarding_modal") {
        // Acknowledge the modal closure immediately to Slack (must happen within 3 seconds)
        context.res = {
            status: 200,
            body: { response_action: "clear" }
        };

        const values = req.body.view.state.values;
        const fullName = values.emp_name_block.emp_name_input.value;
        const email = values.emp_email_block.emp_email_input.value;
        const employeeNumber = values.emp_number_block.emp_number_input.value;
        const company = values.company_block.company_input.value;
        const phone = values.phone_block.phone_input.value;
        const country = values.country_block.country_input.value;
        const mailNickname = email.split("@")[0];
        const tempPassword = "TempPassword123!"; // Change generation logic for production if needed

        try {
            // Initialize Microsoft Graph Client via Managed Identity
            const credential = new DefaultAzureCredential();
            const authProvider = {
                getAccessToken: async () => {
                    const token = await credential.getToken("https://graph.microsoft.com/.default");
                    return token.token;
                }
            };
            const graphClient = Client.initWithMiddleware({ authProvider });

            // Check if user already exists
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

            // Create user in Azure Active Directory (Entra ID)
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

            // Notify Slack channel of success
            await axios.post("https://slack.com/api/chat.postMessage", {
                channel: "#employee-onboarding",
                text: `✅ *New User Created Successfully in Azure!*\n• *Name:* ${fullName}\n• *Email:* ${email}\n• *Employee No:* ${employeeNumber}\n• *Company:* ${company}\n• *Country:* ${country}`
            }, {
                headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });

        } catch (error) {
            context.log.error("Error creating user via Microsoft Graph:", error);
            await axios.post("https://slack.com/api/chat.postMessage", {
                channel: "#employee-onboarding",
                text: `❌ *Error creating user ${fullName}:* \`${error.message}\``
            }, {
                headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
            });
        }
        return;
    }

    context.res = { status: 200, body: "OK" };
};
