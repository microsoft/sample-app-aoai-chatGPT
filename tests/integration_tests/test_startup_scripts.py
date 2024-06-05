import os
import pytest
import sys

from subprocess import Popen, TimeoutExpired
from time import sleep


script_base_path = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

script_timeout = 240

@pytest.fixture(scope="function")
def script_command():
    if sys.platform.startswith("linux"):
        return "./start.sh"
    
    else:
        return "./start.cmd"


def test_startup_script(script_command):
    stdout = None
    try:
        p = Popen([script_command], cwd=script_base_path)
        stdout, _ = p.communicate(timeout=script_timeout)
        
    except TimeoutExpired:
        assert isinstance(stdout, str)
        assert "127.0.0.1:50505" in stdout
        p.terminate()

    
    
    
    