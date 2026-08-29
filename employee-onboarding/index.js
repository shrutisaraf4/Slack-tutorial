module.exports = async function (context, req) {
    context.log("Employee Onboarding function triggered.");

    // Slack URL Verification
    if (req.body && req.body.type === "url_verification") {
        context.res = {
            status: 200,
            body: req.body.challenge
        };
        return;
    }

    // Slack App Mention
    if (req.body && req.body.event && req.body.event.type === "app_mention") {
        context.res = {
            status: 200,
            body: "Hello! Employee Onboarding Bot is working."
        };
        return;
    }

    // Default response
    context.res = {
        status: 200,
        body: "OK"
    };
};
