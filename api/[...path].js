const app = require("../backend/server");

module.exports = (req, res) => {
  const requestUrl = req.url || "/";
  const pathname = requestUrl.split("?", 1)[0];

  // Vercel's root API catch-all receives this assignment alias. Rewrite it to
  // the Express trip route because nested dynamic routes are not consistently
  // exposed by the deployed function router.
  if (pathname === "/api/trip-assignment") {
    const queryString = requestUrl.includes("?") ? requestUrl.slice(requestUrl.indexOf("?") + 1) : "";
    const tripId = String(req.query?.tripId || new URLSearchParams(queryString).get("tripId") || "");
    if (!/^[a-f\d]{24}$/i.test(tripId)) {
      return res.status(400).json({ success: false, message: "A valid tripId is required" });
    }
    req.url = `/api/trips/${tripId}/assignment`;
  } else if (pathname !== "/api" && !pathname.startsWith("/api/")) {
    const queryIndex = requestUrl.indexOf("?");
    const query = queryIndex >= 0 ? requestUrl.slice(queryIndex) : "";
    req.url = `/api${pathname === "/" ? "" : pathname}${query}`;
  }

  return app(req, res);
};
