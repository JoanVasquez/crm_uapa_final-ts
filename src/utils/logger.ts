import { createLogger, format, transports } from 'winston';

/**
 * 🎨 Custom Console Logging Format
 * - Adds timestamp in "YYYY-MM-DD HH:mm:ss" format.
 * - Colors log levels for better readability.
 * - Includes stack traces when errors occur.
 */
export const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize(), // 🟢 Green for info, 🔴 Red for errors, etc.
  format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level}: ${message}${
      stack ? `\n🛠️ ${JSON.stringify(stack)}` : ''
    }`;
  }),
);

/**
 * 📝 Logger Configuration
 * - Logs INFO and above to the console.
 * - Stores ERROR logs separately in "logs/error.log".
 * - Stores all logs in "logs/combined.log" in JSON format.
 */
const logger = createLogger({
  level: 'info', // Default log level
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Include stack traces in error logs
    format.splat(), // Enables printf-style formatting
    format.json(), // JSON format for file logs
  ),
  transports: [
    // 🖥️ Console transport with custom formatting
    new transports.Console({
      format: consoleFormat,
    }),
    // 📂 File transports using JSON format
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // Logs errors separately
    new transports.File({ filename: 'logs/combined.log' }), // Logs everything
  ],
});

export default logger;
