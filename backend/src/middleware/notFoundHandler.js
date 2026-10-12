export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint '${req.method} ${req.originalUrl}' not found on this server.`,
      statusCode: 404,
    },
  });
};
