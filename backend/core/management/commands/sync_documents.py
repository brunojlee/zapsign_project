from django.core.management.base import BaseCommand
import requests
from core.models import Company, Document

class Command(BaseCommand):
    help = 'Sync documents with ZapSign API and clean up the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed sync information',
        )

    def handle(self, *args, **options):
        verbose = options.get('verbose', False)
        
        try:
            company = Company.objects.first()
            if not company:
                self.stdout.write(self.style.ERROR("No company found. Run seed_company first."))
                return
            
            # Get all documents from ZapSign API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {company.api_token}"
            }
            
            zap_api_url = "https://sandbox.api.zapsign.com.br/api/v1/docs/"
            
            self.stdout.write("1. Fetching documents from ZapSign API...")
            response = requests.get(zap_api_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if verbose:
                self.stdout.write(f"API returned {len(data.get('results', []))} documents")
            
            # Extract tokens of existing documents in API
            api_tokens = {doc['token']: doc for doc in data.get('results', [])}
            
            self.stdout.write("2. Fetching local documents...")
            # Check each local document
            local_documents = Document.objects.all()
            if verbose:
                self.stdout.write(f"Found {local_documents.count()} local documents")
            
            docs_deleted = 0
            docs_updated = 0
            
            self.stdout.write("3. Processing documents...")
            for doc in local_documents:
                if not doc.token:
                    if verbose:
                        self.stdout.write(f"Skipping document {doc.id} - {doc.name}: No token")
                    continue
                    
                if doc.token not in api_tokens:
                    self.stdout.write(self.style.WARNING(
                        f"Deleting document '{doc.name}' (id: {doc.id}, token: {doc.token}) - not found in ZapSign API"))
                    doc.delete()
                    docs_deleted += 1
                else:
                    # Update local document with latest API data
                    api_doc = api_tokens[doc.token]
                    if doc.status != api_doc.get('status'):
                        old_status = doc.status
                        doc.status = api_doc.get('status')
                        doc.save()
                        docs_updated += 1
                        if verbose:
                            self.stdout.write(f"Updated document {doc.id} - {doc.name}: Status changed from {old_status} to {doc.status}")
            
            self.stdout.write(self.style.SUCCESS(
                f"Sync complete. Deleted {docs_deleted} documents. Updated {docs_updated} documents."))
            
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Network error when connecting to ZapSign API: {str(e)}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during sync: {str(e)}"))