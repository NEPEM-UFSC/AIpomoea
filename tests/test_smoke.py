import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src_python')))


def test_all_modules_import():
    from src import communication
    from src import configuration
    from src import preprocessing
    from src import utils
    from src.execution import runner
    from src.execution import orchestrator
    from src.exporting import file_exporter
    from src.exporting import database
    import main
    
    assert True


def test_main_py_entrypoint_exists():
    import main
    
    assert hasattr(main, 'main'), "main.py must have a main() function"
    assert callable(main.main), "main.main must be callable"
    
    with open(os.path.join(os.path.dirname(__file__), '..', 'src_python', 'main.py'), 'r') as f:
        content = f.read()
        assert 'if __name__ == "__main__"' in content, "main.py must have if __name__ == '__main__' block"
