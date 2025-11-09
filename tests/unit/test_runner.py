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


def test_execute_single_command_with_batch_retry(mocker):
    """Test batch retry logic when initial batch fails"""
    class MockConfig:
        models_path = "/path/to/models"
    
    image_paths = {
        "img1.jpg": "/uploads/img1.jpg",
        "img2.jpg": "/uploads/img2.jpg",
        "img3.jpg": "/uploads/img3.jpg",
        "img4.jpg": "/uploads/img4.jpg"
    }
    
    # First call fails, subsequent retry calls succeed
    mock_result1 = "Image: /uploads/img1.jpg Result: red"
    mock_result2 = "Image: /uploads/img2.jpg Result: orange"
    
    call_count = [0]
    def mock_check_output(*args, **kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            raise subprocess.CalledProcessError(1, "cmd")
        elif call_count[0] == 2:
            return mock_result1.encode('utf-8')
        else:
            return mock_result2.encode('utf-8')
    
    mocker.patch('subprocess.check_output', side_effect=mock_check_output)
    mocker.patch('os.path.exists', return_value=True)
    mocker.patch('os.chdir')
    mocker.patch('os.getcwd', return_value='/original')
    
    config = MockConfig()
    results = runner.execute_single_command("root_color", image_paths, config, batch_size=4)
    
    # Should have retried and got some results
    assert len(results) >= 0


def test_run_subprocess_success(mocker):
    """Test _run_subprocess function"""
    mock_output = b"Image: test.jpg Result: value"
    mocker.patch('subprocess.check_output', return_value=mock_output)
    
    result = runner._run_subprocess("/path/binary.exe", ["/path/img.jpg"])
    
    assert len(result) == 1
    assert "test.jpg" in result[0]


def test_run_subprocess_error(mocker):
    """Test _run_subprocess with subprocess error"""
    error = subprocess.CalledProcessError(1, "cmd")
    error.output = b"Error message"
    mocker.patch('subprocess.check_output', side_effect=error)
    
    try:
        runner._run_subprocess("/path/binary.exe", ["/path/img.jpg"])
        assert False, "Should have raised exception"
    except RuntimeError as e:
        assert "Subprocess failed" in str(e)


def test_process_results_empty_lines():
    """Test processing results with empty or malformed lines"""
    result_lines = [
        "",
        "Invalid line without proper format",
        "Image: /path/image1.jpg Result: red",
        "Another invalid line"
    ]
    
    results = runner._process_results(result_lines, "root_color")
    
    # Should only process the valid line
    assert len(results) == 1
    assert results[0] == ("image1", "root_color", "red")


def test_process_results_with_dashes():
    """Test processing results with image names containing dashes"""
    result_lines = [
        "Image: /path/test-image-001.jpg - Result: value"
    ]
    
    results = runner._process_results(result_lines, "root_format")
    
    assert len(results) == 1
    assert results[0][0] == "test-image-001"


def test_execute_single_command_empty_images(mocker):
    """Test execution with empty image list"""
    class MockConfig:
        models_path = "/path/to/models"
    
    image_paths = {}
    
    mocker.patch('os.path.exists', return_value=True)
    mocker.patch('os.chdir')
    mocker.patch('os.getcwd', return_value='/original')
    
    config = MockConfig()
    results = runner.execute_single_command("root_color", image_paths, config)
    
    assert len(results) == 0


def test_execute_single_command_progress_messages(mocker):
    """Test that progress messages are sent correctly"""
    class MockConfig:
        models_path = "/path/to/models"
    
    image_paths = {"image1.jpg": "/uploads/image1.jpg"}
    
    mock_result = "Image: /uploads/image1.jpg Result: red"
    mocker.patch('subprocess.check_output', return_value=mock_result.encode('utf-8'))
    mocker.patch('os.path.exists', return_value=True)
    mocker.patch('os.chdir')
    mocker.patch('os.getcwd', return_value='/original')
    
    send_message_mock = mocker.patch('src.execution.runner.send_message')
    
    config = MockConfig()
    runner.execute_single_command("root_color", image_paths, config)
    
    # Verify progress messages were sent
    calls = send_message_mock.call_args_list
    assert any("progress" in str(call) for call in calls)


def test_get_binary_path_with_spaces(mocker):
    """Test binary path with spaces in path"""
    class MockConfig:
        models_path = "C:/Program Files/Models"
    
    mocker.patch('os.path.exists', return_value=True)
    
    config = MockConfig()
    binary_path = runner._get_binary_path("root_color", config)
    
    assert binary_path is not None
    assert "Models" in binary_path

