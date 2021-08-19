Feature: List root streams

  Scenario: Load the root streams as a new user
    Given I am user A
    When I request the root streams
    Then There will be no streams

  Scenario: List a newly created stream and check another user can't see it
    Given I am user A
    When I create a root stream named "test"
    Then There is a stream named "test"
    And User B has no streams