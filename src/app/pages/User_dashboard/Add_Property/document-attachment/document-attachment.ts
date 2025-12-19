import { Component, EventEmitter, Input, OnInit, Output, inject, signal, computed, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-document-attachment',
  templateUrl: './document-attachment.html',
  styleUrls: ['./document-attachment.scss'],
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, MatTooltipModule]
})
export class DocumentAttachmentComponent implements OnInit {
  @Input() selectedPropertyData: any;
  @Output() promptFromChild = new EventEmitter<void>();
  
  // Dependency injection using Angular 20 inject function
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ManagePropertyService);
  private readonly swalToast = inject(ToastService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly notifier = inject(NotifierService);
  private readonly destroyRef = inject(DestroyRef);

  // Reactive signals for state management
  readonly otherAttachmentList = signal<any[]>([]);
  readonly selectedAttachments = signal<File[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly propertyId = signal<string>('');
  
  // Computed properties
  readonly hasAttachments = computed(() => this.otherAttachmentList().length > 0);
  readonly allowedFileTypes = signal<string[]>([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/jpe',
    'image/jif',
    'image/jfif',
    'image/png',
    'image/gif'
  ]);
  readonly maxFileSize = signal<number>(2); // MB

  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Initialize component state
   */
  private initializeComponent(): void {
    this.otherAttachmentList.set([]);
    const propId = this.selectedPropertyData?.id;
    
    if (propId) {
      this.propertyId.set(propId);
    } else {
      this.subscribeToPropertyId();
    }
    
    this.mapAttachmentsToState();
  }

  /**
   * Subscribe to property ID changes from notifier service
   */
  private subscribeToPropertyId(): void {
    this.notifier.propertyID$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: string) => {
        if (id) {
          this.propertyId.set(id);
        }
      });
  }

  /**
   * Map property data attachments to component state
   */
  private mapAttachmentsToState(): void {
    const attachments = this.selectedPropertyData?.documentFileUploads;
    
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      this.otherAttachmentList.set(attachments);
    } else {
      this.otherAttachmentList.set([]);
      this.selectedAttachments.set([]);
    }
  }

  /**
   * Handle file selection for document upload
   */
  onSelectBrouchure(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    this.selectedAttachments.set(fileArray);
    
    const formData = new FormData();
    let validFilesCount = 0;
    
    fileArray.forEach((file) => {
      const fileSize = file.size / 1024 / 1024; // Convert to MB
      
      if (this.isValidFileType(file.type)) {
        if (fileSize <= this.maxFileSize()) {
          formData.append('documentUploads', file);
          validFilesCount++;
        } else {
          this.swalToast.showToast(`File "${file.name}" exceeds ${this.maxFileSize()}MB limit`, 'warning');
        }
      } else {
        this.swalToast.showToast(
          `Invalid file format for "${file.name}". Valid formats: PDF, JPEG, JPG, PNG, GIF`,
          'warning'
        );
      }
    });
    
    // Only proceed if we have valid files
    if (validFilesCount > 0) {
      this.uploadDocuments(formData);
    }
    
    // Clear the input
    target.value = '';
  }

  /**
   * Check if file type is valid
   */
  private isValidFileType(fileType: string): boolean {
    return this.allowedFileTypes().includes(fileType);
  }

  /**
   * Upload documents to server
   */
  private uploadDocuments(formData: FormData): void {
    const propId = this.propertyId();
    if (!propId) {
      this.swalToast.showToast('Property ID is required for upload', 'error');
      return;
    }

    formData.append('propertyId', propId);
    this.isLoading.set(true);
    this.spinner.show();
    
    this.service.saveDocument(formData).subscribe({
      next: (res: any) => {
        this.handleUploadSuccess(res);
      },
      error: (err) => {
        this.handleUploadError(err);
      }
    });
  }

  /**
   * Handle successful upload response
   */
  private handleUploadSuccess(res: any): void {
    this.isLoading.set(false);
    this.spinner.hide();
    
    if (res.headers.statusCode === "200") {
      this.swalToast.showToast(res.headers.message || 'Documents uploaded successfully', 'success');
      this.promptFromChild.emit();
      
      // Refresh attachment list
      setTimeout(() => {
        this.mapAttachmentsToState();
      }, 500);
    } else {
      this.swalToast.showToast(res.headers.message || 'Upload failed', 'error');
    }
  }

  /**
   * Handle upload error
   */
  private handleUploadError(err: any): void {
    this.isLoading.set(false);
    this.spinner.hide();
    
    console.error('Upload error:', err);
    
    let errorMessage = 'Error uploading files. Please try again.';
    if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    this.swalToast.showToast(errorMessage, 'error');
  }

  /**
   * Delete a document attachment
   */
  deleteDocumentUpload(data: any): void {
    Swal.fire({
      title: 'Are you sure you want to remove this file?',
      text: 'You will not be able to recover this file!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performDelete(data);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.swalToast.showToast('Your file is safe', 'info');
      }
    });
  }

  /**
   * Perform the actual delete operation
   */
  private performDelete(data: any): void {
    const deleteReq = {
      propertyId: this.propertyId(),
      identifierId: data?.identifierId
    };
    
    this.isLoading.set(true);
    this.spinner.show();
    
    this.service.deleteDocument(deleteReq).subscribe({
      next: (res: any) => {
        this.handleDeleteSuccess();
      },
      error: (err: any) => {
        this.handleDeleteError(err);
      }
    });
  }

  /**
   * Handle successful delete response
   */
  private handleDeleteSuccess(): void {
    this.isLoading.set(false);
    this.spinner.hide();
    
    this.swalToast.showToast('Your file has been deleted', 'success');
    this.promptFromChild.emit();
    
    // Refresh attachment list
    setTimeout(() => {
      this.mapAttachmentsToState();
      
      // Clear list if no attachments remain
      if (!this.selectedPropertyData?.documentFileUploads?.length) {
        this.otherAttachmentList.set([]);
      }
    }, 500);
  }

  /**
   * Handle delete error
   */
  private handleDeleteError(err: any): void {
    this.isLoading.set(false);
    this.spinner.hide();
    
    console.error('Delete error:', err);
    
    let errorMessage = 'Error deleting file';
    if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    this.swalToast.showToast(errorMessage, 'error');
  }

  /**
   * Get file type for display
   */
  getFileType(documentType: string): string {
    return documentType?.toLowerCase() || '';
  }

  /**
   * Check if file is PDF
   */
  isPdfFile(documentType: string): boolean {
    return this.getFileType(documentType) === 'pdf';
  }
}
