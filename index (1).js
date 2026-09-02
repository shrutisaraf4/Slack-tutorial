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

        // 2. Handle App Mentions / DMs (chat commands)
        if (slackData && slackData.type === "event_callback" && slackData.event) {
            const event = slackData.event;
            context.res = { status: 200, body: "" };

            if (event.type === "app_mention" || event.type === "message") {
                if (event.bot_id) return;

                const rawText = event.text.replace(/<@.*?>/g, "").trim();
                const text = rawText.toLowerCase();
                const channel = event.channel;

                // ---- status / details lookup ----
                if (text.includes("status") || text.includes("details") || text.includes("get")) {
                    const parts = text.split(" ");
                    const searchTerm = parts[parts.length - 1];

                    if (!searchTerm || searchTerm === "status" || searchTerm === "details" || searchTerm === "get") {
                        await postSlackMessage(channel, "⚠️ Please specify a user name or email. Example: `status jsmith`");
                        return;
                    }

                    const graphClient = getGraphClient();

                    try {
                        const users = await findUsersByTerm(graphClient, searchTerm);

                        if (!users || users.length === 0) {
                            await postSlackMessage(channel, `❌ No user found matching \`${searchTerm}\` in Azure.`);
                            return;
                        }

                        if (users.length > 1) {
                            const list = users.map(u => `• ${u.displayName} (\`${u.userPrincipalName}\`)`).join("\n");
                            await postSlackMessage(channel, `⚠️ Found *${users.length}* matches for \`${searchTerm}\`, please be more specific:\n${list}`);
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
                    return;
                }

                // ---- addgroup <email> <group name> ----
                if (text.startsWith("addgroup")) {
                    const parts = rawText.split(" ").slice(1); // drop the command word, keep original case
                    const email = parts.shift();
                    const groupName = parts.join(" ").trim();

                    if (!email || !groupName) {
                        await postSlackMessage(channel, "⚠️ Usage: `addgroup <email> <group name>`");
                        return;
                    }

                    const graphClient = getGraphClient();

                    try {
                        const user = await findUserByEmail(graphClient, email);
                        if (!user) {
                            await postSlackMessage(channel, `❌ No user found with email \`${email}\`.`);
                            return;
                        }

                        const group = await findGroupByName(graphClient, groupName);
                        if (!group) {
                            await postSlackMessage(channel, `❌ No group found matching \`${groupName}\`. Try \`groups\` to see the list.`);
                            return;
                        }

                        await addUserToGroup(graphClient, user.id, group.id);

                        const groupKind = group.groupTypes && group.groupTypes.includes("Unified") ? "Microsoft 365 group" : "Security group";
                        await postSlackMessage(channel, `✅ Added *${user.displayName}* to *${group.displayName}* (${groupKind}).`);
                    } catch (err) {
                        const graphMessage = err.body ? JSON.parse(err.body)?.error?.message : err.message;
                        if (graphMessage && graphMessage.toLowerCase().includes("already exist")) {
                            await postSlackMessage(channel, `ℹ️ That user is already a member of that group.`);
                        } else {
                            context.log.error("Add To Group Error:", graphMessage || err.message);
                            await postSlackMessage(channel, `⚠️ Error adding user to group: ${graphMessage || err.message}`);
                        }
                    }
                    return;
                }

                // ---- assignlicense <email> <skuPartNumber> ----
                if (text.startsWith("assignlicense")) {
                    const parts = rawText.split(" ").slice(1);
                    const email = parts[0];
                    const skuPartNumber = parts[1];

                    if (!email || !skuPartNumber) {
                        await postSlackMessage(channel, "⚠️ Usage: `assignlicense <email> <skuPartNumber>` — try `licenses` to see available SKUs.");
                        return;
                    }

                    const graphClient = getGraphClient();

                    try {
                        const user = await findUserByEmail(graphClient, email);
                        if (!user) {
                            await postSlackMessage(channel, `❌ No user found with email \`${email}\`.`);
                            return;
                        }

                        if (!user.usageLocation) {
                            await postSlackMessage(channel, `⚠️ *${user.displayName}* has no \`usageLocation\` (country) set. Set that first — licenses can't be assigned without it.`);
                            return;
                        }

                        const licenses = await getAvailableLicenses(graphClient);
                        const targetSku = licenses.find(l => l.skuPartNumber.toLowerCase() === skuPartNumber.toLowerCase());

                        if (!targetSku) {
                            await postSlackMessage(channel, `❌ No license SKU matching \`${skuPartNumber}\`. Try \`licenses\` to see what's available.`);
                            return;
                        }

                        if (targetSku.available <= 0) {
                            await postSlackMessage(channel, `⚠️ *${targetSku.skuPartNumber}* has 0 seats available right now.`);
                            return;
                        }

                        await assignLicenseToUser(graphClient, user.id, targetSku.skuId);
                        await postSlackMessage(channel, `✅ Assigned license *${targetSku.skuPartNumber}* to *${user.displayName}*.`);
                    } catch (err) {
                        const graphMessage = err.body ? JSON.parse(err.body)?.error?.message : err.message;
                        context.log.error("Assign License Error:", graphMessage || err.message);
                        await postSlackMessage(channel, `⚠️ Error assigning license: ${graphMessage || err.message}`);
                    }
                    return;
                }

                // ---- groups (list) ----
                if (text === "groups" || text.startsWith("groups")) {
                    const graphClient = getGraphClient();
                    try {
                        const groups = await listGroups(graphClient);
                        if (!groups.length) {
                            await postSlackMessage(channel, "No groups found (or missing `Group.Read.All`/`Directory.Read.All` permission).");
                            return;
                        }
                        const list = groups.map(g => {
                            const kind = g.groupTypes && g.groupTypes.includes("Unified") ? "M365" : "Security";
                            return `• ${g.displayName} _(${kind})_`;
                        }).join("\n");
                        await postSlackMessage(channel, `📁 *Available groups (first ${groups.length}):*\n${list}`);
                    } catch (err) {
                        context.log.error("List Groups Error:", err.message);
                        await postSlackMessage(channel, `⚠️ Error listing groups: ${err.message}`);
                    }
                    return;
                }

                // ---- licenses (list) ----
                if (text === "licenses" || text.startsWith("licenses")) {
                    const graphClient = getGraphClient();
                    try {
                        const licenses = await getAvailableLicenses(graphClient);
                        if (!licenses.length) {
                            await postSlackMessage(channel, "No license SKUs found (or missing `Organization.Read.All` permission).");
                            return;
                        }
                        const list = licenses.map(l => `• ${l.skuPartNumber} — ${l.available} seat(s) available`).join("\n");
                        await postSlackMessage(channel, `🎫 *Licenses in this tenant:*\n${list}`);
                    } catch (err) {
                        context.log.error("List Licenses Error:", err.message);
                        await postSlackMessage(channel, `⚠️ Error listing licenses: ${err.message}`);
                    }
                    return;
                }

                // ---- fallback help ----
                await postSlackMessage(channel,
                    `👋 Hello! Here's what I can do:\n` +
                    `• \`status <email_or_name>\` — look up a user\n` +
                    `• \`addgroup <email> <group name>\` — add a user to a Security or Microsoft 365 group\n` +
                    `• \`assignlicense <email> <skuPartNumber>\` — assign a Microsoft 365 license\n` +
                    `• \`groups\` — list available groups\n` +
                    `• \`licenses\` — list available license SKUs and seat counts\n` +
                    `• Global shortcut *Create Employee* — create a new user (with optional group + license at creation time)`
                );
            }
            return;
        }

        // 3. Handle Global Shortcut ("create_employee") -> Open Modal
        if (slackData && slackData.callback_id === "create_employee") {
            const triggerId = slackData.trigger_id;
            const graphClient = getGraphClient();

            // Pull groups + licenses to populate optional multi-selects.
            // If either call fails (permission not granted yet, etc.), we degrade
            // gracefully and just skip that block rather than failing the whole modal.
            let groupOptions = [];
            let licenseOptions = [];

            try {
                const groups = await listGroups(graphClient);
                groupOptions = groups.slice(0, 90).map(g => ({
                    text: { type: "plain_text", text: g.displayName.substring(0, 75) },
                    value: g.id
                }));
            } catch (err) {
                context.log.error("Could not load groups for modal:", err.message);
            }

            try {
                const licenses = await getAvailableLicenses(graphClient);
                licenseOptions = licenses
                    .filter(l => l.available > 0)
                    .map(l => ({
                        text: { type: "plain_text", text: `${l.skuPartNumber} (${l.available} left)`.substring(0, 75) },
                        value: l.skuId
                    }));
            } catch (err) {
                context.log.error("Could not load licenses for modal:", err.message);
            }

            const blocks = [
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
            ];

            if (groupOptions.length > 0) {
                blocks.push({
                    type: "input",
                    block_id: "groups_block",
                    optional: true,
                    element: {
                        type: "multi_static_select",
                        action_id: "groups_input",
                        placeholder: { type: "plain_text", text: "Select group(s), optional" },
                        options: groupOptions
                    },
                    label: { type: "plain_text", text: "Add to Group(s)" }
                });
            }

            if (licenseOptions.length > 0) {
                blocks.push({
                    type: "input",
                    block_id: "license_block",
                    optional: true,
                    element: {
                        type: "multi_static_select",
                        action_id: "license_input",
                        placeholder: { type: "plain_text", text: "Select license(s), optional" },
                        options: licenseOptions
                    },
                    label: { type: "plain_text", text: "Assign License(s)" }
                });
            }

            const view = {
                type: "modal",
                callback_id: "employee_onboarding_modal",
                title: { type: "plain_text", text: "New Employee Onboarding" },
                submit: { type: "plain_text", text: "Create User" },
                blocks: blocks
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

            // Optional selections — blocks may not exist if they were skipped when the modal was built
            const selectedGroups = values.groups_block?.groups_input?.selected_options?.map(o => o.value) || [];
            const selectedLicenses = values.license_block?.license_input?.selected_options?.map(o => o.value) || [];

            const mailNickname = email.split("@")[0];
            const tempPassword = "TempPassword123!";

            const graphClient = getGraphClient();

            let userExists = false;
            try {
                const existingUser = await graphClient.api(`/users/${email}`).get();
                if (existingUser) userExists = true;
            } catch (err) {
                if (err.statusCode !== 404) throw err;
            }

            if (userExists) {
                await postToOnboardingChannel(`⚠️ *Onboarding Failed:* User with email \`${email}\` already exists in the Azure tenant.`);
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

            const newUser = await graphClient.api("/users").post(userProperties);

            let summary = `✅ *New User Created Successfully in Azure!*\n` +
                `• *Name:* ${fullName}\n` +
                `• *Email:* ${email}\n` +
                `• *Employee No:* ${employeeNumber}\n` +
                `• *Company:* ${company}\n` +
                `• *Country:* ${country}`;

            // Best-effort group adds — a failure here should not hide the fact the user was created
            if (selectedGroups.length > 0) {
                const groupResults = [];
                for (const groupId of selectedGroups) {
                    try {
                        await addUserToGroup(graphClient, newUser.id, groupId);
                        groupResults.push(`✅ added to group \`${groupId}\``);
                    } catch (err) {
                        const graphMessage = err.body ? JSON.parse(err.body)?.error?.message : err.message;
                        groupResults.push(`❌ failed to add to group \`${groupId}\`: ${graphMessage || err.message}`);
                    }
                }
                summary += `\n• *Groups:*\n  ${groupResults.join("\n  ")}`;
            }

            // Best-effort license assignment
            if (selectedLicenses.length > 0) {
                try {
                    await assignLicenseToUser(graphClient, newUser.id, selectedLicenses);
                    summary += `\n• *Licenses:* ✅ assigned ${selectedLicenses.length} license(s)`;
                } catch (err) {
                    const graphMessage = err.body ? JSON.parse(err.body)?.error?.message : err.message;
                    summary += `\n• *Licenses:* ❌ failed — ${graphMessage || err.message}`;
                }
            }

            await postToOnboardingChannel(summary);
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGraphClient() {
    const credential = new ClientSecretCredential(
        process.env.TENANT_ID,
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET
    );
    const authProvider = {
        getAccessToken: async () => (await credential.getToken("https://graph.microsoft.com/.default")).token
    };
    return Client.initWithMiddleware({ authProvider });
}

async function postSlackMessage(channel, text) {
    await axios.post("https://slack.com/api/chat.postMessage", {
        channel: channel,
        text: text
    }, {
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
    });
}

async function postToOnboardingChannel(text) {
    await axios.post("https://slack.com/api/chat.postMessage", {
        channel: "#employee-onboarding",
        text: text
    }, {
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
    });
}

async function findUsersByTerm(graphClient, term) {
    const response = await graphClient.api("/users")
        .filter(`mail eq '${term}' or userPrincipalName eq '${term}' or startsWith(displayName, '${term}') or startsWith(mailNickname, '${term}')`)
        .select("displayName,userPrincipalName,accountEnabled,employeeId,companyName,mobilePhone,usageLocation")
        .get();
    return response.value;
}

async function findUserByEmail(graphClient, email) {
    try {
        return await graphClient.api(`/users/${email}`)
            .select("id,displayName,userPrincipalName,accountEnabled,usageLocation")
            .get();
    } catch (err) {
        if (err.statusCode === 404) return null;
        throw err;
    }
}

async function findGroupByName(graphClient, name) {
    const response = await graphClient.api("/groups")
        .filter(`displayName eq '${name}' or startswith(displayName, '${name}')`)
        .select("id,displayName,groupTypes,securityEnabled,mailEnabled")
        .get();
    return response.value && response.value.length > 0 ? response.value[0] : null;
}

async function listGroups(graphClient) {
    const response = await graphClient.api("/groups")
        .select("id,displayName,groupTypes,securityEnabled,mailEnabled")
        .top(90)
        .get();
    return response.value;
}

async function addUserToGroup(graphClient, userId, groupId) {
    await graphClient.api(`/groups/${groupId}/members/$ref`).post({
        "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
    });
}

async function getAvailableLicenses(graphClient) {
    const response = await graphClient.api("/subscribedSkus").get();
    return response.value.map(s => ({
        skuId: s.skuId,
        skuPartNumber: s.skuPartNumber,
        available: s.prepaidUnits.enabled - s.consumedUnits
    }));
}

async function assignLicenseToUser(graphClient, userId, skuIdOrIds) {
    const skuIds = Array.isArray(skuIdOrIds) ? skuIdOrIds : [skuIdOrIds];
    await graphClient.api(`/users/${userId}/assignLicense`).post({
        addLicenses: skuIds.map(skuId => ({ skuId, disabledPlans: [] })),
        removeLicenses: []
    });
}
