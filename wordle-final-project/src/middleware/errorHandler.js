function errorHandler(err, req, res, next) {
  // eslint-disable-line
  console.error(" Error:", err);

  // Mongoose duplicate key
  if (err && err.code === 11000) {
    return res.status(400).json({ message: "Duplicate value", details: err.keyValue });
  }

  // Mongoose cast error (bad ObjectId)
  if (err && err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id format" });
  }

  const status = err.statusCode || 500;
  const msg = err.message || "Internal server error";
  res.status(status).json({ message: msg });
}

module.exports = { errorHandler };
