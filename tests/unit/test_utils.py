import sys
import os
import time
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src.utils import Utils


def test_utils_benchmark():
    """Test benchmark timing functionality"""
    utils = Utils()
    
    utils.benchmark()
    assert utils.start_time is not None
    
    time.sleep(0.1)
    utils.end_benchmark()


def test_utils_benchmark_not_started():
    """Test end_benchmark when start_time is not set"""
    utils = Utils()
    utils.start_time = None
    
    utils.end_benchmark()


def test_utils_benchmark_time_context_manager():
    """Test benchmark_time context manager"""
    utils = Utils()
    
    with utils.benchmark_time("Test operation"):
        time.sleep(0.05)
    
    assert utils.start_time is not None


def test_utils_benchmark_time_with_logging(tmp_path):
    """Test benchmark_time with log file writing"""
    utils = Utils()
    utils.write_logs = True
    
    log_file = tmp_path / "benchmark.log"
    original_dir = os.getcwd()
    
    try:
        os.chdir(tmp_path)
        
        with utils.benchmark_time("Test with logging"):
            time.sleep(0.01)
        
        assert log_file.exists()
        content = log_file.read_text()
        assert "Test with logging" in content
        assert "completed in" in content
    
    finally:
        os.chdir(original_dir)


def test_utils_benchmark_time_without_logging(tmp_path):
    """Test benchmark_time without log file writing"""
    utils = Utils()
    utils.write_logs = False
    
    original_dir = os.getcwd()
    
    try:
        os.chdir(tmp_path)
        
        with utils.benchmark_time("Test without logging"):
            time.sleep(0.01)
        
        # Verify no log was created in tmp directory
        log_file = tmp_path / "benchmark.log"
        assert not log_file.exists()
    
    finally:
        os.chdir(original_dir)


def test_utils_change_directory():
    """Test change_directory context manager"""
    utils = Utils()
    original_dir = os.getcwd()
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        with utils.change_directory(temp_dir):
            assert os.getcwd() == temp_dir
        
        assert os.getcwd() == original_dir
    
    finally:
        os.rmdir(temp_dir)


def test_utils_change_directory_restores_on_error():
    """Test that change_directory restores original dir even on exception"""
    utils = Utils()
    original_dir = os.getcwd()
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        with utils.change_directory(temp_dir):
            raise ValueError("Test error")
    except ValueError:
        pass
    
    assert os.getcwd() == original_dir
    os.rmdir(temp_dir)


def test_utils_initialization():
    """Test Utils initialization"""
    utils = Utils()
    
    assert utils.start_time is None
    assert utils.write_logs is True
