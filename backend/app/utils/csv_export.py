"""CSV 导出工具（UTF-8 BOM，兼容 Excel 中文）。"""
import csv
import io
import re


def sanitize_csv_cell(value: str | int | float | None) -> str:
    text = "" if value is None else str(value)
    text = re.sub(r"[\r\n]+", " ", text.strip())
    return text


def rows_to_csv_bytes(headers: list[str], rows: list[list[str | int | float | None]]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([sanitize_csv_cell(cell) for cell in row])
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")
