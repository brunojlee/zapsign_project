import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../document.service';

@Component({
  standalone: true,
  selector: 'app-document-update',
  templateUrl: './document-update.component.html',
  styleUrls: ['./document-update.component.css'],
  imports: [CommonModule, FormsModule],
})
export class DocumentUpdateComponent implements OnInit {
  document: any = {
    name: '',
    url_pdf: '',
    external_id: null,
    signers: [
      {
        name: '',
        email: '',
        auth_mode: 'assinaturaTela',
        send_automatic_email: true,
        send_automatic_whatsapp: false,
      },
    ],
    lang: 'pt-br',
    disable_signer_emails: false,
    folder_path: '/',
    created_by: '',
    signature_order_active: false,
    company: 1,
    status: 'pending',
  };
  documentId: number = 0;
  loading: boolean = true;
  error: string | null = null;
  documentFound: boolean = false;

  constructor(
    private documentService: DocumentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get document ID from route params
    this.route.params.subscribe((params) => {
      this.documentId = +params['id'];
      console.log(`Document ID from route: ${this.documentId}`);
      this.loadDocument();
    });
  }

  loadDocument(): void {
    this.loading = true;
    this.error = null;
    console.log(`Loading document with ID: ${this.documentId}`);

    this.documentService.getDocumentByOpenId(this.documentId).subscribe({
      next: (document) => {
        console.log('Document received:', document);
        // Fix the created_by field - convert object to string
        if (
          typeof document.created_by === 'object' &&
          document.created_by !== null
        ) {
          // Handle both direct email property and nested structures
          if (document.created_by.email) {
            document.created_by = document.created_by.email;
          } else {
            // Fallback to string representation if no email property
            document.created_by = JSON.stringify(document.created_by);
          }
        }

        this.document = document;
        this.documentFound = true;
        this.loading = false;
        console.log('Processed document:', this.document);
      },
      error: (err) => {
        console.error('Error loading document:', err);
        this.error = err.message;
        this.loading = false;
      },
    });
  }

  // New method to fetch document details by token
  loadDetailedDocumentByToken(token: string): void {
    console.log(`Fetching detailed document info for token: ${token}`);

    this.documentService.getDocumentByToken(token).subscribe(
      (detailedDoc) => {
        console.log('Detailed document data:', detailedDoc);
        this.setupDocumentData(detailedDoc);
      },
      (error) => {
        console.error('Failed to get detailed document data:', error);
        // Continue with basic document data
        this.setupDocumentData(this.document);
      }
    );
  }

  // Helper to setup document data for the form
  setupDocumentData(docData: any): void {
    // Set the document data
    this.document = docData;

    // Ensure all required fields exist
    if (!this.document.url_pdf) {
      this.document.url_pdf = '';
    }

    // Set up signers array if it exists in the API response
    if (docData.signers && docData.signers.length > 0) {
      // Use signers from API
      this.document.signers = docData.signers.map((signer: any) => ({
        name: signer.name || '',
        email: signer.email || '',
        auth_mode: signer.auth_mode || 'assinaturaTela',
        send_automatic_email: signer.send_automatic_email !== false,
        send_automatic_whatsapp: signer.send_automatic_whatsapp || false,
      }));
    } else if (!this.document.signers) {
      // Create default signer if none exists
      this.document.signers = [
        {
          name: '',
          email: '',
          auth_mode: 'assinaturaTela',
          send_automatic_email: true,
          send_automatic_whatsapp: false,
        },
      ];
    }

    this.documentFound = true;
    this.loading = false;
  }

  updateDocument(): void {
    if (!this.documentFound) {
      this.error = "Cannot update a document that wasn't properly loaded";
      return;
    }

    // For ZapSign documents, we need to create or get the local database record first
    // If we already have a local ID, use that, otherwise we'll need to fetch or create it
    if (this.document.id) {
      this.performUpdate(this.document.id);
    } else {
      // We need to make an extra call to ensure we have a local database record
      this.documentService.getDocumentByOpenId(this.document.open_id).subscribe(
        (localDoc) => {
          console.log('Retrieved local document by open_id:', localDoc);
          // Now we have the local database ID
          this.performUpdate(localDoc.id);
        },
        (error) => {
          console.error('Error getting local document:', error);
          this.error = 'Failed to find document in local database';
        }
      );
    }
  }

  performUpdate(djangoId: number): void {
    console.log('Updating document, current state:', this.document);

    // Create a clean copy without sensitive fields
    const documentToUpdate = { ...this.document };

    // Explicitly handle created_by field
    if (
      typeof documentToUpdate.created_by === 'object' &&
      documentToUpdate.created_by !== null
    ) {
      if (documentToUpdate.created_by.email) {
        documentToUpdate.created_by = documentToUpdate.created_by.email;
      } else {
        documentToUpdate.created_by = 'ZapSign API';
      }
    } else if (!documentToUpdate.created_by) {
      documentToUpdate.created_by = 'ZapSign API';
    }

    console.log('Document to update:', documentToUpdate);

    // Only include url_pdf if the document is not signed
    if (this.document.status === 'signed') {
      delete documentToUpdate.url_pdf;
    }

    this.documentService.updateDocument(djangoId, documentToUpdate).subscribe(
      (response) => {
        console.log('Success response:', response);
        alert('Documento atualizado com sucesso!');
        this.router.navigate(['/documents']);
      },
      (error) => {
        console.error('Error updating document:', error);
        alert('Erro ao atualizar o documento: ' + JSON.stringify(error.error));
      }
    );
  }

  navigateToDocuments(): void {
    this.router.navigate(['/documents']);
  }
}
