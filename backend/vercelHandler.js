const app = require("./server");

module.exports = (mountPath) => (req, res) => {
  const requestUrl = req.url || "/";
  const pathname = requestUrl.split("?", 1)[0];
  const routePath = mountPath.replace(/^\/api/, "");

  // Resource-level Vercel functions may receive only the path after their
  // directory. Restore the Express /api mount path in that case.
  if (pathname !== mountPath && !pathname.startsWith(`${mountPath}/`)) {
    const queryIndex = requestUrl.indexOf("?");
    const query = queryIndex >= 0 ? requestUrl.slice(queryIndex) : "";
    if (pathname === routePath || pathname.startsWith(`${routePath}/`)) {
      req.url = `/api${pathname}${query}`;
    } else {
      const suffix = pathname === "/" ? "" : pathname.startsWith("/") ? pathname : `/${pathname}`;
      req.url = `${mountPath}${suffix}${query}`;
    }
  }

  return app(req, res);
};
