
        function startVoiceInput() {

            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                alert("🎤 Speech recognition is not supported in this browser.");
                return;
            }

            const recognition = new SpeechRecognition();

            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.start();

            recognition.onstart = function () {

                document.getElementById(
                    "questionInput"
                ).placeholder = "🎤 Listening...";
            };

            recognition.onend = function () {

                const input =
                    document.getElementById(
                        "questionInput"
                    );

                if (!input.value.trim()) {

                    input.placeholder =
                        "Where do you need help?";
                }
            };

            recognition.onresult = function (event) {

                const transcript =
                    event.results[0][0].transcript;

                const input =
                    document.getElementById("questionInput");

                const start = input.selectionStart;
                const end = input.selectionEnd;

                input.value =
                    input.value.substring(0, start) +
                    transcript +
                    " " +
                    input.value.substring(end);

                input.selectionStart =
                    input.selectionEnd =
                    start + transcript.length + 1;
            };

            recognition.onerror = function (event) {

                if (
                    event.error === "no-speech" ||
                    event.error === "aborted"
                ) {
                    return;
                }

                console.log(
                    "Voice error:",
                    event.error
                );
            };
        }
