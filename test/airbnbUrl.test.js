const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeAirbnbRoomUrl } = require("../utils/airbnbUrl");

test("accepts an Airbnb India room URL", () => {
  const result = normalizeAirbnbRoomUrl(
    "https://www.airbnb.co.in/rooms/1588241649003481269?check_in=2026-05-29",
  );

  assert.equal(result.roomId, "1588241649003481269");
  assert.match(result.url, /airbnb\.co\.in\/rooms\/1588241649003481269/);
});

test("recovers Airbnb query fields when the API URL was pasted without encoding", () => {
  const result = normalizeAirbnbRoomUrl(
    "https://www.airbnb.co.in/rooms/123?check_in=2026-05-29",
    { check_out: "2026-05-31", adults: "2" },
  );
  const parsed = new URL(result.url);

  assert.equal(parsed.searchParams.get("check_out"), "2026-05-31");
  assert.equal(parsed.searchParams.get("adults"), "2");
});

test("rejects lookalike hosts and non-room URLs", () => {
  assert.throws(
    () => normalizeAirbnbRoomUrl("https://airbnb.com.example.test/rooms/123"),
    /Airbnb property link/,
  );
  assert.throws(
    () => normalizeAirbnbRoomUrl("https://www.airbnb.com/s/Delhi/homes"),
    /specific Airbnb room/,
  );
});
