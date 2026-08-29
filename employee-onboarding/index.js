module.exports = async function (context, req) {
    context.log("Employee Onboarding function triggered.");

    const body = req.body || {};

    // Slack URL Verification
    if (body.type === "url_verification") {
        context.res = {
            status: 200,
            body: body.challenge
        };
        return;
    }

    // Slack Events
    if (body.type === "event_callback" && body.event) {
        const event = body.event;

        // Ignore messages sent by the bot itself
        if (event.bot_id) {
            context.res = {
                status: 200,
                body: "OK"
            };
            return;
        }

        // Respond to @app mentions
        if (event.type === "app_mention") {
            const token = process.env.SLACK_BOT_TOKEN;

            if (!token) {
                context.log.error("SLACK_BOT_TOKEN is not configured.");

                context.res = {
                    status: 500,
                    body: "Slack bot token is not configured."
                };
                return;
            }

            const response = await fetch(
                "https://slack.com/api/chat.postMessage",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        channel: event.channel,
                        text: "Hello! Employee Onboarding Bot is working."
                    })
                }
            );

            const result = await response.json();

            context.log("Slack API response:", JSON.stringify(result));

            if (!result.ok) {
                context.log.error(
                    "Slack API error:",
                    result.error
                );

                context.res = {
                    status: 500,
                    body: "Failed to send Slack message."
                };
                return;
            }

            context.res = {
                status: 200,
                body: "Message sent successfully."
            };
            return;
        }
    }

    // Default response
    context.res = {
        status: 200,
        body: "OK"
    };
};
