export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        destination,
        lookupType = ""
    } = req.body;

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
