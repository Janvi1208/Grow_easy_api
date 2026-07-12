export function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);

  if (err.name === "MulterError") {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
