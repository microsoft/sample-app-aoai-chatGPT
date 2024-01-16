import logging
from orchestrators.DefaultOrchestrator import DefaultOrchestrator
from orchestrators.Orchestrator import Orchestrator


def create_orchestrator_instance(class_name: str) -> Orchestrator:
    """
    Creates an instance of a class that inherits the Orchestrator class.
    Note: The custom orchestrator class must be in the orchestrators folder and the class
    must be named the same as the file name.

    :param class_name: The name of the custom Orchestrator class.

    :return: An instance of a class that inherits the Orchestrator class.
    """

    if not class_name or class_name.strip() == "":
        print("Class name not provided. Using default orchestrator ...")
        return DefaultOrchestrator()
    
    module_name = f"orchestrators.{class_name}"
    
    try:
        logging.info(f"Attempting to construct '{class_name}' instance from '{module_name}' module ...")

        module = __import__(module_name, fromlist=[class_name])
        class_ = getattr(module, class_name)

        if not issubclass(class_, Orchestrator):
            raise TypeError(f"'{class_name}' is not a subclass of Orchestrator")

        return class_()
    except Exception as e:
        logging.exception(f"An error occurred constructing '{class_name}' instance from '{module_name}' module. Using default orchestrator. ERROR: {e}")
        return DefaultOrchestrator()