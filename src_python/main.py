import sys
import traceback
import pandas as pd
from src import communication, configuration, preprocessing
from src.execution import orchestrator
from src.exporting import database, file_exporter


def main():
    try:
        communication.send_log("info", "AIpomoea Pipeline: Starting...")
        
        payload = communication.read_command()
        communication.send_log("info", "Command received successfully.")
        
        config = configuration.AppConfig(payload)
        communication.send_log("info", f"Configuration loaded. Ready to process {len(config.files_to_process)} images.")
        
        final_image_list = preprocessing.prepare_image_list(config)
        config.update_image_list(final_image_list)
        communication.send_log("info", f"Image preprocessing complete. {len(final_image_list)} images ready for processing.")
        
        communication.send_log("info", "Starting model execution pipeline...")
        all_results = orchestrator.run_pipeline(config)
        communication.send_log("info", f"Model execution completed. Processed {len(all_results)} results.")
        
        if not all_results:
            communication.send_log("warning", "No results to export.")
            communication.send_message("complete", {
                "status": "success",
                "message": "Pipeline completed with no results."
            })
            return
        
        communication.send_log("info", "Preparing results for export...")
        results_dict = {}
        for image, model, result in all_results:
            if image not in results_dict:
                results_dict[image] = {}
            results_dict[image][model] = result
        
        results_df = pd.DataFrame.from_dict(results_dict, orient='index').reset_index()
        results_df.rename(columns={'index': 'image'}, inplace=True)
        
        communication.send_log("info", "Exporting results...")
        
        if config.export_formats.get('connected_database', False):
            try:
                database.export_to_db(results_df, config)
            except Exception as db_error:
                communication.send_log("error", f"Database export failed: {db_error}")
        
        exporter = file_exporter.FileExporter(
            export_formats=config.export_formats,
            output_folder=config.output_folder,
            separation_position=config.export_separation_pos
        )
        exporter.export(results_dict)
        
        communication.send_message("complete", {
            "status": "success",
            "message": "Pipeline completed successfully.",
            "results_count": len(all_results)
        })
        
    except ValueError as config_error:
        communication.send_error(
            "CONFIG_ERROR",
            f"Configuration error: {config_error}",
            trace=traceback.format_exc()
        )
        sys.exit(1)
    
    except Exception as e:
        communication.send_error(
            "FATAL_ERROR",
            f"Pipeline execution failed: {e}",
            trace=traceback.format_exc()
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
