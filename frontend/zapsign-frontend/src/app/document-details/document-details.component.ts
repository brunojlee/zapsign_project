import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../document.service';

@Component({
  standalone: true,
  selector: 'app-document-details',
  templateUrl: './document-details.component.html',
  styleUrls: ['./document-details.component.css'],
  imports: [CommonModule],
})
export class DocumentDetailsComponent implements OnInit {
  document: any = {};
  documentId: number = 0;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private documentService: DocumentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get document ID from route params
    this.route.params.subscribe((params) => {
      this.documentId = +params['id'];
      console.log(`Loading details for document ID: ${this.documentId}`);
      this.loadDocument();
    });
  }

  loadDocument(): void {
    this.loading = true;
    this.error = null;

    this.documentService.getDocumentByOpenId(this.documentId).subscribe({
      next: (document) => {
        console.log('Document details received:', document);
        this.document = document;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading document details:', err);
        this.error = err.message || 'Failed to load document details';
        this.loading = false;
      },
    });
  }

  editDocument(): void {
    if (this.document.open_id) {
      this.router.navigate(['/update', this.document.open_id]);
    } else {
      alert('Este documento não possui um open_id válido para edição.');
    }
  }

  navigateToDocuments(): void {
    this.router.navigate(['/documents']);
  }
}
