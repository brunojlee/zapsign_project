from rest_framework import serializers
from .models import Company, Document, Signer

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['open_id', 'token']  # Make these fields read-only

class SignerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signer
        fields = '__all__'
