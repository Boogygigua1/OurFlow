export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        destination,
        originalDestination,
        locationBias
    } = req.body || {};

    if (!destination || !String(destination).trim()) {
        return res.status(400).json({
            error: "Destination required"
        });
    }

    const apiKey =
        process.env.GOOGLE_PLACES_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "Google Places API key is not configured",
            candidates: []
        });
    }

    try {
        const requestBody = {
            textQuery: String(destination).trim(),
            maxResultCount: 3
        };

        if (
            locationBias &&
            typeof locationBias.latitude === "number" &&
            typeof locationBias.longitude === "number"
        ) {
            requestBody.locationBias = {
                circle: {
                    center: {
                        latitude: locationBias.latitude,
                        longitude: locationBias.longitude
                    },
                    radius:
                        typeof locationBias.radius === "number"
                            ? locationBias.radius
                            : 50000
                }
            };
        }

        const response = await fetch(
            "https://places.googleapis.com/v1/places:searchText",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey,
                    "X-Goog-FieldMask":
                        "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri"
                },
                body: JSON.stringify(requestBody)
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Google Places lookup failed",
                candidates: []
            });
        }

        const candidates =
            (data.places || [])
                .slice(0, 3)
                .map(place => ({
                    destinationName:
                        place.displayName?.text || "",
                    destinationAddress:
                        place.formattedAddress || "",
                    destinationPlaceId:
                        place.id || "",
                    destinationGps:
                        place.location || null,
                    googleMapsUri:
                        place.googleMapsUri || ""
                }))
                .filter(place =>
                    place.destinationName ||
                    place.destinationAddress
                );

        return res.status(200).json({
            destination,
            originalDestination:
                originalDestination || destination,
            candidates
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Google Places lookup failed",
            candidates: []
        });
    }
}
