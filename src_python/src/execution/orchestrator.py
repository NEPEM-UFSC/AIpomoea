from multiprocessing import Pool, cpu_count
import traceback
from typing import List, Tuple
from . import runner
from ..communication import send_message, send_log


DEBUG = False


def run_pipeline(config) -> List[Tuple]:
    commands_to_execute = [cmd for cmd, value in config.execution_commands.items() if value]
    
    if not commands_to_execute:
        send_log("warning", "No commands to execute.")
        return []
    
    send_log("info", f"Starting pipeline with {len(commands_to_execute)} commands.")
    
    image_paths = config.get_image_paths()
    batch_size = 50
    
    if config.force_max_performance:
        return _execute_parallel(commands_to_execute, image_paths, config, batch_size)
    else:
        return _execute_sequential(commands_to_execute, image_paths, config, batch_size)


def _execute_parallel(commands: List[str], image_paths: dict, config, batch_size: int) -> List[Tuple]:
    num_processes = min(cpu_count(), len(commands))
    send_log("info", f"Executing in parallel with {num_processes} processes...")
    
    try:
        with Pool(processes=num_processes) as pool:
            results = pool.starmap(
                runner.execute_single_command,
                [(cmd, image_paths, config, batch_size) for cmd in commands]
            )
        
        all_results = []
        for result_list in results:
            if isinstance(result_list, list):
                all_results.extend(result_list)
        
        return all_results
        
    except Exception as e:
        send_message("error", {
            "code": "PARALLEL_EXECUTION_FAILED",
            "message": f"Parallel execution failed: {e}",
            "trace": traceback.format_exc()
        })
        
        send_log("warning", "Falling back to sequential execution...")
        return _execute_sequential(commands, image_paths, config, batch_size)


def _execute_sequential(commands: List[str], image_paths: dict, config, batch_size: int) -> List[Tuple]:
    send_log("info", "Executing commands sequentially...")
    
    all_results = []
    for command in commands:
        try:
            results = runner.execute_single_command(command, image_paths, config, batch_size)
            all_results.extend(results)
        except Exception as e:
            send_message("error", {
                "code": "COMMAND_FAILED",
                "task": command,
                "message": f"Command execution failed: {e}",
                "trace": traceback.format_exc()
            })
    
    return all_results
