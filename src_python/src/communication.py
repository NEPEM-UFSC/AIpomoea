import sys
import json
import traceback


def read_command():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            raise ValueError("No data received from stdin.")
        return json.loads(input_data)
    except Exception as e:
        print(f"Failed to parse command from stdin: {e}\n{traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)


def send_message(msg_type, payload):
    message = json.dumps({"type": msg_type, "payload": payload})
    print(message, flush=True)


def send_error(code, message, task=None, trace=None):
    payload = {
        "code": code,
        "message": message
    }
    if task:
        payload["task"] = task
    if trace:
        payload["trace"] = trace
    send_message("error", payload)


def send_log(level, message):
    send_message("log", {"level": level, "message": message})
