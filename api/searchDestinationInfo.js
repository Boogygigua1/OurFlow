export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        destination,
        question
    } = req.body;

    const destinationDomains = {
        "chico state": "csuchico.edu",
        "butte college": "butte.edu",
        "enloe": "enloe.org",
        "dmv": "dmv.ca.gov"
    };

    let searchDomain = "";

    const destinationLower =
        (destination || "").toLowerCase();

    for (const key in destinationDomains) {

        if (destinationLower.includes(key)) {

            searchDomain =
                destinationDomains[key];

            break;
        }
    }

    return res.status(200).json({
        destination,
        question,
        searchDomain
    });
}