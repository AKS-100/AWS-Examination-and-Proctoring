/**
 * Adapts an Express (req, res) handler into an AWS Lambda (event, context) invocation
 * Accurately mimics Amazon API Gateway HTTP API payload v2
 */
export const expressToLambda = (lambdaHandler) => async (req, res, next) => {
  try {
    const event = {
      version: '2.0',
      routeKey: `${req.method} ${req.path}`,
      rawPath: req.path,
      rawQueryString: req.url.split('?')[1] || '',
      headers: req.headers,
      queryStringParameters: req.query || {},
      requestContext: {
        http: {
          method: req.method,
          path: req.path,
          protocol: req.protocol,
          sourceIp: req.ip,
          userAgent: req.get('user-agent'),
        },
        authorizer: {
          jwt: {
            claims: req.user || {
              sub: req.headers['x-cognito-sub'] || 'usr-local-dev',
              email: req.headers['x-cognito-email'] || 'dev@example.com',
              'custom:role': req.headers['x-cognito-role'] || 'student',
            },
          },
        },
      },
      body: req.body,
      isBase64Encoded: false,
    };

    const context = {
      functionName: lambdaHandler.name || 'apiGatewayHandler',
      awsRequestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };

    const result = await lambdaHandler(event, context);

    if (result && typeof result === 'object' && result.statusCode) {
      if (result.headers) {
        Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
      }
      const parsedBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      return res.status(result.statusCode).json(parsedBody);
    }

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export default expressToLambda;
