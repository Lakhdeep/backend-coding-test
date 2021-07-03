const { devLogger, prodLogger } = require('./loggers')

let logger = process.env.NODE_ENV === 'dev' ? devLogger() : prodLogger()

module.exports = logger
