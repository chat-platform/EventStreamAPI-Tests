Feature: Transports can receive and send events on the configured queue


  Scenario: Creating an event while subscribed generates a queue notification
    Given There is a single User "A"
    And User "A" created root stream "A"
    When User "A" subscribes to events on stream "A" with the test-transport
    And User "A" creates 1 event of type "cucumber-test" in stream "A"
    Then There are 1 notifications for the test-transport

  Scenario: Creating an event while two users are subscribed generates a single queue notification
    Given There are two users, User "A" and User "B"
    And User "A" created root stream "A"
    And User "B" joins the stream named "A" created by User "A"
    When User "A" subscribes to events on stream "A" with the test-transport
    And User "B" subscribes to events on stream "A" with the test-transport
    And User "A" creates 1 event of type "cucumber-test" in stream "A"
    Then There are 1 notifications for the test-transport