import sys
import os
import json
from io import StringIO

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src import communication


def test_read_command_valid(mocker):
    test_payload = {
        "typemode": "root",
        "commands": {"root_color": True},
        "config": {"OUTPUT_DIR": "/tmp"},
        "files_to_process": ["image1.jpg"],
        "paths": {
            "models_dir": "/models",
            "uploads_dir": "/uploads",
            "results_dir": "/results"
        }
    }
    
    mock_stdin = StringIO(json.dumps(test_payload))
    mocker.patch('sys.stdin', mock_stdin)
    
    result = communication.read_command()
    
    assert result == test_payload
    assert result["typemode"] == "root"
    assert "root_color" in result["commands"]


def test_read_command_invalid_json(mocker):
    mock_stdin = StringIO('{"invalid": "json"')
    mocker.patch('sys.stdin', mock_stdin)
    mocker.patch('sys.exit')
    
    communication.read_command()
    
    sys.exit.assert_called_once_with(1)


def test_send_message_stdout(capsys):
    communication.send_message("progress", {"current": 10, "total": 100})
    
    captured = capsys.readouterr()
    output = captured.out.strip()
    
    assert output.endswith('\n') or len(output) > 0
    
    parsed = json.loads(output)
    assert parsed["type"] == "progress"
    assert parsed["payload"]["current"] == 10
    assert parsed["payload"]["total"] == 100


def test_send_log(capsys):
    communication.send_log("info", "Test message")
    
    captured = capsys.readouterr()
    output = captured.out.strip()
    
    parsed = json.loads(output)
    assert parsed["type"] == "log"
    assert parsed["payload"]["level"] == "info"
    assert parsed["payload"]["message"] == "Test message"


def test_send_error(capsys):
    communication.send_error("TEST_ERROR", "Error message", task="test_task", trace="traceback")
    
    captured = capsys.readouterr()
    output = captured.out.strip()
    
    parsed = json.loads(output)
    assert parsed["type"] == "error"
    assert parsed["payload"]["code"] == "TEST_ERROR"
    assert parsed["payload"]["message"] == "Error message"
    assert parsed["payload"]["task"] == "test_task"
    assert parsed["payload"]["trace"] == "traceback"
