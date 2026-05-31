export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                error: "Question required"
            });
        }

        return res.status(200).json({
            answer:
                "OurFlow received: " + question +
                ". OpenAI integration coming next."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Server error"
        });
    }
}