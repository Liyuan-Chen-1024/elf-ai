"""Test fixtures and configuration."""
import pytest
from django.test import Client
from rest_framework.test import APIClient


@pytest.fixture
def client():
    """Return a Django test client."""
    return Client()


@pytest.fixture
def api_client():
    """Return a DRF API test client."""
    return APIClient() 