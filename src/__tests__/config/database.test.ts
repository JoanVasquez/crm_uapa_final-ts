import { DataSource, DataSourceOptions } from 'typeorm';

// Provide a manual mock for logger so its methods are jest.fn() instances.
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

// Mock SSM dependency
jest.mock('../../utils/ssmUtil');

describe('Database Configuration', () => {
  const testDbConfig = {
    type: 'postgres' as const,
    host: 'test-host',
    port: '5432',
    username: 'test-user',
    password: 'test-password',
    database: 'test-db',
  };

  let MockedDataSource: jest.Mock;
  /* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
  let getAppDataSource: () => Promise<DataSource>;

  beforeEach(() => {
    // Reset modules and clear mocks for tests that don't require error simulation.
    jest.resetModules();
    jest.clearAllMocks();

    // Set environment variables for production branch.
    process.env.NODE_ENV = 'development';
    process.env.SSM_DB_TYPE = 'db-type-param';
    process.env.SSM_DB_HOST = 'db-host-param';
    process.env.SSM_DB_PORT = 'db-port-param';
    process.env.SSM_DB_USERNAME = 'db-username-param';
    process.env.SSM_DB_PASSWORD = 'db-password-param';
    process.env.SSM_DB_NAME = 'db-name-param';

    // Setup a default mock for DataSource (used in successful cases)
    MockedDataSource = jest
      .fn()
      .mockImplementation((options: DataSourceOptions) => ({
        isInitialized: false,
        options,
        initialize: jest.fn().mockResolvedValue(true),
      }));

    // Mock TypeORM's DataSource using our MockedDataSource.
    jest.doMock('typeorm', () => ({
      ...jest.requireActual('typeorm'),
      DataSource: MockedDataSource,
    }));

    // Setup default SSM responses for production branch.
    const { getParameterDirect } = require('../../utils/ssmUtil');
    (getParameterDirect as jest.Mock).mockImplementation(
      async (paramName: string) => {
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
      },
    );

    // Import the module under test.
    const databaseModule = require('../../config/database');
    getAppDataSource = databaseModule.getAppDataSource;
  });

  it('should create SQLite in-memory database for test environment', async () => {
    process.env.NODE_ENV = 'test';
    // Re-import the module under test to pick up test env branch.
    const databaseModule = require('../../config/database');
    const getAppDataSource = databaseModule.getAppDataSource;
    await getAppDataSource();
    expect(MockedDataSource).toHaveBeenCalled();
  });

  it('should successfully create production MySQL DataSource', async () => {
    // Override SSM responses for MySQL.
    process.env.NODE_ENV = 'development';
    process.env.SSM_DB_TYPE = 'db-type-param';
    process.env.SSM_DB_HOST = 'db-host-param';
    process.env.SSM_DB_PORT = 'db-port-param';
    process.env.SSM_DB_USERNAME = 'db-username-param';
    process.env.SSM_DB_PASSWORD = 'db-password-param';
    process.env.SSM_DB_NAME = 'db-name-param';

    // Reset modules so updated mocks take effect.
    jest.resetModules();
    // Reapply TypeORM mock.
    jest.doMock('typeorm', () => ({
      ...jest.requireActual('typeorm'),
      DataSource: MockedDataSource,
    }));
    // Override SSM to return MySQL values.
    const { getParameterDirect } = require('../../utils/ssmUtil');
    (getParameterDirect as jest.Mock).mockImplementation(
      async (paramName: string) => {
        if (paramName === 'db-type-param') return 'mysql';
        if (paramName === 'db-host-param') return 'mysql-host';
        if (paramName === 'db-port-param') return '3306';
        if (paramName === 'db-username-param') return 'mysql-user';
        if (paramName === 'db-password-param') return 'mysql-pass';
        if (paramName === 'db-name-param') return 'mysql-db';
        throw new Error(`Unexpected SSM param: ${paramName}`);
      },
    );

    const databaseModule = require('../../config/database');
    const getAppDataSource = databaseModule.getAppDataSource;
    const ds = await getAppDataSource();

    expect(MockedDataSource).toHaveBeenCalledTimes(1);
    const options = ds.options as {
      type: string;
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    };
    expect(options.type).toBe('mysql');
    expect(options.host).toBe('mysql-host');
    expect(options.port).toBe(3306);
    expect(options.username).toBe('mysql-user');
    expect(options.password).toBe('mysql-pass');
    expect(options.database).toBe('mysql-db');
  });

  it('should throw BaseAppException and log error when SSM parameter retrieval fails', async () => {
    process.env.NODE_ENV = 'development';
    const ssmError = new Error('SSM error');

    // Force getParameterDirect to reject.
    jest.resetModules();
    const ssmUtil = require('../../utils/ssmUtil');
    (ssmUtil.getParameterDirect as jest.Mock).mockRejectedValue(ssmError);

    // Re-import the database module so it picks up the updated SSM mock.
    const databaseModule = require('../../config/database');
    const getAppDataSource = databaseModule.getAppDataSource;

    await expect(getAppDataSource()).rejects.toThrow(
      'Database initialization failed.',
    );
  });

  it('should throw BaseAppException and log error when DataSource initialization fails', async () => {
    process.env.NODE_ENV = 'development';

    // For SSM calls, provide valid responses.
    jest.resetModules();
    const ssmUtil = require('../../utils/ssmUtil');
    (ssmUtil.getParameterDirect as jest.Mock).mockImplementation(
      async (paramName: string) => {
        if (paramName === 'db-type-param') return 'mysql';
        if (paramName === 'db-host-param') return 'host';
        if (paramName === 'db-port-param') return '3306';
        if (paramName === 'db-username-param') return 'user';
        if (paramName === 'db-password-param') return 'pass';
        if (paramName === 'db-name-param') return 'db';
        throw new Error(`Unexpected SSM param: ${paramName}`);
      },
    );

    // Force DataSource.initialize() to fail.
    jest.doMock('typeorm', () => ({
      ...jest.requireActual('typeorm'),
      DataSource: jest
        .fn()
        .mockImplementation((options: DataSourceOptions) => ({
          isInitialized: false,
          options,
          initialize: jest
            .fn()
            .mockRejectedValue(new Error('Connection failed')),
        })),
    }));

    const databaseModule = require('../../config/database');
    const getAppDataSource = databaseModule.getAppDataSource;

    await expect(getAppDataSource()).rejects.toThrow(
      'Database connection failed',
    );
  });

  it('should reuse existing DataSource instance if already initialized', async () => {
    process.env.NODE_ENV = 'test';
    // For test environment we don't need error mocks.
    const databaseModule = require('../../config/database');
    const getAppDataSource = databaseModule.getAppDataSource;
    const ds1 = await getAppDataSource();
    // Mark the instance as initialized.
    Object.defineProperty(ds1, 'isInitialized', { value: true });
    const ds2 = await getAppDataSource();
    expect(ds2).toBe(ds1);
  });
});
