const LEVEL_VALUES = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
const minimumLevel = LEVEL_VALUES[configuredLevel] || LEVEL_VALUES.info;

function log(level, message, metadata = {}) {
  if (LEVEL_VALUES[level] < minimumLevel) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };

  const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  writer(JSON.stringify(entry));
}

module.exports = {
  debug: (message, metadata) => log("debug", message, metadata),
  info: (message, metadata) => log("info", message, metadata),
  warn: (message, metadata) => log("warn", message, metadata),
  error: (message, metadata) => log("error", message, metadata),
};
