Feature: Creating root streams

  Scenario: Load the root streams as a new user
    Given There is a single User "A"
    When User "A" requests the root streams
    Then User "A" has no streams

  Scenario: List a newly created stream and check another user can't see it
    Given There are two users, User "A" and User "B"
    And User "A" created root stream "A"
    When User "A" requests the root streams
    And User "B" requests the root streams
    Then User "A" will have a stream named "A"
    And User "B" has no streams

  Scenario: Newly created streams should contain a single marker event from the user joining
    Given There is a single User "A"
    And User "A" created root stream "A"
    When User "A" requests the root streams
    Then User "A" has 1 events of type "user-joined" in stream "A"

  Scenario: Events can be created in new root streams
    Given There is a single User "A"
    And User "A" created root stream "A"
    And User "A" created root stream "B"
    When User "A" creates 1 event of type "cucumber-test" in stream "A"
    And User "A" creates 1 event of type "cucumber-test2" in stream "A"
    And User "A" creates 3 event of type "cucumber-test" in stream "B"
    And User "A" creates 3 event of type "cucumber-test2" in stream "B"
    Then User "A" has 1 events of type "cucumber-test" in stream "A"
    And User "A" has 1 events of type "cucumber-test2" in stream "A"
    And User "A" has 3 events of type "cucumber-test" in stream "B"
    And User "A" has 3 events of type "cucumber-test2" in stream "B"
    
  Scenario: Users can see events in streams they join
    Given There are two users, User "A" and User "B"
    And User "A" created root stream "A"
    And User "B" joins the stream named "A" created by User "A"
    When User "A" creates 1 event of type "cucumber-test" in stream "A"
    And User "B" creates 1 event of type "cucumber-test" in stream "A"
    Then User "A" has 2 events of type "cucumber-test" in stream "A"
    And User "B" has 2 events of type "cucumber-test" in stream "A"