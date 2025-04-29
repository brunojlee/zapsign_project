from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=255)
    api_token = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Document(models.Model):
    open_id = models.IntegerField(null=True, blank=True)
    token = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=255)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='documents')
    external_id = models.CharField(max_length=255, null=True, blank=True)
    deleted = models.BooleanField(default=False)  # Add this field
    deleted_at = models.DateTimeField(null=True, blank=True)  # Add this field

    def __str__(self):
        return self.name

class Signer(models.Model):
    token = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    external_id = models.CharField(max_length=255, null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='signers')

    def __str__(self):
        return self.name
