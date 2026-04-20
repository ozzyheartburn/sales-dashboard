// Sales Dashboard — Express Server Bootstrap
// Modular architecture: routes, services, config, middleware
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Import route modules
const healthRoutes = require("./routes/health");
const accountRoutes = require("./routes/accounts");
const swarmRoutes = require("./routes/swarm");
const orgChartRoutes = require("./routes/org-chart");
const researchRoutes = require("./routes/research");
const searchRoutes = require("./routes/search");
const salesActivityRoutes = require("./routes/sales-activities");
const tenantRoutes = require("./routes/tenants");
const authRoutes = require("./routes/auth");
const identityRoutes = require("./routes/identity");
const analyticsRoutes = require("./routes/analytics");

// Import startup service
const { initializePlatform } = require("./services/seed.service");

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api", healthRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/swarm", swarmRoutes);
app.use("/api/org-chart", orgChartRoutes);
app.use("/api/research", researchRoutes);
app.use("/api", searchRoutes);
app.use("/api/sales-activities", salesActivityRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/identity", identityRoutes);
app.use("/api/analytics", analyticsRoutes);

// Initialize platform on startup (register tenants, seed users/roles)
initializePlatform();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
