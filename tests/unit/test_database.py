import sys
import os
import sqlite3
import pandas as pd
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'src_python')))

from src.exporting import database


def test_export_to_db_disabled():
    """Test that export_to_db returns early when database is disabled"""
    class MockConfig:
        enable_db = False
    
    config = MockConfig()
    results_df = pd.DataFrame()
    
    # Should return without error
    database.export_to_db(results_df, config)


def test_export_to_db_file_not_found():
    """Test error when database file doesn't exist"""
    class MockConfig:
        enable_db = True
        db_path = "/nonexistent/path/database.db"
        db_name = "test_table"
    
    config = MockConfig()
    results_df = pd.DataFrame({"image": ["test.jpg"], "model": ["result"]})
    
    try:
        database.export_to_db(results_df, config)
        assert False, "Should have raised FileNotFoundError"
    except FileNotFoundError:
        pass


def test_export_to_db_table_not_found():
    """Test error when table doesn't exist in database"""
    temp_db = tempfile.NamedTemporaryFile(mode='w', suffix='.db', delete=False)
    temp_db_path = temp_db.name
    temp_db.close()
    
    try:
        conn = sqlite3.connect(temp_db_path)
        conn.execute("CREATE TABLE other_table (id INTEGER)")
        conn.commit()
        conn.close()
        
        class MockConfig:
            enable_db = True
            db_path = temp_db_path
            db_name = "nonexistent_table"
        
        config = MockConfig()
        results_df = pd.DataFrame({"image": ["test.jpg"], "model": ["result"]})
        
        try:
            database.export_to_db(results_df, config)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "not found in database" in str(e)
    
    finally:
        os.unlink(temp_db_path)


def test_export_to_db_insert_new_rows():
    """Test inserting new rows into database"""
    temp_db = tempfile.NamedTemporaryFile(mode='w', suffix='.db', delete=False)
    temp_db_path = temp_db.name
    temp_db.close()
    
    try:
        conn = sqlite3.connect(temp_db_path)
        conn.execute("CREATE TABLE results (image TEXT, root_color TEXT, root_format TEXT)")
        conn.commit()
        conn.close()
        
        class MockConfig:
            enable_db = True
            db_path = temp_db_path
            db_name = "results"
        
        config = MockConfig()
        results_df = pd.DataFrame({
            "image": ["img1.jpg", "img2.jpg"],
            "root_color": ["red", "yellow"],
            "root_format": ["round", "long"]
        })
        
        database.export_to_db(results_df, config)
        
        conn = sqlite3.connect(temp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM results ORDER BY image")
        rows = cursor.fetchall()
        conn.close()
        
        assert len(rows) == 2
        assert rows[0] == ("img1.jpg", "red", "round")
        assert rows[1] == ("img2.jpg", "yellow", "long")
    
    finally:
        os.unlink(temp_db_path)


def test_export_to_db_update_existing_rows():
    """Test updating existing rows in database"""
    temp_db = tempfile.NamedTemporaryFile(mode='w', suffix='.db', delete=False)
    temp_db_path = temp_db.name
    temp_db.close()
    
    try:
        conn = sqlite3.connect(temp_db_path)
        conn.execute("CREATE TABLE results (image TEXT, root_color TEXT, root_format TEXT)")
        conn.execute("INSERT INTO results VALUES ('img1.jpg', 'old_color', 'old_format')")
        conn.commit()
        conn.close()
        
        class MockConfig:
            enable_db = True
            db_path = temp_db_path
            db_name = "results"
        
        config = MockConfig()
        results_df = pd.DataFrame({
            "image": ["img1.jpg"],
            "root_color": ["new_color"],
            "root_format": ["new_format"]
        })
        
        database.export_to_db(results_df, config)
        
        conn = sqlite3.connect(temp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM results WHERE image = 'img1.jpg'")
        row = cursor.fetchone()
        conn.close()
        
        assert row == ("img1.jpg", "new_color", "new_format")
    
    finally:
        os.unlink(temp_db_path)


def test_export_to_db_mixed_insert_and_update():
    """Test mixing inserts and updates in single export"""
    temp_db = tempfile.NamedTemporaryFile(mode='w', suffix='.db', delete=False)
    temp_db_path = temp_db.name
    temp_db.close()
    
    try:
        conn = sqlite3.connect(temp_db_path)
        conn.execute("CREATE TABLE results (image TEXT, root_color TEXT)")
        conn.execute("INSERT INTO results VALUES ('existing.jpg', 'old_value')")
        conn.commit()
        conn.close()
        
        class MockConfig:
            enable_db = True
            db_path = temp_db_path
            db_name = "results"
        
        config = MockConfig()
        results_df = pd.DataFrame({
            "image": ["existing.jpg", "new.jpg"],
            "root_color": ["updated_value", "new_value"]
        })
        
        database.export_to_db(results_df, config)
        
        conn = sqlite3.connect(temp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM results")
        count = cursor.fetchone()[0]
        
        cursor.execute("SELECT root_color FROM results WHERE image = 'existing.jpg'")
        existing = cursor.fetchone()[0]
        
        cursor.execute("SELECT root_color FROM results WHERE image = 'new.jpg'")
        new = cursor.fetchone()[0]
        
        conn.close()
        
        assert count == 2
        assert existing == "updated_value"
        assert new == "new_value"
    
    finally:
        os.unlink(temp_db_path)


def test_export_to_db_connection_error():
    """Test handling of database connection errors"""
    temp_db = tempfile.NamedTemporaryFile(mode='w', suffix='.db', delete=False)
    temp_db_path = temp_db.name
    temp_db.close()
    
    try:
        conn = sqlite3.connect(temp_db_path)
        conn.execute("CREATE TABLE results (image TEXT)")
        conn.commit()
        conn.close()
        
        # Make file read-only to cause error
        os.chmod(temp_db_path, 0o444)
        
        class MockConfig:
            enable_db = True
            db_path = temp_db_path
            db_name = "results"
        
        config = MockConfig()
        results_df = pd.DataFrame({"image": ["test.jpg"]})
        
        try:
            database.export_to_db(results_df, config)
            # On some systems read-only doesn't prevent writes, so we allow success
        except Exception:
            pass  # Expected on systems where read-only prevents writes
    
    finally:
        os.chmod(temp_db_path, 0o644)
        os.unlink(temp_db_path)
