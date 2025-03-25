import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, {
  JwtHeader,
  VerifyOptions,
  JwtPayload,
  SigningKeyCallback,
} from 'jsonwebtoken';
import jwksClient, { SigningKey } from 'jwks-rsa';
import { getCachedParameter } from '../utils/ssmUtil';
import { AuthError } from '../errors/AuthError';
import { container } from 'tsyringe';
import { UserService } from '../services/UserService';
import { NotFoundError } from '../errors/NotFoundError';
import logger from '../utils/logger';

// ✅ Extend Express Request interface to include a 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: { username: string };
    }
  }
}

/**
 * 🔐 verifyToken - Middleware to authenticate users using JWT.
 * - Retrieves the signing key from AWS Cognito's JWKS endpoint.
 * - Extracts and verifies JWT tokens from cookies or headers.
 * - Attaches the user data to the request object.
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    logger.info('🔑 [Auth] Verifying token...');

    // ✅ Fetch the Cognito User Pool ID dynamically from SSM
    const userPoolId = await getCachedParameter(
      process.env.SSM_COGNITO_USER_POOL_ID!,
    );
    const region = process.env.AWS_REGION ?? 'us-east-1';
    const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

    // ✅ Initialize the JWKS client
    const client = jwksClient({ jwksUri });

    /**
     * 🗝️ Helper function to retrieve the signing key from Cognito's JWKS endpoint.
     */
    function getKey(header: JwtHeader, callback: SigningKeyCallback): void {
      if (!header.kid) {
        logger.error("❌ [Auth] Missing 'kid' in token header");
        return callback(new Error('Missing kid in token header'));
      }

      client.getSigningKey(
        header.kid,
        (err: Error | null, key?: SigningKey) => {
          if (err) {
            logger.error('❌ [Auth] Error retrieving signing key:', err);
            return callback(err);
          }
          if (!key) {
            logger.error('❌ [Auth] Signing key not found');
            return callback(new Error('Signing key not found'));
          }

          const signingKey = key.getPublicKey();
          callback(null, signingKey);
        },
      );
    }

    // ✅ Set verification options using the dynamic issuer value
    const verifyOptions: VerifyOptions = {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      // Optionally, add audience verification:
      // audience: process.env.COGNITO_CLIENT_ID,
    };

    // ✅ Extract token from cookies or the Authorization header
    const authHeader = req.headers['authorization'];
    const token =
      req.cookies.token || (authHeader ? authHeader.split(' ')[1] : null);
    if (!token) {
      logger.warn('⚠️ [Auth] No token provided');
      return next(new AuthError('Unauthorized: No token provided'));
    }

    // ✅ Verify the token using the JWKS client
    jwt.verify(token, getKey, verifyOptions, (err, decoded) => {
      if (err) {
        logger.error('❌ [Auth] Token verification failed', err);
        return next(new AuthError('Invalid token'));
      }

      // ✅ Ensure decoded is an object (not a string)
      if (!decoded || typeof decoded === 'string') {
        return next(new AuthError('Invalid token payload'));
      }

      // ✅ Safely assert the type of decoded
      const payload = decoded as JwtPayload;

      // ✅ Ensure the expected property exists (e.g., "name" as username)
      if (!payload.name) {
        logger.warn('⚠️ [Auth] Token payload missing username');
        return next(new AuthError('Token payload missing username'));
      }

      // ✅ Attach the decoded payload to the request object
      req.user = { username: payload.name };
      logger.info(`✅ [Auth] Token verified. User: ${payload.name}`);
      next();
    });
  } catch (error) {
    logger.error(
      '❌ [Auth] Token verification failed due to misconfiguration:',
      error,
    );
    next(new AuthError('Token verification configuration failed'));
  }
};

/**
 * 🚀 authorize - Middleware to authorize a user based on a required role.
 * @param requiredRole - The role required to access the route.
 * - Ensures the authenticated user has the correct role.
 */
export function authorize(requiredRole: string): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      logger.info(`🔒 [Auth] Authorizing user for role: ${requiredRole}`);

      if (!req.user) {
        logger.warn('⚠️ [Auth] No user data found in request');
        return next(new AuthError('Unauthorized: No user data'));
      }

      const userService = container.resolve(UserService);

      // ✅ Fetch user data from the database or service
      const user = await userService.findByUsername(req.user.username);
      if (!user) {
        logger.warn(`⚠️ [Auth] User not found: ${req.user.username}`);
        return next(new NotFoundError('User not found'));
      }

      // ✅ Check if the user's role matches the required role
      if (user.role !== requiredRole) {
        logger.warn(`⚠️ [Auth] Access denied for user: ${req.user.username}`);
        return next(new AuthError('Forbidden: You don’t have permission'));
      }

      logger.info(`✅ [Auth] User authorized: ${req.user.username}`);
      next();
    } catch (error) {
      logger.error(
        '❌ [Auth] Authorization failed due to internal error:',
        error,
      );
      next(new AuthError('Internal server error'));
    }
  };
}
