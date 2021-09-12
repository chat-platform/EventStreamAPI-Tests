const {Given, When, Then, setWorldConstructor, World } = require("@cucumber/cucumber");
const {Client} = require("eventstreamapi-sdk-ts");
const assert = require('assert');

const userA = new Client(process.env.TEST_TOKEN_A, process.env.TEST_TARGET)
const userB = new Client(process.env.TEST_TOKEN_B, process.env.TEST_TARGET)

class CustomWorld extends World {
    users = {
        "A": {
            client:    userA,
            resources: {
                streams: []
            }
        },
        "B": {
            client:    userB,
            resources: {
                streams: []
            }
        }
    }

    client = userA
    resources = {}


    loadUser(userId) {
        this.client    = this.users[userId]?.client
        this.resources = this.users[userId]?.resources
    }


    constructor(options) {
        super(options)
    }
}

setWorldConstructor(CustomWorld)

Given('I am user {word}', function (user) {
    this.loadUser(user)
})

When('I request the root streams', async function () {
    this.resources.streams = await this.client.getRootStreams()
})

When('User {word} requests the root streams', async function (user) {
    this.users[user].resources.streams = await this.users[user].client.getRootStreams()
})

When('I create a root stream named {string}', async function (name) {
    this.resources.streams.push(await this.client.createStream(name, "", false, true))
})

When('I create an event of type {string} in stream {string}', async function (eventType, streamName) {
    const stream = this.resources.streams.filter(e => e.name === streamName)[0]
    await this.client.createEvent(stream.id, eventType, null)
})

Then('There will be no streams', function () {
    assert.deepStrictEqual(this.resources.streams, [])
})

Then('There is a stream named {string}', function (name) {
    assert.strictEqual(this.resources.streams.filter(e => e.name === name).length, 1)
})

Then('User {word} has no streams', function (user) {
    assert.deepStrictEqual(this.users[user].resources.streams, [])
})
Then('There are {int} events of type {string} in stream {string}', async function (eventCount, eventType, streamName) {
    const stream = this.resources.streams.filter(e => e.name === streamName)[0]
    const events = await this.client.getEventStream(stream.id)

    assert.strictEqual(events.filter(e => e.type === eventType).length, eventCount)
});