Feature: Transports can receive and send events on the configured queue


  Scenario: Creating an event while subscribed generates a queue notification
    Given There is a single User "t_A"
    And User "t_A" created root stream "t_A"
    When User "t_A" subscribes to events on stream "t_A" with the test-transport
    And User "t_A" creates 1 event of type "cucumber-test" in stream "t_A"
    Then There are 1 notifications for the test-transport

  Scenario: Creating an event while two users are subscribed generates a single queue notification
    Given There are two users, User "t_A" and User "t_B"
    And User "t_A" created root stream "t_A"
    And User "t_B" joins the stream named "t_A" created by User "t_A"
    When User "t_A" subscribes to events on stream "t_A" with the test-transport
    And User "t_B" subscribes to events on stream "t_A" with the test-transport
    And User "t_A" creates 1 event of type "cucumber-test" in stream "t_A"
    Then There are 1 notifications for the test-transport