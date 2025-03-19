"""Test fixtures and configuration."""

from django.test import Client
from rest_framework.test import APIClient

import pytest


@pytest.fixture
def client():
    """Return a Django test client."""
    return Client()


@pytest.fixture
def api_client():
    """Return a DRF API test client."""
    return APIClient()
