import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentListComponent } from './document-list.component';
import { DocumentService } from '../document.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Mock data
  const mockDocuments = {
    results: [
      { id: 1, name: 'Document 1', open_id: 101, token: 'token1' },
      { id: 2, name: 'Document 2', open_id: 102, token: 'token2' }
    ]
  };

  beforeEach(async () => {
    // Create spies for service and router
    mockDocumentService = jasmine.createSpyObj('DocumentService', ['getZapsignDocs', 'deleteDocumentByToken']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Configure mock service response
    mockDocumentService.getZapsignDocs.and.returnValue(of(mockDocuments));
    
    await TestBed.configureTestingModule({
      imports: [CommonModule, DocumentListComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This will call ngOnInit() which calls loadDocuments()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load documents on initialization', () => {
    expect(mockDocumentService.getZapsignDocs).toHaveBeenCalled();
    expect(component.documents).toEqual(mockDocuments.results);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should handle error when loading documents fails', () => {
    // Set up the service to return an error
    mockDocumentService.getZapsignDocs.and.returnValue(throwError(() => new Error('API Error')));
    
    // Call loadDocuments again
    component.loadDocuments();
    
    // Check that error is handled correctly
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Failed to load documents');
  });

  it('should navigate to edit document when editDocument is called with valid open_id', () => {
    const doc = { id: 1, name: 'Document 1', open_id: 101 };
    
    component.editDocument(doc);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/update', 101]);
  });

  it('should show alert when editDocument is called with invalid open_id', () => {
    const doc = { id: 1, name: 'Document 1', open_id: null };
    spyOn(window, 'alert');
    
    component.editDocument(doc);
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Este documento não possui um open_id válido para edição.');
  });

  it('should navigate to view document when viewDocument is called with valid open_id', () => {
    const doc = { id: 1, name: 'Document 1', open_id: 101 };
    
    component.viewDocument(doc);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/details', 101]);
  });

  it('should show alert when viewDocument is called with invalid open_id', () => {
    const doc = { id: 1, name: 'Document 1', open_id: null };
    spyOn(window, 'alert');
    
    component.viewDocument(doc);
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Este documento não possui um open_id válido para visualização.');
  });

  it('should delete document when deleteDocument is called with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockDocumentService.deleteDocumentByToken.and.returnValue(of({}));
    spyOn(component, 'loadDocuments');
    spyOn(window, 'alert');
    
    component.deleteDocument('token1');
    
    expect(mockDocumentService.deleteDocumentByToken).toHaveBeenCalledWith('token1');
    expect(component.loadDocuments).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Documento excluído com sucesso!');
  });

  it('should not delete document when confirmation is canceled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteDocument('token1');
    
    expect(mockDocumentService.deleteDocumentByToken).not.toHaveBeenCalled();
  });

  it('should handle 404 error when deleting document', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockDocumentService.deleteDocumentByToken.and.returnValue(
      throwError(() => ({ status: 404, message: 'Not found' }))
    );
    spyOn(component, 'loadDocuments');
    spyOn(window, 'alert');
    
    component.deleteDocument('token1');
    
    expect(component.loadDocuments).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Documento já foi excluído ou não existe na ZapSign API. A lista foi atualizada.'
    );
  });

  it('should handle other errors when deleting document', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockDocumentService.deleteDocumentByToken.and.returnValue(
      throwError(() => ({ status: 500, error: { message: 'Server error' } }))
    );
    spyOn(component, 'loadDocuments');
    spyOn(window, 'alert');
    
    component.deleteDocument('token1');
    
    expect(component.loadDocuments).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Erro ao excluir o documento: {"message":"Server error"}'
    );
  });

  it('should navigate to create document page', () => {
    component.navigateToCreate();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/create']);
  });
});
