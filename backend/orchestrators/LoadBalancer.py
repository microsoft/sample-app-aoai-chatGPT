import random
import os
import json

class OpenAIContext():
    def __init__(self, resource: str, model: str, endpoint_url: str, key: str, weight: float, version: str):
        # these are the values required to create each endpoint context
        self.resource = resource
        self.model = model
        self.endpoint_url = endpoint_url
        self.key = key
        self.weight = weight
        self.version = version

    def to_dict(self):
        return {
            'resource': self.resource,
            'model': self.model,
            'endpoint_url': self.endpoint_url,
            'key': self.key,
            'weight': self.weight,
            'version': self.version
        }

class LoadBalancer:  
    def __init__(self):
        open_ai_env_contexts = os.environ.get("AZURE_OPENAI_CONTEXTS")
        open_ai_contexts = json.loads(open_ai_env_contexts)
        api_version = os.environ.get("AZURE_OPENAI_PREVIEW_API_VERSION")

        # The algorithm for selecting an endpoint is as follows:
        #
        # 1. Get the context for each endpoint, which includes a "weight" for the endpoint. 
        #    The weight is the TPM of the endpoint divided by 1000. (For example 80,000 TPM is listed as 80 for the weight.)
        #
        # 2. Calculate the total weight of all endpoints. In this case, we have 80, 80, and 10 for the endpoint weights in the .env file.
        #
        # 3. Calculate the relative weight of each endpoint as a percentage of the total:
        #    endpoint weight / total weight and round to 2 decimal places. 
        #    In this case, we will have [(80 / 170), (80 / 170), (10 / 170)] = [0.47, 0.47, 0.06]
        #
        # 4. Calculate the cumulative weight of each endpoint by adding the relative weights in order. 
        #    Each number in the list is a sum of the preceding numbers.
        #    [0.47, 0.47, 0.06] --> [0.47, (0.47 + 0.47 = 0.94), (0.94 + 0.06 = 1.00)] = [0.47, 0.94, 1.00]
        #
        # 5. Generate a random number between 0.0 and 1.0.
        #
        # 6. a) If the random number is less than or equal to the first cumulative weight, select the first endpoint.
        #    b) Then, if that check fails, check if the random number is less than or equal to the second cumulative weight. 
        #       If that check passes, select the second endpoint.
        #    c) Then, if that check fails, check if the random number is less than or equal to the third cumulative weight.
        #       Since the random number generator has to be between 0 and 1, the third endpoint would be selected.
        #    
        #    For example, in this case if the random number is 0.5, then the first check fails, the second check passes,
        #    and the third check is not executed. The second endpoint is selected.
        #
        #    For a large distribution of calls, the number of calls to each endpoint should be roughly 
        #    proportional to the relative weight percentages. Each generation of a random number is independent of the others,
        #    so the distribution of calls to each endpoint will vary over time.

        # unpack the list of dictionaries into keyword arguments and assigne to an OpenAIContext object
        self.contexts = [OpenAIContext(version=api_version, **context) for context in open_ai_contexts]

        # Calculate the total weight of all endpoints. Example: 80 + 80 + 10 = 170
        total_weight = sum(context.weight for context in self.contexts)

        # Calculate the relative weight of each endpoint as a percentage of the total weight, round to 2 places.
        # Example: [80 / 170, 80 / 170, 10 / 170] = [0.47, 0.47, 0.06]
        relative_weights = [round(context.weight / total_weight, 2) for context in self.contexts]

        # Create a list of all weights by adding the relative weights in order.
        # Example: [0.47, 0.47, 0.06] --> [0.47, (0.47 + 0.47 = 0.94), (0.94 + 0.06 = 1.00)] = [0.47, 0.94, 1.00]
        self.all_weights = [round(sum(relative_weights[:i+1]), 2) for i in range(len(relative_weights))]

    def get_openai_context(self) -> OpenAIContext:
        rand_num = random.random()  # Generates a random float number between 0.0 to 1.0

        for i, cumulative_weight in enumerate(self.all_weights): # Iterate through the list of cumulative weights for comparison with the random number
            if rand_num <= cumulative_weight: # Compares the random number to the cumulative weight
                selected_context = self.contexts[i].to_dict() # Get the endpoint context based on the randomly selected weight
                return selected_context
