'use strict'

const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const logger = require('../logger')

/**
 * @swagger
 * tags:
 *  name: Ride
 *  description: Ride management APIs
 */

module.exports = (db) => {
  /**
   * @swagger
   * /health:
   *  get:
   *    tags: [Ride]
   *    summary: check server health
   *    responses:
   *      200:
   *        description: healthy
   *
   */
  app.get('/health', (req, res) => res.send('Healthy'))

  /**
   * @swagger
   * /rides:
   *  post:
   *    tags: [Ride]
   *    summary: create ride
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/Create_Ride'
   *    responses:
   *      200:
   *        description: ride created
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/components/schemas/Ride'
   *
   */
  app.post('/rides', jsonParser, async (req, res) => {
    try {
      const startLatitude = Number(req.body.start_lat)
      const startLongitude = Number(req.body.start_long)
      const endLatitude = Number(req.body.end_lat)
      const endLongitude = Number(req.body.end_long)
      const riderName = req.body.rider_name
      const driverName = req.body.driver_name
      const driverVehicle = req.body.driver_vehicle

      if (
        startLatitude < -90 ||
        startLatitude > 90 ||
        startLongitude < -180 ||
        startLongitude > 180
      ) {
        throw new Error(
          'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
        )
      }

      if (
        endLatitude < -90 ||
        endLatitude > 90 ||
        endLongitude < -180 ||
        endLongitude > 180
      ) {
        throw new Error(
          'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
        )
      }

      if (typeof riderName !== 'string' || riderName.length < 1) {
        throw new Error('Rider name must be a non empty string')
      }

      if (typeof driverName !== 'string' || driverName.length < 1) {
        throw new Error('Driver name must be a non empty string')
      }

      if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
        throw new Error('Driver vehicle must be a non empty string')
      }
    } catch (err) {
      logger.error(new Error(`VALIDATION_ERROR: ${err.message}`))
      return res.send({
        error_code: 'VALIDATION_ERROR',
        message: err.message,
      })
    }

    var values = [
      req.body.start_lat,
      req.body.start_long,
      req.body.end_lat,
      req.body.end_long,
      req.body.rider_name,
      req.body.driver_name,
      req.body.driver_vehicle,
    ]

    try {
      const createResult = await db.run(
        'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)',
        values
      )

      const rows = await db.all(
        'SELECT * FROM Rides WHERE rideID = ?',
        createResult.lastID
      )
      return res.send(rows)
    } catch (err) {
      logger.error(err)
      await res.send({
        error_code: 'SERVER_ERROR',
        message: 'Unknown error',
      })
    }
  })

  /**
   * @swagger
   * /rides:
   *  get:
   *    tags: [Ride]
   *    summary: get all rides
   *    parameters:
   *     - in: query
   *       name: page
   *       schema:
   *         type: integer
   *       description: The number of items to skip before starting to collect the result set
   *     - in: query
   *       name: limit
   *       schema:
   *         type: integer
   *       description: The numbers of items to return
   *    responses:
   *      200:
   *        description: query executed successfully
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/components/schemas/Ride'
   *
   */
  app.get('/rides', async (req, res) => {
    let { limit = 10, page = 1 } = req.query

    if (limit < 1 || limit > 50) limit = 10
    if (page < 1) page = 1

    try {
      const offset = (page - 1) * limit
      const rows = await db.all('SELECT * FROM Rides LIMIT ? OFFSET ?', [
        limit,
        offset,
      ])
      if (rows.length === 0) {
        logger.error(
          new Error('RIDES_NOT_FOUND_ERROR: Could not find any rides')
        )
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        })
      }

      return res.send(rows)
    } catch (err) {
      logger.error(err)
      await res.send({
        error_code: 'SERVER_ERROR',
        message: 'Unknown error',
      })
    }
  })

  /**
   * @swagger
   * /rides/{id}:
   *  get:
   *    tags: [Ride]
   *    summary: get ride based on id
   *    parameters:
   *      - in: path
   *        name: id
   *        schema:
   *          type: integer
   *        required: true
   *        description: ride id
   *    responses:
   *      200:
   *        description: query executed successfully
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/components/schemas/Ride'
   *
   */
  app.get('/rides/:id', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM Rides WHERE rideID=?', [
        req.params.id,
      ])

      if (rows.length === 0) {
        logger.error(
          new Error('RIDES_NOT_FOUND_ERROR: Could not find any rides')
        )
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        })
      }

      res.send(rows)
    } catch (err) {
      logger.error(err)
      await res.send({
        error_code: 'SERVER_ERROR',
        message: 'Unknown error',
      })
    }
  })

  return app
}

/**
 * @swagger
 * components:
 *  schemas:
 *      Create_Ride:
 *          type: object
 *          required:
 *              start_lat
 *              start_long
 *              end_lat
 *              end_long
 *              rider_name
 *              driver_name
 *              driver_vehicle
 *          properties:
 *              start_lat:
 *                  type: string
 *                  description:  latitude for start of ride
 *              start_long:
 *                  type: string
 *                  description:  longitude for start of ride
 *              end_lat:
 *                  type: string
 *                  description:  latitude for end of ride
 *              end_long:
 *                  type: string
 *                  description:  longitude for end of ride
 *              rider_name:
 *                  type: string
 *                  description:  name of rider
 *              driver_name:
 *                  type: string
 *                  description:  name of driver
 *              driver_vehicle:
 *                  type: string
 *                  description:  driver's vehicle
 *          example:
 *              start_lat: 10.10
 *              start_long: 20.20
 *              end_lat: 30.30
 *              end_long: 40.40
 *              rider_name: Lone Rider
 *              driver_name: Baby Driver
 *              driver_vehicle: Mustang
 *      Ride:
 *          type: object
 *          required:
 *              start_lat
 *              start_long
 *              end_lat
 *              end_long
 *              rider_name
 *              driver_name
 *              driver_vehicle
 *          properties:
 *              rideID:
 *                  type: integer
 *                  description: auto-generated ID for ride
 *              startLat:
 *                  type: decimal
 *                  description:  latitude for start of ride
 *              startLong:
 *                  type: decimal
 *                  description:  longitude for start of ride
 *              endLat:
 *                  type: decimal
 *                  description:  latitude for end of ride
 *              endLong:
 *                  type: decimal
 *                  description:  longitude for end of ride
 *              riderName:
 *                  type: string
 *                  description:  name of rider
 *              driverName:
 *                  type: string
 *                  description:  name of driver
 *              driverVehicle:
 *                  type: string
 *                  description:  driver's vehicle
 *              created:
 *                  type: datetime
 *                  description: time of ride creation
 *          example:
 *              rideID: 1
 *              startLat: 10.10
 *              startLong: 20.20
 *              endLat: 30.30
 *              endLong: 40.40
 *              riderName: Lone Rider
 *              driverName: Baby Driver
 *              driverVehicle: Mustang
 *              created: "2021-06-26 13:38:35"
 *
 */
