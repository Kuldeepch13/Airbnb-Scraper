const { randomUUID } = require("node:crypto");
const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const suppliedId = req.get("x-request-id");
  const requestId =
    suppliedId && /^[a-zA-Z0-9_.-]{1,100}$/.test(suppliedId) ? suppliedId : randomUUID();
  const start = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1000000;

    logger.info("Request completed", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
}

module.exports = requestLogger;
