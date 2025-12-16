// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-document-attachment',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './document-attachment.html',
//   styleUrl: './document-attachment.scss',
// })
// export class DocumentAttachment {

// }


import { Component, EventEmitter, Input, OnInit, AfterViewInit, OnDestroy, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
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
export class DocumentAttachmentComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() selectedPropertyData: any;
  @Output() promptFromChild: any = new EventEmitter<void>();
  
  private dataSubscription: Subscription = new Subscription();
  otherAttachmentList: any[] = [];
  selectedAttachments: File[] = [];
  docType: any = '';
  documentUpload: FormData = new FormData();
  propertyId: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: ManagePropertyService,
    private swalToast: ToastService,
    private spinner: NgxSpinnerService,
    private notifier: NotifierService,
  ) {}

  ngOnInit(): void {
    this.otherAttachmentList = [];
    this.propertyId = this.selectedPropertyData?.id;
    this.propertyId ? this.propertyId : this.getNotifyData();
    this.mapintoFormData();
  }

  ngAfterViewInit(): void {
    this.mapintoFormData();
  }

  mapintoFormData() {
    if (
      this.selectedPropertyData !== undefined && 
      this.selectedPropertyData?.documentFileUploads !== undefined && 
      this.selectedPropertyData?.documentFileUploads.length > 0
    ) {
      this.otherAttachmentList = this.selectedPropertyData?.documentFileUploads;
    } else {
      this.selectedAttachments = [];
    }
  }

  onSelectBrouchure(event: any) {
    this.selectedAttachments = Array.from(event.target.files);
    this.documentUpload = new FormData();
    
    for (let i = 0; i < this.selectedAttachments.length; i++) {
      const file = this.selectedAttachments[i];
      const fileSize = file.size / 1024 / 1024; // Convert to MB
      
      if (
        file.type === 'application/pdf' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg' ||
        file.type === 'image/jpe' ||
        file.type === 'image/jif' ||
        file.type === 'image/jfif' ||
        file.type === 'image/png' ||
        file.type === 'image/gif'
      ) {
        if (fileSize < 2) {
          this.documentUpload.append(`documentUploads[${i}]`, file);
        } else {
          this.swalToast.showToast('Image File Size Limit is 2 MB', 'info');
        }
      } else {
        this.swalToast.showToast(
          'Invalid File Format! Valid: pdf, jpeg, jpg, png, and gif',
          'warning'
        );
      }
    }
    
    this.appendDocumentUploadsData();
    event.target.value = '';
  }

  appendDocumentUploadsData() {
    if (this.documentUpload !== null && this.documentUpload !== undefined) {
      this.documentUpload.append('propertyId', this.propertyId);
      this.spinner.show();
      
      setTimeout(() => {
        this.service.saveDocument(this.documentUpload).subscribe({
          next: res => {
            if (res.headers.statusCode === 200) {
              this.swalToast.showToast(res.headers.message, 'success');
              this.spinner.hide();
              this.documentUpload = new FormData();
              this.promptFromChild.emit();
              
              setTimeout(() => {
                this.mapintoFormData();
              }, 500);
            } else {
              this.swalToast.showToast(res.headers.message, 'error');
              this.spinner.hide();
            }
          },
          error: (err) => {
            const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
            this.swalToast.showToast(
              errList ? errList : 'Error on Uploading Image! Please Try Another', 
              'error'
            );
            this.documentUpload = new FormData();
            this.spinner.hide();
          }
        });
      }, 1200);
    }
  }

  getNotifyData() {
    this.dataSubscription = this.notifier.propertyID$.subscribe((res) => {
      this.propertyId = res;
    });
  }

  deleteDocumentUpload(data: any) {
    Swal.fire({
      title: 'Are you sure want to remove this file?',
      text: 'You will not be able to recover this file!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteReq = {
          propertyId: this.propertyId,
          identifierId: data?.identifierId
        };
        
        this.spinner.show();
        
        this.service.deleteDocument(deleteReq).subscribe({
          next: (res: any) => {
            this.swalToast.showToast('Your file has been deleted.', 'success');
            this.promptFromChild.emit();
            
            setTimeout(() => {
              this.mapintoFormData();
              if (this.selectedPropertyData?.documentFileUploads.length === 0) {
                this.otherAttachmentList = [];
              }
            }, 500);
            
            this.spinner.hide();
          },
          error: (err: any) => {
            let error = err;
            error = error.replace(/[{}]/g, '');
            this.swalToast.showToast(error, 'error');
            this.spinner.hide();
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.swalToast.showToast('Your file is safe.', 'info');
        this.spinner.hide();
      }
    });
  }

  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }
}
