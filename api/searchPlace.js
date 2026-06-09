export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        query,
        searchType = "arrival"
    } = req.body;

    if (!query) {
        return res.status(400).json({
            error: "Search query required"
        });
    }

    const cleanQuery =
        query
            .replace(/entrance parking directions/gi, "")
            .replace(/reviews/gi, "")
            .trim();

    const searchQuery =
        cleanQuery + " entrance parking directions reviews";

    const mapUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(searchQuery);

    const webSearchUrl =
        "https://www.google.com/search?q=" +
        encodeURIComponent(cleanQuery);

    const aiResponse = await fetch(
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
                        content: `
You are OurFlow.

Create a short arrival preparation note for someone going to an unfamiliar destination.

Do not invent facts.
Do not claim you verified parking, entrances, directories, or building layout.
Give practical things the user should check before leaving.

Focus on:
- parking
- entrances
- suite numbers
- signage
- office complexes
- accessibility
- directories
- building names
- department locations
- check-in desks

Return plain text only.
No markdown.
No bold text.
No numbered list.
Use 4 short bullet points maximum.
Keep each bullet under 12 words.
Do not say "safe travels."
`
                    },
                    {
                        role: "user",
                        content: `
Destination:
${cleanQuery}
`
                    }
                ]
            })
        }
    );

    const aiData = await aiResponse.json();

    const arrivalTip =
        aiData?.choices?.[0]?.message?.content ||
        "Map search ready. Before leaving, check Google Maps for Street View, photos, reviews, parking, entrances, directories, suite numbers, and check-in details.";

    return res.status(200).json({
        query,
        searchQuery,
        mapUrl,
        webSearchUrl,
        arrivalTip
    });
}