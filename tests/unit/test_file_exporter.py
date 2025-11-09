import sys
import os
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src.exporting import file_exporter


def test_csv_export(tmp_path):
    test_data = {
        "image1.jpg": {"root_color": "red", "root_format": "round"},
        "image2.jpg": {"root_color": "orange", "root_format": "oval"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True, "json": False},
        output_folder=str(tmp_path),
        separation_position=None
    )
    
    exporter.export(test_data)
    
    csv_file = tmp_path / "results.csv"
    assert csv_file.exists()
    
    df = pd.read_csv(csv_file)
    assert len(df) == 2
    assert "image" in df.columns
    assert "root_color" in df.columns
    assert "root_format" in df.columns


def test_json_export(tmp_path):
    test_data = {
        "image1.jpg": {"root_color": "red", "root_format": "round"},
        "image2.jpg": {"root_color": "orange", "root_format": "oval"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": False, "json": True},
        output_folder=str(tmp_path),
        separation_position=None
    )
    
    exporter.export(test_data)
    
    json_file = tmp_path / "results.json"
    assert json_file.exists()
    
    import json
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    assert len(data) == 2
    assert data[0]["image"] in ["image1.jpg", "image2.jpg"]


def test_export_with_separation(tmp_path):
    test_data = {
        "gen1_rep1.jpg": {"root_color": "red"},
        "gen1_rep2.jpg": {"root_color": "orange"},
        "gen2_rep1.jpg": {"root_color": "yellow"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True},
        output_folder=str(tmp_path),
        separation_position=1
    )
    
    exporter.export(test_data)
    
    gen1_file = tmp_path / "gen1.csv"
    gen2_file = tmp_path / "gen2.csv"
    
    assert gen1_file.exists()
    assert gen2_file.exists()
    
    df_gen1 = pd.read_csv(gen1_file)
    assert len(df_gen1) == 2
    
    df_gen2 = pd.read_csv(gen2_file)
    assert len(df_gen2) == 1


def test_export_empty_data(tmp_path):
    test_data = {}
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True},
        output_folder=str(tmp_path),
        separation_position=None
    )
    
    exporter.export(test_data)
