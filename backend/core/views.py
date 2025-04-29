from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import requests
from .models import Company, Document
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()

        try:
            company = Company.objects.first()
        except Company.DoesNotExist:
            return Response({"error": "Company not found."}, status=status.HTTP_400_BAD_REQUEST)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {company.api_token}"
        }
        print("Headers enviados para a ZapSign:", headers)
        # Construindo o payload conforme a documentação da ZapSign
        payload = {
            "name": document.name,
            "url_pdf": request.data.get("url_pdf", ""),
            "external_id": request.data.get("external_id"),
            "signers": request.data.get("signers", []),
            "lang": request.data.get("lang", "pt-br"),
            "disable_signer_emails": request.data.get("disable_signer_emails", False),
            "brand_logo": request.data.get("brand_logo", ""),
            "brand_primary_color": request.data.get("brand_primary_color", ""),
            "brand_name": request.data.get("brand_name", ""),
            "folder_path": request.data.get("folder_path", "/"),
            "created_by": request.data.get("created_by", ""),
            "date_limit_to_sign": request.data.get("date_limit_to_sign"),
            "signature_order_active": request.data.get("signature_order_active", False),
            "observers": request.data.get("observers", ["test@observer.com"]),
            "reminder_every_n_days": request.data.get("reminder_every_n_days", 0),
            "allow_refuse_signature": request.data.get("allow_refuse_signature", False),
            "disable_signers_get_original_file": request.data.get("disable_signers_get_original_file", False)
        }

        print("Payload enviado para a ZapSign:", payload)
        zap_api_url = "https://sandbox.api.zapsign.com.br/api/v1/docs/"
        response = requests.post(zap_api_url, json=payload, headers=headers)
        print("Resposta da ZapSign:", response.text)
        
        try:
            data = response.json()
            document.open_id = data.get("open_id")
            document.token = data.get("token")
            document.status = data.get("status")
            document.external_id = data.get("external_id")
            document.save()
            return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Error processing ZapSign response:", str(e))
            document.delete()
            return Response({"error": "Error processing ZapSign API response", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Prevent modification of sensitive fields
        if 'token' in request.data:
            return Response(
                {"error": "You cannot modify the token field"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if 'open_id' in request.data:
            return Response(
                {"error": "You cannot modify the open_id field"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update only in local database (no API call)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='zapsign-docs')
    def zapsign_docs(self, request):
        try:
            company = Company.objects.first()
        except Company.DoesNotExist:
            return Response({"error": "Company not found."}, status=status.HTTP_400_BAD_REQUEST)
            
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {company.api_token}"
        }
        
        zap_api_url = "https://sandbox.api.zapsign.com.br/api/v1/docs/"
        response = requests.get(zap_api_url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Process each document in the API response
            if 'results' in data:
                # Dictionary to track tokens of documents that exist in our database
                local_documents = {doc.token: doc for doc in Document.objects.all() if doc.token}
                
                # New list for filtered results
                filtered_results = []
                
                for api_doc in data['results']:
                    token = api_doc.get('token')
                    deleted_in_api = api_doc.get('deleted', False)
                    
                    # Check if the document exists in our local database
                    if token in local_documents:
                        local_doc = local_documents[token]
                        
                        # If document is deleted in API but not in our database, mark it as deleted
                        if deleted_in_api and not local_doc.deleted:
                            local_doc.deleted = True
                            local_doc.deleted_at = api_doc.get('deleted_at')
                            local_doc.save()
                            # Don't include deleted documents in the response
                            continue
                        
                        # If document is not deleted, add it to filtered results
                        if not deleted_in_api:
                            filtered_results.append(api_doc)
                    else:
                        # Document doesn't exist in our local database
                        # Only add non-deleted documents to our response
                        if not deleted_in_api:
                            filtered_results.append(api_doc)
                
                # Replace the original results with our filtered list
                data['results'] = filtered_results
                
            return Response(data, status=status.HTTP_200_OK)
        else:
            print("ZapSign GET error:", response.text)
            return Response(
                {"error": "Error fetching docs from ZapSign API", "detail": response.text},
                status=response.status_code
            )
    
    @action(detail=False, methods=['delete'], url_path='delete-by-token/(?P<token>[^/.]+)')
    def delete_by_token(self, request, token=None):
        # Try to find document locally but don't fail if it doesn't exist locally
        local_document_exists = False
        try:
            instance = Document.objects.get(token=token)
            local_document_exists = True
        except Document.DoesNotExist:
            # Continue anyway to try deleting from ZapSign API
            pass
        
        # Get API token from company
        try:
            company = Company.objects.first()
        except Company.DoesNotExist:
            return Response({"error": "Company not found."}, status=status.HTTP_400_BAD_REQUEST)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {company.api_token}"
        }
        
        # Delete from ZapSign API
        zap_api_url = f"https://sandbox.api.zapsign.com.br/api/v1/docs/{token}/"
        response = requests.delete(zap_api_url, headers=headers)
        
        # Handle API response - 404 is acceptable (already deleted)
        if response.status_code not in [200, 201, 204, 404]:
            print("ZapSign API delete error:", response.text)
            return Response({"error": "Error deleting document from ZapSign API", "detail": response.text}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # If document exists locally, delete it regardless of API response
        if local_document_exists:
            self.perform_destroy(instance)
            
        # Return success even if only deleted from one place
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'], url_path='by-open-id/(?P<open_id>[^/.]+)')
    def get_by_open_id(self, request, open_id=None):
        try:
            # Try to convert open_id to integer
            try:
                open_id_int = int(open_id)
            except ValueError:
                return Response(
                    {"detail": f"Invalid open_id format: {open_id}. Must be an integer."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # First check if we have this document in our database already
            try:
                document = Document.objects.get(open_id=open_id_int)
                serializer = self.get_serializer(document)
                return Response(serializer.data)
            except Document.DoesNotExist:
                # If not in our database, try to find it in the ZapSign API and create it
                company = Company.objects.first()
                if not company:
                    return Response({"error": "Company not found."}, status=status.HTTP_400_BAD_REQUEST)
                    
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {company.api_token}"
                }
                
                zap_api_url = "https://sandbox.api.zapsign.com.br/api/v1/docs/"
                response = requests.get(zap_api_url, headers=headers)
                
                if response.status_code != 200:
                    return Response(
                        {"error": "Error fetching documents from ZapSign API"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
                data = response.json()
                results = data.get('results', [])
                
                # Try to find the document with matching open_id
                for api_doc in results:
                    if api_doc.get('open_id') == open_id_int:
                        # Found in API, create in our database
                        new_document = Document.objects.create(
                            open_id=api_doc.get('open_id'),
                            token=api_doc.get('token'),
                            name=api_doc.get('name'),
                            status=api_doc.get('status'),
                            created_by='ZapSign API',
                            company=company,
                            external_id=api_doc.get('external_id', '')
                        )
                        serializer = self.get_serializer(new_document)
                        return Response(serializer.data)
                
                # Not found in API either
                return Response(
                    {"detail": f"No document with open_id={open_id} found in database or ZapSign API"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            return Response(
                {"detail": f"Error processing request: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='by-token/(?P<token>[^/.]+)')
    def get_by_token(self, request, token=None):
        try:
            # First check if we have this document in our database already
            try:
                document = Document.objects.get(token=token)
                serializer = self.get_serializer(document)
                local_data = serializer.data
                
                # Get fresh data from ZapSign API 
                company = Company.objects.first()
                if not company:
                    return Response({"error": "Company not found."}, status=status.HTTP_400_BAD_REQUEST)
                    
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {company.api_token}"
                }
                
                # Direct token lookup from ZapSign API
                zap_api_url = f"https://sandbox.api.zapsign.com.br/api/v1/docs/{token}/"
                response = requests.get(zap_api_url, headers=headers)
                
                if response.status_code == 200:
                    api_data = response.json()
                    
                    # Merge API data with our local data
                    api_data['id'] = document.id  # Add our database ID for reference
                    
                    # Update status if it has changed
                    if api_data.get('status') != document.status:
                        document.status = api_data.get('status')
                        document.save()
                    
                    return Response(api_data)
                
                # If API call fails, return local data
                return Response(local_data)
                
            except Document.DoesNotExist:
                # Document not in local DB, fetch directly from API
                company = Company.objects.first()
                if not company:
                    return Response({"error": "Company not found."}, status=status.HTTP_400_BAD_REQUEST)
                    
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {company.api_token}"
                }
                
                zap_api_url = f"https://sandbox.api.zapsign.com.br/api/v1/docs/{token}/"
                response = requests.get(zap_api_url, headers=headers)
                
                if response.status_code != 200:
                    return Response(
                        {"error": "Error fetching document from ZapSign API"}, 
                        status=response.status_code
                    )
                    
                api_doc = response.json()
                
                # Create local record for this document
                new_document = Document.objects.create(
                    open_id=api_doc.get('open_id'),
                    token=api_doc.get('token'),
                    name=api_doc.get('name'),
                    status=api_doc.get('status'),
                    created_by=api_doc.get('created_by', {}).get('email', 'ZapSign API'),
                    company=company,
                    external_id=api_doc.get('external_id', '')
                )
                
                # Add our database ID for reference
                api_doc['id'] = new_document.id
                
                return Response(api_doc)
                
        except Exception as e:
            return Response(
                {"detail": f"Error processing request: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )