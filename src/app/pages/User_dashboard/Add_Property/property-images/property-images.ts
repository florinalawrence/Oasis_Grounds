import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationDialogService } from '../../../../services/Confirmation-service/confirmation-dialog.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-property-images',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-images.html',
  styleUrls: ['./property-images.scss']
})
export class PropertyImages implements OnInit, OnDestroy {
  @Input() selectedPropertyData: any;
  @Output() promptFromChild: EventEmitter<void> = new EventEmitter();
  
  private dataSubscription: Subscription = new Subscription();
  featureImgUrl: string = '';
  listOfImagePath: string[] = [];
  selectedFeaturedImg: File | null = null;
  selectedListOfImgFiles: File[] = [];
  featureImgUpload: FormData = new FormData();
  listOfImgUpload: FormData = new FormData();
  propertyId: any;

  constructor(
    private service: ManagePropertyService,
    private swalToast: ToastService,
    private spinner: NgxSpinnerService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.selectedPropertyData?.id;
    if (this.propertyId) {
      this.mapIntoFormData();
    }
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
  }

  // Mapping initial data
  mapIntoFormData() {
    if (this.selectedPropertyData?.featuredImage) {
      this.featureImgUrl = this.selectedPropertyData.featuredImage;
    }
    if (this.selectedPropertyData?.listOfImage?.length > 0) {
      this.listOfImagePath = this.selectedPropertyData.listOfImage;
    }
  }

  // Handling Featured Image Upload
 onSelectFeaturedImage(event: any): void {
  const file = event.target.files[0] as File; // Type-cast to File
  if (file) {
    const fileSize = file.size / 1024 / 1024; // MB
    if (file.type.includes('image') && fileSize < 2) {
      // Clear previous FormData and create new one
      this.featureImgUpload = new FormData();
      this.featureImgUpload.append('featuredImage', file);
      this.featureImgUrl = URL.createObjectURL(file);
      event.target.value = ''; // Reset input
      this.saveFeaturedImage();
    } else {
      this.swalToast.showToast('File size must be less than 2 MB and image format should be valid', 'warning');
    }
  }
}

  // Save Featured Image
  saveFeaturedImage() {
    if (!this.propertyId) {
      this.swalToast.showToast('Property ID is required', 'error');
      return;
    }
    
    this.featureImgUpload.append('propertyId', this.propertyId);
    this.spinner.show();
    
    console.log(' Uploading featured image for property:', this.propertyId);
    
    this.service.saveFeatureImageGallery(this.featureImgUpload).subscribe({
      next: res => {
        console.log(' Featured image upload response:', res);
        if (res.status === 200 || res.success) {
          this.swalToast.showToast('Featured Image saved successfully', 'success');
          // Update the featured image URL from response if available
          if (res.body?.featuredImage || res.data?.featuredImage) {
            this.featureImgUrl = res.body?.featuredImage || res.data?.featuredImage;
          }
        } else {
          this.swalToast.showToast('Error saving image', 'error');
        }
        this.spinner.hide();
      },
      error: err => {
        console.error(' Featured image upload error:', err);
        this.swalToast.showToast('Error uploading image: ' + (err.message || 'Unknown error'), 'error');
        this.spinner.hide();
      }
    });
  }

  // Handling List of Images Upload
 onSelectListOfImages(event: any): void {
  const files = Array.from(event.target.files) as File[]; // Type-cast to File[]
  
  if (files.length === 0) {
    return;
  }
  
  // Clear previous FormData and create new one
  this.listOfImgUpload = new FormData();
  let validFiles = 0;
  
  files.forEach((file, index) => {
    const fileSize = file.size / 1024 / 1024; // MB
    if (file.type.includes('image') && fileSize < 2) {
      this.listOfImgUpload.append(`listOfImage`, file); // Use consistent naming
      validFiles++;
    } else {
      this.swalToast.showToast(`File "${file.name}" size must be less than 2 MB and image format should be valid`, 'warning');
    }
  });
  
  if (validFiles > 0) {
    this.saveListOfImages();
  }
  event.target.value = ''; // Reset input
}

  // Save List of Images
  saveListOfImages() {
    if (!this.propertyId) {
      this.swalToast.showToast('Property ID is required', 'error');
      return;
    }
    
    this.listOfImgUpload.append('propertyId', this.propertyId);
    this.spinner.show();
    
    console.log('📸 Uploading gallery images for property:', this.propertyId);
    
    this.service.saveListOfImageGallery(this.listOfImgUpload).subscribe({
      next: res => {
        console.log('Gallery images upload response:', res);
        if (res.status === 200 || res.success) {
          this.swalToast.showToast('Images saved successfully', 'success');
          // Update the image list from response
          if (res.body?.listOfImage) {
            this.listOfImagePath = res.body.listOfImage;
          } else if (res.data?.listOfImage) {
            this.listOfImagePath = res.data.listOfImage;
          }
          // Refresh the property data to get updated image list
          this.promptFromChild.emit();
        } else {
          this.swalToast.showToast('Error saving images', 'error');
        }
        this.spinner.hide();
      },
      error: err => {
        console.error(' Gallery images upload error:', err);
        this.swalToast.showToast('Error uploading images: ' + (err.message || 'Unknown error'), 'error');
        this.spinner.hide();
      }
    });
  }

  // Delete Feature Image
  deleteFeatureImage(url: string) {
    Swal.fire({
      title: 'Are you sure you want to remove this image?',
      text: 'You won’t be able to recover this image!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(result => {
      if (result.isConfirmed) {
        if (!this.propertyId) {
          this.swalToast.showToast('Property ID is required', 'error');
          return;
        }
        
        this.spinner.show();
        console.log('🗑️ Deleting featured image:', { propertyId: this.propertyId, filePath: url });
        
        this.service.deleteFeatureImage({ propertyId: this.propertyId, filePath: url }).subscribe({
          next: res => {
            console.log('Featured image delete response:', res);
            this.swalToast.showToast('Image deleted successfully', 'success');
            this.featureImgUrl = '';
            this.promptFromChild.emit();
            this.spinner.hide();
          },
          error: err => {
            console.error(' Featured image delete error:', err);
            this.swalToast.showToast('Error deleting image: ' + (err.message || 'Unknown error'), 'error');
            this.spinner.hide();
          }
        });
      }
    });
  }

  // Delete List of Image
  deleteListOfImage(url: string) {
    Swal.fire({
      title: 'Are you sure you want to remove this image?',
      text: 'You won’t be able to recover this image!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then(result => {
      if (result.isConfirmed) {
        if (!this.propertyId) {
          this.swalToast.showToast('Property ID is required', 'error');
          return;
        }
        
        this.spinner.show();
        console.log('🗑️ Deleting gallery image:', { propertyId: this.propertyId, filePath: url });
        
        this.service.deleteListOfImage({ propertyId: this.propertyId, filePath: url }).subscribe({
          next: res => {
            console.log(' Gallery image delete response:', res);
            this.swalToast.showToast('Image deleted successfully', 'success');
            this.listOfImagePath = this.listOfImagePath.filter(image => image !== url);
            this.spinner.hide();
          },
          error: err => {
            console.error(' Gallery image delete error:', err);
            this.swalToast.showToast('Error deleting image: ' + (err.message || 'Unknown error'), 'error');
            this.spinner.hide();
          }
        });
      }
    });
  }

  // View Image in Fullscreen
  viewImageFullscreen(imageUrl: string) {
    if (imageUrl) {
      Swal.fire({
        imageUrl: imageUrl,
        imageAlt: 'Property Image',
        showConfirmButton: false,
        showCloseButton: true,
        imageWidth: '90%',
        imageHeight: 'auto',
        customClass: {
          popup: 'image-popup'
        },
        background: 'rgba(0, 0, 0, 0.9)',
        backdrop: 'rgba(0, 0, 0, 0.8)'
      });
    }
  }
}
