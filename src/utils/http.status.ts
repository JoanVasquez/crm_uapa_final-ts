/**
 * 📡 HTTP Status Codes Reference
 * Provides standardized HTTP response status codes for consistency across the application.
 */
const HttpStatus = {
  // ✅ Success Responses
  OK: {
    code: 200,
    status: 'OK',
    description: 'The request was successful.',
  },
  CREATED: {
    code: 201,
    status: 'CREATED',
    description: 'A new resource has been successfully created.',
  },
  NO_CONTENT: {
    code: 204,
    status: 'NO_CONTENT',
    description:
      'The request was successful, but there is no content to return.',
  },

  // ⚠️ Client Error Responses
  BAD_REQUEST: {
    code: 400,
    status: 'BAD_REQUEST',
    description: 'The server cannot process the request due to client error.',
  },
  NOT_FOUND: {
    code: 404,
    status: 'NOT_FOUND',
    description: 'The requested resource was not found on the server.',
  },

  // ❌ Server Error Responses
  INTERNAL_SERVER_ERROR: {
    code: 500,
    status: 'INTERNAL_SERVER_ERROR',
    description: 'An unexpected error occurred on the server.',
  },
};

export default HttpStatus;
