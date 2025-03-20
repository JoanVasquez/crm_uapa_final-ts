import { createLogger, format, transports } from 'winston';

// Mock winston modules
jest.mock('winston', () => ({
  createLogger: jest.fn(),
  format: {
    timestamp: jest.fn().mockReturnValue('timestampFormat'),
    colorize: jest.fn().mockReturnValue('colorizeFormat'),
    printf: jest.fn().mockReturnValue('printfFormat'),
    combine: jest.fn().mockReturnValue('combinedFormat'),
    errors: jest.fn().mockReturnValue('errorsFormat'),
    splat: jest.fn().mockReturnValue('splatFormat'),
    json: jest.fn().mockReturnValue('jsonFormat'),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Move the logger import after the mocks
import { consoleFormat } from './../../utils/logger';

// Add type assertions for the mocked functions
const mockedFormat = format as jest.Mocked<typeof format>;
const mockedCreateLogger = createLogger as jest.Mock;
const mockedTransports = transports as jest.Mocked<typeof transports>;

describe('Logger Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-import the logger in beforeEach to ensure the mocks are used
    jest.isolateModules(() => {
      require('./../../utils/logger');
    });
  });

  describe('consoleFormat', () => {
    it('should create console format with correct configuration', () => {
      expect(mockedFormat.timestamp).toHaveBeenCalledWith({
        format: 'YYYY-MM-DD HH:mm:ss',
      });
      expect(mockedFormat.colorize).toHaveBeenCalled();
      expect(mockedFormat.printf).toHaveBeenCalled();
      expect(mockedFormat.combine).toHaveBeenCalled();
    });

    it('should format log messages correctly', () => {
      // Create a mock printf function
      const mockPrintfFn = jest.fn();
      (mockedFormat.printf as jest.Mock).mockImplementation((fn) => {
        mockPrintfFn.mockImplementation(fn);
        return mockPrintfFn;
      });

      // Re-import to trigger the printf implementation
      jest.isolateModules(() => {
        require('./../../utils/logger');
      });

      const mockLog = {
        timestamp: '2023-12-25 10:00:00',
        level: 'info',
        message: 'Test message',
      };

      const printfFn = (mockedFormat.printf as jest.Mock).mock.calls[0][0];
      const result = printfFn(mockLog);
      expect(result).toBe('[2023-12-25 10:00:00] info: Test message');
    });

    it('should include stack trace when present', () => {
      // Create a mock printf function
      const mockPrintfFn = jest.fn();
      (mockedFormat.printf as jest.Mock).mockImplementation((fn) => {
        mockPrintfFn.mockImplementation(fn);
        return mockPrintfFn;
      });

      // Re-import to trigger the printf implementation
      jest.isolateModules(() => {
        require('./../../utils/logger');
      });

      const mockLog = {
        timestamp: '2023-12-25 10:00:00',
        level: 'error',
        message: 'Error message',
        stack: 'Error stack trace',
      };

      const printfFn = (mockedFormat.printf as jest.Mock).mock.calls[0][0];
      const result = printfFn(mockLog);
      expect(result).toBe(
        '[2023-12-25 10:00:00] error: Error message\n🛠️ "Error stack trace"',
      );
    });
  });

  describe('logger instance', () => {
    it('should create logger with correct configuration', () => {
      expect(mockedCreateLogger).toHaveBeenCalledWith({
        level: 'info',
        format: 'combinedFormat',
        transports: expect.any(Array),
      });
    });

    it('should configure correct number of transports', () => {
      const loggerConfig = mockedCreateLogger.mock.calls[0][0];
      expect(loggerConfig.transports).toHaveLength(3);
    });

    it('should configure console transport correctly', () => {
      expect(mockedTransports.Console).toHaveBeenCalledWith({
        format: consoleFormat,
      });
    });

    it('should configure error file transport correctly', () => {
      expect(mockedTransports.File).toHaveBeenCalledWith({
        filename: 'logs/error.log',
        level: 'error',
      });
    });

    it('should configure combined file transport correctly', () => {
      expect(mockedTransports.File).toHaveBeenCalledWith({
        filename: 'logs/combined.log',
      });
    });
  });
});
