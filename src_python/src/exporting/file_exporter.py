import pandas as pd
import re
from typing import Dict
from ..communication import send_log


DEBUG = False


class FileExporter:
    def __init__(self, export_formats: dict, output_folder: str, separation_position: int = None):
        self.export_formats = export_formats
        self.output_folder = output_folder
        self.separation_position = separation_position
    
    def export(self, results_dict: dict):
        try:
            if DEBUG:
                send_log("debug", f"Exporting results: {results_dict}")
            
            if self.separation_position:
                separated_results = self._group_results_by_position(results_dict, self.separation_position - 1)
                
                for base_name, grouped_results in separated_results.items():
                    self._export_to_formats(base_name, grouped_results)
            else:
                self._export_to_formats("results", results_dict)
            
            send_log("info", "Results exported successfully.")
            
        except Exception as e:
            send_log("error", f"Error during export: {e}")
            raise
    
    def _group_results_by_position(self, results_dict: dict, position: int) -> Dict[str, dict]:
        separated_results = {}
        
        for image, data in results_dict.items():
            try:
                parts = re.split(r'[_-]', image)
                if len(parts) > position:
                    base_name = parts[position]
                    if base_name not in separated_results:
                        separated_results[base_name] = {}
                    separated_results[base_name][image] = data
                else:
                    send_log("warning", f"Invalid position {position} for image '{image}'. Skipping.")
            except Exception as e:
                send_log("error", f"Error processing image '{image}': {e}")
        
        return separated_results
    
    def _export_to_formats(self, base_name: str, results_data: dict):
        try:
            rows = []
            for image, data in results_data.items():
                if isinstance(data, dict):
                    rows.extend((image, model, result) for model, result in data.items())
            
            if not rows:
                send_log("warning", f"No valid data to export for base name '{base_name}'")
                return
            
            results_df = pd.DataFrame(rows, columns=['image', 'model', 'result']).pivot(
                index='image', columns='model', values='result'
            ).reset_index()
            
            if DEBUG:
                send_log("debug", f"DataFrame created for {base_name}")
            
            for format_name, enabled in self.export_formats.items():
                if enabled:
                    export_method = getattr(self, f"_export_to_{format_name}", None)
                    if callable(export_method):
                        export_method(base_name, results_df)
                    else:
                        send_log("warning", f"No export method found for format: {format_name}")
        
        except Exception as e:
            send_log("error", f"Error during format export: {e}")
            raise
    
    def _export_to_csv(self, base_name: str, results_df: pd.DataFrame):
        try:
            import os
            filepath = os.path.join(self.output_folder, f"{base_name.lower()}.csv")
            results_df.to_csv(filepath, index=False)
            send_log("info", f"Exported CSV: {filepath}")
        except Exception as e:
            send_log("error", f"Error exporting CSV for {base_name}: {e}")
            raise
    
    def _export_to_json(self, base_name: str, results_df: pd.DataFrame):
        try:
            import os
            import json
            
            results_json_list = [
                {"image": row["image"], **row.drop("image").to_dict()}
                for _, row in results_df.iterrows()
            ]
            
            filepath = os.path.join(self.output_folder, f"{base_name.lower()}.json")
            with open(filepath, 'w') as json_file:
                json.dump(results_json_list, json_file, indent=4)
            
            send_log("info", f"Exported JSON: {filepath}")
        except Exception as e:
            send_log("error", f"Error exporting JSON for {base_name}: {e}")
            raise
