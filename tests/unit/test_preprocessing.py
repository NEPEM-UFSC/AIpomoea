import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src import preprocessing


def test_prepare_image_list_no_filter():
    class MockConfig:
        def __init__(self):
            self.config = {}
            self.files_to_process = ["image1.jpg", "image2.jpg", "image3.jpg"]
        
        def get_image_paths(self):
            return {f: f"/path/{f}" for f in self.files_to_process}
    
    config = MockConfig()
    result = preprocessing.prepare_image_list(config)
    
    assert len(result) == 3
    assert "image1.jpg" in result


def test_prepare_image_list_select_only():
    class MockConfig:
        def __init__(self):
            self.config = {
                "custom_preloading": {
                    "customEntry": "gen1,gen2",
                    "selectedOption": "selectOnly"
                }
            }
            self.files_to_process = ["gen1_rep1.jpg", "gen2_rep1.jpg", "gen3_rep1.jpg"]
        
        def get_image_paths(self):
            return {f: f"/path/{f}" for f in self.files_to_process}
    
    config = MockConfig()
    result = preprocessing.prepare_image_list(config)
    
    assert len(result) == 2
    assert "gen1_rep1.jpg" in result
    assert "gen2_rep1.jpg" in result
    assert "gen3_rep1.jpg" not in result


def test_prepare_image_list_exclude_only():
    class MockConfig:
        def __init__(self):
            self.config = {
                "custom_preloading": {
                    "customEntry": "gen1",
                    "selectedOption": "excludeOnly"
                }
            }
            self.files_to_process = ["gen1_rep1.jpg", "gen2_rep1.jpg", "gen3_rep1.jpg"]
        
        def get_image_paths(self):
            return {f: f"/path/{f}" for f in self.files_to_process}
    
    config = MockConfig()
    result = preprocessing.prepare_image_list(config)
    
    assert len(result) == 2
    assert "gen1_rep1.jpg" not in result
    assert "gen2_rep1.jpg" in result
    assert "gen3_rep1.jpg" in result


def test_select_only_function():
    images = ["gen1_img1.jpg", "gen2_img1.jpg", "gen1_img2.jpg"]
    values = ["gen1"]
    
    result = preprocessing._select_only(images, values)
    
    assert len(result) == 2
    assert all("gen1" in img for img in result)


def test_exclude_only_function():
    images = ["gen1_img1.jpg", "gen2_img1.jpg", "gen1_img2.jpg"]
    values = ["gen1"]
    
    result = preprocessing._exclude_only(images, values)
    
    assert len(result) == 1
    assert "gen2_img1.jpg" in result
