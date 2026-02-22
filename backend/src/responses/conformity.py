"""Conformity checking engine.

Evaluates answers against question reference values to determine
if the answer is conforming or non-conforming.
"""

from src.core.enums import ConformityStatus, QuestionType


def check_conformity(
    question_type: QuestionType,
    value: dict | None,
    reference_value: dict | None,
) -> ConformityStatus:
    """Check if an answer value conforms to the question's reference value."""
    if reference_value is None or value is None:
        return ConformityStatus.NOT_APPLICABLE

    try:
        checker = _CHECKERS.get(question_type)
        if checker is None:
            return ConformityStatus.NOT_APPLICABLE
        return checker(value, reference_value)
    except (KeyError, TypeError, ValueError):
        return ConformityStatus.NOT_APPLICABLE


def _check_numeric(value: dict, ref: dict) -> ConformityStatus:
    number = value.get("number")
    if number is None:
        return ConformityStatus.NOT_APPLICABLE

    number = float(number)
    operator = ref.get("operator", "between")

    if operator == "between":
        min_val = float(ref.get("min", float("-inf")))
        max_val = float(ref.get("max", float("inf")))
        return ConformityStatus.CONFORMING if min_val <= number <= max_val else ConformityStatus.NON_CONFORMING

    if operator == "eq":
        return ConformityStatus.CONFORMING if number == float(ref["value"]) else ConformityStatus.NON_CONFORMING

    if operator == "gte":
        return ConformityStatus.CONFORMING if number >= float(ref["value"]) else ConformityStatus.NON_CONFORMING

    if operator == "lte":
        return ConformityStatus.CONFORMING if number <= float(ref["value"]) else ConformityStatus.NON_CONFORMING

    if operator == "gt":
        return ConformityStatus.CONFORMING if number > float(ref["value"]) else ConformityStatus.NON_CONFORMING

    if operator == "lt":
        return ConformityStatus.CONFORMING if number < float(ref["value"]) else ConformityStatus.NON_CONFORMING

    return ConformityStatus.NOT_APPLICABLE


def _check_boolean(value: dict, ref: dict) -> ConformityStatus:
    answer = value.get("boolean")
    expected = ref.get("expected")
    if answer is None or expected is None:
        return ConformityStatus.NOT_APPLICABLE
    return ConformityStatus.CONFORMING if answer == expected else ConformityStatus.NON_CONFORMING


def _check_single_choice(value: dict, ref: dict) -> ConformityStatus:
    selected = value.get("selected")
    expected_values = ref.get("expected_values", [])
    if selected is None or not expected_values:
        return ConformityStatus.NOT_APPLICABLE
    return ConformityStatus.CONFORMING if selected in expected_values else ConformityStatus.NON_CONFORMING


def _check_multi_choice(value: dict, ref: dict) -> ConformityStatus:
    selected = set(value.get("selected", []))
    expected_values = set(ref.get("expected_values", []))
    if not selected or not expected_values:
        return ConformityStatus.NOT_APPLICABLE
    # All selected values must be within expected values
    return ConformityStatus.CONFORMING if selected <= expected_values else ConformityStatus.NON_CONFORMING


def _check_text(value: dict, ref: dict) -> ConformityStatus:
    import re
    text = value.get("text", "")
    pattern = ref.get("pattern")
    if not pattern:
        return ConformityStatus.NOT_APPLICABLE
    return ConformityStatus.CONFORMING if re.match(pattern, text) else ConformityStatus.NON_CONFORMING


_CHECKERS = {
    QuestionType.NUMERIC: _check_numeric,
    QuestionType.BOOLEAN: _check_boolean,
    QuestionType.SINGLE_CHOICE: _check_single_choice,
    QuestionType.MULTI_CHOICE: _check_multi_choice,
    QuestionType.TEXT: _check_text,
}
