import os
import re
from typing import Any, Dict, List, Tuple


class AppConfig:
    def __init__(self, payload: dict):
        self._validate_and_parse(payload)
        
    def _validate_and_parse(self, payload: dict):
        paths = payload.get('paths', {})
        self.models_path = paths.get('models_dir')
        self.uploads_path = paths.get('uploads_dir')
        self.results_path = paths.get('results_dir')
        
        if not all([self.models_path, self.uploads_path, self.results_path]):
            raise ValueError("Missing essential paths in configuration.")
        
        self.config = payload.get('config', {})
        self.output_folder = self.config.get('OUTPUT_DIR', self.results_path)
        self.naming_convention = self.config.get('NAMING_CONVENTION', 'Gen-Rep')
        self.enable_naming_separation = self.config.get('ENABLE_NAMING_SEPARATION', True)
        self.force_max_performance = self.config.get('FORCE_MAXPERFORMANCE', False)
        self.enable_db = self.config.get('ENABLE_DB', False)
        self.db_path = self.config.get('DB_PATH', '')
        self.db_name = self.config.get('DB_NAME', 'aipomoea')
        
        self.files_to_process = payload.get('files_to_process', [])
        self.typemode = payload.get('typemode', 'root')
        
        commands_raw = payload.get('commands', {})
        recipe_processor = RecipeProcessor(commands_raw)
        processed = recipe_processor.process()
        
        self.execution_commands = processed['commands']
        self.commands_spec = processed['commands_spec']
        self.export_formats = processed['exportation_format']
        
        self.export_separation_pos = None
        if self.enable_naming_separation:
            self.export_separation_pos = self._calculate_separation_position()
    
    def _calculate_separation_position(self):
        if not self.naming_convention:
            return None
        parts = self.naming_convention.split('-')
        for idx, part in enumerate(parts):
            if part.lower() == 'gen':
                return idx + 1
        return None
    
    def update_image_list(self, new_list: List[str]):
        self.files_to_process = new_list
    
    def get_image_paths(self) -> Dict[str, str]:
        return {
            filename: os.path.join(self.uploads_path, filename).replace('\\', '/')
            for filename in self.files_to_process
        }


class RecipeProcessor:
    EXPORT_FORMATS = {'csv', 'json', 'pdf', 'connected_database'}
    COMMANDS_SPEC = {'white_background', 'export_separation'}
    
    def __init__(self, commands: dict):
        self.commands_data = commands or {}
    
    def process(self) -> Dict[str, Any]:
        commands, commands_spec, exportation_format = self._decompose_commands(self.commands_data)
        return {
            "commands": commands,
            "commands_spec": commands_spec,
            "exportation_format": exportation_format
        }
    
    def _decompose_commands(self, commands: Dict[str, bool]) -> Tuple[Dict[str, bool], Dict[str, bool], Dict[str, bool]]:
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
        
        return general_commands, command_specs, export_formats
