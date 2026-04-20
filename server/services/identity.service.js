// Identity resolution service — look up users from pg_identity
const { connectIdentityDB } = require("../config/db");

// Helper: look up a user's identity from pg_identity by email
async function resolveIdentity(email) {
  const identityDb = await connectIdentityDB();
  const companiesCol = identityDb.collection("companies");
  const rbacCol = identityDb.collection("rbac_policies");

  // Find which company this user belongs to
  const company = await companiesCol.findOne(
    { "users.email": email.toLowerCase(), status: "active" },
    {
      projection: {
        customer_company_id: 1,
        companyName: 1,
        slug: 1,
        databaseName: 1,
        users: { $elemMatch: { email: email.toLowerCase() } },
      },
    },
  );

  if (!company || !company.users || company.users.length === 0) {
    return null;
  }

  const user = company.users[0];

  // Look up RBAC policy
  const rbac = await rbacCol.findOne({
    customer_user_id_rbac: user.customer_user_id_rbac,
  });

  return {
    customer_company_id: company.customer_company_id,
    companyName: company.companyName,
    companySlug: company.slug,
    databaseName: company.databaseName,
    customer_user_id: user.customer_user_id,
    customer_user_id_rbac: user.customer_user_id_rbac,
    rbac: rbac || null,
    user,
  };
}

module.exports = { resolveIdentity };
