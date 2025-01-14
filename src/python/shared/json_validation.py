from pathlib import Path
import json
from jsonschema import Draft202012Validator

SCHEMA_DIR = Path(__file__).parent.parent.parent / 'schema'


class SchemaError(Exception):
    def __init__(self, message: str, schema: str):
        super().__init__(message)
        self.schema = schema


class InvalidStructureError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


def validate(data, schema_file: str):
    # load schema
    schema_path = SCHEMA_DIR / '{}.schema.json'.format(schema_file)
    try:
        with open(schema_path, 'r') as f:
            schema = json.load(f)
    except FileNotFoundError:
        raise SchemaError('Schema not found', schema_file)
    except json.JSONDecodeError:
        raise SchemaError('Invalid schema', schema_file)
    except Exception as e:
        raise SchemaError(str(e), schema_file)

    # validate each key against schema
    # see: https://python-jsonschema.readthedocs.io/en/stable/errors/
    validator = Draft202012Validator(schema)
    validationErrors = sorted(validator.iter_errors(data), key=lambda e: e.path)

    # first check is JSON structure is correct, early exit otherwise
    if len(validationErrors) == 1 and len(validationErrors[0].absolute_path) == 0:
        error = validationErrors[0]
        message = (
            "expected type '{}'".format(error.validator_value)
            if error.validator == 'type'
            else ''
        )
        raise InvalidStructureError(message)

    collected_errors = collect_errors(validationErrors)
    return (data, collected_errors)


def collect_errors(errors):
    collected = []
    for error in errors:
        suberrors = (
            []
            if not error.context
            else sorted(error.context, key=lambda e: e.schema_path)
        )
        if len(suberrors) > 0:
            collected += collect_errors(suberrors)

        if error.validator in ['oneOf', 'anyOf']:
            continue

        if error.validator == 'required':
            # collected.append(([error.validator_value[-1]], error.validator))
            collected.append(
                (
                    list(error.absolute_path) + [error.validator_value[-1]],
                    error.validator,
                )
            )
        else:
            if len(error.relative_path) > 0:  # exclude validator 'not'
                collected.append((list(error.absolute_path), error.validator))

    return collected
