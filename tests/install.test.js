const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function setup({ ios = false, standalone = false } = {}) {
    const handlers = {};
    const nodes = Object.fromEntries(["installOurFlowSection", "installOurFlowButton", "iphoneInstallHelp", "questionInput"].map(id => [id, {
        hidden: true, disabled: false, addEventListener(name, fn) { this[name] = fn; }, focus() { document.activeElement = this; }
    }]));
    const document = { activeElement: null, getElementById: id => nodes[id] };
    const announcements = [];
    const window = { matchMedia: () => ({ matches: standalone }), addEventListener: (name, fn) => { handlers[name] = fn; } };
    const context = { window, document, navigator: { userAgent: ios ? "iPhone" : "Desktop", platform: "", maxTouchPoints: 0 },
        announceOurFlowStatus: message => announcements.push(message) };
    vm.runInNewContext(fs.readFileSync(path.join(root, "install.js"), "utf8"), context);
    return { handlers, nodes, document, announcements };
}

function offer(b, outcome) {
    let prevented = false;
    let calls = 0;
    b.handlers.beforeinstallprompt({ preventDefault() { prevented = true; }, async prompt() { calls++; return { outcome }; } });
    return { get prevented() { return prevented; }, get calls() { return calls; } };
}

test("install control appears only when offered; acceptance returns focus and consumes the prompt", async () => {
    const b = setup();
    assert.equal(b.nodes.installOurFlowSection.hidden, true);
    const event = offer(b, "accepted");
    assert.equal(event.prevented, true);
    assert.equal(b.nodes.installOurFlowButton.hidden, false);
    b.document.activeElement = b.nodes.installOurFlowButton;
    await b.nodes.installOurFlowButton.click();
    assert.equal(event.calls, 1);
    assert.equal(b.nodes.installOurFlowButton.hidden, true);
    assert.equal(b.document.activeElement, b.nodes.questionInput);
    assert.deepEqual(b.announcements, ["Installation started."]);
    await b.nodes.installOurFlowButton.click();
    assert.equal(event.calls, 1);
});

test("dismissal, a later offer, and installation update the native controls", async () => {
    const b = setup();
    offer(b, "dismissed");
    await b.nodes.installOurFlowButton.click();
    assert.equal(b.announcements.at(-1), "Installation canceled.");
    assert.equal(b.nodes.installOurFlowButton.hidden, true);
    offer(b, "accepted");
    assert.equal(b.nodes.installOurFlowButton.hidden, false);
    b.handlers.appinstalled();
    assert.equal(b.nodes.installOurFlowSection.hidden, true);
    assert.equal(b.announcements.at(-1), "OurFlow installed.");
});

test("iPhone help is available without a prompt and is hidden in standalone mode", () => {
    const b = setup({ ios: true });
    assert.equal(b.nodes.iphoneInstallHelp.hidden, false);
    assert.equal(b.nodes.installOurFlowButton.hidden, true);
    const installed = setup({ ios: true, standalone: true });
    assert.equal(installed.nodes.installOurFlowSection.hidden, true);
});

test("a failed install prompt reports an error and releases the control", async () => {
    const b = setup();
    b.handlers.beforeinstallprompt({ preventDefault() {}, async prompt() { throw new Error("Unavailable"); } });
    b.document.activeElement = b.nodes.installOurFlowButton;
    await b.nodes.installOurFlowButton.click();
    assert.equal(b.announcements.at(-1), "Installation could not be started.");
    assert.equal(b.nodes.installOurFlowButton.disabled, false);
    assert.equal(b.nodes.installOurFlowButton.hidden, true);
    assert.equal(b.document.activeElement, b.nodes.questionInput);
});

test("manifest points to correctly sized local PNG icons", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
    assert.equal(manifest.name, "OurFlow");
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.scope, "/");
    assert.equal(manifest.display, "standalone");
    for (const [file, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
        const bytes = fs.readFileSync(path.join(root, file));
        assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert.equal(bytes.readUInt32BE(16), size);
        assert.equal(bytes.readUInt32BE(20), size);
        if (size !== 180) assert(manifest.icons.some(icon => icon.src === "/" + file && icon.sizes === `${size}x${size}` && icon.type === "image/png"));
    }
});
