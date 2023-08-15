from app import format_as_ndjson


def test_format_as_ndjson():
    obj = {"message": "I ❤️ 🐍 \n and escaped newlines"}
    assert format_as_ndjson(obj) == '{"message": "I ❤️ 🐍 \\n and escaped newlines"}\n'
