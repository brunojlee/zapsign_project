import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://127.0.0.1:8000/api/documents/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentService]
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get documents from ZapSign API', () => {
    const mockResponse = {
      results: [
        { id: 1, name: 'Document 1' },
        { id: 2, name: 'Document 2' }
      ]
    };

    service.getZapsignDocs().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.results.length).toBe(2);
    });

    const req = httpMock.expectOne('http://127.0.0.1:8000/api/documents/zapsign-docs/');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get document by ID', () => {
    const mockDocument = { id: 1, name: 'Test Document' };
    const id = 1;

    service.getDocument(id).subscribe(document => {
      expect(document).toEqual(mockDocument);
    });

    const req = httpMock.expectOne(`${apiUrl}${id}/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDocument);
  });

  it('should get document by token', () => {
    const mockDocument = { id: 1, token: 'abc123', name: 'Test Document' };
    const token = 'abc123';

    service.getDocumentByToken(token).subscribe(document => {
      expect(document).toEqual(mockDocument);
    });

    const req = httpMock.expectOne(`${apiUrl}by-token/${token}/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDocument);
  });

  it('should get document by open_id', () => {
    const mockDocument = { id: 1, open_id: 123, name: 'Test Document' };
    const openId = 123;

    service.getDocumentByOpenId(openId).subscribe(document => {
      expect(document).toEqual(mockDocument);
    });

    const req = httpMock.expectOne(`${apiUrl}by-open-id/${openId}/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDocument);
  });

  it('should create a new document', () => {
    const newDocument = { name: 'New Document', content: 'Content' };
    const mockResponse = { id: 1, ...newDocument };

    service.createDocument(newDocument).subscribe(document => {
      expect(document).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newDocument);
    req.flush(mockResponse);
  });

  it('should update a document', () => {
    const id = 1;
    const documentToUpdate = { 
      id: 1, 
      name: 'Updated Document', 
      content: 'Updated Content',
      token: 'abc123',
      open_id: 123,
      created_by: { email: 'test@example.com' }
    };
    const mockResponse = { id: 1, name: 'Updated Document', content: 'Updated Content' };

    service.updateDocument(id, documentToUpdate).subscribe(document => {
      expect(document).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}${id}/`);
    expect(req.request.method).toBe('PUT');
    // Check that excluded fields are not sent in the request
    expect(req.request.body.token).toBeUndefined();
    expect(req.request.body.open_id).toBeUndefined();
    // Check that created_by was converted to string
    expect(req.request.body.created_by).toBe('test@example.com');
    
    req.flush(mockResponse);
  });

  it('should delete a document by ID', () => {
    const id = 1;

    service.deleteDocument(id).subscribe(response => {
      expect(response).toBeTruthy(); // Or whatever response you expect
    });

    const req = httpMock.expectOne(`${apiUrl}${id}/`);
    expect(req.request.method).toBe('DELETE');
    req.flush({}); // Empty response for successful deletion
  });

  it('should delete a document by token', () => {
    const token = 'abc123';

    service.deleteDocumentByToken(token).subscribe(response => {
      expect(response).toBeTruthy(); // Or whatever response you expect
    });

    const req = httpMock.expectOne(`${apiUrl}delete-by-token/${token}/`);
    expect(req.request.method).toBe('DELETE');
    req.flush({}); // Empty response for successful deletion
  });
});