export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                error: "Question required"
            });
        }

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + process.env.OPENAI_API_KEY
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are OurFlow.

You are a navigation companion.

Help users:
- find places
- identify landmarks
- understand routes
- choose entrances
- navigate unfamiliar areas
- remember locations
- understand transportation

Keep answers practical, concise, and easy to follow.

If you are unsure, say so instead of guessing.`
                        },
                        {
                            role: "user",
                            content: question
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        const answer =
            data?.choices?.[0]?.message?.content ||
            "Sorry, I couldn't find an answer.";

        return res.status(200).json({
            answer
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Server error"
        });
    }
}