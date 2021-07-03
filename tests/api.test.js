'use strict'

const request = require('supertest')

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

const app = require('../src/app')(db)
const buildSchemas = require('../src/schemas')

const { expect } = require('chai')

describe('API tests', () => {
  before((done) => {
    db.serialize(async (err) => {
      if (err) {
        return done(err)
      }

      buildSchemas(db)

      var values = [1.1, 2.2, 3.3, 4.4, 'Night Rider', 'Screw Driver', 'Ford']

      await db.run(
        'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)',
        values
      )

      done()
    })
  })

  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
        .get('/health')
        .expect('Content-Type', /text/)
        .expect(200, done)
    })
  })

  describe('POST /rides', () => {
    it('should return error for invalid start latitude', async () => {
      const response = await request(app).post('/rides').send({
        start_lat: -1000.1,
      })

      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('VALIDATION_ERROR')
      expect(attributes.message).to.equal(
        'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      )
    })
  })

  describe('POST /rides', () => {
    it('should return error for invalid start longitude', async () => {
      const response = await request(app).post('/rides').send({
        start_lat: 10.1,
        start_long: 2000.2,
      })

      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('VALIDATION_ERROR')
      expect(attributes.message).to.equal(
        'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      )
    })
  })

  describe('POST /rides', () => {
    it('should return error for invalid stop latitude', async () => {
      const response = await request(app).post('/rides').send({
        start_lat: 10.1,
        start_long: 200.2,
        end_lat: -3000.3,
        end_long: 40.4,
      })

      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('VALIDATION_ERROR')
      expect(attributes.message).to.equal(
        'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      )
    })
  })

  describe('POST /rides', () => {
    it('should return error for invalid stop longitude', async () => {
      const response = await request(app).post('/rides').send({
        start_lat: 10.1,
        start_long: 200.2,
        end_lat: 30.3,
        end_long: 4000.4,
      })

      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('VALIDATION_ERROR')
      expect(attributes.message).to.equal(
        'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
      )
    })
  })

  describe('POST /rides', () => {
    it('should return error for empty riderName', async () => {
      const response = await request(app).post('/rides')
      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('VALIDATION_ERROR')
      expect(attributes.message).to.equal(
        'Rider name must be a non empty string'
      )
    })
  })

  describe('POST /rides', () => {
    it('should return error for empty riderName', async () => {
      const response = await request(app).post('/rides').send({
        rider_name: 'testRider',
      })

      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('VALIDATION_ERROR')
      expect(attributes.message).to.equal(
        'Driver name must be a non empty string'
      )
    })
  })

  describe('POST /rides', () => {
    it('should return error for empty riderName', async () => {
      const response = await request(app).post('/rides').send({
        rider_name: 'testRider',
        driver_name: 'testDriver',
      })
      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('VALIDATION_ERROR')
      expect(attributes.message).to.equal(
        'Driver vehicle must be a non empty string'
      )
    })
  })

  describe('POST /rides', () => {
    it('should fail to create ride', async () => {
      const response = await request(app).post('/rides').send({
        rider_name: 'Lone Rider',
        driver_name: 'Baby Driver',
        driver_vehicle: 'Mustang',
      })
      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('SERVER_ERROR')
      expect(attributes.message).to.equal('Unknown error')
    })
  })

  describe('POST /rides', () => {
    it('should create ride', async () => {
      const response = await request(app).post('/rides').send({
        start_lat: 10.1,
        start_long: 20.2,
        end_lat: 30.3,
        end_long: 40.4,
        rider_name: 'Lone Rider',
        driver_name: 'Baby Driver',
        driver_vehicle: 'Mustang',
      })
      expect(response.status).to.equal(200)
      expect(response.body).is.lengthOf(1)

      const attributes = response.body[0]
      expect(attributes).to.include.keys(
        'rideID',
        'startLat',
        'startLong',
        'endLat',
        'endLong',
        'riderName',
        'driverName',
        'driverVehicle',
        'created'
      )
      expect(attributes.startLat).to.equal(10.1)
      expect(attributes.startLong).to.equal(20.2)
      expect(attributes.endLat).to.equal(30.3)
      expect(attributes.endLong).to.equal(40.4)
      expect(attributes.riderName).to.equal('Lone Rider')
      expect(attributes.driverName).to.equal('Baby Driver')
      expect(attributes.driverVehicle).to.equal('Mustang')
    })
  })

  describe('GET /rides', () => {
    it('should return rides with invalid page and limit values', async () => {
      const response = await request(app)
        .get('/rides')
        .query({ limit: -1, page: -1 })
      expect(response.status).to.equal(200)
      expect(response.body).to.be.an('array')

      const attributes = response.body[0]
      expect(attributes).to.include.keys(
        'rideID',
        'startLat',
        'startLong',
        'endLat',
        'endLong',
        'riderName',
        'driverName',
        'driverVehicle',
        'created'
      )
    })
  })

  describe('GET /rides', () => {
    it('should return rides', async () => {
      const response = await request(app)
        .get('/rides')
        .query({ limit: 10, page: 1 })
      expect(response.status).to.equal(200)
      expect(response.body).to.be.an('array')

      const attributes = response.body[0]
      expect(attributes).to.include.keys(
        'rideID',
        'startLat',
        'startLong',
        'endLat',
        'endLong',
        'riderName',
        'driverName',
        'driverVehicle',
        'created'
      )
    })
  })

  describe('GET /rides', () => {
    it('should should return error when invalid id', async () => {
      const response = await request(app).get('/rides/-1')
      expect(response.status).to.equal(200)

      const attributes = response.body
      expect(attributes).to.include.keys('error_code', 'message')
      expect(attributes.error_code).to.equal('RIDES_NOT_FOUND_ERROR')
      expect(attributes.message).to.equal('Could not find any rides')
    })
  })

  describe('GET /rides', () => {
    it('should return ride by id', async () => {
      const response = await request(app).get('/rides/1')
      expect(response.status).to.equal(200)
      expect(response.body).to.be.an('array')

      const attributes = response.body[0]
      expect(attributes).to.include.keys(
        'rideID',
        'startLat',
        'startLong',
        'endLat',
        'endLong',
        'riderName',
        'driverName',
        'driverVehicle',
        'created'
      )
      expect(attributes.startLat).to.equal(1.1)
      expect(attributes.startLong).to.equal(2.2)
      expect(attributes.endLat).to.equal(3.3)
      expect(attributes.endLong).to.equal(4.4)
      expect(attributes.riderName).to.equal('Night Rider')
      expect(attributes.driverName).to.equal('Screw Driver')
      expect(attributes.driverVehicle).to.equal('Ford')
    })
  })
})
