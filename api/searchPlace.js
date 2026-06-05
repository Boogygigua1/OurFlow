export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { query } = req.body;

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

    const arrivalTip =
        "Map search ready for: " +
        searchQuery +
        ". Before leaving, check Google Maps for Street View, photos, reviews, parking, entrance signs, and whether the office is inside a larger complex.";

    return res.status(200).json({
        query,
        searchQuery,
        mapUrl,
        arrivalTip
    });
}