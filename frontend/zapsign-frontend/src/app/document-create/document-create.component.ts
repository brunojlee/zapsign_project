import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService } from '../document.service';

@Component({
  standalone: true,
  selector: 'app-document-create',
  templateUrl: './document-create.component.html',
  styleUrls: ['./document-create.component.css'],
  imports: [CommonModule, FormsModule],
})
export class DocumentCreateComponent {
  document = {
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
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private documentService: DocumentService,
    private router: Router
  ) {}

  createDocument(): void {
    this.loading = true;
    this.error = null;

    this.documentService.createDocument(this.document).subscribe(
      (response) => {
        console.log('Success response:', response);
        alert('Documento criado com sucesso!');
        this.router.navigate(['/documents']);
      },
      (error) => {
        console.error('Error creating document:', error);
        this.loading = false;

        // If the error response contains a JSON response from ZapSign
        if (
          error.error &&
          typeof error.error === 'object' &&
          error.error.token
        ) {
          console.log('ZapSign created the document but backend had an error');
          alert(
            'Documento criado na ZapSign, mas houve um erro ao salvar localmente'
          );
          this.router.navigate(['/documents']);
        } else {
          this.error =
            'Erro ao criar o documento: ' + JSON.stringify(error.error);
        }
      }
    );
  }

  navigateToDocuments(): void {
    this.router.navigate(['/documents']);
  }
}
