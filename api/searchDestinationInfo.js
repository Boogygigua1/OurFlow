export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        destination,
        question,
        searchTerm
    } = req.body;

    const destinationDomains = {
        "chico state": "csuchico.edu",
        "butte college": "butte.edu",
        "enloe": "enloe.org",
        "dmv": "dmv.ca.gov"
    };

    let searchDomain = "";

    for (const value of [searchTerm, destination]) {
        const text = typeof value === "string" ? value.toLowerCase() : "";
        for (const key in destinationDomains) {
            if (text.includes(key)) {
                searchDomain = destinationDomains[key];
                break;
            }
        }
        if (searchDomain) break;
    }

    return res.status(200).json({
        destination,
        question,
        searchDomain
    });
}
