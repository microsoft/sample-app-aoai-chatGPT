from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider, Tracer
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter
import json
import time


'''def get_tracer_provider(app_insights_connection_string: str) -> TracerProvider:
    tracer_provider = TracerProvider(
        resource=Resource.create({"app_name": "test_app"})
    )
    trace_exporter = AzureMonitorTraceExporter.from_connection_string(app_insights_connection_string)
    bsp = BatchSpanProcessor(trace_exporter)
    tracer_provider.add_span_processor(bsp)
    
    return tracer_provider '''
APPLICATION_NAME = "ProductInfo_Contoso_Bot"
 
def set_exporter(app_insights_connection_string: str, instrumenting_module_name: str, tracer: Tracer) -> None:
    start_time = time.perf_counter_ns()
    exporter = AzureMonitorTraceExporter.from_connection_string(
        app_insights_connection_string,
    )
    span_processor = BatchSpanProcessor(exporter)
    tracer.span_processor.add_span_processor(span_processor=span_processor)
    end_time = time.perf_counter_ns()
    print ()
    print (f"time taken to create exporter in ns: {end_time - start_time}")
    print (f"time taken to create exporter in ms: {(end_time - start_time)//1000000}")
    print ()


def emit_traces(
    tracer: Tracer,
    app_insights_connection_string: str,
    query: str,
    response_json: dict
):
    # tracer_provider = get_tracer_provider(app_insights_connection_string)
    set_exporter(app_insights_connection_string, "backend.emit_traces", tracer)
    
    start_time = time.perf_counter_ns()
    with tracer.start_as_current_span("OYD_Request") as span:
        span.set_attribute(key="span_type", value="Function")
        span_context = span.get_span_context()
        span.set_attribute(key="traceId", value=span_context.trace_id)
        span.set_attribute(key="spanId", value=span_context.span_id)
        span.set_attribute(key="applicationId", value=APPLICATION_NAME)
        span.set_attribute(key="retrieval.query", value=query)
        citation_string = json.dumps(extract_citations(response_json))
        span.set_attribute(key="retrieval.documents", value=citation_string)
        for char_start in range(0, len(citation_string), 8000):
            span.add_event(name="retrieval.documents", attributes={f"doc_st_{char_start}": citation_string[char_start:char_start+8000]})
        for k, v in extract_LLM_attributes(response_json).items():
                span.set_attribute(key=k, value=v)

        ret_start_time = time.perf_counter_ns()
        with tracer.start_as_current_span("OYD Request - Retrieval") as retrieval_span:
            retrieval_span.set_attribute(key="span_type", value="Retrieval")
            retrieval_span.set_attribute(key="parentId", value=span_context.span_id)
            retrieval_span.set_attribute(key="traceId", value=retrieval_span.get_span_context().trace_id)
            retrieval_span.set_attribute(key="spanId", value=retrieval_span.get_span_context().span_id)
            retrieval_span.set_attribute(key="applicationId", value=APPLICATION_NAME)
            retrieval_span.set_attribute(key="retrieval.query", value=query)
            citation_string = json.dumps(extract_citations(response_json))
            retrieval_span.set_attribute(key="retrieval.documents", value=citation_string)
            for char_start in range(0, len(citation_string), 8000):
                retrieval_span.add_event(name="retrieval.documents", attributes={f"doc_st_{char_start}": citation_string[char_start:char_start+8000]})
            
        end_time_ret_trace = time.perf_counter_ns()
        print ()
        print (f"time taken to create retrieval trace in ns: {end_time_ret_trace - ret_start_time}")
        print (f"time taken to create retrieval trace in ms: {(end_time_ret_trace - ret_start_time)//1000000}")
        print ()
                
        with tracer.start_as_current_span("OYD Request - LLM") as llm_span:
            llm_span.set_attribute(key="span_type", value="LLM")
            llm_span.set_attribute(key="parentId", value=span_context.span_id)
            llm_span.set_attribute(key="traceId", value=llm_span.get_span_context().trace_id)
            llm_span.set_attribute(key="spanId", value=llm_span.get_span_context().span_id)
            llm_span.set_attribute(key="applicationId", value=APPLICATION_NAME)
            for k, v in extract_LLM_attributes(response_json).items():
                llm_span.set_attribute(key=k, value=v)
    
    end_time = time.perf_counter_ns()
    print ()
    print (f"time taken to parent trace in ns: {end_time - start_time}")
    print (f"time taken to parent trace in ms: {(end_time - start_time)//1000000}")
    print ()

def extract_LLM_attributes(response) -> dict:
    return {
        "llm.usage.total_tokens": response.usage.total_tokens,
        "llm.usage.prompt_tokens": response.usage.prompt_tokens,
        "llm.usage.completion_tokens": response.usage.completion_tokens,
        "llm.response.model": response.model,
        "llm.generated_message": response.choices[-1].message.content
    }


def extract_citations(response) -> dict:
    return response.choices[-1].message.model_extra["context"]["citations"]