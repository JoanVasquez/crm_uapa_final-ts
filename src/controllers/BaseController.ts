import { NextFunction, Request, Response } from 'express';
import httpStatus from '../utils/http.status';
import ResponseTemplate from '../utils/response.template';
import { ICRUD } from '../services/ICRUD';
import logger from '../utils/logger';

/**
 * 📦 BaseController - A Generic Controller for CRUD Operations.
 * - Provides standard API methods (`save`, `update`, `delete`, `findById`, `findAll`, `findAllPaginated`).
 * - Uses `ICRUD` to abstract service interactions.
 * - Can be extended by specific controllers for different entities.
 */
export default abstract class BaseController {
  constructor(protected readonly baseService: ICRUD<unknown>) {
    this.baseService = baseService;
  }

  /**
   * 🆕 Saves a new entity.
   * - Uses `baseService.save()` to persist data.
   */
  save? = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      logger.info('📝 [BaseController] Creating new entity...');

      const createdEntity = await this.baseService.save(req.body);

      res
        .status(httpStatus.CREATED.code)
        .send(
          new ResponseTemplate(
            httpStatus.CREATED.code,
            httpStatus.CREATED.status,
            'CREATED',
            createdEntity,
          ),
        );
      logger.info('✅ [BaseController] Entity created successfully.');
    } catch (error) {
      logger.error('❌ [BaseController] Error creating entity:', { error });
      next(error);
    }
  };

  /**
   * ✏️ Updates an existing entity.
   * - Extracts ID from `req.params.id`.
   */
  update? = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id: number = parseInt(req.params.id);
      logger.info(`✏️ [BaseController] Updating entity with ID: ${id}`);

      const updatedEntity = await this.baseService.update(id, req.body);

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            'UPDATED',
            updatedEntity,
          ),
        );
      logger.info(`✅ [BaseController] Entity updated successfully: ${id}`);
    } catch (error) {
      logger.error(
        `❌ [BaseController] Error updating entity ID: ${req.params.id}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 🗑️ Deletes an entity by ID.
   * - Extracts ID from `req.params.id`.
   */
  delete? = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id: number = parseInt(req.params.id);
      logger.info(`🗑️ [BaseController] Deleting entity with ID: ${id}`);

      const isDeleted = await this.baseService.delete(id);

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            'DELETED',
            isDeleted,
          ),
        );
      logger.info(`✅ [BaseController] Entity deleted successfully: ${id}`);
    } catch (error) {
      logger.error(
        `❌ [BaseController] Error deleting entity ID: ${req.params.id}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 🔍 Finds an entity by ID.
   * - Extracts ID from `req.params.id`.
   */
  findById? = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id: number = parseInt(req.params.id);
      logger.info(`🔍 [BaseController] Searching for entity with ID: ${id}`);

      const entity = await this.baseService.findById(id);

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            'FOUND',
            entity,
          ),
        );
      logger.info(`✅ [BaseController] Entity found: ${id}`);
    } catch (error) {
      logger.error(
        `❌ [BaseController] Error finding entity ID: ${req.params.id}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 📋 Retrieves all entities.
   */
  findAll? = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      logger.info('📋 [BaseController] Retrieving all entities...');

      const entities = await this.baseService.findAll();

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            'FOUND',
            entities,
          ),
        );
      logger.info(`✅ [BaseController] Retrieved ${entities.length} entities.`);
    } catch (error) {
      logger.error('❌ [BaseController] Error retrieving all entities:', {
        error,
      });
      next(error);
    }
  };

  /**
   * 📊 Retrieves entities with pagination.
   * - Extracts `page` and `perPage` from `req.query`.
   */
  findAllPaginated? = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const perPage = parseInt(req.query.per_page as string, 10) || 10;
      logger.info(
        `📊 [BaseController] Fetching paginated entities: page=${page}, per_page=${perPage}`,
      );

      const entities = await this.baseService.findPaginated(page, perPage);

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            'FOUND',
            entities,
          ),
        );
      logger.info(
        `✅ [BaseController] Retrieved paginated entities: page=${page}`,
      );
    } catch (error) {
      logger.error('❌ [BaseController] Error fetching paginated entities:', {
        error,
      });
      next(error);
    }
  };
}
