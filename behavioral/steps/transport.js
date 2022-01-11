const { createClient } = require('redis');
const {BeforeAll, Before, AfterAll, Then, When} = require("@cucumber/cucumber");
const assert = require("assert");

const queue = createClient({
    url: process.env.QUEUE_TARGET
})

const transportPrivateKey = process.env.TRANSPORT_PRIVATE_KEY

BeforeAll(async () => {
    await queue.connect()
})

Before(async () => {
    await queue.flushAll()
})

AfterAll(async () => {
    await queue.quit()
})

When('User {string} subscribes to events on stream {string} with the test-transport', async function (user, streamName) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]
    let streamUser = (await this.users[user].client.getStreamUsers(stream.id, user))[0]

    await this.users[user].client.createSubscription(streamUser.id, "test-transport")
})

When('The test-transport creates an arbitrary event in stream {string} created by {string}', async function (streamName, user) {
    const stream = this.users[user].resources.streams.filter(e => e.name === streamName)[0]

    const eventId = crypto.randomUUID()

    const sign = crypto.createSign('SHA256');
    sign.write(eventId);
    sign.end();
    const signature = sign.sign(transportPrivateKey);


    const transportResponse = {
        event: {
            id: eventId,
            stream: {
                id: stream.id
            },
            user: {
                id: user
            },
            type: "transport-message",
            transport: {
                id: "test-transport"
            }
        },
        signature: signature.toString("utf8")
    }

    let size = await queue.xAdd("return", "*", "message", JSON.stringify(transportResponse))

    assert.strictEqual(size, eventCount)
});

Then('There are {int} notifications for the test-transport', async function (eventCount) {
    let size = await queue.xLen("events")

    assert.strictEqual(size, eventCount)
});