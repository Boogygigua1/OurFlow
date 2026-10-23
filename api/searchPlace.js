import {
    applyRateLimit,
    getSafeErrorCategory,
    getLimitedString,
    getUpstreamFailureStatus,
    readJsonSafely,
    rejectOversizedBody
} from "./requestGuards.js";

const SEARCH_PLACE_LIMITS = {
    bodyBytes: 16 * 1024,
    queryChars: 300,
    searchTypeChars: 50
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    if (
        applyRateLimit(req, res, {
            name: "searchPlace",
            windowMs: 60 * 1000,
            maxRequests: 30
        })
    ) {
        return;
    }

    if (rejectOversizedBody(req, res, SEARCH_PLACE_LIMITS.bodyBytes)) {
        return;
    }

    const {
        query: rawQuery,
        searchType: rawSearchType = "arrival"
    } = req.body;

    const query =
        getLimitedString(rawQuery, SEARCH_PLACE_LIMITS.queryChars);

    const limitedSearchType =
        getLimitedString(rawSearchType, SEARCH_PLACE_LIMITS.searchTypeChars);

    if (query === null || limitedSearchType === null) {
        return res.status(413).json({
            error: "Request is too large."
        });
    }

    const searchType =
        limitedSearchType || "arrival";

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

    const apiKey =
        process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("SEARCH PLACE ERROR:", {
            errorCategory: "missing_configuration"
        });

        return res.status(500).json({
            error: "Location lookup is temporarily unavailable."
        });
    }

    try {
        const aiResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    max_completion_tokens: 256,
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

Find the building's physical street address.

If this is a university department, identify the building
and provide the building's street address.

Do not return only the department name.
Do not return only the campus name.
`
                        }
                    ]
                })
            }
        );

        if (!aiResponse.ok) {
            console.error("SEARCH PLACE ERROR:", {
                errorCategory: "upstream_http_error",
                upstreamStatus: aiResponse.status
            });

            return res.status(getUpstreamFailureStatus(aiResponse.status)).json({
                error: "Location lookup is temporarily unavailable."
            });
        }

        const aiData =
            await readJsonSafely(aiResponse);

        const choice =
            aiData?.choices?.[0];

        const arrivalTip =
            choice?.message?.content;

        // Never display or save a response cut off by the output-token limit.
        if (choice?.finish_reason === "length" || typeof arrivalTip !== "string" || !arrivalTip.trim()) {
            console.error("SEARCH PLACE ERROR:", {
                errorCategory: choice?.finish_reason === "length"
                    ? "upstream_truncated_response"
                    : "upstream_invalid_response"
            });

            return res.status(502).json({
                error: "Location lookup is temporarily unavailable."
            });
        }

        return res.status(200).json({
            query,
            searchQuery,
            mapUrl,
            webSearchUrl,
            arrivalTip
        });
    } catch (error) {
        console.error("SEARCH PLACE ERROR:", {
            errorCategory: getSafeErrorCategory(error)
        });

        return res.status(503).json({
            error: "Location lookup is temporarily unavailable."
        });
    }
}
