const { chromium } = require("playwright");
const { normalizeAirbnbRoomUrl } = require("../utils/airbnbUrl");

async function scrapeProperty(rawUrl) {
  const { roomId, url } = normalizeAirbnbRoomUrl(rawUrl);
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

    await page.route("**/*", async (route) => {
      const resourceType = route.request().resourceType();

      if (resourceType === "media" || resourceType === "font") {
        return route.abort();
      }

      return route.continue();
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForSelector("h1, [data-section-id], script[type='application/ld+json']", {
      timeout: 20000,
    }).catch(() => {});

    await page.mouse.move(200, 300);
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(1000);

    const data = await page.evaluate((listingRoomId) => {
      const text = document.body?.innerText || "";
      const title =
        document.querySelector("h1")?.textContent?.trim() ||
        document.querySelector('meta[property="og:title"]')?.content?.trim() ||
        document.title?.trim() ||
        null;

      const priceMatch = text.match(
        /(?:₹\s*[\d,]+(?:\.\d{1,2})?|\b(?:Rs\.?|INR)\s*₹?\s*[\d,]+(?:\.\d{1,2})?|(?:US\$|\$|€|£)\s*[\d,]+(?:\.\d{1,2})?)/i,
      );
      const ratingMatch = text.match(
        /(?:rated\s*)?([0-5](?:\.\d{1,2})?)\s*(?:out of 5|stars?|rating)/i,
      );

      const images = new Set();
      const candidates = [
        document.querySelector('meta[property="og:image"]')?.content,
        ...[...document.querySelectorAll("img")].map((image) => image.currentSrc || image.src),
      ];

      candidates.forEach((source) => {
        if (!source) {
          return;
        }

        try {
          const imageUrl = new URL(source);
          const isListingPhoto =
            imageUrl.hostname.endsWith(".muscache.com") &&
            imageUrl.pathname.includes(`/pictures/hosting/Hosting-${listingRoomId}/`);

          if (isListingPhoto) {
            images.add(source);
          }
        } catch (error) {
          // Ignore malformed image sources returned by page extensions or placeholders.
        }
      });

      return {
        title,
        price: priceMatch?.[0] || null,
        rating: ratingMatch?.[1] || null,
        images: [...images],
        bodyPreview: text.slice(0, 500),
      };
    }, roomId);

    if (/access denied|captcha|verify you are human|robot/i.test(data.bodyPreview)) {
      throw new Error("Airbnb blocked the automated browser request");
    }

    delete data.bodyPreview;

    return {
      room_id: roomId,
      property_url: url,
      ...data,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = scrapeProperty;
