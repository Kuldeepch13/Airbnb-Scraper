const PASSTHROUGH_QUERY_PARAMETERS = [
  "check_in",
  "check_out",
  "adults",
  "children",
  "infants",
  "pets",
  "guests",
  "currency",
];

class AirbnbUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "AirbnbUrlError";
  }
}

function isAirbnbHost(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");

  return /^airbnb\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host);
}

function normalizeAirbnbRoomUrl(rawUrl, requestQuery = {}) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new AirbnbUrlError("Property URL required");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch (error) {
    throw new AirbnbUrlError("Invalid URL format");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new AirbnbUrlError("Property URL must use HTTP or HTTPS");
  }

  if (!isAirbnbHost(parsedUrl.hostname)) {
    throw new AirbnbUrlError("URL must be an Airbnb property link");
  }

  const roomMatch = parsedUrl.pathname.match(/^\/rooms\/(\d+)(?:\/|$)/);

  if (!roomMatch) {
    throw new AirbnbUrlError("URL must point to a specific Airbnb room");
  }

  // A URL typed directly into the API query may leave Airbnb parameters outside `url`.
  for (const parameter of PASSTHROUGH_QUERY_PARAMETERS) {
    if (!parsedUrl.searchParams.has(parameter) && typeof requestQuery[parameter] === "string") {
      parsedUrl.searchParams.set(parameter, requestQuery[parameter]);
    }
  }

  parsedUrl.hash = "";

  return {
    roomId: roomMatch[1],
    url: parsedUrl.toString(),
  };
}

module.exports = {
  AirbnbUrlError,
  isAirbnbHost,
  normalizeAirbnbRoomUrl,
};
