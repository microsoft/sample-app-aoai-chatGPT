"""Data utilities for index preparation."""
import ast
import html
import json
import os
import re
import ssl
import subprocess
import tempfile
import time
import urllib.request
from abc import ABC, abstractmethod
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from functools import partial
from typing import Any, Callable, Dict, Generator, List, Optional, Tuple, Union
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
import fitz
import requests
import base64

import markdown
import requests
import tiktoken
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential
from azure.storage.blob import ContainerClient
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain.text_splitter import TextSplitter, MarkdownTextSplitter, RecursiveCharacterTextSplitter, PythonCodeTextSplitter
from openai import AzureOpenAI
from tqdm import tqdm

# Configure environment variables  
load_dotenv() # take environment variables from .env.

FILE_FORMAT_DICT = {
        "md": "markdown",
        "txt": "text",
        "html": "html",
        "shtml": "html",
        "htm": "html",
        "py": "python",
        "pdf": "pdf",
        "docx": "docx",
        "pptx": "pptx",
        "png": "png",
        "jpg": "jpg",
        "jpeg": "jpeg",
        "gif": "gif",
        "webp": "webp"
    }

RETRY_COUNT = 5

SENTENCE_ENDINGS = [".", "!", "?"]
WORDS_BREAKS = list(reversed([",", ";", ":", " ", "(", ")", "[", "]", "{", "}", "\t", "\n"]))

HTML_TABLE_TAGS = {"table_open": "<table>", "table_close": "</table>", "row_open":"<tr>"}

PDF_HEADERS = {
    "title": "h1",
    "sectionHeading": "h2"
}

class TokenEstimator(object):
    GPT2_TOKENIZER = tiktoken.get_encoding("gpt2")

    def estimate_tokens(self, text: Union[str, List]) -> int:

        return len(self.GPT2_TOKENIZER.encode(text, allowed_special="all"))

    def construct_tokens_with_size(self, tokens: str, numofTokens: int) -> str:
        newTokens = self.GPT2_TOKENIZER.decode(
            self.GPT2_TOKENIZER.encode(tokens, allowed_special="all")[:numofTokens]
        )
        return newTokens

TOKEN_ESTIMATOR = TokenEstimator()

class PdfTextSplitter(TextSplitter):
    def __init__(self, length_function: Callable[[str], int] =TOKEN_ESTIMATOR.estimate_tokens, separator: str = "\n\n", **kwargs: Any):
        """Create a new TextSplitter for htmls from extracted pdfs."""
        super().__init__(**kwargs)
        self._table_tags = HTML_TABLE_TAGS
        self._separators = separator or ["\n\n", "\n", " ", ""]
        self._length_function = length_function
        self._noise = 50 # tokens to accommodate differences in token calculation, we don't want the chunking-on-the-fly to inadvertently chunk anything due to token calc mismatch

    def extract_caption(self, text):
        separator = self._separators[-1]
        for _s in self._separators:
            if _s == "":
                separator = _s
                break
            if _s in text:
                separator = _s
                break
        
        # Now that we have the separator, split the text
        if separator:
            lines = text.split(separator)
        else:
            lines = list(text)
        
        # remove empty lines
        lines = [line for line in lines if line!='']
        caption = ""
        
        if len(text.split(f"<{PDF_HEADERS['title']}>"))>1:
            caption +=  text.split(f"<{PDF_HEADERS['title']}>")[-1].split(f"</{PDF_HEADERS['title']}>")[0]
        if len(text.split(f"<{PDF_HEADERS['sectionHeading']}>"))>1:
            caption +=  text.split(f"<{PDF_HEADERS['sectionHeading']}>")[-1].split(f"</{PDF_HEADERS['sectionHeading']}>")[0]
        
        caption += "\n"+ lines[-1].strip()

        return caption
    
    def mask_urls_and_imgs(self, text) -> Tuple[Dict[str, str], str]:

        def find_urls(string):
            regex = r"(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^()\s<>]+|\(([^()\s<>]+|(\([^()\s<>]+\)))*\))+(?:\(([^()\s<>]+|(\([^()\s<>]+\)))*\)|[^()\s`!()\[\]{};:'\".,<>?«»“”‘’]))"
            urls = re.findall(regex, string)
            return [x[0] for x in urls]
        
        def find_imgs(string):
            regex = r'(<img\s+src="[^"]+"[^>]*>.*?</img>)'
            imgs = re.findall(regex, string, re.DOTALL)
            return imgs
        
        content_dict = {}
        masked_text = text
        urls = set(find_urls(text))

        for i, url in enumerate(urls):
            masked_text = masked_text.replace(url, f"##URL{i}##")
            content_dict[f"##URL{i}##"] = url

        imgs = set(find_imgs(text))
        for i, img in enumerate(imgs):
            masked_text = masked_text.replace(img, f"##IMG{i}##")
            content_dict[f"##IMG{i}##"] = img

        return content_dict, masked_text

    def split_text(self, text: str) -> List[str]:
        content_dict, masked_text = self.mask_urls_and_imgs(text)
        start_tag = self._table_tags["table_open"]
        end_tag = self._table_tags["table_close"]
        splits = masked_text.split(start_tag)
        
        final_chunks = self.chunk_rest(splits[0]) # the first split is before the first table tag so it is regular text
        
        table_caption_prefix = ""
        if len(final_chunks)>0:
            table_caption_prefix += self.extract_caption(final_chunks[-1]) # extracted from the last chunk before the table
        for part in splits[1:]:
            table, rest = part.split(end_tag)
            table = start_tag + table + end_tag 
            minitables = self.chunk_table(table, table_caption_prefix)
            final_chunks.extend(minitables)

            if rest.strip()!="":
                text_minichunks = self.chunk_rest(rest)
                final_chunks.extend(text_minichunks)
                table_caption_prefix = self.extract_caption(text_minichunks[-1])
            else:
                table_caption_prefix = ""
            

        final_final_chunks = [chunk for chunk, chunk_size in merge_chunks_serially(final_chunks, self._chunk_size, content_dict)]

        return final_final_chunks



    def chunk_rest(self, item):
        separator = self._separators[-1]
        for _s in self._separators:
            if _s == "":
                separator = _s
                break
            if _s in item:
                separator = _s
                break
        chunks = []
        if separator:
            splits = item.split(separator)
        else:
            splits = list(item)
        _good_splits = []
        for s in splits:
            if self._length_function(s) < self._chunk_size - self._noise:
                _good_splits.append(s)
            else:
                if _good_splits:
                    merged_text = self._merge_splits(_good_splits, separator)
                    chunks.extend(merged_text)
                    _good_splits = []
                other_info = self.chunk_rest(s)
                chunks.extend(other_info)
        if _good_splits:
            merged_text = self._merge_splits(_good_splits, separator)
            chunks.extend(merged_text)
        return chunks
        
    def chunk_table(self, table, caption):
        if self._length_function("\n".join([caption, table])) < self._chunk_size - self._noise:
            return ["\n".join([caption, table])]
        else:
            headers = ""
            if re.search("<th.*>.*</th>", table):
                headers += re.search("<th.*>.*</th>", table).group() # extract the header out. Opening tag may contain rowspan/colspan
            splits = table.split(self._table_tags["row_open"]) #split by row tag
            tables = []
            current_table = caption + "\n"
            for part in splits:
                if len(part)>0:
                    if self._length_function(current_table + self._table_tags["row_open"] + part) < self._chunk_size: # if current table length is within permissible limit, keep adding rows
                        if part not in [self._table_tags["table_open"], self._table_tags["table_close"]]: # need add the separator (row tag) when the part is not a table tag
                            current_table += self._table_tags["row_open"]
                        current_table += part
                        
                    else:
                        
                        # if current table size is beyond the permissible limit, complete this as a mini-table and add to final mini-tables list
                        current_table += self._table_tags["table_close"]
                        tables.append(current_table)

                        # start a new table
                        current_table = "\n".join([caption, self._table_tags["table_open"], headers])
                        if part not in [self._table_tags["table_open"], self._table_tags["table_close"]]:
                            current_table += self._table_tags["row_open"]
                        current_table += part

            
            # TO DO: fix the case where the last mini table only contain tags
            
            if not current_table.endswith(self._table_tags["table_close"]):
                
                tables.append(current_table + self._table_tags["table_close"])
            else:
                tables.append(current_table)
            return tables

    
@dataclass
class Document(object):
    """A data class for storing documents

    Attributes:
        content (str): The content of the document.
        id (Optional[str]): The id of the document.
        title (Optional[str]): The title of the document.
        filepath (Optional[str]): The filepath of the document.
        url (Optional[str]): The url of the document.
        metadata (Optional[Dict]): The metadata of the document.    
    """

    content: str
    id: Optional[str] = None
    title: Optional[str] = None
    filepath: Optional[str] = None
    url: Optional[str] = None
    metadata: Optional[Dict] = None
    contentVector: Optional[List[float]] = None
    image_mapping: Optional[Dict] = None

def cleanup_content(content: str) -> str:
    """Cleans up the given content using regexes
    Args:
        content (str): The content to clean up.
    Returns:
        str: The cleaned up content.
    """
    output = re.sub(r"\n{2,}", "\n", content)
    output = re.sub(r"[^\S\n]{2,}", " ", output)
    output = re.sub(r"-{2,}", "--", output)

    return output.strip()

class BaseParser(ABC):
    """A parser parses content to produce a document."""

    @abstractmethod
    def parse(self, content: str, file_name: Optional[str] = None) -> Document:
        """Parses the given content.
        Args:
            content (str): The content to parse.
            file_name (str): The file name associated with the content.
        Returns:
            Document: The parsed document.
        """
        pass

    def parse_file(self, file_path: str) -> Document:
        """Parses the given file.
        Args:
            file_path (str): The file to parse.
        Returns:
            Document: The parsed document.
        """
        with open(file_path, "r") as f:
            return self.parse(f.read(), os.path.basename(file_path))

    def parse_directory(self, directory_path: str) -> List[Document]:
        """Parses the given directory.
        Args:
            directory_path (str): The directory to parse.
        Returns:
            List[Document]: List of parsed documents.
        """
        documents = []
        for file_name in os.listdir(directory_path):
            file_path = os.path.join(directory_path, file_name)
            if os.path.isfile(file_path):
                documents.append(self.parse_file(file_path))
        return documents

class MarkdownParser(BaseParser):
    """Parses Markdown content."""

    def __init__(self) -> None:
        super().__init__()
        self._html_parser = HTMLParser()

    def parse(self, content: str, file_name: Optional[str] = None) -> Document:
        """Parses the given content.
        Args:
            content (str): The content to parse.
            file_name (str): The file name associated with the content.
        Returns:
            Document: The parsed document.
        """
        html_content = markdown.markdown(content, extensions=['fenced_code', 'toc', 'tables', 'sane_lists'])

        return self._html_parser.parse(html_content, file_name)


class HTMLParser(BaseParser):
    """Parses HTML content."""
    TITLE_MAX_TOKENS = 128
    NEWLINE_TEMPL = "<NEWLINE_TEXT>"

    def __init__(self) -> None:
        super().__init__()
        self.token_estimator = TokenEstimator()

    def parse(self, content: str, file_name: Optional[str] = None) -> Document:
        """Parses the given content.
        Args:
            content (str): The content to parse.
            file_name (str): The file name associated with the content.
        Returns:
            Document: The parsed document.
        """
        soup = BeautifulSoup(content, 'html.parser')

        # Extract the title
        title = ''
        if soup.title and soup.title.string:
            title = soup.title.string
        else:
            # Try to find the first <h1> tag
            h1_tag = soup.find('h1')
            if h1_tag:
                title = h1_tag.get_text(strip=True)
            else:
                h2_tag = soup.find('h2')
                if h2_tag:
                    title = h2_tag.get_text(strip=True)
        if title is None or title == '':
            # if title is still not found, guess using the next string
            try:
                title = next(soup.stripped_strings)
                title = self.token_estimator.construct_tokens_with_size(title, self.TITLE_MAX_TOKENS)

            except StopIteration:
                title = file_name

                # Helper function to process text nodes

        # Parse the content as it is without any formatting changes
        result = content
        if title is None:
            title = '' # ensure no 'None' type title

        return Document(content=cleanup_content(result), title=str(title))

class TextParser(BaseParser):
    """Parses text content."""

    def __init__(self) -> None:
        super().__init__()

    def _get_first_alphanum_line(self, content: str) -> Optional[str]:
        title = None
        for line in content.splitlines():
            if any([c.isalnum() for c in line]):
                title = line.strip()
                break
        return title

    def _get_first_line_with_property(
        self, content: str, property: str = "title: "
    ) -> Optional[str]:
        title = None
        for line in content.splitlines():
            if line.startswith(property):
                title = line[len(property) :].strip()
                break
        return title

    def parse(self, content: str, file_name: Optional[str] = None) -> Document:
        """Parses the given content.
        Args:
            content (str): The content to parse.
            file_name (str): The file name associated with the content.
        Returns:
            Document: The parsed document.
        """
        title = self._get_first_line_with_property(
            content
        ) or self._get_first_alphanum_line(content)

        return Document(content=cleanup_content(content), title=title or file_name)


class PythonParser(BaseParser):
    def _get_topdocstring(self, text):
        tree = ast.parse(text)
        docstring = ast.get_docstring(tree)  # returns top docstring
        return docstring

    def parse(self, content: str, file_name: Optional[str] = None) -> Document:
        """Parses the given content.
        Args:
            content (str): The content to parse.
            file_name (str): The file name associated with the content.
        Returns:
            Document: The parsed document.
        """
        docstring = self._get_topdocstring(content)
        if docstring:
            title = f"{file_name}: {docstring}"
        else:
            title = file_name
        return Document(content=content, title=title)

    def __init__(self) -> None:
        super().__init__()

class ImageParser(BaseParser):
    def parse(self, content: str, file_name: Optional[str] = None) -> Document:
        return Document(content=content, title=file_name)

class ParserFactory:
    def __init__(self):
        self._parsers = {
            "html": HTMLParser(),
            "text": TextParser(),
            "markdown": MarkdownParser(),
            "python": PythonParser(),
            "png": ImageParser(),
            "jpg": ImageParser(),
            "jpeg": ImageParser(),
            "gif": ImageParser(),
            "webp": ImageParser()
        }

    @property
    def supported_formats(self) -> List[str]:
        "Returns a list of supported formats"
        return list(self._parsers.keys())

    def __call__(self, file_format: str) -> BaseParser:
        parser = self._parsers.get(file_format, None)
        if parser is None:
            raise UnsupportedFormatError(f"{file_format} is not supported")

        return parser

parser_factory = ParserFactory()

class UnsupportedFormatError(Exception):
    """Exception raised when a format is not supported by a parser."""

    pass

@dataclass
class ChunkingResult:
    """Data model for chunking result

    Attributes:
        chunks (List[Document]): List of chunks.
        total_files (int): Total number of files.
        num_unsupported_format_files (int): Number of files with unsupported format.
        num_files_with_errors (int): Number of files with errors.
        skipped_chunks (int): Number of chunks skipped.
    """
    chunks: List[Document]
    total_files: int
    num_unsupported_format_files: int = 0
    num_files_with_errors: int = 0
    # some chunks might be skipped to small number of tokens
    skipped_chunks: int = 0

def extractStorageDetailsFromUrl(url):
    matches = re.fullmatch(r'https:\/\/([^\/.]*)\.blob\.core\.windows\.net\/([^\/]*)\/(.*)', url)
    if not matches:
        raise Exception(f"Not a valid blob storage URL: {url}")
    return (matches.group(1), matches.group(2), matches.group(3))

def downloadBlobUrlToLocalFolder(blob_url, local_folder, credential):
    (storage_account, container_name, path) = extractStorageDetailsFromUrl(blob_url)
    container_url = f'https://{storage_account}.blob.core.windows.net/{container_name}'
    container_client = ContainerClient.from_container_url(container_url, credential=credential)
    if path and not path.endswith('/'):
        path = path + '/'

    last_destination_folder = None
    for blob in container_client.list_blobs(name_starts_with=path):
        relative_path = blob.name[len(path):]
        destination_path = os.path.join(local_folder, relative_path)
        destination_folder = os.path.dirname(destination_path)
        if destination_folder != last_destination_folder:
            os.makedirs(destination_folder, exist_ok=True)
            last_destination_folder = destination_folder
        blob_client = container_client.get_blob_client(blob.name)
        with open(file=destination_path, mode='wb') as local_file:
            stream = blob_client.download_blob()
            local_file.write(stream.readall())

def get_files_recursively(directory_path: str) -> List[str]:
    """Gets all files in the given directory recursively.
    Args:
        directory_path (str): The directory to get files from.
    Returns:
        List[str]: List of file paths.
    """
    file_paths = []
    for dirpath, _, files in os.walk(directory_path):
        for file_name in files:
            file_path = os.path.join(dirpath, file_name)
            file_paths.append(file_path)
    return file_paths

def convert_escaped_to_posix(escaped_path):
    windows_path = escaped_path.replace("\\\\", "\\")
    posix_path = windows_path.replace("\\", "/")
    return posix_path

def _get_file_format(file_name: str, extensions_to_process: List[str]) -> Optional[str]:
    """Gets the file format from the file name.
    Returns None if the file format is not supported.
    Args:
        file_name (str): The file name.
        extensions_to_process (List[str]): List of extensions to process.
    Returns:
        str: The file format.
    """

    # in case the caller gives us a file path
    file_name = os.path.basename(file_name)
    file_extension = file_name.split(".")[-1]
    if file_extension not in extensions_to_process:
        return None
    return FILE_FORMAT_DICT.get(file_extension, None)

def table_to_html(table):
    table_html = "<table>"
    rows = [sorted([cell for cell in table.cells if cell.row_index == i], key=lambda cell: cell.column_index) for i in range(table.row_count)]
    for row_cells in rows:
        table_html += "<tr>"
        for cell in row_cells:
            tag = "th" if (cell.kind == "columnHeader" or cell.kind == "rowHeader") else "td"
            cell_spans = ""
            if cell.column_span and cell.column_span > 1: cell_spans += f" colSpan={cell.column_span}"
            if cell.row_span and cell.row_span > 1: cell_spans += f" rowSpan={cell.row_span}"
            table_html += f"<{tag}{cell_spans}>{html.escape(cell.content)}</{tag}>"
        table_html +="</tr>"
    table_html += "</table>"
    return table_html

def polygon_to_bbox(polygon, dpi=72):
    x_coords = polygon[0::2]
    y_coords = polygon[1::2]
    x0, y0 = min(x_coords)*dpi, min(y_coords)*dpi
    x1, y1 = max(x_coords)*dpi, max(y_coords)*dpi
    return x0, y0, x1, y1

def extract_pdf_content(file_path, form_recognizer_client, use_layout=False): 
    offset = 0
    page_map = []
    model = "prebuilt-layout" if use_layout else "prebuilt-read"
    
    base64file = base64.b64encode(open(file_path, "rb").read()).decode()
    poller = form_recognizer_client.begin_analyze_document(model, AnalyzeDocumentRequest(bytes_source=base64file))
    form_recognizer_results = poller.result()

    # (if using layout) mark all the positions of headers
    roles_start = {}
    roles_end = {}
    for paragraph in form_recognizer_results.paragraphs:
        if paragraph.role!=None:
            para_start = paragraph.spans[0].offset
            para_end = paragraph.spans[0].offset + paragraph.spans[0].length
            roles_start[para_start] = paragraph.role
            roles_end[para_end] = paragraph.role

    for page_num, page in enumerate(form_recognizer_results.pages):
        page_offset = page.spans[0].offset
        page_length = page.spans[0].length

        if use_layout:
            tables_on_page = []
            for table in form_recognizer_results.tables:
                # If the table is empty, the span is empty, so we skip it
                if len(table.spans) > 0:
                    table_offset = table.spans[0].offset
                    table_length = table.spans[0].length
                    if page_offset <= table_offset and table_offset + table_length < page_offset + page_length:
                        tables_on_page.append(table)
        else:
            tables_on_page = []

        # (if using layout) mark all positions of the table spans in the page
        table_chars = [-1]*page_length
        for table_id, table in enumerate(tables_on_page):
            for span in table.spans:
                # replace all table spans with "table_id" in table_chars array
                for i in range(span.length):
                    idx = span.offset - page_offset + i
                    if idx >=0 and idx < page_length:
                        table_chars[idx] = table_id

        # build page text by replacing charcters in table spans with table html and replace the characters corresponding to headers with html headers, if using layout
        page_text = ""
        added_tables = set()
        for idx, table_id in enumerate(table_chars):
            if table_id == -1:
                position = page_offset + idx
                if position in roles_start.keys():
                    role = roles_start[position]
                    if role in PDF_HEADERS:
                        page_text += f"<{PDF_HEADERS[role]}>"
                if position in roles_end.keys():
                    role = roles_end[position]
                    if role in PDF_HEADERS:
                        page_text += f"</{PDF_HEADERS[role]}>"

                page_text += form_recognizer_results.content[page_offset + idx]
                
            elif not table_id in added_tables:
                page_text += table_to_html(tables_on_page[table_id])
                added_tables.add(table_id)

        page_text += " "
        page_map.append((page_num, offset, page_text))
        offset += len(page_text)

    full_text = "".join([page_text for _, _, page_text in page_map])

    # Extract any images
    image_mapping = {}

    if "figures" in form_recognizer_results.keys() and file_path.endswith(".pdf"):
        document = fitz.open(file_path)

        for figure in form_recognizer_results["figures"]:
            bounding_box = figure.bounding_regions[0]

            page_number = bounding_box['pageNumber'] - 1  # Page numbers in PyMuPDF start from 0
            x0, y0, x1, y1 = polygon_to_bbox(bounding_box['polygon'])

            page = document.load_page(page_number)
            bbox = fitz.Rect(x0, y0, x1, y1)

            # If either the width or height of the bounding box is less than 3 inches, we upscale by 2x
            if bbox.width < 72*3 or bbox.height < 72*3:
                zoom = 2.0
            else:
                zoom = 1.0 
            mat = fitz.Matrix(zoom, zoom)
            image = page.get_pixmap(matrix=mat, clip=bbox)

            # Save the extracted image to a base64 string
            image_data = image.tobytes(output='jpg')
            image_base64 = base64.b64encode(image_data).decode("utf-8")
            image_base64 = f"data:image/jpg;base64,{image_base64}"

            # Identify the text that corresponds to the figure
            replace_start = figure["spans"][0]["offset"]
            replace_end = figure["spans"][0]["offset"] + figure["spans"][0]["length"]

            # Sometimes the figure doesn't correspond to any text, in which case we skip it
            if replace_start == replace_end:
                continue
            
            # Now we get the image tag
            original_text = form_recognizer_results.content[replace_start:replace_end]

            if original_text not in full_text:
                continue
            
            img_tag = image_content_to_tag(original_text)
            
            # We replace only the first occurrence of the original text
            full_text = full_text.replace(original_text, img_tag, 1)
            image_mapping[img_tag] = image_base64

    return full_text, image_mapping

def merge_chunks_serially(chunked_content_list: List[str], num_tokens: int, content_dict: Dict[str, str]={}) -> Generator[Tuple[str, int], None, None]:
    def unmask_urls_and_imgs(text, content_dict={}):
        if "##URL" in text or "##IMG" in text:
            for key, value in content_dict.items():
                text = text.replace(key, value)
        return text
    # TODO: solve for token overlap
    current_chunk = ""
    total_size = 0
    for chunked_content in chunked_content_list:
        chunked_content = unmask_urls_and_imgs(chunked_content, content_dict)
        chunk_size = TOKEN_ESTIMATOR.estimate_tokens(chunked_content)
        if total_size > 0:
            new_size = total_size + chunk_size
            if new_size > num_tokens:
                yield current_chunk, total_size
                current_chunk = ""
                total_size = 0
        total_size += chunk_size
        current_chunk += chunked_content
    if total_size > 0:
        yield current_chunk, total_size

def get_payload_and_headers_cohere(
    text, aad_token) -> Tuple[Dict, Dict]:
    oai_headers =  {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {aad_token}",
    }

    cohere_body = { "texts": [text], "input_type": "search_document" }
    return cohere_body, oai_headers
    
def get_embedding(text, embedding_model_endpoint=None, embedding_model_key=None, azure_credential=None):
    endpoint = embedding_model_endpoint if embedding_model_endpoint else os.environ.get("EMBEDDING_MODEL_ENDPOINT")
    
    FLAG_EMBEDDING_MODEL = os.getenv("FLAG_EMBEDDING_MODEL", "AOAI")
    FLAG_COHERE = os.getenv("FLAG_COHERE", "ENGLISH")
    FLAG_AOAI = os.getenv("FLAG_AOAI", "V3")

    if azure_credential is None and (endpoint is None or key is None):
        raise Exception("EMBEDDING_MODEL_ENDPOINT and EMBEDDING_MODEL_KEY are required for embedding")

    try:
        if FLAG_EMBEDDING_MODEL == "AOAI":
            endpoint_parts = endpoint.split("/openai/deployments/")
            base_url = endpoint_parts[0]
            deployment_id = endpoint_parts[1].split("/embeddings")[0]
            api_version = endpoint_parts[1].split("api-version=")[1].split("&")[0]
            if azure_credential is not None:
                api_key = azure_credential.get_token("https://cognitiveservices.azure.com/.default").token
            else:
                api_key = embedding_model_key if embedding_model_key else os.getenv("AZURE_OPENAI_API_KEY")
            
            client = AzureOpenAI(api_version=api_version, azure_endpoint=base_url, api_key=api_key)
            if FLAG_AOAI == "V2":
                embeddings = client.embeddings.create(model=deployment_id, input=text)
            elif FLAG_AOAI == "V3":   
                embeddings = client.embeddings.create(model=deployment_id, 
                                                      input=text, 
                                                      dimensions=int(os.getenv("VECTOR_DIMENSION", 1536)))
            
            return embeddings.model_dump()['data'][0]['embedding']
        
        if FLAG_EMBEDDING_MODEL == "COHERE":
            if FLAG_COHERE == "MULTILINGUAL":
                key = embedding_model_key if embedding_model_key else os.getenv("COHERE_MULTILINGUAL_API_KEY")
            elif FLAG_COHERE == "ENGLISH":
                key = embedding_model_key if embedding_model_key else os.getenv("COHERE_ENGLISH_API_KEY")
            data, headers = get_payload_and_headers_cohere(text, key)

            body = str.encode(json.dumps(data))
            req = urllib.request.Request(endpoint, body, headers)
            response = urllib.request.urlopen(req)
            result = response.read()
            result_content = json.loads(result.decode('utf-8'))
                        
            return result_content["embeddings"][0]   
        

    except Exception as e:
        raise Exception(f"Error getting embeddings with endpoint={endpoint} with error={e}")


def chunk_content_helper(
        content: str, file_format: str, file_name: Optional[str],
        token_overlap: int,
        num_tokens: int = 256
) -> Generator[Tuple[str, int, Document], None, None]:
    if num_tokens is None:
        num_tokens = 1000000000

    parser = parser_factory(file_format.split("_pdf")[0]) # to handle cracked pdf converted to html
    doc = parser.parse(content, file_name=file_name)
    # if the original doc after parsing is < num_tokens return as it is
    doc_content_size = TOKEN_ESTIMATOR.estimate_tokens(doc.content)
    if doc_content_size < num_tokens or file_format in ["png", "jpg", "jpeg", "gif", "webp"]:
        yield doc.content, doc_content_size, doc
    else:
        if file_format == "markdown":
            splitter = MarkdownTextSplitter.from_tiktoken_encoder(
                chunk_size=num_tokens, chunk_overlap=token_overlap)
            chunked_content_list = splitter.split_text(
                content)  # chunk the original content
            for chunked_content, chunk_size in merge_chunks_serially(chunked_content_list, num_tokens):
                chunk_doc = parser.parse(chunked_content, file_name=file_name)
                chunk_doc.title = doc.title
                yield chunk_doc.content, chunk_size, chunk_doc
        else:
            if file_format == "python":
                splitter = PythonCodeTextSplitter.from_tiktoken_encoder(
                    chunk_size=num_tokens, chunk_overlap=token_overlap)
            else:
                if file_format == "html_pdf": # cracked pdf converted to html
                    splitter = PdfTextSplitter(separator=SENTENCE_ENDINGS + WORDS_BREAKS, chunk_size=num_tokens, chunk_overlap=token_overlap)
                else:
                    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
                            separators=SENTENCE_ENDINGS + WORDS_BREAKS,
                            chunk_size=num_tokens, chunk_overlap=token_overlap)
            chunked_content_list = splitter.split_text(doc.content)
            for chunked_content in chunked_content_list:
                chunk_size = TOKEN_ESTIMATOR.estimate_tokens(chunked_content)
                yield chunked_content, chunk_size, doc

def chunk_content(
    content: str,
    file_name: Optional[str] = None,
    url: Optional[str] = None,
    ignore_errors: bool = True,
    num_tokens: int = 256,
    min_chunk_size: int = 10,
    token_overlap: int = 0,
    extensions_to_process = FILE_FORMAT_DICT.keys(),
    cracked_pdf = False,
    use_layout = False,
    add_embeddings = False,
    azure_credential = None,
    embedding_endpoint = None,
    image_mapping = {}
) -> ChunkingResult:
    """Chunks the given content. If ignore_errors is true, returns None
        in case of an error
    Args:
        content (str): The content to chunk.
        file_name (str): The file name. used for title, file format detection.
        url (str): The url. used for title.
        ignore_errors (bool): If true, ignores errors and returns None.
        num_tokens (int): The number of tokens in each chunk.
        min_chunk_size (int): The minimum chunk size below which chunks will be filtered.
        token_overlap (int): The number of tokens to overlap between chunks.
    Returns:
        List[Document]: List of chunked documents.
    """

    try:
        if file_name is None or (cracked_pdf and not use_layout):
            file_format = "text"
        elif cracked_pdf:
            file_format = "html_pdf" # differentiate it from native html
        else:
            file_format = _get_file_format(file_name, extensions_to_process)
            if file_format is None:
                raise Exception(
                    f"{file_name} is not supported")

        chunked_context = chunk_content_helper(
            content=content,
            file_name=file_name,
            file_format=file_format,
            num_tokens=num_tokens,
            token_overlap=token_overlap
        )
        chunks = []
        skipped_chunks = 0
        for chunk, chunk_size, doc in chunked_context:
            if chunk_size >= min_chunk_size:
                if add_embeddings:
                    for i in range(RETRY_COUNT):
                        try:
                            doc.contentVector = get_embedding(chunk, azure_credential=azure_credential, embedding_model_endpoint=embedding_endpoint)
                            break
                        except Exception as e:
                            print(f"Error getting embedding for chunk with error={e}, retrying, current at {i + 1} retry, {RETRY_COUNT - (i + 1)} retries left")
                            time.sleep(30)
                    if doc.contentVector is None:
                        raise Exception(f"Error getting embedding for chunk={chunk}")
                    
                doc.image_mapping = {}
                for key, value in image_mapping.items():
                    if key in chunk:
                        doc.image_mapping[key] = value
                chunks.append(
                    Document(
                        content=chunk,
                        title=doc.title,
                        url=url,
                        contentVector=doc.contentVector,
                        metadata=doc.metadata,
                        image_mapping=doc.image_mapping
                    )
                )
            else:
                skipped_chunks += 1

    except UnsupportedFormatError as e:
        if ignore_errors:
            return ChunkingResult(
                chunks=[], total_files=1, num_unsupported_format_files=1
            )
        else:
            raise e
    except Exception as e:
        if ignore_errors:
            return ChunkingResult(chunks=[], total_files=1, num_files_with_errors=1)
        else:
            raise e
    return ChunkingResult(
        chunks=chunks,
        total_files=1,
        skipped_chunks=skipped_chunks,
    )

def image_content_to_tag(image_content: str) -> str:
    # We encode the images in an XML-like format to make the replacement very unlikely to conflict with other text
    # This also lets us preserve the content with minimal escaping, just escaping the <img> tags
    random_id = str(time.time()).replace(".", "")[-4:]
    img_tag = f'<img src="IMG_{random_id}.jpg">{image_content.replace("<img>", "&lt;img&gt;").replace("</img>", "&lt;/img&gt;")}</img>'
    return img_tag

def get_caption(image_path, captioning_model_endpoint, captioning_model_key):
    encoded_image = base64.b64encode(open(image_path, 'rb').read()).decode('ascii')
    file_ext = image_path.split(".")[-1]
    headers = {
        "Content-Type": "application/json",
        "api-key": captioning_model_key,
    }

    payload = {
        "messages": [
            {
            "role": "system",
            "content": [
                {
                "type": "text",
                "text": "You are a captioning model that helps uses find descriptive captions."
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "Describe this image as if you were describing it to someone who can't see it. "
                },
                {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/{file_ext};base64,{encoded_image}"
                }
                }
            ]
            }
        ],
        "temperature": 0
    }

    for i in range(RETRY_COUNT):
        try:
            response = requests.post(captioning_model_endpoint, headers=headers, json=payload)
            response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
            break
        except Exception as e:
            print(f"Error getting caption with error={e}, retrying, current at {i + 1} retry, {RETRY_COUNT - (i + 1)} retries left")
            time.sleep(15)

    if response.status_code != 200:
        raise Exception(f"Error getting caption with status_code={response.status_code}")
    
    caption = response.json()["choices"][0]["message"]["content"]
    img_tag = image_content_to_tag(caption)
    mapping = {img_tag: f"data:image/{file_ext};base64,{encoded_image}"}

    return img_tag, mapping

def chunk_file(
    file_path: str,
    ignore_errors: bool = True,
    num_tokens=256,
    min_chunk_size=10,
    url = None,
    token_overlap: int = 0,
    extensions_to_process = FILE_FORMAT_DICT.keys(),
    form_recognizer_client = None,
    use_layout = False,
    add_embeddings=False,
    azure_credential = None,
    embedding_endpoint = None,
    captioning_model_endpoint = None,
    captioning_model_key = None
) -> ChunkingResult:
    """Chunks the given file.
    Args:
        file_path (str): The file to chunk.
    Returns:
        List[Document]: List of chunked documents.
    """
    file_name = os.path.basename(file_path)
    file_format = _get_file_format(file_name, extensions_to_process)
    image_mapping = {}
    if not file_format:
        if ignore_errors:
            return ChunkingResult(
                chunks=[], total_files=1, num_unsupported_format_files=1
            )
        else:
            raise UnsupportedFormatError(f"{file_name} is not supported")

    cracked_pdf = False
    if file_format in ["pdf", "docx", "pptx"]:
        if form_recognizer_client is None:
            raise UnsupportedFormatError("form_recognizer_client is required for pdf files")
        content, image_mapping = extract_pdf_content(file_path, form_recognizer_client, use_layout=use_layout)
        cracked_pdf = True
    elif file_format in ["png", "jpg", "jpeg", "webp"]:
        # Make call to LLM for a descriptive caption
        if captioning_model_endpoint is None or captioning_model_key is None:
            raise Exception("CAPTIONING_MODEL_ENDPOINT and CAPTIONING_MODEL_KEY are required for images")
        content, image_mapping = get_caption(file_path, captioning_model_endpoint, captioning_model_key)
    else:
        try:
            with open(file_path, "r", encoding="utf8") as f:
                content = f.read()
        except UnicodeDecodeError:
            from chardet import detect
            with open(file_path, "rb") as f:
                binary_content = f.read()
                encoding = detect(binary_content).get('encoding', 'utf8')
                content = binary_content.decode(encoding)
        
    return chunk_content(
        content=content,
        file_name=file_name,
        ignore_errors=ignore_errors,
        num_tokens=num_tokens,
        min_chunk_size=min_chunk_size,
        url=url,
        token_overlap=max(0, token_overlap),
        extensions_to_process=extensions_to_process,
        cracked_pdf=cracked_pdf,
        use_layout=use_layout,
        add_embeddings=add_embeddings,
        azure_credential=azure_credential,
        embedding_endpoint=embedding_endpoint,
        image_mapping=image_mapping
    )


def process_file(
        file_path: str, # !IMP: Please keep this as the first argument
        directory_path: str,
        ignore_errors: bool = True,
        num_tokens: int = 1024,
        min_chunk_size: int = 10,
        url_prefix = None,
        token_overlap: int = 0,
        extensions_to_process: List[str] = FILE_FORMAT_DICT.keys(),
        form_recognizer_client = None,
        use_layout = False,
        add_embeddings = False,
        azure_credential = None,
        embedding_endpoint = None,
        captioning_model_endpoint = None,
        captioning_model_key = None
    ):

    if not form_recognizer_client:
        form_recognizer_client = SingletonFormRecognizerClient()

    is_error = False
    try:
        url_path = None
        rel_file_path = os.path.relpath(file_path, directory_path)
        if url_prefix:
            url_path = url_prefix + rel_file_path
            url_path = convert_escaped_to_posix(url_path)

        result = chunk_file(
            file_path,
            ignore_errors=ignore_errors,
            num_tokens=num_tokens,
            min_chunk_size=min_chunk_size,
            url=url_path,
            token_overlap=token_overlap,
            extensions_to_process=extensions_to_process,
            form_recognizer_client=form_recognizer_client,
            use_layout=use_layout,
            add_embeddings=add_embeddings,
            azure_credential=azure_credential,
            embedding_endpoint=embedding_endpoint,
            captioning_model_endpoint=captioning_model_endpoint,
            captioning_model_key=captioning_model_key
        )
        for chunk_idx, chunk_doc in enumerate(result.chunks):
            chunk_doc.filepath = rel_file_path
            chunk_doc.metadata = json.dumps({"chunk_id": str(chunk_idx)})
            chunk_doc.image_mapping = json.dumps(chunk_doc.image_mapping) if chunk_doc.image_mapping else None
    except Exception as e:
        print(e)
        if not ignore_errors:
            raise
        print(f"File ({file_path}) failed with ", e)
        is_error = True
        result =None
    return result, is_error

def chunk_blob_container(
        blob_url: str,
        credential,
        ignore_errors: bool = True,
        num_tokens: int = 1024,
        min_chunk_size: int = 10,
        url_prefix = None,
        token_overlap: int = 0,
        extensions_to_process: List[str] = list(FILE_FORMAT_DICT.keys()),
        form_recognizer_client = None,
        use_layout = False,
        njobs=4,
        add_embeddings = False,
        azure_credential = None,
        embedding_endpoint = None
):
    with tempfile.TemporaryDirectory() as local_data_folder:
        print(f'Downloading {blob_url} to local folder')
        downloadBlobUrlToLocalFolder(blob_url, local_data_folder, credential)
        print(f'Downloaded.')

        result = chunk_directory(
            local_data_folder,
            ignore_errors=ignore_errors,
            num_tokens=num_tokens,
            min_chunk_size=min_chunk_size,
            url_prefix=url_prefix,
            token_overlap=token_overlap,
            extensions_to_process=extensions_to_process,
            form_recognizer_client=form_recognizer_client,
            use_layout=use_layout,
            njobs=njobs,
            add_embeddings=add_embeddings,
            azure_credential=azure_credential,
            embedding_endpoint=embedding_endpoint
        )

    return result


def chunk_directory(
        directory_path: str,
        ignore_errors: bool = True,
        num_tokens: int = 1024,
        min_chunk_size: int = 10,
        url_prefix = None,
        token_overlap: int = 0,
        extensions_to_process: List[str] = list(FILE_FORMAT_DICT.keys()),
        form_recognizer_client = None,
        use_layout = False,
        njobs=4,
        add_embeddings = False,
        azure_credential = None,
        embedding_endpoint = None,
        captioning_model_endpoint = None,
        captioning_model_key = None
):
    """
    Chunks the given directory recursively
    Args:
        directory_path (str): The directory to chunk.
        ignore_errors (bool): If true, ignores errors and returns None.
        num_tokens (int): The number of tokens to use for chunking.
        min_chunk_size (int): The minimum chunk size.
        url_prefix (str): The url prefix to use for the files. If None, the url will be None. If not None, the url will be url_prefix + relpath. 
                            For example, if the directory path is /home/user/data and the url_prefix is https://example.com/data, 
                            then the url for the file /home/user/data/file1.txt will be https://example.com/data/file1.txt
        token_overlap (int): The number of tokens to overlap between chunks.
        extensions_to_process (List[str]): The list of extensions to process. 
        form_recognizer_client: Optional form recognizer client to use for pdf files.
        use_layout (bool): If true, uses Layout model for pdf files. Otherwise, uses Read.
        add_embeddings (bool): If true, adds a vector embedding to each chunk using the embedding model endpoint and key.

    Returns:
        List[Document]: List of chunked documents.
    """
    chunks = []
    total_files = 0
    num_unsupported_format_files = 0
    num_files_with_errors = 0
    skipped_chunks = 0

    all_files_directory = get_files_recursively(directory_path)
    files_to_process = [file_path for file_path in all_files_directory if os.path.isfile(file_path)]
    print(f"Total files to process={len(files_to_process)} out of total directory size={len(all_files_directory)}")


    if njobs==1:
        print("Single process to chunk and parse the files. --njobs > 1 can help performance.")
        for file_path in tqdm(files_to_process):
            total_files += 1
            result, is_error = process_file(file_path=file_path,directory_path=directory_path, ignore_errors=ignore_errors,
                                       num_tokens=num_tokens,
                                       min_chunk_size=min_chunk_size, url_prefix=url_prefix,
                                       token_overlap=token_overlap,
                                       extensions_to_process=extensions_to_process,
                                       form_recognizer_client=form_recognizer_client, use_layout=use_layout, add_embeddings=add_embeddings,
                                       azure_credential=azure_credential, embedding_endpoint=embedding_endpoint,
                                       captioning_model_endpoint=captioning_model_endpoint, captioning_model_key=captioning_model_key)
            if is_error:
                num_files_with_errors += 1
                continue
            chunks.extend(result.chunks)
            num_unsupported_format_files += result.num_unsupported_format_files
            num_files_with_errors += result.num_files_with_errors
            skipped_chunks += result.skipped_chunks
    elif njobs > 1:
        print(f"Multiprocessing with njobs={njobs}")
        process_file_partial = partial(process_file, directory_path=directory_path, ignore_errors=ignore_errors,
                                       num_tokens=num_tokens,
                                       min_chunk_size=min_chunk_size, url_prefix=url_prefix,
                                       token_overlap=token_overlap,
                                       extensions_to_process=extensions_to_process,
                                       form_recognizer_client=None, use_layout=use_layout, add_embeddings=add_embeddings,
                                       azure_credential=azure_credential, embedding_endpoint=embedding_endpoint,
                                       captioning_model_endpoint=captioning_model_endpoint, captioning_model_key=captioning_model_key)
        with ProcessPoolExecutor(max_workers=njobs) as executor:
            futures = list(tqdm(executor.map(process_file_partial, files_to_process), total=len(files_to_process)))
            for result, is_error in futures:
                total_files += 1
                if is_error:
                    num_files_with_errors += 1
                    continue
                chunks.extend(result.chunks)
                num_unsupported_format_files += result.num_unsupported_format_files
                num_files_with_errors += result.num_files_with_errors
                skipped_chunks += result.skipped_chunks

    return ChunkingResult(
            chunks=chunks,
            total_files=total_files,
            num_unsupported_format_files=num_unsupported_format_files,
            num_files_with_errors=num_files_with_errors,
            skipped_chunks=skipped_chunks,
        )


class SingletonFormRecognizerClient:
    instance = None
    def __new__(cls, *args, **kwargs):
        if not cls.instance:
            print("SingletonFormRecognizerClient: Creating instance of Form recognizer per process")
            url = os.getenv("FORM_RECOGNIZER_ENDPOINT")
            key = os.getenv("FORM_RECOGNIZER_KEY")
            if url and key:
                cls.instance = DocumentIntelligenceClient(
                        endpoint=url, credential=AzureKeyCredential(key), headers={"x-ms-useragent": "sample-app-aoai-chatgpt/1.0.0"})
            else:
                print("SingletonFormRecognizerClient: Skipping since credentials not provided. Assuming NO form recognizer extensions(like .pdf) in directory")
                cls.instance = object() # dummy object
        return cls.instance

    def __getstate__(self):
        return self.url, self.key

    def __setstate__(self, state):
        url, key = state
        self.instance = DocumentIntelligenceClient(endpoint=url, credential=AzureKeyCredential(key), headers={"x-ms-useragent": "sample-app-aoai-chatgpt/1.0.0"})
