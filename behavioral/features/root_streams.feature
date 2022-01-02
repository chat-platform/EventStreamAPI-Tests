Feature: Creating root streams

  Scenario: Load the root streams as a new user
    Given There is a single User "rs_A"
    When User "rs_A" requests the root streams
    Then User "rs_A" has no streams

  Scenario: List a newly created stream and check another user can't see it
    Given There are two users, User "rs_A" and User "rs_B"
    And User "rs_A" created root stream "rs_A"
    When User "rs_A" requests the root streams
    And User "rs_B" requests the root streams
    Then User "rs_A" will have a stream named "rs_A"
    And User "rs_B" has no streams

  Scenario: Newly created streams should contain a single marker event from the user joining
    Given There is a single User "rs_A"
    And User "rs_A" created root stream "rs_A"
    When User "rs_A" requests the root streams
    Then User "rs_A" has 1 events of type "user-joined" in stream "rs_A"

  Scenario: Events can be created in new root streams
    Given There is a single User "rs_A"
    And User "rs_A" created root stream "rs_A"
    And User "rs_A" created root stream "rs_B"
    When User "rs_A" creates 1 event of type "cucumber-test" in stream "rs_A"
    And User "rs_A" creates 1 event of type "cucumber-test2" in stream "rs_A"
    And User "rs_A" creates 3 event of type "cucumber-test" in stream "rs_B"
    And User "rs_A" creates 3 event of type "cucumber-test2" in stream "rs_B"
    Then User "rs_A" has 1 events of type "cucumber-test" in stream "rs_A"
    And User "rs_A" has 1 events of type "cucumber-test2" in stream "rs_A"
    And User "rs_A" has 3 events of type "cucumber-test" in stream "rs_B"
    And User "rs_A" has 3 events of type "cucumber-test2" in stream "rs_B"
    
  Scenario: Users can see events in root streams they join
    Given There are two users, User "rs_A" and User "rs_B"
    And User "rs_A" created root stream "rs_A"
    And User "rs_B" joins the stream named "rs_A" created by User "rs_A"
    When User "rs_A" creates 1 event of type "cucumber-test" in stream "rs_A"
    And User "rs_B" creates 1 event of type "cucumber-test" in stream "rs_A"
    Then User "rs_A" has 2 events of type "cucumber-test" in stream "rs_A"
    And User "rs_B" has 2 events of type "cucumber-test" in stream "rs_A"

  Scenario: Users can set their last seen event id in a root stream
    Given There is a single User "rs_A"
    And User "rs_A" created root stream "rs_A"
    When User "rs_A" sets the last seen event id on stream "rs_A"
    Then User "rs_A" has their last seen event id set for stream "rs_A"