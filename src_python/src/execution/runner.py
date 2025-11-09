import os
import subprocess
import traceback
from pathlib import Path
from typing import List, Tuple
from ..communication import send_message, send_log


DEBUG = False


def execute_single_command(command: str, image_paths: dict, config, batch_size: int = 50) -> List[Tuple]:
    if DEBUG:
        print(f"DEBUG - Executing command: {command}")
    
    try:
        binary_path = _get_binary_path(command, config)
        
        if not binary_path:
            send_message("error", {
                "code": "MODEL_NOT_FOUND",
                "task": command,
                "message": f"Model {command} not found."
            })
            return []
        
        image_list = list(image_paths.values())
        results = []
        
        send_message("progress", {
            "task": command,
            "status": "started",
            "total": len(image_list)
        })
        
        binary_dir = os.path.dirname(binary_path)
        ocwd = os.getcwd()
        
        try:
            os.chdir(binary_dir)
            
            for i in range(0, len(image_list), batch_size):
                batch = image_list[i:i + batch_size]
                if DEBUG:
                    print(f"DEBUG - Processing batch {i // batch_size + 1}")
                
                try:
                    result_lines = _run_subprocess(binary_path, batch)
                    batch_results = _process_results(result_lines, command)
                    results.extend(batch_results)
                    
                    send_message("progress", {
                        "task": command,
                        "status": "running",
                        "processed": len(results)
                    })
                    
                except Exception as e:
                    send_log("warning", f"Batch execution failed, retrying with smaller batches: {e}")
                    
                    for j in range(i, min(i + batch_size, len(image_list)), batch_size // 2):
                        retry_batch = image_list[j:j + batch_size // 2]
                        try:
                            result_lines = _run_subprocess(binary_path, retry_batch)
                            batch_results = _process_results(result_lines, command)
                            results.extend(batch_results)
                            
                            send_message("progress", {
                                "task": command,
                                "status": "running",
                                "processed": len(results)
                            })
                        except Exception as retry_e:
                            send_message("error", {
                                "code": "BATCH_EXECUTION_FAILED",
                                "task": command,
                                "message": f"Failed to process batch: {retry_e}",
                                "trace": traceback.format_exc()
                            })
        finally:
            os.chdir(ocwd)
        
        send_message("progress", {
            "task": command,
            "status": "completed",
            "processed": len(results),
            "total": len(image_list)
        })
        
        return results
        
    except Exception as e:
        send_message("error", {
            "code": "COMMAND_EXECUTION_FAILED",
            "task": command,
            "message": str(e),
            "trace": traceback.format_exc()
        })
        return []


def _get_binary_path(command: str, config) -> str:
    try:
        models_path = config.models_path
        binary_path = os.path.join(Path(models_path).resolve(), command + ".exe")
        
        if not os.path.exists(binary_path):
            return None
        
        if DEBUG:
            print(f"DEBUG - Binary path: {binary_path}")
        
        return binary_path
    except Exception as e:
        if DEBUG:
            print(f"DEBUG - Error getting binary path: {e}")
        return None


def _run_subprocess(binary_path: str, batch: List[str]) -> List[str]:
    try:
        result = subprocess.check_output([binary_path] + batch, stderr=subprocess.STDOUT)
        return result.decode('utf-8').strip().split('\n')
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Subprocess failed: {e.output.decode('utf-8')}")


def _process_results(result_lines: List[str], command: str) -> List[Tuple]:
    results = []
    for line in result_lines:
        parts = line.split(" Result: ")
        if len(parts) == 2:
            image_filename = os.path.basename(parts[0].split(": ")[1]).strip(" -")
            image_filename = os.path.splitext(image_filename)[0]
            result_values = parts[1].replace('*', '').strip()
            results.append((image_filename, command, result_values))
            if DEBUG:
                print(f"DEBUG - Processed result for {image_filename}: {result_values}")
    return results
