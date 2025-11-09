import sys
import os
import subprocess

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src.execution import runner


def test_execute_single_command_success(mocker):
    class MockConfig:
        models_path = "/path/to/models"
    
    image_paths = {
        "image1.jpg": "/uploads/image1.jpg",
        "image2.jpg": "/uploads/image2.jpg"
    }
    
    mock_result = "Image: /uploads/image1.jpg Result: red\nImage: /uploads/image2.jpg Result: orange"
    mocker.patch('subprocess.check_output', return_value=mock_result.encode('utf-8'))
    mocker.patch('os.path.exists', return_value=True)
    mocker.patch('os.chdir')
    mocker.patch('os.getcwd', return_value='/original')
    
    config = MockConfig()
    results = runner.execute_single_command("root_color", image_paths, config, batch_size=10)
    
    assert len(results) == 2
    assert results[0][0] == "image1"
    assert results[0][1] == "root_color"
    assert results[0][2] == "red"


def test_execute_single_command_model_not_found(mocker):
    class MockConfig:
        models_path = "/path/to/models"
    
    image_paths = {"image1.jpg": "/uploads/image1.jpg"}
    
    mocker.patch('os.path.exists', return_value=False)
    mocker.patch('os.chdir')
    mocker.patch('os.getcwd', return_value='/original')
    
    config = MockConfig()
    results = runner.execute_single_command("nonexistent_model", image_paths, config)
    
    assert len(results) == 0


def test_get_binary_path_exists(mocker):
    class MockConfig:
        models_path = "/path/to/models"
    
    mocker.patch('os.path.exists', return_value=True)
    
    config = MockConfig()
    binary_path = runner._get_binary_path("root_color", config)
    
    assert binary_path is not None
    assert "root_color.exe" in binary_path


def test_get_binary_path_not_exists(mocker):
    class MockConfig:
        models_path = "/path/to/models"
    
    mocker.patch('os.path.exists', return_value=False)
    
    config = MockConfig()
    binary_path = runner._get_binary_path("nonexistent", config)
    
    assert binary_path is None


def test_process_results():
    result_lines = [
        "Image: /path/image1.jpg Result: red",
        "Image: /path/image2.jpg Result: orange"
    ]
    
    results = runner._process_results(result_lines, "root_color")
    
    assert len(results) == 2
    assert results[0] == ("image1", "root_color", "red")
    assert results[1] == ("image2", "root_color", "orange")


def test_process_results_with_asterisks():
    result_lines = [
        "Image: /path/image1.jpg Result: *red*"
    ]
    
    results = runner._process_results(result_lines, "root_color")
    
    assert len(results) == 1
    assert results[0][2] == "red"
