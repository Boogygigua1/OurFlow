import {
    applyRateLimit,
    getSafeErrorCategory,
    getLimitedString,
    getUpstreamFailureStatus,
    readJsonSafely,
    rejectOversizedBody
} from "./requestGuards.js";

const FIND_DESTINATION_LIMITS = {
    bodyBytes: 16 * 1024,
    destinationChars: 500,
    lookupTypeChars: 50
};

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    if (
        applyRateLimit(req, res, {
            name: "findDestinationAddress",
            windowMs: 60 * 1000,
            maxRequests: 30
        })
    ) {
        return;
    }

    if (rejectOversizedBody(req, res, FIND_DESTINATION_LIMITS.bodyBytes)) {
        return;
    }

    const {
        destination: rawDestination,
        lookupType: rawLookupType = ""
    } = req.body;

    const destination =
        getLimitedString(rawDestination, FIND_DESTINATION_LIMITS.destinationChars);

    const lookupType =
        getLimitedString(rawLookupType, FIND_DESTINATION_LIMITS.lookupTypeChars);

    if (destination === null || lookupType === null) {
        return res.status(413).json({
            error: "Request is too large."
        });
    }

    if (!destination) {
        return res.status(400).json({
            error: "Destination required"
        });
    }

    const normalizedDestination =
        destination
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .trim();

    const isParkingLookup =
        lookupType === "parking";

    const isStreetParkingDescription =
        normalizedDestination.includes("on the street") ||
        normalizedDestination.includes("street parking") ||
        normalizedDestination.includes("parked on ");

    const isVagueParkingDescription =
        isStreetParkingDescription ||
        (
            isParkingLookup &&
            (
        normalizedDestination.includes("parked near ") ||
        normalizedDestination.includes("parked behind ") ||
        normalizedDestination.includes("parked by ") ||
        normalizedDestination.includes("near ") ||
        normalizedDestination.includes("behind ") ||
        normalizedDestination.includes("next to ") ||
        normalizedDestination.includes("across from ") ||
        normalizedDestination.includes("parking lot") ||
        normalizedDestination.includes("parking structure") ||
        normalizedDestination.includes("level ") ||
        normalizedDestination.includes("row ") ||
        normalizedDestination.includes("elevator") ||
                normalizedDestination.includes("stairs")
            )
        );

    if (isVagueParkingDescription) {
        return res.status(200).json({
            destination,
            suggestion: ""
        });
    }

    const shouldUseChicoContext =
        normalizedDestination.includes("chico") ||
        normalizedDestination.includes("csu") ||
        normalizedDestination.includes("cal state") ||
        normalizedDestination.includes("butte hall") ||
        normalizedDestination.includes("anthropology");

    const possibleContext =
        shouldUseChicoContext
            ? `
Possible context:
This may be located at California State University, Chico
in Chico, California.
`
            : "";

    const apiKey =
        process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("DESTINATION ADDRESS LOOKUP ERROR:", {
            errorCategory: "missing_configuration"
        });

        return res.status(500).json({
            error: "Location lookup is temporarily unavailable."
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
                        apiKey
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    max_completion_tokens: 256,
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
                            content: `
Destination:
${destination}
${possibleContext}

Try to identify the most likely building and address.
`
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            console.error("DESTINATION ADDRESS LOOKUP ERROR:", {
                errorCategory: "upstream_http_error",
                upstreamStatus: response.status
            });

            return res.status(getUpstreamFailureStatus(response.status)).json({
                error: "Location lookup is temporarily unavailable."
            });
        }

        const data =
            await readJsonSafely(response);

        const choice =
            data?.choices?.[0];

        const suggestion =
            choice?.message?.content;

        // Never display or save a response cut off by the output-token limit.
        if (choice?.finish_reason === "length" || typeof suggestion !== "string" || !suggestion.trim()) {
            console.error("DESTINATION ADDRESS LOOKUP ERROR:", {
                errorCategory: choice?.finish_reason === "length"
                    ? "upstream_truncated_response"
                    : "upstream_invalid_response"
            });

            return res.status(502).json({
                error: "Location lookup is temporarily unavailable."
            });
        }

        return res.status(200).json({
            destination,
            suggestion
        });

    } catch (error) {

        console.error("DESTINATION ADDRESS LOOKUP ERROR:", {
            errorCategory: getSafeErrorCategory(error)
        });

        return res.status(503).json({
            error: "Location lookup is temporarily unavailable."
        });
    }
}
