        function handleKey(event) {
            if (event.key === "Enter") {
                askOurFlow();
            }
        }

        function toggleReadMore(button) {

            const moreText = document.getElementById("moreText");

            const isHidden = moreText.style.display === "none" || moreText.style.display === "";

            moreText.style.display = isHidden ? "inline" : "none";
            button.innerText = isHidden ? "Read less" : "Read more";
        }

        function togglePhilosophy(button) {

            const text = document.getElementById("philosophyText");

            const isHidden =
                text.style.display === "none" || text.style.display === "";

            text.style.display = isHidden ? "block" : "none";

            button.innerText = isHidden
                ? "Hide Philosophy"
                : "✨ Our Philosophy";
        }

        function toggleLegal(button) {

            const text = document.getElementById("legalText");

            const isHidden =
                text.style.display === "none" || text.style.display === "";

            text.style.display = isHidden ? "block" : "none";

            button.innerText = isHidden
                ? "▲ Hide AI, Usage & Platform Information"
                : "▼ AI, Usage & Platform Information";
        }
