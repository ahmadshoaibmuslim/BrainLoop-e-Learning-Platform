#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
sys.path.insert(0, "d:\\FYP\\backend")

django.setup()

from api.models import Book

try:
    book = Book.objects.get(id=1)
    print(f"Book: {book.title}")
    print(f"PDF File: {book.pdf_file}")
    print(f"Has PDF: {bool(book.pdf_file)}")
    print(f"Preview Pages: {book.preview_pages}")
    print(f"Total Pages: {book.total_pages}")
except Book.DoesNotExist:
    print("Book with ID 1 not found")
except Exception as e:
    print(f"Error: {e}")
