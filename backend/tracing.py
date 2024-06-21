from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter
import json


def get_tracer_provider(app_insights_connection_string: str) -> TracerProvider:
    tracer_provider = TracerProvider(
        resource=Resource.create({"app_name": "test_app"})
    )
    trace_exporter = AzureMonitorTraceExporter.from_connection_string(app_insights_connection_string)
    bsp = BatchSpanProcessor(trace_exporter)
    tracer_provider.add_span_processor(bsp)
    
    return tracer_provider


def emit_traces(
    app_insights_connection_string: str,
    query: str,
    response_json: dict
):
    tracer_provider = get_tracer_provider(app_insights_connection_string)
    tracer = tracer_provider.get_tracer("backend.emit_traces")
    
    with tracer.start_as_current_span("OYD Request") as span:
        span.set_attribute(key="span_type", value="Function")
        
        with tracer.start_as_current_span("OYD Request - Retrieval") as retrieval_span:
            retrieval_span.set_attribute(key="span_type", value="Retrieval")
            retrieval_span.set_attribute(key="retrieval.query", value=query)
            retrieval_span.set_attribute(key="retrieval.documents", value=json.dumps(extract_retrieval_documents(response_json)))
                
        with tracer.start_as_current_span("OYD Request - LLM") as llm_span:
            llm_span.set_attribute(key="span_type", value="LLM")
            for k, v in extract_LLM_attributes(response_json).items():
                llm_span.set_attribute(key=k, value=v)
                

def extract_LLM_attributes(response) -> dict:
    return {
        "llm.usage.total_tokens": response.usage.total_tokens,
        "llm.usage.prompt_tokens": response.usage.prompt_tokens,
        "llm.usage.completion_tokens": response.usage.completion_tokens,
        "llm.response.model": response.model
    }


def extract_retrieval_documents(response) -> dict:
    return response.choices[-1].message.model_extra["context"]["all_retrieved_documents"]