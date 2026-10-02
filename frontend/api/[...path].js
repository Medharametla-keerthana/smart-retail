const app = require("../backend/server");

module.exports = (req, res) => {
  const requestUrl = req.url || "/";
  const pathname = requestUrl.split("?", 1)[0];
  if (pathname !== "/api" && !pathname.startsWith("/api/")) {
    req.url = `/api${pathname === "/" ? "" : pathname}${requestUrl.slice(pathname.length)}`;
  }
  return app(req, res);
};
