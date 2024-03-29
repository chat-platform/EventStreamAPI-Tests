const {Given, When, Then, setWorldConstructor, World, defineParameterType} = require("@cucumber/cucumber");
const { Client } = require("eventstreamapi-sdk-ts");
const assert = require('assert');
const jwt = require('jsonwebtoken');
const fs = require("fs");

const signJwtForSubject = (subject) => {
    return jwt.sign({ }, process.env.JWT_PRIVATE_KEY, {
        algorithm: 'RS256',
        audience: 'test',
        issuer: 'test',
        subject: subject,
        expiresIn: '1h',
        keyid: process.env.JWT_KEY_ID
    });
}

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
Given('User {string} created stream {string} as a child of stream {string} created by {string}', async function (user, streamName, parentName, creatorUser) {
    const parentStream = this.users[creatorUser].resources.streams.filter(e => e.name === parentName)[0]
    this.users[user].resources.streams.push(await this.users[user].client.createStream(streamName, "", false, false, parentStream.id))
})
Given('User {string} created discoverable stream {string} as a child of stream {string} created by {string}', async function (user, streamName, parentName, creatorUser) {
    const parentStream = this.users[creatorUser].resources.streams.filter(e => e.name === parentName)[0]
    this.users[user].resources.streams.push(await this.users[user].client.createStream(streamName, "", true, false, parentStream.id))
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

When('User {string} requests the children streams of stream {string}', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]

    this.users[user].resources.streams = this.users[user].resources.streams.concat(await this.users[user].client.getStreamsByParent(stream.id))
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


When('User {string} sets the last seen event id on stream {string}', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const streamUser = (await this.users[user].client.getStreamUsers(stream.id, user))[0]

    const event = await this.users[user].client.createEvent(stream.id, "arbitrary", null)

    await this.users[user].client.setLastSeenEvent(streamUser.id, event.id)
})

Then('User {string} will have a stream named {string}', function (user, name) {
    assert.strictEqual(this.users[user].resources.streams.filter(e => e.name === name).length, 1)
})
Then('User {string} will have a stream named {string} that is a child of stream {string}', function (user, name, parentStreamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === parentStreamName)[0]
    assert.strictEqual(this.users[user].resources.streams.filter(e => e.name === name && e.owner?.id === stream.id).length, 1)
})

Then('User {string} has no streams', function (user) {
    assert.deepStrictEqual(this.users[user].resources.streams, [])
})
Then('User {string} has no streams that are children of stream {string}', function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const children = this.users[user].resources.streams.filter(e => e.owner?.id === stream.id)
    assert.deepStrictEqual(children, [])
})
Then('User {string} has {int} events of type {string} in stream {string}', async function (user, eventCount, eventType, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const events = await this.users[user].client.getEventStream(stream.id)

    assert.strictEqual(events.filter(e => e.type === eventType).length, eventCount)
});
Then('User {string} can\'t see events in stream {string} created by {string}', async function (user, streamName, creatorUser) {
    const stream = this.users[creatorUser].resources.streams.filter(e => e.name === streamName)[0]

    const events = await this.users[user].client.getEventStream(stream.id)

    assert.strictEqual(events.length, 0)
});

const checkEventWithData = async function (user, eventType, streamName, data) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const events = (await this.users[user].client.getEventStream(stream.id)).filter(e => e.type === eventType && e.eventData.data === data)

    assert.strictEqual(events.length, 1)
}
Then('User {string} has event of type {string} in stream {string} with data {string}', checkEventWithData);
Then('User {string} has event of type {string} in stream {string} with data {data_file}', checkEventWithData);
Then('User {string} has event of type {string} in stream {string} with data {binary_data_file}', checkEventWithData);

Then('User {string} has their last seen event id set for stream {string}', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    const streamUser = (await this.users[user].client.getStreamUsers(stream.id, user))[0]

    assert.notStrictEqual(streamUser.lastSeenEvent, null)
});