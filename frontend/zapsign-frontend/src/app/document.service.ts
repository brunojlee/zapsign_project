import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiUrl = 'http://127.0.0.1:8000/api/documents/';

  constructor(private http: HttpClient) {}

  getZapsignDocs(): Observable<any> {
    return this.http.get('http://127.0.0.1:8000/api/documents/zapsign-docs/');
  }

  getDocument(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}${id}/`);
  }

  getDocumentByToken(token: string): Observable<any> {
    // Add a method to get document by token
    return this.http.get(`${this.apiUrl}by-token/${token}/`);
  }

  createDocument(document: any): Observable<any> {
    return this.http.post(this.apiUrl, document);
  }

  updateDocument(id: number, document: any): Observable<any> {
    // Create a new object without fields that should not be updated
    const {
      token,
      open_id,
      original_file,
      signed_file,
      signers,
      created_at,
      last_update_at,
      ...updatableDocument
    } = document;

    if (
      typeof updatableDocument.created_by === 'object' &&
      updatableDocument.created_by !== null
    ) {
      if (updatableDocument.created_by.email) {
        updatableDocument.created_by = updatableDocument.created_by.email;
      } else {
        updatableDocument.created_by = JSON.stringify(
          updatableDocument.created_by
        );
      }
    }

    // Send only the updatable fields
    return this.http.put(`${this.apiUrl}${id}/`, updatableDocument);
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

  deleteDocumentByToken(token: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}delete-by-token/${token}/`);
  }

  getDocumentByOpenId(openId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}by-open-id/${openId}/`);
  }
}
