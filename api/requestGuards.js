const MAX_RATE_LIMIT_BUCKETS = 1000;

const rateLimitBuckets =
    globalThis.__ourFlowRateLimitBuckets ||
    new Map();

globalThis.__ourFlowRateLimitBuckets = rateLimitBuckets;

function getClientIp(req) {

    const forwardedFor =
        req.headers?.["x-forwarded-for"];

    if (typeof forwardedFor === "string" && forwardedFor.trim()) {
        return forwardedFor.split(",")[0].trim();
    }

    return (
        req.headers?.["x-real-ip"] ||
        req.socket?.remoteAddress ||
        "unknown"
    );
}

function pruneExpiredBuckets(now) {

    let nextResetAt = Infinity;

    for (const [key, bucket] of rateLimitBuckets.entries()) {
        if (bucket.resetAt <= now) {
            rateLimitBuckets.delete(key);
        } else {
            nextResetAt = Math.min(nextResetAt, bucket.resetAt);
        }
    }

    return nextResetAt;
}

export function applyRateLimit(req, res, options = {}) {

    const {
        name = "default",
        windowMs = 60 * 1000,
        maxRequests = 20
    } = options;

    const now =
        Date.now();

    const nextResetAt = pruneExpiredBuckets(now);

    const key =
        name + ":" + getClientIp(req);

    const existing =
        rateLimitBuckets.get(key);

    // Keep active counters intact; reject new identities rather than evicting them.
    if (!existing && rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
        return rejectRateLimitedRequest(res, nextResetAt, now);
    }

    const bucket =
        existing && existing.resetAt > now
            ? existing
            : {
                count: 0,
                resetAt: now + windowMs
            };

    bucket.count += 1;
    rateLimitBuckets.set(key, bucket);

    if (bucket.count <= maxRequests) {
        return false;
    }

    return rejectRateLimitedRequest(res, bucket.resetAt, now);
}

function rejectRateLimitedRequest(res, resetAt, now) {

    const retryAfterSeconds =
        Math.max(1, Math.ceil((resetAt - now) / 1000));

    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
        error: "Too many requests. Please try again shortly."
    });

    return true;
}

export function getJsonBodySize(value) {

    try {
        return Buffer.byteLength(JSON.stringify(value || {}), "utf8");
    } catch {
        return Infinity;
    }
}

export function rejectOversizedBody(req, res, maxBytes) {

    if (getJsonBodySize(req.body) <= maxBytes) {
        return false;
    }

    res.status(413).json({
        error: "Request is too large."
    });

    return true;
}

export function getLimitedString(value, maxLength) {

    if (typeof value !== "string") {
        return "";
    }

    const trimmed =
        value.trim();

    if (trimmed.length > maxLength) {
        return null;
    }

    return trimmed;
}

export function isStringTooLong(value, maxLength) {

    return (
        typeof value === "string" &&
        value.trim().length > maxLength
    );
}

export function getLimitedStringArray(value, options = {}) {

    const {
        maxItems = 20,
        maxItemLength = 500
    } = options;

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .slice(0, maxItems)
        .map(item =>
            typeof item === "string"
                ? item.trim().slice(0, maxItemLength)
                : ""
        )
        .filter(Boolean);
}

export function getUpstreamFailureStatus(status) {

    return status === 429
        ? 503
        : 502;
}

export function getSafeErrorCategory(error) {

    if (error instanceof SyntaxError) {
        return "upstream_invalid_response";
    }

    if (error?.name === "TypeError") {
        return "network_error";
    }

    return "request_error";
}

export async function readJsonSafely(response) {

    try {
        return await response.json();
    } catch {
        return null;
    }
}
