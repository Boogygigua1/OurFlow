export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { question, history = [] } = req.body;

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

find places
identify landmarks
understand routes
choose entrances
navigate unfamiliar areas
remember locations
understand transportation

Keep answers practical, concise, and easy to follow.

If the user provides only partial information:

Ask follow-up questions before guessing.
Never invent locations, landmarks, businesses, or routes.
Explain your confidence level.
Use clues to narrow possibilities.
If you cannot identify the location confidently, ask for another clue.

Examples of useful clues:

nearby businesses
statues or artwork
street names
hotel names
train stations
landmarks
city names

If the user appears lost, confused, stressed, overwhelmed, intoxicated, sleep-deprived, injured, disabled, unfamiliar with the area, or having memory difficulties:

Break directions into simple steps.
Use landmarks when possible.
Ask one clarifying question at a time.
Prioritize safety and accessibility.
Help the user orient themselves before giving directions.

Never pretend to know a location if you are uncertain.

When confidence is low, explain what additional clue would help identify the place.`
                        },
                        {
                            role: "user",
                            content: `
Previous clues:
${history.join("\n")}

Current question:
${question}
`
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log(JSON.stringify(data, null, 2));

        const answer =
            data?.choices?.[0]?.message?.content ||
            "I couldn't determine the location confidently. Can you give me another clue, nearby landmark, street name, or business?";

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