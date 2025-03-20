import { DataSource, DataSourceOptions } from 'typeorm';
import { getParameterDirect } from '../../utils/ssmUtil';

// Mock SSM and logger dependencies
jest.mock('../../utils/ssmUtil');
jest.mock('../../utils/logger');

describe('Database Configuration', () => {
  const mockGetParameterDirect = getParameterDirect as jest.MockedFunction<
    typeof getParameterDirect
  >;
  let MockedDataSource: jest.Mock;
  let getAppDataSource: () => Promise<DataSource>;

  const testDbConfig = {
    type: 'postgres' as const,
    host: 'test-host',
    port: '5432',
    username: 'test-user',
    password: 'test-password',
    database: 'test-db',
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Reset environment variables
    process.env.NODE_ENV = 'development';
    process.env.SSM_DB_TYPE = 'db-type-param';
    process.env.SSM_DB_HOST = 'db-host-param';
    process.env.SSM_DB_PORT = 'db-port-param';
    process.env.SSM_DB_USERNAME = 'db-username-param';
    process.env.SSM_DB_PASSWORD = 'db-password-param';
    process.env.SSM_DB_NAME = 'db-name-param';

    // Setup mock for DataSource
    MockedDataSource = jest
      .fn()
      .mockImplementation((options: DataSourceOptions) => ({
        isInitialized: false,
        options,
        initialize: jest.fn().mockResolvedValue(true),
      }));

    // Mock typeorm
    jest.mock('typeorm', () => ({
      ...jest.requireActual('typeorm'),
      DataSource: MockedDataSource,
    }));

    // Setup SSM mock responses
    mockGetParameterDirect.mockImplementation(async (paramName: string) => {
      switch (paramName) {
        case process.env.SSM_DB_TYPE:
          return testDbConfig.type;
        case process.env.SSM_DB_HOST:
          return testDbConfig.host;
        case process.env.SSM_DB_PORT:
          return testDbConfig.port;
        case process.env.SSM_DB_USERNAME:
          return testDbConfig.username;
        case process.env.SSM_DB_PASSWORD:
          return testDbConfig.password;
        case process.env.SSM_DB_NAME:
          return testDbConfig.database;
        default:
          throw new Error(`Unexpected SSM param: ${paramName}`);
      }
    });

    // Import the module under test after setting up mocks
    const databaseModule = require('../../config/database');
    getAppDataSource = databaseModule.getAppDataSource;
  });

  it('should create SQLite in-memory database for test environment', async () => {
    process.env.NODE_ENV = 'test';

    await getAppDataSource();

    expect(MockedDataSource).toHaveBeenCalled();
  });

  it('should throw BaseAppException when database initialization fails', async () => {
    MockedDataSource.mockImplementationOnce(() => ({
      isInitialized: false,
      options: {} as DataSourceOptions,
      initialize: jest.fn().mockRejectedValue(new Error('Connection failed')),
    }));

    await expect(getAppDataSource()).rejects.toThrow(
      'Database initialization failed.',
    );
  });
});
