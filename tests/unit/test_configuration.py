import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src import configuration


def test_appconfig_load_success():
    test_payload = {
        "typemode": "root",
        "commands": {"root_color": True, "root_format": False, "csv": True},
        "config": {
            "OUTPUT_DIR": "/tmp/results",
            "NAMING_CONVENTION": "Matrix-Gen-Rep",
            "ENABLE_NAMING_SEPARATION": True,
            "FORCE_MAXPERFORMANCE": False,
            "ENABLE_DB": False
        },
        "files_to_process": ["image1.jpg", "image2.jpg"],
        "paths": {
            "models_dir": "/path/to/models",
            "uploads_dir": "/path/to/uploads",
            "results_dir": "/path/to/results"
        }
    }
    
    config = configuration.AppConfig(test_payload)
    
    assert config.models_path == "/path/to/models"
    assert config.uploads_path == "/path/to/uploads"
    assert config.results_path == "/path/to/results"
    assert len(config.files_to_process) == 2
    assert "image1.jpg" in config.files_to_process
    assert config.typemode == "root"
    assert config.execution_commands["root_color"] == True
    assert config.execution_commands["root_format"] == False
    assert config.export_formats["csv"] == True


def test_appconfig_missing_paths():
    test_payload = {
        "typemode": "root",
        "commands": {},
        "config": {},
        "files_to_process": []
    }
    
    try:
        config = configuration.AppConfig(test_payload)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Missing essential paths" in str(e)


def test_appconfig_get_image_paths():
    test_payload = {
        "typemode": "root",
        "commands": {},
        "config": {},
        "files_to_process": ["test1.jpg", "test2.jpg"],
        "paths": {
            "models_dir": "/models",
            "uploads_dir": "/uploads",
            "results_dir": "/results"
        }
    }
    
    config = configuration.AppConfig(test_payload)
    image_paths = config.get_image_paths()
    
    assert len(image_paths) == 2
    assert "test1.jpg" in image_paths
    assert image_paths["test1.jpg"] == "/uploads/test1.jpg"


def test_appconfig_update_image_list():
    test_payload = {
        "typemode": "root",
        "commands": {},
        "config": {},
        "files_to_process": ["image1.jpg", "image2.jpg"],
        "paths": {
            "models_dir": "/models",
            "uploads_dir": "/uploads",
            "results_dir": "/results"
        }
    }
    
    config = configuration.AppConfig(test_payload)
    assert len(config.files_to_process) == 2
    
    config.update_image_list(["image3.jpg"])
    assert len(config.files_to_process) == 1
    assert config.files_to_process[0] == "image3.jpg"


def test_recipe_processor_decompose():
    commands = {
        "root_color": True,
        "root_format": False,
        "csv": True,
        "json": False,
        "white_background": True
    }
    
    processor = configuration.RecipeProcessor(commands)
    result = processor.process()
    
    assert "root_color" in result["commands"]
    assert "root_format" in result["commands"]
    assert "csv" in result["exportation_format"]
    assert "json" in result["exportation_format"]
    assert "white_background" in result["commands_spec"]
