// Auth0 JWT validation + Role-Based Access Control middleware
const { auth } = require("express-oauth2-jwt-bearer");

// Auth0 JWT check — validates the access token from the Authorization header
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: "RS256",
});

// Resolve tenant database name from the authenticated user's token
// The tenant slug is stored in the Auth0 token as a custom claim
function resolveTenant(req, res, next) {
  const tenantSlug = req.auth?.payload?.["https://salesdashboard/tenant"];
  if (!tenantSlug) {
    return res.status(403).json({ error: "No tenant assigned to this user" });
  }
  req.tenantSlug = tenantSlug;
  next();
}

// Role-based access control — checks the user's role against required roles
// Roles are stored as a custom claim in the Auth0 token
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole =
      req.auth?.payload?.["https://salesdashboard/role"] || "viewer";
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Insufficient permissions. Required: ${allowedRoles.join(" or ")}. Your role: ${userRole}`,
      });
    }
    req.userRole = userRole;
    next();
  };
}

// Extract user info from the token for logging/audit purposes
function extractUser(req, res, next) {
  if (req.auth?.payload) {
    req.userId = req.auth.payload.sub;
    req.userEmail =
      req.auth.payload["https://salesdashboard/email"] ||
      req.auth.payload.email ||
      null;
    req.userName =
      req.auth.payload["https://salesdashboard/name"] ||
      req.auth.payload.name ||
      null;
    req.userRole = req.auth.payload["https://salesdashboard/role"] || "viewer";
    req.tenantSlug = req.auth.payload["https://salesdashboard/tenant"] || null;
  }
  next();
}

module.exports = { checkJwt, resolveTenant, requireRole, extractUser };
