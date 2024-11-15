import pandas as pd
import subprocess
import time
import sqlite3
from contextlib import contextmanager
from multiprocessing import Pool, current_process, cpu_count
import traceback
import concurrent.futures
import os
import json
import re
from pathlib import Path
from typing import Any, Dict, Tuple, Union
import warnings
warnings.filterwarnings("ignore")


"""
FACTORY.PY - The Engine(monolith) of AIpomoea

This file serves as the core engine behind AIpomoea, orchestrating the entire workflow of model execution,
image processing, and result generation. It acts as the heart of the application, handling every step
from loading AI models to processing user-defined tasks, allowing the system to execute complex recipes
in an efficient and automated manner.

Key responsibilities include:
- **Loading models**: The file is responsible for dynamically loading pre-trained AI models from predefined
  locations. It supports parallel processing for performance optimization, ensuring the models are
  prepared and validated before use.

- **Executing recipes**: Recipes, which are sequences of commands defined by the user, are interpreted and
  executed in this file. The factory orchestrates the preprocessing, application of models, and post-processing
  to generate accurate results.

- **Parallel execution**: To maximize efficiency, multiple models can be executed in parallel. This reduces
  latency and increases throughput, particularly for larger datasets where multiple operations must be
  carried out simultaneously.

- **Exporting results**: Once processing is complete, the factory manages the exportation of results in
  various formats as defined by the user. This includes the ability to group results by specific criteria
  (such as genotype-based sorting) and save them in multiple output formats.

- **Handling custom configurations**: The factory adapts its execution based on user configurations,
  which can include custom preloading paths, export preferences, and special commands for fine-tuning
  the output.

- **Automation**: The entire process from model loading to result generation is designed to be fully automated,
  reducing manual intervention and allowing for batch processing of large datasets in a production environment.

- **Scalability**: Built with scalability in mind, the factory.py file is adaptable to various hardware
  configurations, ensuring compatibility across different systems while maintaining performance.

License: refer to the LICENSE file provided with the code for information on usage and redistribution rights.

version: 0.6.1 - 14/11/2024
"""

"""
Development Flags:

    DEBUG:
        - If True, debug messages will be printed to the console.
        - WARNING: The use of debug mode may produce false-positive error messages during client operation.
        - It is recommended to use debug mode only when running this file directly in a development environment.

    PERFORM_BENCHMARK:
        - If True, the time taken for the execution of each recipe will be logged.
        - This is useful for performance analysis and identifying bottlenecks in the processing pipeline.

Current Development Status:

    The code is fully functional, but still undergoing optimization for better performance.
    Significant improvements are in progress, particularly regarding error handling, exception management,
    and the implementation of new features.

    Key improvements underway include:
    - **Error and Exception Handling**: The code is being updated to more gracefully manage errors,
      ensuring robustness and minimizing crashes during execution.
    - **Refactoring**: The codebase is being refactored to enhance readability, maintainability, and scalability,
      making it easier for developers to contribute and modify in future versions.
    - **New Features**: Upcoming releases will introduce more advanced model execution methods, along with enhanced
      support for complex saving operations.

Parallel Execution:

    - The code is now capable of executing recipes in parallel using the `multiprocessing.Pool` class, significantly
      reducing processing time for large datasets and enhancing overall efficiency.
    - In the event of an error during parallel execution, the fallback mechanism will automatically switch to
      sequential execution using the `subprocess` module, ensuring that recipes complete even if parallelization
      encounters issues.
"""

DEBUG = False
PERFORM_BENCHMARK = False

pd.options.mode.chained_assignment = None  # Suppress SettingWithCopyWarning
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER_BUILD = Path('./uploads').resolve()
UPLOAD_FOLDER_DIST = Path('./resources/app/uploads').resolve()
RECIPE_PATH_BUILD = Path('./recipe.json').resolve()
RECIPE_PATH_DIST = Path('./resources/app/recipe.json').resolve()
MODELS_PATH_BUILD = Path('./models').resolve()
MODELS_PATH_DIST = Path('./resources/app/models').resolve()
CONFIG_PATH_BUILD = Path('./config.json').resolve()
CONFIG_PATH_DIST = Path('./resources/app/config.json').resolve()
CUSTOM_PRELOADING_PATH_BUILD = Path('./custom_preloading.json').resolve()
CUSTOM_PRELOADING_PATH_DIST = Path('./resources/app/custom_preloading.json').resolve()


class Model:
    """
    A class representing a model and model-related operations.
    Attributes:
        models (dict): A dictionary containing the loaded models.
        models_file (str): The file path of the models JSON file.
        model_definitions (dict): A dictionary containing the model definitions.
    Methods:
        __init__(): Initializes the Model object.
        load_models(): Loads the models from the models JSON file.
        get_model(name): Returns the model with the specified name.
    """
    def __init__(self):
        self.models = {}
        try:
            if os.path.exists(os.path.join(MODELS_PATH_BUILD, 'models.json')):
                self.models_file = os.path.join(MODELS_PATH_BUILD, 'models.json')
            elif os.path.exists(os.path.join(MODELS_PATH_DIST, 'models.json')):
                self.models_file = os.path.join(MODELS_PATH_DIST, 'models.json')
            else:
                print("Models file not found.")
        except Exception as e:
            print(f"Error while loading models: {e}")
        self.model_definitions = {}
        self.load_models()

    def load_models(self):
        """
        Loads and validates model definitions from a JSON file.
        Parameters:
            - None
        Returns:
            - None
        Example:
            - self.load_models()  # Assuming self.models_file is a JSON file containing model definitions
        """
        with open(self.models_file, 'r') as file:
            data = json.load(file)
            for model in data['models']:
                if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', model['name']):
                    raise ValueError(f"invalid model name: {model['name']}")
                self.model_definitions[model['name']] = model['path']

    # TODO Add compatibility to work with tf.model execution as it was before if user wants to use it.
    # def exec_model(self, model_name):
    #     if model_name in self.model_definitions:
    #         self.models[model_name] = self.model_definitions[model_name]
    #         print(f"Model {model_name} executing.")
    #     else:
    #         raise ValueError(f"Model {model_name} not found.")

    def get_model(self, name):
        return self.models[name] if name in self.models else None


class Utils:
    """
    Utils class provides utility methods for benchmarking code execution time and safely changing directories.
    Methods:
        __init__():
        benchmark():
        end_benchmark():
        benchmark_time(description="Operation"):
        change_directory(new_path):
    """

    def __init__(self):
        """
        Initializes the factory object with default settings.

        Attributes:
            start_time (None): Placeholder for the start time of the factory process.
            write_logs (bool): Flag to determine if logs should be written. Default is True.
        """
        self.start_time = None
        self.write_logs = True

    def benchmark(self):
        """
        Measures the execution time of a function or a block of code.

        Usage:
            benchmark()

        Returns:
            None
        """
        self.start_time = time.time()

    def end_benchmark(self):
        """
        Ends the benchmark and prints the elapsed time.

        If the start time is set, calculates the elapsed time by subtracting the start time from the current time.
        Prints the elapsed time in seconds with 6 decimal places.
        If the start time is not set, prints a message indicating that the benchmark start time is not set.
        """
        end_time = time.time()
        if self.start_time is not None:
            elapsed_time = end_time - self.start_time
            print(f"Benchmark completed in {elapsed_time:.6f} seconds.")
        else:
            print("Benchmark start time is not set.")

    @contextmanager
    def benchmark_time(self, description="Operation"):
        """
        Context manager for benchmarking the execution time of an operation.

        Parameters:
        - description (str): Description of the operation being benchmarked.

        Usage:
            with benchmark_time(description="Operation"):
                # Code to be benchmarked

        The benchmark_time context manager starts the benchmark timer, executes the code block inside the 'with' statement, and stops the timer when the code block completes. It then prints the elapsed time in seconds.

        Example:
            with benchmark_time(description="Sorting"):
                my_list = [3, 1, 4, 2]
                my_list.sort()

        Output:
            Sorting completed in 0.000123 seconds.
        """
        self.benchmark()
        try:
            yield
        finally:
            self.end_benchmark()
            if self.start_time is not None:
                message = (f"{description} completed in {time.time() - self.start_time:.6f} seconds.")
                print(message)
                if self.write_logs:
                    with open("benchmark.log", "a") as file:
                        file.write(message + "\n")
            else:
                print("Benchmark start time is not set.")

    @contextmanager
    def change_directory(self, new_path):
        """
            Context manager to safely change directories.

            This context manager allows you to safely change directories by temporarily changing the current working directory to the specified `new_path`. It ensures that the original working directory is restored after the code block inside the context manager is executed or an exception is raised.

            Parameters:
            - `new_path`: The new directory path to change to.

            Usage:
            new_path = '/caminho/para/novo/diretorio'
            with change_directory(new_path):
                # Code to be executed in the new directory.

        """
        self.ocwd = os.getcwd()
        os.chdir(new_path)
        try:
            yield
        finally:
            os.chdir(self.ocwd)


class Recipe:
    """
    The Recipe class is responsible for loading and processing user-defined recipes for the execution of AI models.

    Attributes:
    EXPORT_FORMATS (set): A set of supported export formats (e.g., {'csv', 'json', 'pdf', 'connected_database'}).
    COMMANDS_SPEC (set): A set of supported special commands (e.g., {'white_background', 'export_separation'}).
    recipe_path (Path): The path to the recipe file.

    Methods:
    init(): Initializes the Recipe class instance, determining the recipe path.
    _determine_recipe_path() -> Path: Determines the path to the recipe file.
    load_recipe() -> Dict[str, Any]: Loads the recipe from a JSON file and separates it into commands, command specifications, and export formats.
    _process_recipe(checkbox_states: Dict[str, bool]) -> Dict[str, Dict[str, bool]]: Processes the states of the recipe's checkboxes, categorizing them into commands, command specifications, and export formats.
    _decompose_commands(commands: Dict[str, bool]) -> Tuple[Dict[str, bool], Dict[str, bool], Dict[str, bool]]: Decomposes the commands into three categories: general commands, command specifications, and export formats.

    """
    def __init__(self):
        """
        Initializes the Recipe instance by setting the recipe path.
        """
        self.EXPORT_FORMATS = {'csv', 'json', 'pdf', 'connected_database'}
        self.COMMANDS_SPEC = {'white_background', 'export_separation'}
        self.recipe_path = self._determine_recipe_path()
        if DEBUG:
            print(f"DEBUG - Recipe path determined: {self.recipe_path}")

    def _determine_recipe_path(self) -> Path:
        """
        Determines the path of the recipe file.

        Returns:
            Path: Path to the recipe file if it exists.

        Raises:
            FileNotFoundError: If the recipe file is not found in either path.
        """
        if RECIPE_PATH_BUILD.exists():
            if DEBUG:
                print(f"DEBUG - Using recipe path: {RECIPE_PATH_BUILD}")
            return RECIPE_PATH_BUILD
        elif RECIPE_PATH_DIST.exists():
            if DEBUG:
                print(f"DEBUG - Using recipe path: {RECIPE_PATH_DIST}")
            return RECIPE_PATH_DIST
        if DEBUG:
            print("DEBUG - Recipe file not found in both paths.")
        raise FileNotFoundError("FINIT2 - Recipe not found.")

    def load_recipe(self) -> Dict[str, Any]:
        """
        Loads the recipe from a JSON file and separates it into commands, command specs,
        and export formats.

        Returns:
            dict: Contains commands, commands_spec, and exportation_format.

        Raises:
            Exception: If there's an issue reading or parsing the recipe file.
        """
        try:
            if DEBUG:
                print(f"DEBUG - Loading recipe from path: {self.recipe_path}")
            with self.recipe_path.open('r', encoding='utf-8') as file:
                content = json.load(file)
                if DEBUG:
                    print(f"DEBUG - Recipe content loaded: {content}")
                checkbox_states = content.get('checkboxStates', {})
                if DEBUG:
                    print(f"DEBUG - Checkbox states extracted: {checkbox_states}")
                return self._process_recipe(checkbox_states)
        except (json.JSONDecodeError, IOError) as e:
            print(f"FLRE1- Error while loading recipe: {e}")
            raise

    def _process_recipe(self, checkbox_states: Dict[str, bool]) -> Dict[str, Dict[str, bool]]:
        """
        Processes the checkbox states from the recipe, categorizing them into commands,
        command specs, and export formats.

        Args:
            checkbox_states (dict): The raw checkbox states from the recipe file.

        Returns:
            dict: A dictionary with categorized commands, commands_spec, and exportation_format.
        """
        if DEBUG:
            print(f"DEBUG - Processing checkbox states: {checkbox_states}")
        commands, commands_spec, exportation_format = self._decompose_commands(checkbox_states)
        if DEBUG:
            print(f"DEBUG - Commands: {commands}")
            print(f"DEBUG - Command specs: {commands_spec}")
            print(f"DEBUG - Exportation formats: {exportation_format}")
        return {
            "commands": commands,
            "commands_spec": commands_spec,
            "exportation_format": exportation_format
        }

    def _decompose_commands(self, commands: Dict[str, bool]) -> Tuple[Dict[str, bool], Dict[str, bool], Dict[str, bool]]:
        """
        Decomposes commands into three categories:
        - Commands for general commands,
        - Commands_spec for special configurations,
        - Exportation_format for export-specific commands.

        Args:
            commands (dict): The raw commands from the recipe file.

        Returns:
            tuple: Contains dictionaries of commands, commands_spec, and exportation_format.
        """
        general_commands = {}
        command_specs = {}
        export_formats = {}
        for command, value in commands.items():
            normalized_command = command.replace("-", "_")
            if normalized_command in self.EXPORT_FORMATS:
                export_formats[normalized_command] = value
            elif normalized_command in self.COMMANDS_SPEC:
                command_specs[normalized_command] = value
            else:
                general_commands[normalized_command] = value
        if DEBUG:
            print(f"DEBUG - Decomposed commands: {general_commands}")
            print(f"DEBUG - Decomposed command specs: {command_specs}")
            print(f"DEBUG - Decomposed export formats: {export_formats}")
        return general_commands, command_specs, export_formats


class ResultsExporter:
    def __init__(self, exportation_formats, output_folder, separate_exports):
        """
        Initializes the ResultsExporter with export formats and output folder.
        Parameters:
            - exportation_formats (dict): Dictionary specifying formats for export (e.g., {'csv': True, 'json': True}).
            - output_folder (str): Path to the folder where results will be saved.
            - separate_exports (bool): Flag to indicate if exports should be separated by image groups.
        """
        self.exportation_formats = exportation_formats
        self.output_folder = output_folder
        self.separate_exports = separate_exports

    def export_results(self, results_dict):
        """
        Exports results in specified formats, optionally separating them by a configured position.

        Parameters:
            results_dict (dict): Dictionary of results to export, keyed by image names with associated data.

        Returns:
            None
        """
        try:
            if DEBUG:
                print("DEBUG - Starting export_results method.")
                print(f"DEBUG - Results to export: {results_dict}")

            position = self.separate_exports - 1 if self.separate_exports else None

            if position is not None:
                if DEBUG:
                    print(f"DEBUG - Exporting results with separation at position {position}.")

                try:
                    separated_results = self._group_results_by_position(results_dict, position)
                except Exception as group_error:
                    print(f"REXEXR2 - Error while grouping results by position: {group_error}")
                    raise group_error

                if DEBUG:
                    print(f"DEBUG - Grouped results: {separated_results}")

                if separated_results:
                    for base_name, grouped_results in separated_results.items():
                        if DEBUG:
                            print(f"DEBUG - Exporting results for base name: {base_name}")
                        try:
                            self._export_to_formats(base_name, grouped_results)
                        except Exception as export_error:
                            print(f"REXEXR3 - Error while exporting grouped results for base name '{base_name}': {export_error}")
                            raise export_error
            else:
                if DEBUG:
                    print("DEBUG - No separation position provided. Exporting all results together.")
                try:
                    self._export_to_formats("results", results_dict)
                except Exception as export_error:
                    print(f"REXEXR4 - Error while exporting non-separated results: {export_error}")
                    raise export_error

        except Exception as e:
            print(f"REXEXR1 - Error in export_results method: {e}")
            raise e

    def _group_results_by_position(self, results_dict, position):
        """
        Groups results by the specified position in the image name.

        Parameters:
            results_dict (dict): Original results dictionary keyed by image names.
            position (int): Position to use for grouping the results (0-based index).

        Returns:
            dict: Dictionary where each key is a base name, and each value is a dictionary of results.
        """
        try:
            if DEBUG:
                print("DEBUG - Starting _group_results_by_position method.")
                print(f"DEBUG - Position for grouping: {position}")
                print(f"DEBUG - Results to group: {results_dict}")

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
                        print(f"GRBB2 - Invalid position {position} for image '{image}'. Skipping this image.")
                except Exception as grouping_error:
                    print(f"GRBB3 - Error processing image '{image}': {grouping_error}")
                    raise grouping_error

            if DEBUG:
                print(f"DEBUG - Grouped results: {separated_results}")

            return separated_results

        except Exception as e:
            print(f"GRBB1 - Error in _group_results_by_position method: {e}")
            raise e

    def _export_to_formats(self, base_name, results_data):
        """
        Exports data in all specified formats (CSV, JSON).

        Parameters:
            base_name (str): Name to use as the base of the output filename.
            results_data (dict): Dictionary of results keyed by image with associated data.

        Returns:
            None
        """
        try:
            if DEBUG:
                print(f"DEBUG - Starting export for base name: {base_name}")
                print(f"DEBUG - Results data: {results_data}")

            rows = []
            for image, data in results_data.items():
                if isinstance(data, dict):
                    rows.extend((image, model, result) for model, result in data.items())
                else:
                    print(f"REXFOR3 - Unexpected data format for image '{image}': {data}")

            if not rows:
                print(f"REXFOR4 - No valid data to export for base name '{base_name}'")
                raise ValueError(f"No valid data to export for base name '{base_name}'")

            results_df = pd.DataFrame(rows, columns=['image', 'model', 'result']).pivot(
                index='image', columns='model', values='result'
            ).reset_index()

            if DEBUG:
                print("DEBUG - DataFrame created for export:")
                print(results_df.head())

            for format_name, enabled in self.exportation_formats.items():
                if enabled:
                    export_method = getattr(self, f"_export_to_{format_name}", None)
                    if callable(export_method):
                        try:
                            export_method(base_name, results_df)
                        except Exception as e:
                            print(f"REXFOR2 - Error while exporting '{base_name}' to {format_name.upper()}: {e}")
                            raise e
                    else:
                        print(f"REXFOR6 - No valid export method found for format: {format_name}")

            print("done")

        except ValueError as ve:
            print(f"REXFOR4 - Value error encountered: {ve}")
            raise ve
        except KeyError as ke:
            print(f"REXFOR5 - Missing configuration key: {ke}")
            raise ke
        except Exception as e:
            print(f"REXFOR1 - Unexpected error during export: {e}")
            raise e

    def _export_to_csv(self, base_name, results_df):
        """
        Exports results DataFrame to a CSV file.
        Parameters:
            - base_name (str): Name to use as the base of the output filename.
            - results_df (pd.DataFrame): DataFrame containing the results.
        """
        try:

            results_df.to_csv(f"{self.output_folder}/{base_name.lower()}.csv", index=False)
        except Exception as e:
            print(f"CSVEX - Error while exporting {base_name} to CSV: {e}")

    def _export_to_json(self, base_name, results_df):
        """
        Exports results DataFrame to a JSON file.
        Parameters:
            - base_name (str): Name to use as the base of the output filename.
            - results_df (pd.DataFrame): DataFrame containing the results.
        """
        try:
            results_json_list = [
                {"image": row["image"], **row.drop("image").to_dict()}
                for _, row in results_df.iterrows()
            ]
            with open(f"{self.output_folder}/{base_name.lower()}.json", 'w') as json_file:
                json.dump(results_json_list, json_file, indent=4)
        except Exception as e:
            print(f"JSONEX - Error while exporting {base_name} to JSON: {e}")


class Factory:
    """
    The Factory class is the core engine of the AIpomoea application, responsible for orchestrating the entire workflow...
    since model execution, image processing, and result generation.
    It acts as the heart of the application, handling every step from loading AI models to processing user-defined tasks, allowing the system to execute complex recipes in an efficient and automated manner.

    Attributes:
        upload_folder (str): The path to the upload folder.
        commands (dict): The commands loaded from the recipe.
        commands_spec (dict): The specifications of the commands loaded from the recipe.
        exportation_formats (dict): The export formats loaded from the recipe.
        ocwd (str): The current working directory.
        models_path (str): The path to the models folder.
        config_path (str): The path to the configuration file.
        custom_preloading_path (str): The path to the custom preloading file.
        images (dict): A dictionary for storing images.
        results (pandas.DataFrame): A DataFrame for storing results.
        models (Model): An instance of the Model class.
        db_conn (sqlite3.Connection): A connection to the SQLite database.
        db_cursor (sqlite3.Cursor): A cursor for the SQLite database.
        batch_size (int): The batch size for parallel execution.
        utils (Utils):

    Methods:
        load_config()
        load_database()
        load_custom_preloading()
        get_output_folder()
        preloading()
        select_only(values)
        exclude_only(values)
        load_export_separation()
        verify_preprocessed_images()
        load_images()
        export_connecteddb(results)
        export_results(results)
        execute_recipe()
        _get_binary_path(command)
        _run_subprocess(binary_path,batch)
        _process_results(result_lines, command)
        _execute_command(command)
        execute_recipes_parallel()

    """

    def __init__(self):
        """
        Initializes the Factory object.
        Raises:
            FileNotFoundError: If any of the required files or folders are not found.
        """

        if (UPLOAD_FOLDER_BUILD).exists():
            self.upload_folder = UPLOAD_FOLDER_BUILD
        elif (UPLOAD_FOLDER_DIST).exists():
            self.upload_folder = UPLOAD_FOLDER_DIST
        else:
            if DEBUG:
                print("DEBUG - Upload folder not found.")
                print(f"DEBUG - nor {UPLOAD_FOLDER_BUILD} or {UPLOAD_FOLDER_DIST} exists.")
            raise FileNotFoundError("FINIT1 - Images folder not found.")

        recipe = Recipe()
        recipe_content = recipe.load_recipe()
        self.commands = recipe_content['commands']
        self.commands_spec = recipe_content['commands_spec']
        self.exportation_formats = recipe_content['exportation_format']
        self.ocwd = os.getcwd()

        if (MODELS_PATH_BUILD).exists():
            self.models_path = MODELS_PATH_BUILD
        elif (MODELS_PATH_DIST).exists():
            self.models_path = MODELS_PATH_DIST
        else:
            raise FileNotFoundError("FINIT3 - Models folder not found.")

        if (CONFIG_PATH_BUILD).exists():
            self.config_path = CONFIG_PATH_BUILD
        elif (CONFIG_PATH_DIST).exists():
            self.config_path = CONFIG_PATH_DIST
        else:
            raise FileNotFoundError("FINIT4 - Config file not found.")

        if (CUSTOM_PRELOADING_PATH_BUILD).exists():
            self.custom_preloading_path = CUSTOM_PRELOADING_PATH_BUILD
        elif (CUSTOM_PRELOADING_PATH_DIST).exists():
            self.custom_preloading_path = CUSTOM_PRELOADING_PATH_DIST
        else:
            raise FileNotFoundError("FINIT5 - Custom preloading file not found.")

        self.images = {}
        self.preloading()
        self.load_images()
        self.results = pd.DataFrame()
        self.models = Model()
        self.db_conn = None
        self.db_cursor = None
        self.batch_size = 50  # Batch size for parallel execution

        if PERFORM_BENCHMARK:  # Benchmarking flag
            self.utils = Utils()

    def load_config(self):
        """
        Load the configuration from a JSON file.
        Parameters:
            - None
        Returns:
            - dict: The content of the configuration file as a dictionary.
        Example:
            - load_config() -> {'setting1': 'value1', 'setting2': 'value2'}
        """
        try:
            with open(self.config_path, 'r') as file:
                content = json.load(file)
                return content
        except Exception as e:
            print(f"FLCO1 - Error while loading config: {e}")
            traceback.print_exc()
            raise e

    def load_database(self):
        """
        Load the database from a JSON file.
        Parameters:
            - None
        Returns:
            - tuple: A tuple containing the connection and cursor objects.
        Example:
            - load_database() -> (connection, cursor)
        """
        config = self.load_config()
        if config['ENABLE_DB']:
            db_path = Path(config['DB_PATH'])
            db_name = config['DB_NAME']

            if not (db_path).exists():
                raise FileNotFoundError("FDB3 - Database not found.")
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()

                cursor.execute("""
                    SELECT name FROM sqlite_master WHERE type='table' AND name=?;
                """, (db_name,))

                table_exists = cursor.fetchone() is not None

                if table_exists:
                    self.db_conn = conn
                    self.db_cursor = cursor
                else:
                    raise ValueError("FDB2 - Table not found.")
            except Exception as e:
                print(f"FDB1 - Error while loading database: {e}")
                traceback.print_exc()
                raise e

    def load_custom_preloading(self):
        """
        Load custom preloading from a JSON file.

        Returns:
            dict: The content of the JSON file.

        Raises:
            Exception: If there is an error while loading the custom preloading.
        """
        try:
            with open(self.custom_preloading_path, 'r') as file:
                content = json.load(file)
                return content
        except Exception as e:
            print(f"LCP1 - Error while loading custom preloading: {e}")
            traceback.print_exc()
            raise e

    def get_output_folder(self):
        """
        Retrieves the output folder directory from the configuration.
        Parameters:
            - self (object): Instance of the class containing this method.
        Returns:
            - str: The path to the output directory.
        Example:
            - instance.get_output_folder() -> '/path/to/output_directory'
        """
        try:
            config = self.load_config()
            if not config.get('OUTPUT_DIR'):
                return os.path.abspath(os.path.join(self.ocwd, "results"))
            return config['OUTPUT_DIR']
        except Exception as e:
            print("GOF1 - Error while getting output folder.")
            traceback.print_exc()
            raise e

    def preloading(self):
        """
        Perform preloading based on the custom preloading configuration.

        This method loads the custom preloading configuration and checks if a custom entry is specified.
        If a custom entry is found, it checks the selected option in the preloading configuration and performs the corresponding action.

        Returns:
            bool: True if preloading is performed successfully, False otherwise.
        """
        preloading_config = self.load_custom_preloading()
        if 'customEntry' in preloading_config:
            custom_entry = preloading_config['customEntry']
            if custom_entry:
                try:
                    custom_entry = custom_entry.split(',')
                    selected_option = preloading_config.get('selectedOption')
                    export_separation = preloading_config.get('exportSeparation')
                    if selected_option == 'selectOnly':
                        self.select_only(custom_entry)
                    elif selected_option == 'excludeOnly':
                        self.exclude_only(custom_entry)
                    if export_separation:
                        print(f"Export separation option selected: {export_separation}")
                except Exception as e:
                    print(f"FPL1 - Error while performing preloading: {e}")
                    return False
            else:
                if DEBUG:
                    print("DEBUG - No custom entry found in preloading configuration.")
                pass
        else:
            pass

    def select_only(self, values):
        """
        Selects only the images whose filenames start with the specified values.

        Args:
            values (list): A list of strings representing the desired starting values of the filenames.

        Returns:
            None
        """
        try:
            images = self.load_images()
            allowed_images = set()
            for value in values:
                allowed_images.update([i for i in images if i.startswith(value)])
            for image in images:
                if image not in allowed_images:
                    os.remove(os.path.join(self.upload_folder, image))
            pass
        except Exception as e:
            print(f"FPL2 - Error while selecting images: {e}")
            raise BaseException(e)
        self.verify_preprocessed_images()

    def exclude_only(self, values):
        """
        Removes images from the upload folder that start with the specified values.

        Args:
            values (list): A list of strings representing the values to match the image names.

        Returns:
            None
        """
        try:
            images = self.load_images()
            for value in values:
                for image in images:
                    if image.startswith(value):
                        os.remove(os.path.join(self.upload_folder, image))
            pass
        except Exception as e:
            print(f"FPL3 - Error while excluding images: {e}")
            raise BaseException(e)
        self.verify_preprocessed_images()

    def load_export_separation(self) -> Union[int, bool]:
        """
        Loads the export separation configuration.

        Returns:
            int: Position of the separation factor in the naming convention (1-based index).
            bool: False if the separation factor is not specified or is 'Nenhum'.

        Raises:
            ValueError: If the separation factor is invalid or not found.
            Exception: For other errors while loading configurations.
        """
        try:
            config = self.load_config()
            custom = self.load_custom_preloading()

            separating_factor = custom.get('exportSeparation')
            naming_convention = config.get('NAMING_CONVENTION')

            if not separating_factor or separating_factor == 'Nenhum':
                return False

            if not naming_convention:
                raise ValueError("FLES2 - Naming convention not specified in the configuration.")

            naming_convention_parts = re.split(r'[_-]', naming_convention)

            if separating_factor in naming_convention_parts:
                return naming_convention_parts.index(separating_factor) + 1

            raise ValueError("FLES3 - Separating factor not found in naming convention.")

        except KeyError as e:
            print(f"FLES4 - Missing configuration key: {e}")
            raise e
        except ValueError as e:
            print(f"FLES5 - Invalid value provided for export separation: {e}")
            raise e
        except Exception as e:
            print("FLES1 - Error while loading export separation.")
            raise e

    def verify_preprocessed_images(self):
        """Verify that images have been preprocessed.
        Parameters:
            - self: Instance of the class containing preprocessed images.
        Returns:
            - None: Raises FileNotFoundError if no images are found.
        Example:
            - verify_preprocessed_images() -> None
        """
        if not self.images:
            print("FVPI1 - No images found.")
            raise FileNotFoundError("FVPI1 - No images found.")
        pass

    def load_images(self):
        """
        Load images from a specified upload folder and store them in a dictionary.
        Parameters:
            - self (object): An instance of a class containing the upload_folder and images attributes.
        Returns:
            - dict: A dictionary where keys are filenames and values are their respective file paths.
        Example:
            - Assuming instance.load_images() is called on an instance of a class with an upload_folder attribute set to 'uploads/' and images attribute initialized as an empty dictionary:
              instance.load_images() -> {'image1.jpg': 'uploads/image1.jpg', 'image2.png': 'uploads/image2.png'}
        """
        try:
            if self.upload_folder is None:
                print("FLI1 - Upload folder not found.")
                traceback.print_exc()
                raise FileNotFoundError("FLI1 - Images folder not found.")

            if not isinstance(self.images, dict):
                print("FLI4 - Invalid images dictionary.")
                traceback.print_exc()
                raise ValueError("FLI2 - Invalid images dictionary.")

            for filename in os.listdir(self.upload_folder):
                if filename.split('.')[-1].lower() in ALLOWED_EXTENSIONS:
                    self.images[filename] = os.path.join(self.upload_folder, filename)

            if not self.images:
                print("FLI5 - No images found.")
                traceback.print_exc()
                raise FileNotFoundError("FLI3 - No images found.")

            return self.images
        except Exception as e:
            print("FLIBE - Error while loading images.")
            traceback.print_exc()
            raise e

    def export_connecteddb(self, results):
        """
    Exports data from a DataFrame to a connected SQLite database, updating existing entries and
    adding new columns if necessary.

    Parameters:
        - self (object): An instance of the class that holds the database connection (`db_conn`) and cursor (`db_cursor`).
        - results (pandas.DataFrame): A DataFrame containing data to be exported to the SQLite database.
          The DataFrame must include at least an 'image' column to uniquely identify each row in the table.

    Returns:
        - None: The function performs database operations and does not return any value.

    Raises:
        - AttributeError: If the database connection (`db_conn`) or cursor (`db_cursor`) are not defined or are set to `None`.
        - KeyError: If the 'image' column is not present in the DataFrame, as it is required to identify existing records.

    Database Requirements:
        - The function assumes an SQLite database with a specific table configuration, as follows:
            - Table name: The table name is obtained from the configuration file loaded by `load_config()`,
              accessible via `config['DB_NAME']`.
            - Columns: The primary column used for identifying records is `image` (TEXT), which should contain
              unique values (e.g., file names, URLs) for each row. Additional columns in the DataFrame will be
              matched to columns in the table; if a column is missing in the database, it will be added automatically.
            - Primary key: Although the function does not enforce a primary key constraint, the `image` column
              serves as a unique identifier for each row.

    Example Usage:
        Assuming the database and cursor are set up and the `load_config` function provides the necessary table
        name, the following code would allow exporting a DataFrame to the SQLite database:

        ```
        db_handler = DatabaseHandler()  # Example class containing db_conn and db_cursor attributes
        results = pd.DataFrame({
            'image': ['image1.png', 'image2.png'],
            'description': ['Description 1', 'Description 2'],
            'date_added': ['2024-10-28', '2024-10-29']
        })
        db_handler.export_connecteddb(results)
        ```

    Details:
        - Database connection and cursor validation:
          Checks if `db_conn` and `db_cursor` are defined to prevent database operation errors.
        - Table structure and column verification:
          Uses the `PRAGMA table_info` command to fetch existing columns. New columns are added if they exist in
          the DataFrame but not in the database table.
        - Data insertion and update:
          For each row in the DataFrame, the function checks for an existing entry with the same `image` value:
            - If an entry exists, the function updates columns other than `image`.
            - If no entry is found, it inserts the entire row as a new record.

    Note:
        The 'image' column is essential for identifying and updating records. Ensure the DataFrame includes this
        column with unique values to avoid conflicts. The function assumes that the `image` column is formatted
        consistently between the DataFrame and the database.
    """
        try:
            if not hasattr(self, 'db_cursor') or not hasattr(self, 'db_conn'):
                traceback.print_exc()
                raise AttributeError("FBSQL1- A conexão com o banco de dados não está definida.")

            if self.db_cursor is None or self.db_conn is None:
                traceback.print_exc()
                raise AttributeError("FBSQL2 - A conexão com o banco de dados não está definida.")

            # Obter o nome da tabela a partir da configuração
            config = self.load_config()
            table_name = config['DB_NAME']

            # Verificar as colunas existentes na tabela do banco de dados
            self.db_cursor.execute(f"PRAGMA table_info({table_name});")
            existing_columns = [info[1] for info in self.db_cursor.fetchall()]

            try:
                for col in results.columns:
                    if col not in existing_columns:
                        self.db_cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col} TEXT;")
            except Exception as e:
                print(f"FBSQL3 - Erro ao adicionar colunas: {e}")
                traceback.print_exc()
                raise e

            for index, row in results.iterrows():
                image_name = row['image']

                self.db_cursor.execute(f"SELECT 1 FROM {table_name} WHERE image = ?", (image_name,))
                exists = self.db_cursor.fetchone()
                try:
                    if exists:
                        update_placeholders = ', '.join([f"{col} = ?" for col in row.index if col != 'image'])
                        update_sql = f"UPDATE {table_name} SET {update_placeholders} WHERE image = ?"
                        self.db_cursor.execute(update_sql, tuple(row[col] for col in row.index if col != 'image') + (image_name,))
                    else:
                        columns = ', '.join(row.index)
                        placeholders = ', '.join(['?'] * len(row))
                        insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
                        self.db_cursor.execute(insert_sql, tuple(row))
                except Exception as e:
                    print(f"FBSQL4 - Erro ao inserir/atualizar dados: {e}")
                    traceback.print_exc()
                    raise e

            self.db_conn.commit()
            self.db_conn.close()

        except AttributeError as e:
            print("FBSQL-ATTR: ", e)
            traceback.print_exc()
            raise e
        except sqlite3.DatabaseError as e:
            print("FBSQL-DBERR: ", e)
            traceback.print_exc()
            raise e
        except Exception as e:
            print("FBSQL-EXC: ", e)
            traceback.print_exc()
            raise e

    def export_results(self, results):
        """
        Exports the given results in various formats such as CSV or JSON based on specified exportation formats.
        Parameters:
            - results (list of tuples): A list where each tuple contains an image identifier, a model identifier, and the corresponding result.
        Returns:
            - None: This function does not return any value; it performs export operations and logs the status.
        Example:
            - export_results([('image1', 'modelA', 0.95), ('image2', 'modelB', 0.88)])
        """
        try:
            output_folder = self.get_output_folder()
            if DEBUG:
                print(f"DEBUG - Output_folder: {output_folder}")

            separate_position = self.load_export_separation()

            results_dict = {}

            for image, model, result in results:
                if image not in results_dict:
                    results_dict[image] = {}
                results_dict[image][model] = result

            results_pd = pd.DataFrame.from_dict(results_dict, orient='index').reset_index()
            results_pd.rename(columns={'index': 'image'}, inplace=True)

            if self.exportation_formats.get('connected_database', False):
                self.load_database()
                self.export_connecteddb(results_pd)

            if DEBUG:
                print(f"DEBUG - Exporting results: {results_dict}")
                print("DEBUG - Calling ResultsExporter with those parameters:")
                print(f"DEBUG - Exportation formats: {self.exportation_formats}")
                print(f"DEBUG - Output folder: {output_folder}")
                print(f"DEBUG - Separate exports: {separate_position}")

            exporter = ResultsExporter(
                exportation_formats=self.exportation_formats,
                output_folder=output_folder,
                separate_exports=separate_position
            )
            exporter.export_results(results_dict)
        except Exception as e:
            print(f"FPEXR - Error during export_results: {e}")
            traceback.print_exc()
            raise e

    def execute_recipe(self):
        """
        Executes the loaded recipes sequentially and stores the results.
        Returns:
            If an error occurs while loading the binary, the exception is returned.
            If an error occurs while executing a command, the exception is returned.
        """
        if DEBUG:
            print("DEBUG - Executing recipe...")
        additional_parameter = []
        sequential_results = []
        self.white_background = self.commands_spec.get('white_background', False)

        try:
            for command, value in self.commands.items():
                if value:
                    if DEBUG:
                        print(f"DEBUG - Executing command {command}...")
                    binary_path = self._get_binary_path(command)
                    print(binary_path)
                    if binary_path:
                        try:
                            image_path = list(self.images.values())
                            try:
                                if DEBUG:
                                    print(f"DEBUG - Executing BIN of {command}...")
                                full_command = [binary_path] + image_path
                                print(full_command)
                                result = subprocess.check_output(full_command)
                                if DEBUG:
                                    print([binary_path] + additional_parameter + image_path)
                                result = result.decode('utf-8').strip()
                                result_lines = result.split('\n')
                                for line in result_lines:
                                    parts = line.split(" Result: ")
                                    if len(parts) == 2:
                                        image_filename = os.path.basename(parts[0].split(": ")[1]).strip(" -")
                                        image_filename = os.path.splitext(image_filename)[0]
                                        result_values = parts[1].replace('*', '').strip()
                                        sequential_results.append((image_filename, command, result_values))
                            except Exception as e:
                                print(f"FBIN2 - Error while executing {command}: {e}")
                                traceback.print_exc()
                                raise e
                        finally:
                            os.chdir(self.ocwd)
                    else:
                        print(f"FBIN3 - Model {command} not found.")
                        os.chdir(self.ocwd)
                else:
                    if DEBUG:
                        print(f"DEBUG - Skipping command {command}...")
        except Exception as e:
            print(f"FER1 - Error while executing recipe: {e}")
            traceback.print_exc()
        finally:
            if DEBUG:
                print("DEBUG - Exporting results...")
            self.export_results(sequential_results)

    def _get_binary_path(self, command):
        """Find the correct binary path for the given command.

        Args:
            command (str): The command for which to find the binary path.

        Returns:
            tuple or None: A tuple containing the binary path and the corresponding directory path,
            or None if the binary path could not be found.

        Raises:
            RuntimeError: If an error occurs while getting the binary path.
        """
        self.white_background = self.commands_spec.get('white_background', False)
        if command == 'root_color' or 'root_advanced_color':
            if self.white_background:
                additional_parameter = " --whitebg "
                if DEBUG:
                    print(f"DEBUG - Additional parameter: {additional_parameter}")
        try:
            binary_path = os.path.join(Path(self.models_path).resolve(), command + ".exe")
            additional_parameter = additional_parameter if 'additional_parameter' in locals() else ""
            binary_path = binary_path + additional_parameter
            if DEBUG:
                print(f"DEBUG - Binary path: {binary_path}")
            return binary_path
        except Exception as e:
            traceback.print_exc()
            raise RuntimeError(f"FBIN1_P - Error while loading binary: {e}")

    def _run_subprocess(self, binary_path, batch):
        """Run the subprocess for a batch of images.

        Args:
            binary_path (str): The path to the binary executable.
            batch (list): A list of image paths to process.

        Returns:
            list: A list of strings representing the output of the subprocess.

        Raises:
            subprocess.CalledProcessError: If the subprocess returns a non-zero exit status.

        """
        """Run the subprocess for a batch of images."""
        try:
            result = subprocess.check_output([binary_path] + batch)
            return result.decode('utf-8').strip().split('\n')
        except subprocess.CalledProcessError as e:
            print(f"FRSB1 - Subprocess error: {e}")
            traceback.print_exc()
            raise e

    def _process_results(self, result_lines, command):
        """Process the result lines from the subprocess.

        Args:
            result_lines (list): List of strings containing the result lines.
            command (str): The command used to generate the results.

        Returns:
            list: A list of tuples containing the processed results. Each tuple contains:
                - image_filename (str): The filename of the image.
                - command (str): The command used to generate the results.
                - result_values (str): The processed result values.

        """
        """Process the result lines from the subprocess."""
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

    def _execute_command(self, command):
        """
        Executes a single command and returns the result, with compatibility for parallelized execution.

        Args:
            command (str): The command to be executed.

        Returns:
            list: A list of tuples. Each tuple contains:
                - image_filename (str): The filename of the image processed.
                - command (str): The command that was executed.
                - result_values (various): The result values from the command execution.
                If an error occurs, the list will contain a single tuple with an error message.

        Raises:
            Exception: If there is an error during the execution of the command.


        """
        if DEBUG:
            print(f"DEBUG - Process {current_process().name} - Executing command {command}...")

        try:
            config = self.load_config()
            binary_path = self._get_binary_path(command)
            if not binary_path:
                if DEBUG:
                    print(f"DEBUG - Model {command} not found.")
                return [(f"FBIN3_P Model {command} not found.",)]

            image_paths = list(self.images.values())
            results = []

            binary_dir = os.path.dirname(binary_path)

            with Utils().change_directory(binary_dir):
                if config['FORCE_MAXPERFORMANCE']:
                    with concurrent.futures.ThreadPoolExecutor() as executor:
                        future_to_batch = {executor.submit(self._run_subprocess, binary_path, image_paths[i:i + self.batch_size]): i for i in range(0, len(image_paths), self.batch_size)}
                        for future in concurrent.futures.as_completed(future_to_batch):
                            batch_index = future_to_batch[future]
                            try:
                                result_lines = future.result()
                                results.extend(self._process_results(result_lines, command))
                            except Exception as e:
                                if DEBUG:
                                    print(f"DEBUG - Error while executing {command} on batch {batch_index}, retrying with smaller batch: {e}")
                                # Retry logic for smaller batch
                                for j in range(batch_index, batch_index + self.batch_size, self.batch_size // 2):
                                    retry_batch = image_paths[j:j + self.batch_size // 2]
                                    if DEBUG:
                                        print(f"DEBUG - Retrying with smaller batch {j // (self.batch_size // 2) + 1}: {retry_batch}")
                                    try:
                                        result_lines = self._run_subprocess(str(binary_path), retry_batch)
                                        results.extend(self._process_results(result_lines, command))
                                    except Exception as retry_e:
                                        traceback.print_exc()
                                        raise RuntimeError(f"FBIN2_P - Error while retrying smaller batch: {retry_e}")
                else:
                    for i in range(0, len(image_paths), self.batch_size):
                        batch = image_paths[i:i + self.batch_size]
                        if DEBUG:
                            print(f"DEBUG - Processing batch {i // self.batch_size + 1}: {batch}")
                        try:
                            result_lines = self._run_subprocess(binary_path, batch)
                            results.extend(self._process_results(result_lines, command))
                        except Exception as e:
                            if DEBUG:
                                print(f"DEBUG - Error while executing {command} on batch, retrying with smaller batch: {e}")
                            # Retry logic for smaller batch
                            for j in range(i, i + self.batch_size, self.batch_size // 2):
                                retry_batch = image_paths[j:j + self.batch_size // 2]
                                if DEBUG:
                                    print(f"DEBUG - Retrying with smaller batch {j // (self.batch_size // 2) + 1}: {retry_batch}")
                                try:
                                    result_lines = self._run_subprocess(binary_path, retry_batch)
                                    results.extend(self._process_results(result_lines, command))
                                except Exception as retry_e:
                                    if DEBUG:
                                        print(f"DEBUG - Error during retry: {retry_e}")
                                    results.append(
                                        (f"FBIN2_P - Error while retrying smaller batch: {retry_e}",)
                                    )

        except Exception as outer_e:
            if DEBUG:
                print(f"DEBUG - Outer exception caught: {outer_e}")

        return results

    def execute_recipes_parallel(self):
        """
        Executes the loaded recipes in parallel using multiprocessing.Pool.
        Returns:
            None
        Raises:
            None
        """
        self.true_commands = [command for command, value in self.commands.items() if value]
        expected_images = len(self.images)
        copied_images = set(os.listdir(self.upload_folder))

        try:
            wait_time = 1
            while len(copied_images) < expected_images:
                if DEBUG:
                    missing_images = expected_images - len(copied_images)
                    print(
                        f"DEBUG - Waiting for images to be copied... "
                        f"{missing_images} images remaining."
                    )
                time.sleep(wait_time)
                wait_time = min(wait_time * 2, 16)
                copied_images = set(os.listdir(self.upload_folder))

        except Exception as e:
            print(f"FPAR2 - Error while waiting for images to be copied: {e}")
            traceback.print_exc()
            return e

        if DEBUG:
            print("DEBUG - All images copied, proceeding to parallel execution of recipes...")

        num_processes = min(cpu_count(), len(self.true_commands))  # Optimize the number of processes

        try:
            with Pool(processes=num_processes) as pool:
                if DEBUG:
                    print(f"DEBUG - Starting parallel execution with {num_processes} processes.")

                if PERFORM_BENCHMARK:
                    print("Benchmarking parallel execution...")
                    with self.utils.benchmark_time("Executing commands in parallel"):
                        results = pool.map(self._execute_command, self.true_commands)
                else:
                    results = pool.map(self._execute_command, self.true_commands)
        except Exception as e:
            print(f"FPAR3 - Error while executing recipes in parallel: {e}")
            traceback.print_exc()
            return e

        # Flatten results and handle errors
        sequential_results = []
        for result in results:
            try:
                if isinstance(result, list):
                    sequential_results.extend(result)
                else:
                    print(f"FPAR1 - Warning: Expected a list result, got {type(result)} instead.")
            except Exception as e:
                print(f"FPAR4 - Error while processing parallel execution results: {e}")
                traceback.print_exc()
                return e

        if DEBUG:
            print("DEBUG - Recipes executed in parallel successfully, proceeding to export.")
            print(f"DEBUG - Parallel results: {sequential_results}")
        self.export_results(sequential_results)


def handle_parallel_recipes_execution(__name__, Factory):
    """
    Executes recipes in parallel or sequentially based on the current module name.

    Args:
        __name__ (str): The name of the current module.
        Factory (class): The Factory class used to execute recipes.

    Returns:
        None

    Raises:
        Exception: If an error occurs while executing recipes in parallel, it falls back to sequential execution.
        KeyboardInterrupt: If the execution is interrupted by the user.

    """
    if __name__ == "__main__":
        factory = Factory()
        try:
            factory.execute_recipes_parallel()
        except Exception as e:
            print(f"FPAR_MASTER - Error in parallel execution, switching to sequential execution: {e}")
            traceback.print_exc()
            try:
                factory.execute_recipe()
            except Exception as e_seq:
                print(f"FPAR_MASTER - Error during sequential execution fallback: {e_seq}")
                traceback.print_exc()
        except KeyboardInterrupt:
            print("FPAR_MASTER - Execution interrupted by user.")


handle_parallel_recipes_execution(__name__, Factory)
