const express = require("express");

const db = require("../db/connection");
const scrapeProperty = require("../scraper/propertyScraper");
const logger = require("../utils/logger");
const { AirbnbUrlError, normalizeAirbnbRoomUrl } = require("../utils/airbnbUrl");

const router = express.Router();

router.get("/", async (req, res) => {
  let propertyUrl;

  try {
    propertyUrl = normalizeAirbnbRoomUrl(req.query.url, req.query).url;
  } catch (error) {
    if (error instanceof AirbnbUrlError) {
      return res.status(400).json({ message: error.message });
    }

    throw error;
  }

  try {
    if (db) {
      try {
        const [existing] = await db.query(
          `SELECT * FROM properties WHERE property_url = ?`,
          [propertyUrl],
        );

        if (existing.length > 0) {
          const ageInHours = (Date.now() - new Date(existing[0].scraped_at).getTime()) / 3600000;

          if (ageInHours < 6) {
            logger.info("Property returned from cache", {
              requestId: req.requestId,
              roomId: existing[0].room_id,
            });

            return res.json({
              source: "database",
              data: existing[0],
            });
          }
        }
      } catch (error) {
        logger.warn("Property cache unavailable; continuing without it", {
          requestId: req.requestId,
          error: error.message,
        });
      }
    }

    const propertyData = await scrapeProperty(propertyUrl);
    let stored = false;

    if (db) {
      try {
        await db.query(
          `INSERT INTO properties
            (room_id, title, price, rating, property_url, images, scraped_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             price = VALUES(price),
             rating = VALUES(rating),
             images = VALUES(images),
             scraped_at = NOW()`,
          [
            propertyData.room_id,
            propertyData.title,
            propertyData.price,
            propertyData.rating,
            propertyData.property_url,
            JSON.stringify(propertyData.images),
          ],
        );
        stored = true;
      } catch (error) {
        logger.warn("Property scraped but database storage failed", {
          requestId: req.requestId,
          roomId: propertyData.room_id,
          error: error.message,
        });
      }
    }

    logger.info("Property scraped", {
      requestId: req.requestId,
      roomId: propertyData.room_id,
      stored,
    });

    return res.json({
      source: "scraped",
      stored,
      data: propertyData,
    });
  } catch (error) {
    logger.error("Property scraping failed", {
      requestId: req.requestId,
      propertyUrl,
      error: error.message,
    });

    return res.status(502).json({
      message: "Unable to scrape this Airbnb property right now",
      error: error.message,
    });
  }
});

module.exports = router;
