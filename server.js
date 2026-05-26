const express = require("express");
require("dotenv").config({ quiet: true });
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");

const app = express();

// Allow max 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many requests, please try again after a minute." },
});

app.use(express.json());
app.use(requestLogger);
app.use("/api/", limiter);

const propertyRoutes = require("./routes/property");
const listingRoutes = require("./routes/listings");

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/property", propertyRoutes);
app.use("/api/listings", listingRoutes);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info("Server started", { port: Number(PORT) });
  });
}

module.exports = app;
