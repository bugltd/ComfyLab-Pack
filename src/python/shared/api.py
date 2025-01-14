import json
import json5
import yaml
import pyaml
import mimetypes
from pathlib import Path
from aiohttp.web import Request, json_response
from server import PromptServer

from ..shared.json_validation import validate, SchemaError, InvalidStructureError

routes = PromptServer.instance.routes


def send_success(**kwargs):
    return json_response({**kwargs}, status=200)


def send_error(status: int, reason: str = None, **kwargs):
    return json_response({**kwargs}, status=status, reason=reason)


class ParseError(Exception):
    pass


# Parse content, either as JSON or YAML
def parse(raw: str):
    try:
        parsed = json5.loads(raw)
        prettified = json.dumps(parsed, sort_keys=False, indent=2)
        return ('json', parsed, prettified)
    except Exception:
        pass
    try:
        parsed = yaml.safe_load(raw)
        prettified = pyaml.dump(
            parsed,
            sort_keys=False,
        )
        return ('yaml', parsed, prettified)
    except Exception:
        pass
    raise ParseError('parse error')


# Convert data, either to JSON or YAML
def convert(data, format: str) -> str:
    if format == 'json':
        return json.dumps(data, sort_keys=False, indent=2)
    elif format == 'yaml':
        return pyaml.dump(
            data,
            sort_keys=False,
        )


@routes.post('/comfylab/load_file')
async def load_file(request: Request):
    try:
        body = await request.json()
        if not 'path' in body.keys():
            return send_error(
                status=500,
                reason='Path missing in request',
                path='',
            )
        path = body['path']
        with open(path, 'r') as f:
            content = f.read()
        filename = Path(path).name
        mime, encoding = mimetypes.guess_type(path)
        return send_success(
            path=path, filename=filename, content=content, mime=mime, encoding=encoding
        )
    except FileNotFoundError:
        return send_error(status=404, reason='File not found', path=path)
    except Exception as e:
        return send_error(status=500, reason=str(e), path=body['path'] or '')


@routes.post('/comfylab/config_parse')
async def config_parse(request: Request):
    try:
        body = await request.json()
        if not 'raw' in body.keys():
            return send_error(
                status=500,
                reason='Content missing in request',
            )
        raw = body['raw']
        (type, data, prettified) = parse(raw)
    except ParseError:
        return send_error(status=415, reason='Malformed file')
    except Exception as e:
        return send_error(status=500, reason=str(e))
    return send_success(type=type, data=data, prettified=prettified)


@routes.post('/comfylab/config_convert')
async def config_convert(request: Request):
    try:
        body = await request.json()
        if not 'data' in body.keys():
            return send_error(
                status=500,
                reason='Data missing in request',
            )
        if not 'format' in body.keys():
            return send_error(
                status=500,
                reason='Format missing in request',
            )
        data = body['data']
        format = body['format']
        prettified = convert(data, format)
    except Exception as e:
        return send_error(status=500, reason=str(e))
    return send_success(prettified=prettified)


@routes.post('/comfylab/config_validate')
async def config_validate(request: Request):
    try:
        body = await request.json()
        if not 'raw' in body.keys():
            return send_error(status=500, reason='Raw data missing in request')
        if not 'schema' in body.keys():
            return send_error(status=500, reason='Schema missing in request')

        raw = body['raw']
        schema_file = body['schema']
        (_, data, _) = parse(raw)
    except ParseError:
        return send_error(status=415, reason='Malformed data')
    except Exception as e:
        return send_error(status=500, reason=str(e), schema=schema_file)

    # validate JSON data
    try:
        (data, errors) = validate(data, schema_file)
        return send_success(schema=schema_file, data=data, errors=errors)
    except SchemaError as e:
        # invalid schema
        return send_error(status=500, reason=str(e), schema=schema_file)
    except InvalidStructureError as e:
        # invalid schema
        return send_error(
            status=415,
            reason='Invalid structure',
            schema=schema_file,
            message=str(e),
        )


def load_api():
    # print('### ComfyLab: API loaded')
    pass
