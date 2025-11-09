import os
import time
from contextlib import contextmanager


class Utils:
    def __init__(self):
        self.start_time = None
        self.write_logs = True

    def benchmark(self):
        self.start_time = time.time()

    def end_benchmark(self):
        end_time = time.time()
        if self.start_time is not None:
            elapsed_time = end_time - self.start_time
            print(f"Benchmark completed in {elapsed_time:.6f} seconds.")
        else:
            print("Benchmark start time is not set.")

    @contextmanager
    def benchmark_time(self, description="Operation"):
        self.benchmark()
        try:
            yield
        finally:
            self.end_benchmark()
            if self.start_time is not None:
                message = f"{description} completed in {time.time() - self.start_time:.6f} seconds."
                print(message)
                if self.write_logs:
                    with open("benchmark.log", "a") as file:
                        file.write(message + "\n")
            else:
                print("Benchmark start time is not set.")

    @contextmanager
    def change_directory(self, new_path):
        ocwd = os.getcwd()
        os.chdir(new_path)
        try:
            yield
        finally:
            os.chdir(ocwd)
