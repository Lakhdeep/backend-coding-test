const { createLogger, transports, format } = require('winston')
const { timestamp, combine, json, printf, errors } = format

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`
})

exports.devLogger = () => {
  return createLogger({
    format: combine(
      format.colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logs/dev.log' }),
    ],
  })
}

exports.prodLogger = () => {
  return createLogger({
    format: combine(timestamp(), errors({ stack: true }), json()),
    defaultMeta: { service: 'ride-service' },
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logs/prod.log' }),
    ],
  })
}
