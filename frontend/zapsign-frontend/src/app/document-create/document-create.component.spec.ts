import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DocumentService } from '../document.service';
import { DocumentCreateComponent } from './document-create.component';

describe('DocumentCreateComponent', () => {
  let component: DocumentCreateComponent;
  let fixture: ComponentFixture<DocumentCreateComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockDocumentService = jasmine.createSpyObj('DocumentService', [
      'createDocument',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockDocumentService.createDocument.and.returnValue(
      of({ id: 1, name: 'New Document' })
    );

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        HttpClientTestingModule,
        DocumentCreateComponent,
      ],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call createDocument when form is submitted', () => {
    // Set form values
    component.document.name = 'Test Document';
    component.document.url_pdf = 'https://example.com/test.pdf';

    // Call method
    component.createDocument();

    // Verify service was called
    expect(mockDocumentService.createDocument).toHaveBeenCalled();
  });

  it('should navigate to documents list after successful creation', () => {
    // Set form values
    component.document.name = 'Test Document';

    // Call method
    component.createDocument();

    // Verify navigation
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
  });

  // Novos testes para aumentar cobertura

  it('should handle error when document creation fails', () => {
    mockDocumentService.createDocument.and.returnValue(
      throwError(() => ({ error: { message: 'Error creating document' } }))
    );

    spyOn(console, 'error');
    component.createDocument();

    expect(component.loading).toBeFalse();
    expect(component.error).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle ZapSign API success but backend error', () => {
    mockDocumentService.createDocument.and.returnValue(
      throwError(() => ({ error: { token: 'token123' } }))
    );

    spyOn(console, 'log');
    spyOn(window, 'alert');

    component.createDocument();

    expect(console.log).toHaveBeenCalledWith(
      'ZapSign created the document but backend had an error'
    );
    expect(window.alert).toHaveBeenCalledWith(
      'Documento criado na ZapSign, mas houve um erro ao salvar localmente'
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
  });

  it('should set error message when document creation fails with regular error', () => {
    mockDocumentService.createDocument.and.returnValue(
      throwError(() => ({ error: 'API error' }))
    );

    component.createDocument();

    expect(component.error).toEqual('Erro ao criar o documento: "API error"');
  });

  it('should navigate to documents list with navigateToDocuments method', () => {
    component.navigateToDocuments();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
  });
});
