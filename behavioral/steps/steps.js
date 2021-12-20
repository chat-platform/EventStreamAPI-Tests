const {Given, When, Then, setWorldConstructor, World, BeforeAll, AfterAll, Before} = require("@cucumber/cucumber");
const { Client } = require("eventstreamapi-sdk-ts");
const assert = require('assert');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const fs = require("fs");

const privateKey = fs.readFileSync('/jwks/private.key');

const signJwtForSubject = (subject) => {
    return jwt.sign({ }, privateKey, {
        algorithm: 'RS256',
        audience: 'test',
        issuer: 'test',
        subject: subject,
        expiresIn: '1h',
        keyid: '_HX3yPS0fRY-jaeT5Uit8pWElC3DUlVBnu2esL2vOVI'
    });
}


const userB = new Client(process.env.TEST_TOKEN_B, process.env.TEST_TARGET)

const queue = createClient({
    url: process.env.QUEUE_TARGET
})

class User {
    client = null
    resources = {}

    constructor(client) {
        this.client = client
        this.resources = {
            streams: []
        }
    }
}

class CustomWorld extends World {
    users = {
    }

    createUser(userId) {
        this.users[userId] = new User(new Client(signJwtForSubject(userId), process.env.TEST_TARGET))
    }


    constructor(options) {
        super(options)
    }
}

setWorldConstructor(CustomWorld)

BeforeAll(async () => {
    await queue.connect()
})

Before(async () => {
    await queue.flushAll()
})

AfterAll(async () => {
    await queue.quit()
})

Given('There is a single User {string}', function (userId) {
    this.createUser(userId)
})
Given('There are two users, User {string} and User {string}', function (userIdA, userIdB) {
    this.createUser(userIdA)
    this.createUser(userIdB)
})
Given('User {string} created root stream {string}', async function (user, streamName) {
    this.users[user].resources.streams.push(await this.users[user].client.createStream(streamName, "", false, false))
})


Given('User {string} joins the stream named {string} created by User {string}', async function (user, streamName, creatorUser) {
    const stream = this.users[creatorUser].resources.streams.filter(e => e.name === streamName)[0]

    await this.users[user].client.createStreamUser(stream.id, user)
    this.users[user].resources.streams.push(stream)
})

When('User {string} requests the root streams', async function (user) {
    this.users[user].resources.streams = await this.users[user].client.getRootStreams()
})


When('User {string} creates {int} event of type {string} in stream {string}', async function (user, eventCount, eventType, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const promises = []

    for (let i = 0; i < eventCount; i++) {
        promises.push(this.users[user].client.createEvent(stream.id, eventType, null))
    }

    await Promise.all(promises)
})

When('User {string} subscribes to events on stream {string} with the test-transport', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    let streamUser = (await this.users[user].client.getStreamUsers(stream.id, user))[0]

    await this.users[user].client.createSubscription(streamUser.id, "test-transport")
})

Then('User {string} will have a stream named {string}', function (user, name) {
    assert.strictEqual(this.users[user].resources.streams.filter(e => e.name === name).length, 1)
})

Then('User {string} has no streams', function (user) {
    assert.deepStrictEqual(this.users[user].resources.streams, [])
})
Then('User {string} has {int} events of type {string} in stream {string}', async function (user, eventCount, eventType, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const events = await this.users[user].client.getEventStream(stream.id)

    assert.strictEqual(events.filter(e => e.type === eventType).length, eventCount)
});
Then('There are {int} notifications for the test-transport', async function (eventCount) {
    let size = await queue.xLen("events")

    assert.strictEqual(size, eventCount)
});