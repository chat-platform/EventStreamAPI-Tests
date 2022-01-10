Feature: Nested streams should respect discoverability, private, and access control

  Scenario: Load the nested streams as of a new root stream
    Given There is a single User "ns_A"
    And User "ns_A" created root stream "ns_A"
    When User "ns_A" requests the children streams of stream "ns_A"
    Then User "ns_A" has no streams that are children of stream "ns_A"

  Scenario: List a newly created non-discoverable stream and check another user can't see it
    Given There are two users, User "ns_A" and User "ns_B"
    And User "ns_A" created root stream "ns_A"
    And User "ns_B" joins the stream named "ns_A" created by User "ns_A"
    And User "ns_A" created stream "ns_AA" as a child of stream "ns_A" created by "ns_A"
    When User "ns_B" requests the children streams of stream "ns_A"
    And User "ns_B" has no streams that are children of stream "ns_A"

  Scenario: Child streams should be creatable by someone that didn't create the root stream
    Given There are two users, User "ns_A" and User "ns_B"
    And User "ns_A" created root stream "ns_A"
    And User "ns_B" joins the stream named "ns_A" created by User "ns_A"
    And User "ns_B" created stream "ns_AB" as a child of stream "ns_A" created by "ns_A"
    When User "ns_A" requests the children streams of stream "ns_A"
    And User "ns_A" has no streams that are children of stream "ns_A"
    And User "ns_B" will have a stream named "ns_AB" that is a child of stream "ns_A"

  Scenario: List a newly created discoverable stream and check another user can see it
    Given There are two users, User "ns_A" and User "ns_B"
    And User "ns_A" created root stream "ns_A"
    And User "ns_B" joins the stream named "ns_A" created by User "ns_A"
    And User "ns_A" created discoverable stream "ns_AA" as a child of stream "ns_A" created by "ns_A"
    When User "ns_B" requests the children streams of stream "ns_A"
    And User "ns_B" will have a stream named "ns_AA" that is a child of stream "ns_A"
    
  Scenario: Users can't see events in child streams they haven't joined
    Given There are two users, User "ns_A" and User "ns_B"
    And User "ns_A" created root stream "ns_A"
    And User "ns_B" joins the stream named "ns_A" created by User "ns_A"
    And User "ns_A" created discoverable stream "ns_AA" as a child of stream "ns_A" created by "ns_A"
    When User "ns_A" creates 1 event of type "cucumber-test" in stream "ns_A"
    Then User "ns_B" can't see events in stream "ns_AA" created by "ns_A"

  Scenario: Newly created child streams should contain a single marker event from the user joining
    Given There is a single User "ns_A"
    And User "ns_A" created root stream "ns_A"
    When User "ns_A" created stream "ns_AA" as a child of stream "ns_A" created by "ns_A"
    Then User "ns_A" has 1 events of type "user-joined" in stream "ns_AA"

  Scenario: Users can create and see events in child streams they join
    Given There are two users, User "ns_A" and User "ns_B"
    And User "ns_A" created root stream "ns_A"
    And User "ns_B" joins the stream named "ns_A" created by User "ns_A"
    And User "ns_A" created stream "ns_AA" as a child of stream "ns_A" created by "ns_A"
    And User "ns_B" joins the stream named "ns_AA" created by User "ns_A"
    When User "ns_A" creates 1 event of type "cucumber-test" in stream "ns_AA"
    And User "ns_B" creates 1 event of type "cucumber-test" in stream "ns_AA"
    Then User "ns_A" has 2 events of type "cucumber-test" in stream "ns_AA"
    And User "ns_B" has 2 events of type "cucumber-test" in stream "ns_AA"

  Scenario: Users can set their last seen event id in a root stream
    Given There is a single User "ns_A"
    And User "ns_A" created root stream "ns_A"
    And User "ns_A" created stream "ns_AA" as a child of stream "ns_A" created by "ns_A"
    When User "ns_A" sets the last seen event id on stream "ns_AA"
    Then User "ns_A" has their last seen event id set for stream "ns_AA"