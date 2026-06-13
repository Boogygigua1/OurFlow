export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { destination } = req.body;

    if (!destination) {
        return res.status(400).json({
            error: "Destination required"
        });
    }

    try {

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        "Bearer " +
                        process.env.OPENAI_API_KEY
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `
You help identify likely destinations.

Return ONLY:

Name:
Address:

If uncertain, provide the most likely match.

Keep the response under 50 words.
`
                        },
                        {
                            role: "user",
                            content:
                                destination
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        const suggestion =
            data?.choices?.[0]?.message?.content ||
            "No suggestion found.";

        return res.status(200).json({
            destination,
            suggestion
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Address lookup failed"
        });
    }
}