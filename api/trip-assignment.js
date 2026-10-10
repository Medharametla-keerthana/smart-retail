const app = require("../backend/server");

module.exports = (req, res) => {
  const tripId = String(req.query?.tripId || "");
  if (!/^[a-f\d]{24}$/i.test(tripId)) {
    return res.status(400).json({ success: false, message: "A valid tripId is required" });
  }

  req.url = `/api/trips/${tripId}/assignment`;
  return app(req, res);
};
