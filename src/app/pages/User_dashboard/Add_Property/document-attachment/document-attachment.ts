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
  
 
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ManagePropertyService);
  private readonly swalToast = inject(ToastService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly notifier = inject(NotifierService);
  private readonly destroyRef = inject(DestroyRef);

  readonly otherAttachmentList = signal<any[]>([]);
  readonly selectedAttachments = signal<File[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly propertyId = signal<string>('');
  
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

 
  
  private subscribeToPropertyId(): void {
    this.notifier.propertyID$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: string) => {
        if (id) {
          this.propertyId.set(id);
        }
      });
  }


  
  private mapAttachmentsToState(): void {
    const attachments = this.selectedPropertyData?.documentFileUploads;
    
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      this.otherAttachmentList.set(attachments);
    } else {
      this.otherAttachmentList.set([]);
      this.selectedAttachments.set([]);
    }
  }


  
  onSelectBrouchure(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    this.processFilesWithCompression(fileArray);
    
    // Clear the input
    target.value = '';
  }

 
  
  private async processFilesWithCompression(files: File[]): Promise<void> {
    this.isLoading.set(true);
    this.spinner.show();
    
    const formData = new FormData();
    let validFilesCount = 0;
    let processedCount = 0;
    
    try {
      for (const file of files) {
        const fileSize = file.size / 1024 / 1024; 
        
        
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

        let processedFile = file;
        if (this.isImageFile(file.type) && fileSize > this.maxCompressedSize()) {
          
          try {
            processedFile = await this.compressImage(file);
            const compressedSize = processedFile.size / 1024 / 1024;
            
            this.swalToast.showToast(
              `Compressed "${file.name}" from ${fileSize.toFixed(1)}MB to ${compressedSize.toFixed(1)}MB`,
              'info'
            );
          } catch (error) {
            console.warn(`⚠️ Failed to compress ${file.name}, using original:`, error);
          }
        }

        formData.append(`documentUploads[${validFilesCount}]`, processedFile);
        validFilesCount++;
        processedCount++;
      }


      if (validFilesCount > 0) {
        this.appendDocumentUploadsData(formData);
      } else {
        this.isLoading.set(false);
        this.spinner.hide();
        this.swalToast.showToast('No valid files to upload', 'warning');
      }
      
    } catch (error) {

      this.isLoading.set(false);
      this.spinner.hide();
      this.swalToast.showToast('Error processing files. Please try again.', 'error');
    }
  }


  
  private isValidFileType(fileType: string): boolean {
    return this.allowedFileTypes().includes(fileType);
  }

  
  private isImageFile(fileType: string): boolean {
    return (
      fileType === 'image/jpeg' ||
      fileType === 'image/jpg' ||
      fileType === 'image/jpe' ||
      fileType === 'image/jif' ||
      fileType === 'image/jfif' ||
      fileType === 'image/png'

    );
  }


  
  private compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions to reduce file size
          const maxWidth = 1920; 
          
          const maxHeight = 1080; 
          
          
          let { width, height } = img;
          
          // Calculate scaling factor
          const scaleX = maxWidth / width;
          const scaleY = maxHeight / height;
          const scale = Math.min(scaleX, scaleY, 1); 
          
          
          const newWidth = Math.floor(width * scale);
          const newHeight = Math.floor(height * scale);
          

          canvas.width = newWidth;
          canvas.height = newHeight;
          

          if (ctx) {

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            

            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            

            const fileSizeMB = file.size / 1024 / 1024;
            let quality = this.imageQuality();
            

            if (fileSizeMB > 1.5) {
              quality = 0.6; 
              
            } else if (fileSizeMB > 1) {
              quality = 0.7; 
              
            }
            
           
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                
                  
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
              quality 
              
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

      
      
      img.src = URL.createObjectURL(file);
    });
  }

  
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

 
  
  private handleUploadResponse(res: any): void {
    if (res.headers.statusCode == 200) {
      this.swalToast.showToast(res.headers.message, 'success');
      this.isLoading.set(false);
      this.spinner.hide();
      
      
      
      if (res.data?.documentFileUploads) {
       
        
        
       
        
        if (!this.selectedPropertyData) {
          this.selectedPropertyData = {};
        }
        
        this.selectedPropertyData.documentFileUploads = res.data.documentFileUploads;
        this.mapAttachmentsToState();
      } else {
        this.refreshPropertyData();
      }
      
      this.promptFromChild.emit();
    } else {
      this.swalToast.showToast(res.headers.message, 'error');
      this.isLoading.set(false);
      this.spinner.hide();
    }
  }

 
  
  private handleUploadError(err: any): void {
    this.isLoading.set(false);
    this.spinner.hide();
    
   
    
    
    let errorMessage = 'Error uploading files. Please try again.';
    if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    this.swalToast.showToast(errorMessage, 'error');
  }

 
  
  private refreshPropertyData(): void {
    const propId = this.propertyId();
    if (!propId) {
      return;
    }


    
    this.service.getPropertyDetailById(propId).subscribe({
      next: (res: any) => {
        if (res.headers?.statusCode === "200" && res.data) {
          
        
          
          this.selectedPropertyData = res.data;
          
          
          
          this.mapAttachmentsToState();
          
        } else {
          
          
          setTimeout(() => {
            this.mapAttachmentsToState();
          }, 500);
        }
      },
      error: (err) => {
        
        
        setTimeout(() => {
          this.mapAttachmentsToState();
        }, 500);
      }
    });
  }


  
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

 
  
private handleDeleteSuccess(): void {
  this.isLoading.set(false);
  this.spinner.hide();
  
  this.swalToast.showToast('Your file has been deleted', 'success');
  
  
  
  this.promptFromChild.emit();
  
  
  
  setTimeout(() => {
    this.mapAttachmentsToState();
    
  
    
    if (!this.selectedPropertyData?.documentFileUploads?.length) {
      this.otherAttachmentList.set([]);
    }
  }, 500);
}

 

  private handleDeleteError(err: any): void {
    this.isLoading.set(false);
    this.spinner.hide();
    
  
    
    
    let errorMessage = 'Error deleting file';
    if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    this.swalToast.showToast(errorMessage, 'error');
  }


  
  getFileType(documentType: string): string {
    return documentType?.toLowerCase() || '';
  }

 
  
  isPdfFile(documentType: string): boolean {
    return this.getFileType(documentType) === 'pdf';
  }
}


