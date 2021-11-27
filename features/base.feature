Feature: Creating root streams

  Scenario: Load the root streams as a new user
    Given I am user A
    When I request the root streams
    Then There will be no streams

  Scenario: List a newly created stream and check another user can't see it
    Given I am user A
    When I create a root stream named "test"
    Then There is a stream named "test"
    And User B has no streams

  Scenario: Newly created streams should contain a single marker event from the user joining
    Given I am user A
    When I create a root stream named "test"
    Then There are 1 events of type "user-joined" in stream "test"

  Scenario: Events can be created in new root streams
    Given I am user A
    When I create a root stream named "test"
    And I create a root stream named "test2"
    And I create 1 event of type "cucumber-test" in stream "test"
    And I create 1 event of type "cucumber-test2" in stream "test"
    And I create 3 event of type "cucumber-test" in stream "test2"
    And I create 3 event of type "cucumber-test2" in stream "test2"
    Then There are 1 events of type "cucumber-test" in stream "test"
    And There are 1 events of type "cucumber-test2" in stream "test"
    And There are 3 events of type "cucumber-test" in stream "test2"
    And There are 3 events of type "cucumber-test2" in stream "test2"