// Custom Sanitization Engine (Matrix Shield)
// Bypasses the immutable property errors of deprecated libraries like xss-clean

const sanitize = (val) => {
    if (typeof val !== 'string') return val;
    return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            } else if (typeof obj[key] === 'string') {
                obj[key] = sanitize(obj[key]);
            }
        }
    }
    return obj;
};

const sanitizeInput = (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    next();
};

const securityMiddleware = (req, res, next) => {
    // 1. Log sensitive activity
    const sensitiveEndpoints = ['/api/redeem', '/api/users/login', '/api/users/register'];
    if (sensitiveEndpoints.includes(req.path) && req.method === 'POST') {
        console.log(`[FIREWALL_ALERT] Sensitive access attempt on ${req.path} from IP: ${req.ip}`);
    }

    // 2. Add security headers (Extra layer)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow SAMEORIGIN for Firebase/Iframes
    // REMOVED MANUAL CSP - Handled by Helmet in server.js
    // res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");

    next();
};

module.exports = {
    securityMiddleware,
    sanitizeInput
};
