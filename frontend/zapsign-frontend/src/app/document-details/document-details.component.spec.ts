import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DocumentDetailsComponent } from './document-details.component';
import { DocumentService } from '../document.service';
import { CommonModule } from '@angular/common';

describe('DocumentDetailsComponent', () => {
  let component: DocumentDetailsComponent;
  let fixture: ComponentFixture<DocumentDetailsComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockDocument = {
    id: 1,
    open_id: 123,
    token: 'abc-123',
    name: 'Test Document',
    status: 'pending',
    created_at: '2023-01-01T00:00:00Z',
    signers: [
      {
        name: 'John Doe',
        email: 'john@example.com'
      }
    ]
  };

  beforeEach(async () => {
    mockDocumentService = jasmine.createSpyObj('DocumentService', ['getDocumentByOpenId']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    // Create mock ActivatedRoute with a params Observable
    mockActivatedRoute = {
      params: of({ id: '123' })
    };

    // Configure mock service response
    mockDocumentService.getDocumentByOpenId.and.returnValue(of(mockDocument));

    await TestBed.configureTestingModule({
      imports: [CommonModule, DocumentDetailsComponent],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This will call ngOnInit()
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load document details on initialization', () => {
    expect(mockDocumentService.getDocumentByOpenId).toHaveBeenCalledWith(123);
    expect(component.document).toEqual(mockDocument);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should handle error when loading document details fails', () => {
    mockDocumentService.getDocumentByOpenId.and.returnValue(throwError(() => new Error('API Error')));
    
    // Create component again to trigger ngOnInit
    fixture = TestBed.createComponent(DocumentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('API Error');
  });

  it('should navigate to edit document when editDocument is called with valid open_id', () => {
    component.document = { open_id: 123 };
    
    component.editDocument();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/update', 123]);
  });

  it('should show alert when editDocument is called with invalid open_id', () => {
    component.document = { id: 1 }; // No open_id
    spyOn(window, 'alert');
    
    component.editDocument();
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Este documento não possui um open_id válido para edição.');
  });

  it('should navigate to documents list', () => {
    component.navigateToDocuments();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
  });
});