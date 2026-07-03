// Simple test script for eventController date validation
// Run with: node backend/scripts/unit_test_eventController_date_validation.js

const path = require('path');
// require the controller with absolute path
const controller = require(path.resolve(__dirname, '..', 'controllers', 'eventController'));

// Mock the Event model methods used by controller
const Event = require(path.resolve(__dirname, '..', 'models', 'Event'));

// Save originals to restore later
const origCreate = Event.create;
const origFindByIdAndUpdate = Event.findByIdAndUpdate;

// Mock implementations
Event.create = async (data) => {
  // pretend Mongo returned created event with _id
  return Object.assign({ _id: 'mocked_event_id' }, data);
};
Event.findByIdAndUpdate = async (id, updateData, opts) => {
  if (id === 'nonexistent') return null;
  return Object.assign({ _id: id }, updateData);
};

// Simple fake req/res helpers
function makeRes() {
  let statusCode = 200;
  return {
    status(code) { statusCode = code; return this; },
    json(payload) { console.log('RES', statusCode, JSON.stringify(payload)); return payload; }
  };
}

async function run() {
  console.log('Test 1: Missing date -> expect 400');
  const req1 = { body: { title: 't1', description: 'd', venue: 'v' }, userId: 'user1', file: null };
  const res1 = makeRes();
  await controller.createEvent(req1, res1);

  console.log('\nTest 2: Invalid date -> expect 400');
  const req2 = { body: { title: 't2', description: 'd', venue: 'v', date: 'not-a-date' }, userId: 'user1', file: null };
  const res2 = makeRes();
  await controller.createEvent(req2, res2);

  console.log('\nTest 3: Valid date -> expect 201');
  const req3 = { body: { title: 't3', description: 'd', venue: 'v', date: '2025-10-14T13:30' }, userId: 'user1', file: null };
  const res3 = makeRes();
  await controller.createEvent(req3, res3);

  console.log('\nTest 4: Update event with invalid date -> expect 400');
  const req4 = { body: { date: 'bad-date' }, params: { id: 'someid' } };
  const res4 = makeRes();
  await controller.updateEvent(req4, res4);

  console.log('\nTest 5: Update event with valid date -> expect 200');
  const req5 = { body: { date: '2025-12-01T09:00' }, params: { id: 'someid' } };
  const res5 = makeRes();
  await controller.updateEvent(req5, res5);

  // restore
  Event.create = origCreate;
  Event.findByIdAndUpdate = origFindByIdAndUpdate;
}

run().catch(err => console.error(err));
