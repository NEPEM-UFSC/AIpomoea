import pandas as pd
import subprocess
import time
import sqlite3
from contextlib import contextmanager
from multiprocessing import Pool, current_process
import concurrent.futures
import os
import json
import re
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

version: 0.4.1 - 14/10/2024
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

#TODOs:

    - **Model Execution Method**: Implement a new model execution method to ensure backward compatibility
      with earlier versions of the code.

    - **Preprocessing Handling**: Improve handling for complex saving operations and pre-processing steps
      (referred to as 'prepyrus') to allow for greater flexibility and control in batch processing.

    - **Database Connection**: Develop a more flexible and dynamic way to handle database connections,
      allowing compatibility with various database systems and configurations.

Note:
    Documentation is currently obfuscated in parts of the code. This will be improved in future commits
    to provide better clarity and guidance for developers.
"""

DEBUG = False
PERFORM_BENCHMARK = False

pd.options.mode.chained_assignment = None  # Suppress verbose warnings
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}  # Allowed image file extensions
UPLOAD_FOLDER_BUILD = os.path.abspath('./uploads')
UPLOAD_FOLDER_DIST = os.path.abspath('./resources/app/uploads')
RECIPE_PATH_BUILD = os.path.abspath('./recipe.json')
RECIPE_PATH_DIST = os.path.abspath('./resources/app/recipe.json')
MODELS_PATH_BUILD = os.path.abspath('./models')
MODELS_PATH_DIST = os.path.abspath('./resources/app/models')
CONFIG_PATH_BUILD = os.path.abspath('./config.json')
CONFIG_PATH_DIST = os.path.abspath('./resources/app/config.json')
CUSTOM_PRELOADING_PATH_BUILD = os.path.abspath('./custom_preloading.json')
CUSTOM_PRELOADING_PATH_DIST = os.path.abspath('./resources/app/custom_preloading.json')


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
    A class for utility functions.
    NOTE: This class is intended for benchmarking purposes and may be expanded in future versions, as it is not used for production operations.
    IMPORTANT: Set the PERFORM_BENCHMARK flag to True to enable benchmarking.

    Attributes:
        start_time (float): The start time of the benchmark.

    Methods:
        benchmark(): Starts the benchmark timer.
        end_benchmark(): Ends the benchmark and prints the elapsed time.
        benchmark_time(description="Operation"): Context manager for benchmarking the execution time of an operation.

    """

    def __init__(self):
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


class Factory:
    """
    The Factory class is the core engine of the AIpomoea application, responsible for orchestrating the entire workflow...
    since model execution, image processing, and result generation.
    It acts as the heart of the application, handling every step from loading AI models to processing user-defined tasks, allowing the system to execute complex recipes in an efficient and automated manner.

    Attributes:
        upload_folder (str): The path to the upload folder.
        recipe_path (str): The path to the recipe file.
        config_path (str): The path to the config file.
        custom_preloading_path (str): The path to the custom preloading file.
        SPECIAL_COMMANDS (list): A list of special commands.
        images (dict): A dictionary to store images.
        results (pandas.DataFrame): A DataFrame to store results.
        loaded_recipes (list): A list of loaded recipes.
        exportation_formats (list): A list of exportation formats.
        models (Model): An instance of the Model class.
        db_conn (sqlite3.Connection): A connection to the SQLite database.
        db_cursor (sqlite3.Cursor): A cursor for the SQLite database.
        batch_size (int): The batch size for parallel execution.
        PERFORM_BENCHMARK (bool): A flag to enable benchmarking.


    Methods:
        decompose_commands(commands)
        decompose_special_commands(commands)
        load_config()
        load_recipe()
        load_custom_preloading()
        preloading()
        select_only(values)
        exclude_only(values)
        load_export_separation()
        load_exportation_formats()
        load_images()
        export_results()
        export_grouped_results()
        execute_recipe()
        _get_binary_path()
        _run_subprocess()
        _process_results()
        _execute_command()
        execute_recipes_parallel()
    """

    def __init__(self):
        """
        Initializes the Factory object.
        Raises:
            FileNotFoundError: If any of the required files or folders are not found.
        """

        if os.path.exists(UPLOAD_FOLDER_BUILD):
            self.upload_folder = UPLOAD_FOLDER_BUILD
        elif os.path.exists(UPLOAD_FOLDER_DIST):
            self.upload_folder = UPLOAD_FOLDER_DIST
        else:
            raise FileNotFoundError("FINIT1 - Images folder not found.")

        if os.path.exists(RECIPE_PATH_BUILD):
            self.recipe_path = RECIPE_PATH_BUILD
        elif os.path.exists(RECIPE_PATH_DIST):
            self.recipe_path = RECIPE_PATH_DIST
        else:
            raise FileNotFoundError("FINIT2 - Recipe not found.")

        if os.path.exists(CONFIG_PATH_BUILD):
            self.config_path = CONFIG_PATH_BUILD
        elif os.path.exists(CONFIG_PATH_DIST):
            self.config_path = CONFIG_PATH_DIST
        else:
            raise FileNotFoundError("FINIT3 - Config file not found.")

        if os.path.exists(CUSTOM_PRELOADING_PATH_BUILD):
            self.custom_preloading_path = CUSTOM_PRELOADING_PATH_BUILD
        elif os.path.exists(CUSTOM_PRELOADING_PATH_DIST):
            self.custom_preloading_path = CUSTOM_PRELOADING_PATH_DIST
        else:
            raise FileNotFoundError("FINIT4 - Custom preloading file not found.")

        self.SPECIAL_COMMANDS = ['csv', 'pdf', 'json', 'connected_database', 'cli_visible', "export_separation"]
        self.images = {}
        self.preloading()
        self.load_images()
        self.results = pd.DataFrame()
        self.loaded_recipes = self.load_recipe()
        self.exportation_formats = self.load_exportation_formats()
        self.models = Model()
        self.db_conn = None
        self.db_cursor = None
        self.batch_size = 50  # Batch size for parallel execution

        if PERFORM_BENCHMARK:  # Benchmarking flag
            self.utils = Utils()

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
        original_cwd = os.getcwd()
        os.chdir(new_path)
        try:
            yield
        finally:
            os.chdir(original_cwd)

    def decompose_commands(self, commands):
        """
        Decomposes a dictionary of commands to remove special commands and adjust formatting.
        Parameters:
            - commands (dict): Dictionary where keys are command strings and values specify the associated values.
        Returns:
            - list: List of filtered and formatted command keys.
        Example:
            - decompose_commands({"cmd-1": "value1", "cmd-2": None, "SPECIAL_COMMAND1": "value3"}) -> ["cmd_1"]
        """
        decomposed_commands = {command.replace("-", "_"): value for command, value in commands.items() if value}
        decomposed_commands = {command: value for command, value in decomposed_commands.items() if command not in self.SPECIAL_COMMANDS}
        return list(decomposed_commands.keys())

    def decompose_special_commands(self, commands):
        """
        Extract special commands from a dictionary and return their keys.
        Parameters:
            - commands (dict): Dictionary containing command keys and their boolean values.
        Returns:
            - list: List of keys from the dictionary that are in the SPECIAL_COMMANDS set and have True as their value.
        Example:
            - decompose_special_commands({"special-command1": True, "normal-command": False, "special-command2": True}) -> ['special_command1', 'special_command2']
        """
        special_commands = {command.replace("-", "_"): value for command, value in commands.items() if value and command.replace("-", "_") in self.SPECIAL_COMMANDS}
        return list(special_commands.keys())

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
            db_path = config['DB_PATH']
            db_name = config['DB_NAME']

            if not os.path.exists(db_path):
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
                raise e

    def load_recipe(self):
        """
        Load the recipe from a JSON file and decompose its commands.
        Parameters:
            - self (object): Instance of the class containing the recipe_path attribute.
        Returns:
            - list: A list of decomposed commands extracted from the JSON file.
        Example:
            - self.load_recipe() -> ['command1', 'command2', 'command3']
        """
        try:
            with open(self.recipe_path, 'r') as file:
                content = json.load(file)
                checkbox_states = content['checkboxStates']
                commands = self.decompose_commands(checkbox_states)
                return commands
        except Exception as e:
            print(f"FLRE1- Error while loading recipe: {e}")
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
            return config['OUTPUT_DIR']
        except Exception as e:
            print("GOF1 - Error while getting output folder.")
            raise e

    def preloading(self):
        """
        Perform preloading based on the custom preloading configuration.

        This method loads the custom preloading configuration and checks if a custom entry is specified.
        If a custom entry is found, it checks the selected option in the preloading configuration and performs the corresponding action.

        Returns:
            bool: True if preloading is performed successfully, False otherwise.
        """
        config = self.load_config()
        if config['ENABLE_GENOTYPE']:
            preloading_config = self.load_custom_preloading()
            if 'customEntry' in preloading_config:
                custom_entry = preloading_config['customEntry']
                if custom_entry:
                    try:
                        custom_entry = custom_entry.split(',')
                        selected_option = preloading_config.get('selectedOption')
                        if selected_option == 'selectOnly':
                            self.select_only(custom_entry)
                        elif selected_option == 'excludeOnly':
                            self.exclude_only(custom_entry)
                    except Exception as e:
                        print(f"FPL1 - Error while performing preloading: {e}")
                        return False
                else:
                    pass
            else:
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

    def load_export_separation(self):
        """
        Load the export-separation value from the recipe file.
        Parameters:
            - self (object): The instance of the class containing the method.
        Returns:
            - bool: The state of the 'export-separation' checkbox.
        Example:
            - load_export_separation() -> True
        """
        with open(self.recipe_path, 'r') as file:
            content = json.load(file)
            checkbox_states = content['checkboxStates']
            export_separation = checkbox_states['export-separation']
            return export_separation

    def load_exportation_formats(self):
        """
        Load exportation formats from a JSON file and return the decomposed special commands.
        Parameters:
            - self (object): Instance of the class containing the method.
        Returns:
            - list: Decomposed special commands from the checkbox states in the JSON file.
        Example:
            - load_exportation_formats() -> ['format1', 'format2', 'format3']
        """
        with open(self.recipe_path, 'r') as file:
            content = json.load(file)
            checkbox_states = content['checkboxStates']
            exportation_formats = self.decompose_special_commands(checkbox_states)
            return exportation_formats

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
                raise FileNotFoundError("FLI1 - Images folder not found.")

            if not isinstance(self.upload_folder, str):
                print("FLI2 - Invalid upload folder path.")
                raise ValueError("FLI2 - Invalid upload folder path.")

            if not os.path.isdir(self.upload_folder):
                print("FLI3 - Upload folder does not exist.")
                raise FileNotFoundError("FLI3 - Upload folder does not exist.")

            if not isinstance(self.images, dict):
                print("FLI4 - Invalid images dictionary.")
                raise ValueError("FLI4 - Invalid images dictionary.")

            for filename in os.listdir(self.upload_folder):
                if filename.split('.')[-1].lower() in ALLOWED_EXTENSIONS:
                    self.images[filename] = os.path.join(self.upload_folder, filename)

            if not self.images:
                print("FLI5 - No images found.")
                raise FileNotFoundError("FLI5 - No images found.")

            return self.images
        except Exception as e:
            print("FLIBE - Error while loading images.")
            raise e

    # TODO - Implementar um override, para que se uma imagem ja foi adcionada na tabela antes, novos dados sejam enviados para o mesmo segundo image_name.
    def export_connecteddb(self, results):
        """
        Exports results to a connected database by adding any missing columns and inserting data.
        Parameters:
            - self (object): The class instance containing the database connection and cursor.
            - results (pandas.DataFrame): DataFrame containing the data to be exported with column names as database table columns.
        Returns:
            - None: The function performs database operations and does not return any value.
        Example:
            - Assuming `self` has `db_conn` and `db_cursor` attributes:
              `export_connecteddb(self, results)`
        """
        # Verificar se a conexão e o cursor do banco de dados estão definidos
        if not hasattr(self, 'db_cursor') or not hasattr(self, 'db_conn'):
            raise AttributeError("A conexão com o banco de dados não está definida.")

        if self.db_cursor is None or self.db_conn is None:
            raise AttributeError("A conexão com o banco de dados não está definida.")

        # Obter o nome da tabela a partir da configuração
        config = self.load_config()
        table_name = config['DB_NAME']

        self.db_cursor.execute(f"PRAGMA table_info({table_name});")
        existing_columns = [info[1] for info in self.db_cursor.fetchall()]

        # Adicionar colunas que não existem
        for col in results.columns:
            if col not in existing_columns:
                self.db_cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col} TEXT;")

        # Inserir dados do DataFrame na tabela
        for index, row in results.iterrows():
            columns = ', '.join(row.index)
            placeholders = ', '.join(['?'] * len(row))
            sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
            self.db_cursor.execute(sql, tuple(row))

        # Confirmar alterações no banco de dados
        self.db_conn.commit()

    def export_results(self, results):
        """
        Exports the given results in various formats such as CSV or JSON based on specified exportation formats.
        Parameters:
            - self (object): An instance of the class containing this method, which includes configuration for export formats.
            - results (list of tuples): A list where each tuple contains an image identifier, a model identifier, and the corresponding result.
        Returns:
            - None: This function does not return any value, it performs export operations and logs the status.
        Example:
            - export_results(self, [('image1', 'modelA', 'result1'), ('image2', 'modelB', 'result2')]) -> None
        """
        output_folder = self.get_output_folder()
        if DEBUG:
            print(f"DEBUG - Output_folder: {output_folder}")
        separate_exports = self.load_export_separation()
        try:
            results_dict = {}
            results_pd = pd.DataFrame()
            for image, model, result in results:
                if image not in results_dict:
                    results_dict[image] = {}
                results_dict[image][model] = result

            results_pd = pd.DataFrame.from_dict(results_dict, orient='index').reset_index()
            results_pd.rename(columns={'index': 'image'}, inplace=True)
            if 'connected_database' in self.exportation_formats:
                self.load_database()
                self.export_connecteddb(results_pd)
            if separate_exports:
                separated_results = {}
                for image, data in results_dict.items():
                    base_name = image.split('_')[0].split('-')[0]
                    if base_name not in separated_results:
                        separated_results[base_name] = []
                    separated_results[base_name].append((image, data))

                for base_name, grouped_results in separated_results.items():
                    self.export_grouped_results(base_name, grouped_results)

            else:
                for exportation_format in self.exportation_formats:
                    if exportation_format == 'csv':
                        try:
                            results_pd.to_csv(f'{output_folder}/results.csv', index=False)
                        except Exception as e:
                            print(f"FERS2 - Error while exporting to CSV: {e}")
                            return e
                    elif exportation_format == 'json':
                        try:
                            results_json_list = [
                                {"image": row["image"], **row.drop("image").to_dict()}
                                for _, row in results_pd.iterrows()
                            ]
                            with open(f'{output_folder}/results.json', 'w') as json_file:
                                json.dump(results_json_list, json_file, indent=4)
                        except Exception as e:
                            print(f"FERS2 - Error while exporting to JSON: {e}")
                            return e
                    if exportation_format == 'pdf':
                        # WARNING - PDF exportation not implemented
                        # Preparado para versões posteriores a 0.4.1
                        pass
                    elif exportation_format == 'cli_visible':
                        # ! NOT MEAN TO WORK HERE
                        pass
            print("done.")  # STDOUT é exigido.

        except Exception as e:
            print(f"FERS1 - Error while exporting results: {e}")
            return e

    def export_grouped_results(self, base_name, grouped_results):
        """
        Export grouped results to different file formats.
        Parameters:
            - base_name (str): The base name for the export files.
            - grouped_results (dict): A dictionary containing grouped results where the key is an image and the value is another dictionary with the model as the key and the result as the value.
        Returns:
            - None: The function does not return any value but saves the results to files.
        Example:
            - export_grouped_results("experiment1", {"image1": {"modelA": 0.95, "modelB": 0.88}, "image2": {"modelA": 0.75, "modelB": 0.85}}) -> None
        """
        output_folder = self.get_output_folder()
        try:
            results_pd = pd.DataFrame(
                [(image, model, result) for image, data in grouped_results for model, result in data.items()],
                columns=['image', 'model', 'result']
            ).pivot(index='image', columns='model', values='result').reset_index()

            for exportation_format in self.exportation_formats:
                if exportation_format == 'csv':
                    try:
                        results_pd.to_csv(f'{output_folder}/results_{base_name.lower()}.csv', index=False)
                    except Exception as e:
                        print(f"FEGR2 - Error while exporting {base_name} to CSV: {e}")
                        raise e
                elif exportation_format == 'json':
                    try:
                        results_json_list = [
                            {"image": row["image"], **row.drop("image").to_dict()}
                            for _, row in results_pd.iterrows()
                        ]
                        with open(f'{output_folder}/results_{base_name.lower()}.json', 'w') as json_file:
                            json.dump(results_json_list, json_file, indent=4)
                    except Exception as e:
                        print(f"FEGR2 - Error while exporting {base_name} to JSON: {e}")
        except Exception as e:
            print(f"FEGR1 - Error while exporting grouped results: {e}")

    def execute_recipe(self):
        """
        Executes the loaded recipes sequentially and stores the results.
        Returns:
            If an error occurs while loading the binary, the exception is returned.
            If an error occurs while executing a command, the exception is returned.
        """
        # Rest of the code...
        if DEBUG:
            print("DEBUG - Executing recipe...")
        sequential_results = []
        original_cwd = os.getcwd()
        for command in self.loaded_recipes:
            if DEBUG:
                print(f"DEBUG - Executing command {command}...")
            binary_path = None
            try:
                if os.path.exists(MODELS_PATH_BUILD):
                    binary_path = os.path.join(os.path.abspath(MODELS_PATH_BUILD), command + ".exe")
                    os.chdir(MODELS_PATH_BUILD)
                elif os.path.exists(MODELS_PATH_DIST):
                    binary_path = os.path.join(os.path.abspath(MODELS_PATH_DIST), command + ".exe")
                    os.chdir(MODELS_PATH_DIST)
            except Exception as e:
                print(f"FBIN1 - Error while loading binary: {e}")
                os.chdir(original_cwd)
                return e

            if binary_path:
                try:
                    image_path = list(self.images.values())
                    try:
                        if DEBUG:
                            print(f"DEBUG - Executing BIN of {command}...")
                        result = subprocess.check_output([binary_path] + image_path)
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
                        return e
                finally:
                    os.chdir(original_cwd)
            else:
                print(f"FBIN3 - Model {command} not found.")
                os.chdir(original_cwd)
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
        """Find the correct binary path for the given command."""
        try:
            if os.path.exists(MODELS_PATH_BUILD):
                binary_path = os.path.join(os.path.abspath(MODELS_PATH_BUILD), command + ".exe")
                if DEBUG:
                    print(f"DEBUG - Changed directory to {MODELS_PATH_BUILD}")
                return binary_path, MODELS_PATH_BUILD
            elif os.path.exists(MODELS_PATH_DIST):
                binary_path = os.path.join(os.path.abspath(MODELS_PATH_DIST), command + ".exe")
                if DEBUG:
                    print(f"DEBUG - Changed directory to {MODELS_PATH_DIST}")
                return binary_path, MODELS_PATH_DIST
            else:
                return None, None
        except Exception as e:
            if DEBUG:
                print(f"DEBUG - Error while getting binary path: {e}")
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
            binary_path, models_path = self._get_binary_path(command)
            if not binary_path:
                if DEBUG:
                    print(f"DEBUG - Model {command} not found.")
                return [(f"FBIN3_P Model {command} not found.",)]

            image_paths = list(self.images.values())
            results = []

            with self.change_directory(models_path):
                if config['FORCE_MAXPERFORMANCE']:
                    # Process batches in parallel using ThreadPoolExecutor
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
                                        result_lines = self._run_subprocess(binary_path, retry_batch)
                                        results.extend(self._process_results(result_lines, command))
                                    except Exception as retry_e:
                                        if DEBUG:
                                            print(
                                                f"DEBUG - Error during retry: {retry_e}"
                                            )
                                        raise RuntimeError(f"FBIN2_P - Error while retrying smaller batch: {retry_e}")
                else:
                    # Process batches sequentially
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
            return [("FBIN2_P - Outer exception caught", outer_e)]

        return results

    def execute_recipes_parallel(self):
        """
        Executes the loaded recipes in parallel using multiprocessing.Pool.
        Returns:
            None
        Raises:
            None
        """

        expected_images = len(self.images)
        copied_images = set(os.listdir(self.upload_folder))

        try:
            wait_time = 0
            while len(copied_images) < expected_images:
                if DEBUG and wait_time % 2 == 0:
                    missing_images = expected_images - len(copied_images)
                    print(
                        f"DEBUG - Waiting for images to be copied... "
                        f"{len(missing_images)} images remaining."  # type: ignore
                    )
                time.sleep(1)
                wait_time += 1
                copied_images = set(os.listdir(self.upload_folder))

        except Exception as e:
            print(f"FPAR2 - Error while waiting for images to be copied: {e}")
            return e

        if DEBUG:
            print("DEBUG - Executing recipes in parallel...")

        with Pool() as pool:
            if PERFORM_BENCHMARK:
                with self.utils.benchmark_time("Executing commands in parallel"):
                    results = pool.map(self._execute_command, self.loaded_recipes)
            results = pool.map(self._execute_command, self.loaded_recipes)

        # Flatten results and handle errors
        sequential_results = []
        for result in results:
            try:
                if isinstance(result, list):
                    sequential_results.extend(result)
                else:
                    print(f"FPAR1 - Error while executing recipe: {result}")
                    raise ValueError(f"Invalid result type: {result}")
            except Exception as e:
                return e

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
            print(f"FPAR_MASTER - Error while executing recipe using a paralellization, trying sequential: {e}")
            factory.execute_recipe()
        except KeyboardInterrupt:
            print("FPAR_MASTER - Execution interrupted by user.")


handle_parallel_recipes_execution(__name__, Factory)
