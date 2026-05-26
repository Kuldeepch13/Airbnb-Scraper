const { chromium } = require("playwright");

async function scrapeAirbnb(city) {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 900 },
      locale: "en-IN",
    });
    const page = await context.newPage();
    const baseUrl = process.env.AIRBNB_BASE_URL || "https://www.airbnb.co.in";

    await page.goto(`${baseUrl}/s/${encodeURIComponent(city)}/homes`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForSelector('[data-testid="card-container"]', { timeout: 20000 });
    await page.waitForTimeout(1500);

    return await page.evaluate(() => {
      return [...document.querySelectorAll('[data-testid="card-container"]')]
        .map((card) => {
          const title =
            card.querySelector('[data-testid="listing-card-title"]')?.textContent?.trim() ||
            card.querySelector("[id^='title_']")?.textContent?.trim() ||
            null;
          const priceText =
            card.querySelector('[data-testid="price-availability-row"]')?.textContent?.trim() ||
            "";
          const price =
            priceText.match(
              /(?:₹\s*[\d,]+(?:\.\d{1,2})?|\b(?:Rs\.?|INR)\s*₹?\s*[\d,]+(?:\.\d{1,2})?|(?:US\$|\$|€|£)\s*[\d,]+(?:\.\d{1,2})?)/i,
            )?.[0] || null;
          const link =
            card.querySelector("a[href*='/rooms/']")?.href ||
            card.closest("a[href*='/rooms/']")?.href ||
            null;

          return { title, price, link };
        })
        .filter((listing) => listing.title);
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = scrapeAirbnb;
