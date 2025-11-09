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


def test_export_both_csv_and_json(tmp_path):
    """Test exporting to both CSV and JSON simultaneously"""
    test_data = {
        "image1.jpg": {"root_color": "red"},
        "image2.jpg": {"root_color": "yellow"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True, "json": True},
        output_folder=str(tmp_path),
        separation_position=None
    )
    
    exporter.export(test_data)
    
    assert (tmp_path / "results.csv").exists()
    assert (tmp_path / "results.json").exists()


def test_export_invalid_separation_position(tmp_path):
    """Test export with invalid separation position (out of bounds)"""
    test_data = {
        "image1.jpg": {"root_color": "red"},
        "image2.jpg": {"root_color": "yellow"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True},
        output_folder=str(tmp_path),
        separation_position=10  # Position beyond image name parts
    )
    
    exporter.export(test_data)
    
    # Should skip images with invalid position but not crash
    csv_files = list(tmp_path.glob("*.csv"))
    # May create empty groups or no files


def test_export_with_underscore_separator(tmp_path):
    """Test separation with underscore delimiter"""
    test_data = {
        "batch_A_001.jpg": {"root_color": "red"},
        "batch_A_002.jpg": {"root_color": "orange"},
        "batch_B_001.jpg": {"root_color": "yellow"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True},
        output_folder=str(tmp_path),
        separation_position=2  # Split by second part
    )
    
    exporter.export(test_data)
    
    # Should create files for 'A' and 'B'
    a_file = tmp_path / "a.csv"
    b_file = tmp_path / "b.csv"
    
    assert a_file.exists()
    assert b_file.exists()


def test_export_with_dash_separator(tmp_path):
    """Test separation with dash delimiter"""
    test_data = {
        "sample-X-01.jpg": {"root_format": "round"},
        "sample-X-02.jpg": {"root_format": "oval"},
        "sample-Y-01.jpg": {"root_format": "long"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"json": True},
        output_folder=str(tmp_path),
        separation_position=2
    )
    
    exporter.export(test_data)
    
    x_file = tmp_path / "x.json"
    y_file = tmp_path / "y.json"
    
    assert x_file.exists()
    assert y_file.exists()


def test_export_single_image(tmp_path):
    """Test export with single image"""
    test_data = {
        "single.jpg": {"root_color": "purple", "root_format": "irregular"}
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True, "json": True},
        output_folder=str(tmp_path),
        separation_position=None
    )
    
    exporter.export(test_data)
    
    csv_file = tmp_path / "results.csv"
    json_file = tmp_path / "results.json"
    
    assert csv_file.exists()
    assert json_file.exists()
    
    df = pd.read_csv(csv_file)
    assert len(df) == 1
    assert df.iloc[0]["image"] == "single.jpg"


def test_export_multiple_models_per_image(tmp_path):
    """Test export with multiple model results per image"""
    test_data = {
        "img1.jpg": {
            "root_color": "red",
            "root_format": "round",
            "root_size": "large",
            "root_texture": "smooth"
        }
    }
    
    exporter = file_exporter.FileExporter(
        export_formats={"csv": True},
        output_folder=str(tmp_path),
        separation_position=None
    )
    
    exporter.export(test_data)
    
    csv_file = tmp_path / "results.csv"
    df = pd.read_csv(csv_file)
    
    assert len(df) == 1
    assert len(df.columns) == 5  # image + 4 models
    assert all(col in df.columns for col in ["image", "root_color", "root_format", "root_size", "root_texture"])

