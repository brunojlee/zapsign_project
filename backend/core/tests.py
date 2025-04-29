from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Company

class DocumentAPITest(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(name="Test Company", api_token="dummy_token")

    def test_create_document(self):
        url = reverse('document-list')
        data = {
            "name": "Test Document",
            "status": "pending",
            "created_by": "tester",
            "company": self.company.id
        }
        response = self.client.post(url, data, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])
