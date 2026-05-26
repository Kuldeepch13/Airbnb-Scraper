const express = require("express");
const router = express.Router();

const scrapeAirbnb = require("../scraper/airbnbScraper");
const db = require("../db/connection");
const logger = require("../utils/logger");

router.get("/:city", async (req, res) => {
  try {
    const city = req.params.city.trim();

    if (!city || city.length > 100) {
      return res.status(400).json({ message: "Please provide a valid city name" });
    }

    const listings = await scrapeAirbnb(city);

    if (db && listings.length > 0) {
      try {
        const values = listings.map((item) => [item.title, item.price, item.link || null]);
        await db.query(
          `INSERT INTO listings (title, price, link)
           VALUES ?
           ON DUPLICATE KEY UPDATE price = VALUES(price)`,
          [values],
        );
      } catch (error) {
        logger.warn("Listings storage failed; returning scraped results", {
          requestId: req.requestId,
          city,
          error: error.message,
        });
      }
    }

    logger.info("Listings scraped", {
      requestId: req.requestId,
      city,
      count: listings.length,
    });

    return res.json(listings);
  } catch (error) {
    logger.error("Listing scraping failed", {
      requestId: req.requestId,
      city: req.params.city,
      error: error.message,
    });

    return res.status(502).json({
      message: "Unable to scrape Airbnb listings right now",
      error: error.message,
    });
  }
});

module.exports = router;
