// Google OAuth2 token verification + Role-Based Access Control middleware
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Platform admin emails — only these users get full platform access
const PLATFORM_ADMIN_EMAILS = [
  "alimelkkilaoskari@gmail.com",
  "samuli.melart@gmail.com",
];

// Verify Google ID token from Authorization: Bearer <id_token>
async function verifyGoogleToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const idToken = authHeader.slice(7);
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
      return res.status(401).json({ error: "Email not verified" });
    }

    req.googleUser = {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || null,
      picture: payload.picture || null,
    };
    req.userEmail = req.googleUser.email;
    req.userName = req.googleUser.name;
    req.isPlatformAdmin = PLATFORM_ADMIN_EMAILS.includes(req.googleUser.email);
    next();
  } catch (err) {
    console.error("Google token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid Google token" });
  }
}

// Resolve tenant + user role from the platform database
// Looks up the user's email across tenant user records
function resolveUserTenant(connectPlatformDB, connectTenantDB) {
  return async (req, res, next) => {
    try {
      const email = req.googleUser.email;

      // Platform admins can specify tenant via header
      if (req.isPlatformAdmin) {
        const tenantSlug = req.headers["x-tenant"] || "PG_Machine";
        req.tenantSlug = tenantSlug;
        req.userRole = "platform_admin";
        next();
        return;
      }

      // Look up which tenant this user belongs to
      const platformDb = await connectPlatformDB();
      const tenants = await platformDb
        .collection("tenants")
        .find({ status: "active" })
        .toArray();

      for (const tenant of tenants) {
        const tenantDb = await connectTenantDB(tenant.databaseName);
        const user = await tenantDb
          .collection("users")
          .findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });
        if (user) {
          req.tenantSlug = tenant.slug;
          req.userRole = user.role || "end_user";
          req.teamName = user.teamName || null;
          req.tenantUser = user;
          next();
          return;
        }
      }

      return res.status(403).json({
        error: "No tenant found for this email. Ask an admin to invite you.",
      });
    } catch (err) {
      console.error("User tenant resolution error:", err);
      return res.status(500).json({ error: "Failed to resolve user tenant" });
    }
  };
}

// Role-based access control — checks the user's role against required roles
// Platform admins always pass
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (req.isPlatformAdmin) {
      req.userRole = "platform_admin";
      return next();
    }
    const userRole = req.userRole || "end_user";
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Insufficient permissions. Required: ${allowedRoles.join(" or ")}. Your role: ${userRole}`,
      });
    }
    req.userRole = userRole;
    next();
  };
}

module.exports = {
  verifyGoogleToken,
  resolveUserTenant,
  requireRole,
  PLATFORM_ADMIN_EMAILS,
};
