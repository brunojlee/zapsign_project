import { Routes } from '@angular/router';
import { DocumentCreateComponent } from './document-create/document-create.component';
import { DocumentDetailsComponent } from './document-details/document-details.component';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentUpdateComponent } from './document-update/document-update.component';

export const AppRoutes: Routes = [
  { path: '', redirectTo: '/documents', pathMatch: 'full' },
  { path: 'documents', component: DocumentListComponent },
  { path: 'create', component: DocumentCreateComponent },
  { path: 'update/:id', component: DocumentUpdateComponent },
  { path: 'details/:id', component: DocumentDetailsComponent },
];
