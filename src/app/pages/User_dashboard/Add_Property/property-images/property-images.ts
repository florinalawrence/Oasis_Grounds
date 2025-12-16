import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-property-images',
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
    private spinner: NgxSpinnerService
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
    this.featureImgUpload.append('propertyId', this.propertyId);
    this.spinner.show();
    this.service.saveFeatureImageGallery(this.featureImgUpload).subscribe({
      next: res => {
        if (res.status === 200) {
          this.swalToast.showToast('Featured Image saved successfully', 'success');
        } else {
          this.swalToast.showToast('Error saving image', 'error');
        }
        this.spinner.hide();
      },
      error: err => {
        this.swalToast.showToast('Error uploading image', 'error');
        this.spinner.hide();
      }
    });
  }

  // Handling List of Images Upload
 onSelectListOfImages(event: any): void {
  const files = Array.from(event.target.files) as File[]; // Type-cast to File[]
  files.forEach((file, index) => {
    const fileSize = file.size / 1024 / 1024; // MB
    if (file.type.includes('image') && fileSize < 2) {
      this.listOfImgUpload.append(`listOfImage[${index}]`, file); // Append file
    } else {
      this.swalToast.showToast('File size must be less than 2 MB and image format should be valid', 'warning');
    }
  });
  this.saveListOfImages();
  event.target.value = ''; // Reset input
}

  // Save List of Images
  saveListOfImages() {
    this.listOfImgUpload.append('propertyId', this.propertyId);
    this.spinner.show();
    this.service.saveListOfImageGallery(this.listOfImgUpload).subscribe({
      next: res => {
        if (res.status === 200) {
          this.swalToast.showToast('Images saved successfully', 'success');
          this.listOfImagePath = res.body?.listOfImage || [];
        } else {
          this.swalToast.showToast('Error saving images', 'error');
        }
        this.spinner.hide();
      },
      error: err => {
        this.swalToast.showToast('Error uploading images', 'error');
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
        this.service.deleteFeatureImage({ propertyId: this.propertyId, filePath: url }).subscribe({
          next: res => {
            this.swalToast.showToast('Image deleted successfully', 'success');
            this.featureImgUrl = '';
            this.promptFromChild.emit();
            this.mapIntoFormData();
          },
          error: err => {
            this.swalToast.showToast('Error deleting image', 'error');
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
        this.service.deleteListOfImage({ propertyId: this.propertyId, filePath: url }).subscribe({
          next: res => {
            this.swalToast.showToast('Image deleted successfully', 'success');
            this.listOfImagePath = this.listOfImagePath.filter(image => image !== url);
          },
          error: err => {
            this.swalToast.showToast('Error deleting image', 'error');
          }
        });
      }
    });
  }
}
