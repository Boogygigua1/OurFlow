(function () {
    const section = document.getElementById("installOurFlowSection");
    const button = document.getElementById("installOurFlowButton");
    const iphoneHelp = document.getElementById("iphoneInstallHelp");
    if (!section || !button || !iphoneHelp) return;

    let installPrompt = null;
    let installed = false;
    const isStandalone = () =>
        window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    const isIphoneOrIpad = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    function updateVisibility() {
        const inApp = installed || isStandalone();
        const returnFocus = document.activeElement === button && (inApp || !installPrompt);
        button.hidden = inApp || !installPrompt;
        iphoneHelp.hidden = inApp || !isIphoneOrIpad;
        section.hidden = button.hidden && iphoneHelp.hidden;
        if (returnFocus) document.getElementById("questionInput")?.focus({ preventScroll: true });
    }

    window.addEventListener("beforeinstallprompt", event => {
        if (installed || isStandalone()) return;
        event.preventDefault();
        installPrompt = event;
        updateVisibility();
    });

    window.addEventListener("appinstalled", () => {
        installed = true;
        installPrompt = null;
        updateVisibility();
        if (typeof announceOurFlowStatus === "function") announceOurFlowStatus("OurFlow installed.");
    });

    button.addEventListener("click", async () => {
        if (!installPrompt) return;
        const prompt = installPrompt;
        installPrompt = null;
        button.disabled = true;
        try {
            const result = await prompt.prompt();
            const choice = result?.outcome ? result : await prompt.userChoice;
            if (!installed && typeof announceOurFlowStatus === "function") {
                announceOurFlowStatus(choice?.outcome === "accepted"
                    ? "Installation started."
                    : "Installation canceled.");
            }
        } catch (_) {
            if (typeof announceOurFlowStatus === "function") announceOurFlowStatus("Installation could not be started.");
        } finally {
            button.disabled = false;
            updateVisibility();
        }
    });

    updateVisibility();
}());
