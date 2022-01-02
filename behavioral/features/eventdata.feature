Feature: Event data can be set on an event

  Scenario: Short event data can be added to events
    Given There is a single User "ed_A"
    And User "ed_A" created root stream "ed_A"
    When User "ed_A" creates event of type "short" in stream "ed_A" with data "small text data"
    Then User "ed_A" has event of type "short" in stream "ed_A" with data "small text data"

  Scenario: Complex event data can be added to events
    Given There is a single User "ed_A"
    And User "ed_A" created root stream "ed_A"
    When User "ed_A" creates event of type "complex" in stream "ed_A" with data file(samples/complex_1.data)
    Then User "ed_A" has event of type "complex" in stream "ed_A" with data file(samples/complex_1.data)

  Scenario: Long string event data can be added to events
    Given There is a single User "ed_A"
    And User "ed_A" created root stream "ed_A"
    When User "ed_A" creates event of type "long" in stream "ed_A" with data file(samples/long_1.data)
    Then User "ed_A" has event of type "long" in stream "ed_A" with data file(samples/long_1.data)

  Scenario: JSON event data can be added to events
    Given There is a single User "ed_A"
    And User "ed_A" created root stream "ed_A"
    When User "ed_A" creates event of type "json" in stream "ed_A" with data file(samples/structured_1.data)
    Then User "ed_A" has event of type "json" in stream "ed_A" with data file(samples/structured_1.data)

  Scenario: Emoji event data can be added to events
    Given There is a single User "ed_A"
    And User "ed_A" created root stream "ed_A"
    When User "ed_A" creates event of type "emoji" in stream "ed_A" with data file(samples/emoji_1.data)
    Then User "ed_A" has event of type "emoji" in stream "ed_A" with data file(samples/emoji_1.data)

  Scenario: Binary event data can be added to events
    Given There is a single User "ed_A"
    And User "ed_A" created root stream "ed_A"
    When User "ed_A" creates event of type "binary" in stream "ed_A" with data binary_file(samples/binary_1.data)
    Then User "ed_A" has event of type "binary" in stream "ed_A" with data binary_file(samples/binary_1.data)
