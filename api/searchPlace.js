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

    const mapUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(query);

    return res.status(200).json({
        query,
        mapUrl,
        message:
            "I cannot verify turn-by-turn directions yet, but I can help you open a verified map search."
    });
}