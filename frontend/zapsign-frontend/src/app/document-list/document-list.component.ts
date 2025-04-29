import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DocumentService } from '../document.service';

@Component({
  standalone: true,
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css'],
  imports: [CommonModule],
})
export class DocumentListComponent implements OnInit {
  documents: any[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private documentService: DocumentService,
    public router: Router // Changed to public for template access
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.documentService.getZapsignDocs().subscribe(
      (data) => {
        // Extract documents from the 'results' property
        this.documents = data.results || [];
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching documents', error);
        this.error = 'Failed to load documents';
        this.loading = false;
      }
    );
  }

  editDocument(doc: any): void {
    if (doc.open_id) {
      console.log(`Navigating to edit document with open_id: ${doc.open_id}`);
      this.router.navigate(['/update', doc.open_id]);
    } else {
      alert('Este documento não possui um open_id válido para edição.');
    }
  }

  viewDocument(doc: any): void {
    if (doc.open_id) {
      console.log(`Navigating to view document with open_id: ${doc.open_id}`);
      this.router.navigate(['/details', doc.open_id]);
    } else {
      alert('Este documento não possui um open_id válido para visualização.');
    }
  }

  // Using token directly for deletion
  deleteDocument(token: string): void {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      if (token) {
        this.documentService.deleteDocumentByToken(token).subscribe(
          () => {
            alert('Documento excluído com sucesso!');
            this.loadDocuments(); // Refresh the list
          },
          (error) => {
            console.error('Error deleting document:', error);

            // Even if there was an error, the document might have been deleted from one system
            // So refresh the list anyway
            this.loadDocuments();

            if (error.status === 404) {
              alert(
                'Documento já foi excluído ou não existe na ZapSign API. A lista foi atualizada.'
              );
            } else {
              alert(
                'Erro ao excluir o documento: ' +
                  JSON.stringify(error.error || 'Erro desconhecido')
              );
            }
          }
        );
      } else {
        alert('Este documento não possui um token válido para exclusão.');
      }
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/create']);
  }
}
