'use strict'

const express = require('express')
const app = express()
const port = 8010

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const logger = require('./logger')

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

const buildSchemas = require('./src/schemas')

const swaggerUI = require('swagger-ui-express')
const swaggerJsDoc = require('swagger-jsdoc')

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Coding Test API',
      version: '1.0.0',
      description: 'Test APIs for Xendit',
    },
    servers: [
      {
        url: 'http://localhost:8010',
      },
    ],
  },
  apis: ['./src/app.js'],
}

const swaggerSpecs = swaggerJsDoc(swaggerOptions)

db.serialize(() => {
  buildSchemas(db)

  const app = require('./src/app')(db)

  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs))

  app.listen(port, () =>
    logger.info(`App started and listening on port ${port}`)
  )
})
