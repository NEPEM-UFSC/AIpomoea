import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src.execution import orchestrator


def test_run_pipeline_sequential(mocker):
    class MockConfig:
        execution_commands = {"root_color": True, "root_format": True}
        force_max_performance = False
        
        def get_image_paths(self):
            return {"image1.jpg": "/path/image1.jpg"}
    
    mock_results = [
        ("image1", "root_color", "red"),
        ("image1", "root_format", "round")
    ]
    
    mocker.patch('src.execution.runner.execute_single_command', side_effect=[
        [mock_results[0]],
        [mock_results[1]]
    ])
    
    config = MockConfig()
    results = orchestrator.run_pipeline(config)
    
    assert len(results) == 2
    assert results[0] == mock_results[0]
    assert results[1] == mock_results[1]


def test_run_pipeline_parallel(mocker):
    class MockConfig:
        execution_commands = {"root_color": True, "root_format": True}
        force_max_performance = True
        
        def get_image_paths(self):
            return {"image1.jpg": "/path/image1.jpg"}
    
    mock_results = [
        [("image1", "root_color", "red")],
        [("image1", "root_format", "round")]
    ]
    
    mocker.patch('multiprocessing.Pool')
    mock_pool = mocker.MagicMock()
    mock_pool.__enter__ = mocker.MagicMock(return_value=mock_pool)
    mock_pool.__exit__ = mocker.MagicMock(return_value=False)
    mock_pool.starmap = mocker.MagicMock(return_value=mock_results)
    
    mocker.patch('src.execution.orchestrator.Pool', return_value=mock_pool)
    
    config = MockConfig()
    results = orchestrator.run_pipeline(config)
    
    assert len(results) == 2


def test_run_pipeline_no_commands():
    class MockConfig:
        execution_commands = {}
        force_max_performance = False
        
        def get_image_paths(self):
            return {"image1.jpg": "/path/image1.jpg"}
    
    config = MockConfig()
    results = orchestrator.run_pipeline(config)
    
    assert len(results) == 0


def test_run_pipeline_parallel_fallback_to_sequential(mocker):
    class MockConfig:
        execution_commands = {"root_color": True}
        force_max_performance = True
        
        def get_image_paths(self):
            return {"image1.jpg": "/path/image1.jpg"}
    
    # Mock Pool to raise exception during parallel execution
    mock_pool = mocker.MagicMock()
    mock_pool.__enter__ = mocker.MagicMock(side_effect=Exception("Parallel failed"))
    mock_pool.__exit__ = mocker.MagicMock(return_value=False)
    
    mocker.patch('src.execution.orchestrator.Pool', return_value=mock_pool)
    
    # Mock sequential execution to return expected result
    mock_sequential_result = [("image1", "root_color", "red")]
    mocker.patch('src.execution.runner.execute_single_command', return_value=mock_sequential_result)
    
    config = MockConfig()
    results = orchestrator.run_pipeline(config)
    
    assert len(results) == 1
    assert results[0] == mock_sequential_result[0]
