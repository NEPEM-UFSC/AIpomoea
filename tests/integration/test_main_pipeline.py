import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))


def test_full_pipeline_mocked(mocker, tmp_path):
    test_payload = {
        "typemode": "root",
        "commands": {"root_color": True, "csv": True},
        "config": {
            "OUTPUT_DIR": str(tmp_path),
            "NAMING_CONVENTION": "Gen-Rep",
            "ENABLE_NAMING_SEPARATION": False,
            "FORCE_MAXPERFORMANCE": False,
            "ENABLE_DB": False
        },
        "files_to_process": ["image1.jpg"],
        "paths": {
            "models_dir": "/models",
            "uploads_dir": "/uploads",
            "results_dir": str(tmp_path)
        }
    }
    
    from io import StringIO
    mock_stdin = StringIO(json.dumps(test_payload))
    mocker.patch('sys.stdin', mock_stdin)
    
    mock_results = [("image1", "root_color", "red")]
    mocker.patch('src.execution.orchestrator.run_pipeline', return_value=mock_results)
    
    captured_messages = []
    original_send = None
    
    def mock_send_message(msg_type, payload):
        captured_messages.append({"type": msg_type, "payload": payload})
    
    mocker.patch('src.communication.send_message', side_effect=mock_send_message)
    
    import main
    main.main()
    
    assert any(msg["type"] == "log" for msg in captured_messages)
    assert any(msg["type"] == "complete" for msg in captured_messages)
    
    complete_msg = [msg for msg in captured_messages if msg["type"] == "complete"][0]
    assert complete_msg["payload"]["status"] == "success"


def test_pipeline_with_error_handling(mocker):
    test_payload = {
        "typemode": "root",
        "commands": {},
        "config": {},
        "files_to_process": [],
        "paths": {}
    }
    
    from io import StringIO
    mock_stdin = StringIO(json.dumps(test_payload))
    mocker.patch('sys.stdin', mock_stdin)
    mocker.patch('sys.exit')
    
    captured_errors = []
    
    def mock_send_error(code, message, **kwargs):
        captured_errors.append({"code": code, "message": message})
    
    mocker.patch('src.communication.send_error', side_effect=mock_send_error)
    
    import main
    main.main()
    
    assert len(captured_errors) > 0
    assert captured_errors[0]["code"] == "CONFIG_ERROR"
