const {Given, When, Then, setWorldConstructor, World, BeforeAll, AfterAll, Before, defineParameterType} = require("@cucumber/cucumber");
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

const queue = createClient({
    url: process.env.QUEUE_TARGET
})

class User {
    client = null
    resources = {}

    lastError = null

    constructor(client) {
        this.client = client
        this.resources = {
            streams: [],
            invites: []
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

defineParameterType({
    name: "data_file",
    regexp: /file\(.+\)/,
    transformer(fileName) {
        return fs.readFileSync(fileName.substr(5, fileName.length-6), 'utf8')
    }
})

defineParameterType({
    name: "binary_data_file",
    regexp: /binary_file\(.+\)/,
    transformer(fileName) {
        return Buffer.from(
            fs.readFileSync(fileName.substr(7+5, fileName.length-(7+5+1)), "binary"),
            "binary"
        ).toString("base64")
    }
})

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

Given('User {string} created private root stream {string}', async function (user, streamName) {
    this.users[user].resources.streams.push(await this.users[user].client.createStream(streamName, "", false, true))
})

Given('User {string} joins the stream named {string} created by User {string}', async function (user, streamName, creatorUser) {
    const stream = this.users[creatorUser].resources.streams.filter(e => e.name === streamName)[0]

    try {
        await this.users[user].client.createStreamUser(stream.id, user)
        this.users[user].resources.streams.push(stream)
    } catch (e) {
        this.users[user].lastError = e
    }

})
Given('User {string} created an invite for stream {string}', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]

    this.users[user].resources.invites.push(await this.users[user].client.createInvite(stream.id))
})
Given('User {string} joins the stream named {string} created by User {string} with their invite', async function (user, streamName, creatorUser) {
    const stream = this.users[creatorUser].resources.streams.filter(e => e.name === streamName)[0]
    const invite = this.users[creatorUser].resources.invites.filter(e => e.stream.id === stream.id)[0]

    try {
        await this.users[user].client.createStreamUser(stream.id, user, invite.id)
        this.users[user].resources.streams.push(stream)
    } catch (e) {
        this.users[user].lastError = e
    }

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

const createEventWithData = async function (user, eventType, streamName, data) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]

    await this.users[user].client.createEvent(stream.id, eventType, data)
}
When('User {string} creates event of type {string} in stream {string} with data {string}', createEventWithData)
When('User {string} creates event of type {string} in stream {string} with data {data_file}', createEventWithData)
When('User {string} creates event of type {string} in stream {string} with data {binary_data_file}', createEventWithData)

When('User {string} subscribes to events on stream {string} with the test-transport', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    let streamUser = (await this.users[user].client.getStreamUsers(stream.id, user))[0]

    await this.users[user].client.createSubscription(streamUser.id, "test-transport")
})

When('User {string} sets the last seen event id on stream {string}', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const streamUser = (await this.users[user].client.getStreamUsers(stream.id, user))[0]

    const event = await this.users[user].client.createEvent(stream.id, "arbitrary", null)

    await this.users[user].client.setLastSeenEvent(streamUser.id, event.id)
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

const checkEventWithData = async function (user, eventType, streamName, data) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const events = (await this.users[user].client.getEventStream(stream.id)).filter(e => e.type === eventType && e.eventData.data === data)

    assert.strictEqual(events.length, 1)
}
Then('User {string} has event of type {string} in stream {string} with data {string}', checkEventWithData);
Then('User {string} has event of type {string} in stream {string} with data {data_file}', checkEventWithData);
Then('User {string} has event of type {string} in stream {string} with data {binary_data_file}', checkEventWithData);

Then('There are {int} notifications for the test-transport', async function (eventCount) {
    let size = await queue.xLen("events")

    assert.strictEqual(size, eventCount)
});
Then('User {string} has their last seen event id set for stream {string}', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const streamUser = (await this.users[user].client.getStreamUsers(stream.id, user))[0]

    assert.notStrictEqual(streamUser.lastSeenEvent, null)
});