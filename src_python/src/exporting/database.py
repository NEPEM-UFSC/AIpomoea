import sqlite3
import pandas as pd
import traceback
from pathlib import Path
from ..communication import send_log, send_message


def export_to_db(results_df: pd.DataFrame, config):
    if not config.enable_db:
        return
    
    try:
        db_path = Path(config.db_path)
        if not db_path.exists():
            raise FileNotFoundError(f"Database not found: {db_path}")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        table_name = config.db_name
        
        cursor.execute("""
            SELECT name FROM sqlite_master WHERE type='table' AND name=?;
        """, (table_name,))
        
        if not cursor.fetchone():
            raise ValueError(f"Table '{table_name}' not found in database.")
        
        send_log("info", f"Exporting to database table: {table_name}")
        
        for _, row in results_df.iterrows():
            image_name = row['image']
            
            cursor.execute(f"SELECT 1 FROM {table_name} WHERE image = ?", (image_name,))
            exists = cursor.fetchone()
            
            if exists:
                update_placeholders = ', '.join([f"{col} = ?" for col in row.index if col != 'image'])
                update_sql = f"UPDATE {table_name} SET {update_placeholders} WHERE image = ?"
                cursor.execute(update_sql, tuple(row[col] for col in row.index if col != 'image') + (image_name,))
            else:
                columns = ', '.join(row.index)
                placeholders = ', '.join(['?'] * len(row))
                insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
                cursor.execute(insert_sql, tuple(row))
        
        conn.commit()
        conn.close()
        
        send_log("info", "Database export completed successfully.")
        
    except FileNotFoundError as e:
        send_message("error", {
            "code": "DB_NOT_FOUND",
            "message": str(e)
        })
        raise
    except ValueError as e:
        send_message("error", {
            "code": "DB_TABLE_NOT_FOUND",
            "message": str(e)
        })
        raise
    except Exception as e:
        send_message("error", {
            "code": "DB_EXPORT_FAILED",
            "message": f"Database export failed: {e}",
            "trace": traceback.format_exc()
        })
        raise
