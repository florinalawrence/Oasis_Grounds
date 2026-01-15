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
export class DocumentAttachment implements OnInit {
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
  readonly maxCompressedSize = signal<number>(1); // MB - target size after compression
  readonly imageQuality = signal<number>(0.8); // Image compression quality (0.1 to 1.0)

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
   * Handle file selection for document upload - enhanced with compression
   */
  onSelectBrouchure(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    this.processFilesWithCompression(fileArray);
    
    // Clear the input
    target.value = '';
  }

  /**
   * Process files with compression before upload
   */
  private async processFilesWithCompression(files: File[]): Promise<void> {
    this.isLoading.set(true);
    this.spinner.show();
    
    const formData = new FormData();
    let validFilesCount = 0;
    let processedCount = 0;
    
    try {
      for (const file of files) {
        const fileSize = file.size / 1024 / 1024; // Convert to MB
        
        if (!this.isValidFileType(file.type)) {
          this.swalToast.showToast(
            `Invalid file format for "${file.name}". Valid formats: PDF, JPEG, JPG, PNG, GIF`,
            'warning'
          );
          processedCount++;
          continue;
        }

        if (fileSize > this.maxFileSize()) {
          this.swalToast.showToast(
            `File "${file.name}" exceeds ${this.maxFileSize()}MB limit`,
            'warning'
          );
          processedCount++;
          continue;
        }

        // Compress file if it's an image and larger than target size
        let processedFile = file;
        if (this.isImageFile(file.type) && fileSize > this.maxCompressedSize()) {
          console.log(`🗜️ Compressing image: ${file.name} (${fileSize.toFixed(2)}MB)`);
          
          try {
            processedFile = await this.compressImage(file);
            const compressedSize = processedFile.size / 1024 / 1024;
            console.log(`✅ Compressed ${file.name}: ${fileSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB`);
            
            this.swalToast.showToast(
              `Compressed "${file.name}" from ${fileSize.toFixed(1)}MB to ${compressedSize.toFixed(1)}MB`,
              'info'
            );
          } catch (error) {
            console.warn(`⚠️ Failed to compress ${file.name}, using original:`, error);
            // Use original file if compression fails
          }
        }

        formData.append(`documentUploads[${validFilesCount}]`, processedFile);
        validFilesCount++;
        processedCount++;
      }

      // Upload if we have valid files
      if (validFilesCount > 0) {
        this.appendDocumentUploadsData(formData);
      } else {
        this.isLoading.set(false);
        this.spinner.hide();
        this.swalToast.showToast('No valid files to upload', 'warning');
      }
      
    } catch (error) {
      console.error('Error processing files:', error);
      this.isLoading.set(false);
      this.spinner.hide();
      this.swalToast.showToast('Error processing files. Please try again.', 'error');
    }
  }

  /**
   * Check if file type is valid
   */
  private isValidFileType(fileType: string): boolean {
    return this.allowedFileTypes().includes(fileType);
  }

  /**
   * Check if file is an image type that can be compressed
   */
  private isImageFile(fileType: string): boolean {
    return (
      fileType === 'image/jpeg' ||
      fileType === 'image/jpg' ||
      fileType === 'image/jpe' ||
      fileType === 'image/jif' ||
      fileType === 'image/jfif' ||
      fileType === 'image/png'
      // Note: GIF compression is more complex, so we skip it
    );
  }

  /**
   * Compress image file to reduce size
   */
  private compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions to reduce file size
          const maxWidth = 1920; // Max width for documents
          const maxHeight = 1080; // Max height for documents
          
          let { width, height } = img;
          
          // Calculate scaling factor
          const scaleX = maxWidth / width;
          const scaleY = maxHeight / height;
          const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
          
          const newWidth = Math.floor(width * scale);
          const newHeight = Math.floor(height * scale);
          
          // Set canvas dimensions
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Draw and compress image
          if (ctx) {
            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw the image
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            // Determine compression quality based on file size
            const fileSizeMB = file.size / 1024 / 1024;
            let quality = this.imageQuality();
            
            // More aggressive compression for larger files
            if (fileSizeMB > 1.5) {
              quality = 0.6; // Higher compression
            } else if (fileSizeMB > 1) {
              quality = 0.7; // Medium compression
            }
            
            // Convert to blob with compression
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  // Create new file with compressed data
                  const compressedFile = new File(
                    [blob],
                    file.name,
                    {
                      type: file.type,
                      lastModified: Date.now()
                    }
                  );
                  resolve(compressedFile);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              file.type,
              quality // Compression quality
            );
          } else {
            reject(new Error('Canvas context not available'));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload documents to server - enhanced to accept FormData parameter
   */
  private appendDocumentUploadsData(formData: FormData): void {
    const propId = this.propertyId();
    if (!propId) {
      this.swalToast.showToast('Property ID is required for upload', 'error');
      this.isLoading.set(false);
      this.spinner.hide();
      return;
    }

    if (formData !== null && formData !== undefined) {
      formData.append('propertyId', propId);
      
      // Only show spinner if not already loading
      if (!this.isLoading()) {
        this.isLoading.set(true);
        this.spinner.show();
      }
      
      setTimeout(() => {
        this.service.saveDocument(formData).subscribe({
          next: res => {
            this.handleUploadResponse(res);
          },
          error: (err) => {
            this.handleUploadError(err);
          }
        });
      }, 1200);
    }
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
        this.handleUploadResponse(res);
      },
      error: (err) => {
        this.handleUploadError(err);
      }
    });
  }

  /**
   * Handle upload response - enhanced to refresh property data from server
   */
  private handleUploadResponse(res: any): void {
    if (res.headers.statusCode == 200) {
      this.swalToast.showToast(res.headers.message, 'success');
      this.isLoading.set(false);
      this.spinner.hide();
      
      // Check if response contains updated document data
      if (res.data?.documentFileUploads) {
        console.log('✅ Upload response contains document data, updating immediately');
        
        // Ensure selectedPropertyData is initialized
        if (!this.selectedPropertyData) {
          this.selectedPropertyData = {};
        }
        
        this.selectedPropertyData.documentFileUploads = res.data.documentFileUploads;
        this.mapAttachmentsToState();
      } else {
        // Fetch fresh property data from server to update UI immediately
        this.refreshPropertyData();
      }
      
      this.promptFromChild.emit();
    } else {
      this.swalToast.showToast(res.headers.message, 'error');
      this.isLoading.set(false);
      this.spinner.hide();
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
   * Refresh property data from server to get updated document list
   */
  private refreshPropertyData(): void {
    const propId = this.propertyId();
    if (!propId) {
      console.warn('No property ID available for refresh');
      return;
    }

    console.log('🔄 Refreshing property data from server...');
    
    this.service.getPropertyDetailById(propId).subscribe({
      next: (res: any) => {
        if (res.headers?.statusCode === "200" && res.data) {
          console.log('✅ Property data refreshed successfully');
          
          // Update the selectedPropertyData with fresh data
          this.selectedPropertyData = res.data;
          
          // Update the attachment list with fresh data
          this.mapAttachmentsToState();
          
          console.log('📄 Updated document list:', this.otherAttachmentList());
        } else {
          console.warn('Failed to refresh property data:', res);
          // Fallback to old method if API fails
          setTimeout(() => {
            this.mapAttachmentsToState();
          }, 500);
        }
      },
      error: (err) => {
        console.error('Error refreshing property data:', err);
        // Fallback to old method if API fails
        setTimeout(() => {
          this.mapAttachmentsToState();
        }, 500);
      }
    });
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
    
    this.service.deleteDocumentUpload(deleteReq).subscribe({
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
 /**
 * Handle successful delete response
 */
private handleDeleteSuccess(): void {
  this.isLoading.set(false);
  this.spinner.hide();
  
  this.swalToast.showToast('Your file has been deleted', 'success');
  
  // Emit to parent - parent will refresh selectedPropertyData
  this.promptFromChild.emit();
  
  // Wait for parent to update selectedPropertyData, then refresh UI
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


