import {
    applyRateLimit,
    getSafeErrorCategory,
    getLimitedString,
    getUpstreamFailureStatus,
    readJsonSafely,
    rejectOversizedBody
} from "./requestGuards.js";

const SEARCH_DESTINATION_LIMITS = {
    bodyBytes: 16 * 1024,
    destinationChars: 500,
    originalDestinationChars: 500,
    maxBiasRadiusMeters: 50000
};

function getSafeLocationBias(locationBias) {

    if (
        !locationBias ||
        typeof locationBias.latitude !== "number" ||
        typeof locationBias.longitude !== "number"
    ) {
        return null;
    }

    if (
        locationBias.latitude < -90 ||
        locationBias.latitude > 90 ||
        locationBias.longitude < -180 ||
        locationBias.longitude > 180
    ) {
        return null;
    }

    return {
        latitude: locationBias.latitude,
        longitude: locationBias.longitude,
        radius:
            typeof locationBias.radius === "number" &&
            locationBias.radius > 0
                ? Math.min(
                    locationBias.radius,
                    SEARCH_DESTINATION_LIMITS.maxBiasRadiusMeters
                )
                : SEARCH_DESTINATION_LIMITS.maxBiasRadiusMeters
    };
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    if (
        applyRateLimit(req, res, {
            name: "searchDestinationPlace",
            windowMs: 60 * 1000,
            maxRequests: 30
        })
    ) {
        return;
    }

    if (rejectOversizedBody(req, res, SEARCH_DESTINATION_LIMITS.bodyBytes)) {
        return;
    }

    const {
        destination: rawDestination,
        originalDestination: rawOriginalDestination,
        locationBias: rawLocationBias
    } = req.body || {};

    const destination =
        getLimitedString(rawDestination, SEARCH_DESTINATION_LIMITS.destinationChars);

    const originalDestination =
        getLimitedString(
            rawOriginalDestination,
            SEARCH_DESTINATION_LIMITS.originalDestinationChars
        );

    if (destination === null || originalDestination === null) {
        return res.status(413).json({
            error: "Request is too large.",
            candidates: []
        });
    }

    const locationBias =
        getSafeLocationBias(rawLocationBias);

    if (!destination || !String(destination).trim()) {
        return res.status(400).json({
            error: "Destination required"
        });
    }

    const apiKey =
        process.env.GOOGLE_PLACES_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error("DESTINATION PLACE LOOKUP ERROR:", {
            errorCategory: "missing_configuration"
        });

        return res.status(500).json({
            error: "Location lookup is temporarily unavailable.",
            candidates: []
        });
    }

    try {
        const requestBody = {
            textQuery: String(destination).trim(),
            maxResultCount: 3
        };

        if (
            locationBias
        ) {
            requestBody.locationBias = {
                circle: {
                    center: {
                        latitude: locationBias.latitude,
                        longitude: locationBias.longitude
                    },
                    radius:
                        locationBias.radius
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
            await readJsonSafely(response);

        if (!response.ok) {
            console.error("DESTINATION PLACE LOOKUP ERROR:", {
                errorCategory: "upstream_http_error",
                upstreamStatus: response.status
            });

            return res.status(getUpstreamFailureStatus(response.status)).json({
                error: "Location lookup is temporarily unavailable.",
                candidates: []
            });
        }

        if (!data || !Array.isArray(data.places)) {
            console.error("DESTINATION PLACE LOOKUP ERROR:", {
                errorCategory: "upstream_invalid_response"
            });

            return res.status(502).json({
                error: "Location lookup is temporarily unavailable.",
                candidates: []
            });
        }

        const candidates =
            data.places
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
        console.error("DESTINATION PLACE LOOKUP ERROR:", {
            errorCategory: getSafeErrorCategory(error)
        });

        return res.status(503).json({
            error: "Location lookup is temporarily unavailable.",
            candidates: []
        });
    }
}
