# Modern Confirmation Dialog Service

A modern, beautiful confirmation dialog service to replace old SweetAlert implementations.

## Features

✅ **Modern Design** - Beautiful, card-based UI with smooth animations
✅ **Custom Icons** - Clean SVG icons instead of default SweetAlert icons
✅ **Responsive** - Works perfectly on mobile and desktop
✅ **Type-specific** - Different styles for delete, warning, info, and success
✅ **Accessible** - Keyboard navigation and screen reader friendly
✅ **Customizable** - Easy to customize colors, text, and behavior

## Usage

### 1. Import the Service

```typescript
import { ConfirmationDialogService } from '../../../../services/Confirmation-service/confirmation-dialog.service';

constructor(
  private confirmationDialog: ConfirmationDialogService
) {}
```

### 2. Basic Usage Examples

#### Delete Confirmation
```typescript
async deleteItem() {
  const confirmed = await this.confirmationDialog.confirmDelete('property');
  
  if (confirmed) {
    // Proceed with deletion
    this.service.deleteProperty(id).subscribe({
      next: () => this.swalToast.showToast('Property deleted successfully', 'success'),
      error: () => this.swalToast.showToast('Error deleting property', 'error')
    });
  }
}
```

#### Remove Confirmation
```typescript
async removeFromWishlist() {
  const confirmed = await this.confirmationDialog.confirmRemove('property from wishlist');
  
  if (confirmed) {
    // Proceed with removal
    this.removeFromWishlist();
  }
}
```

#### Publish Confirmation
```typescript
async publishProperty() {
  const confirmed = await this.confirmationDialog.confirmPublish();
  
  if (confirmed) {
    // Proceed with publishing
    this.publishToSite();
  }
}
```

#### Custom Confirmation
```typescript
async customAction() {
  const confirmed = await this.confirmationDialog.confirm({
    title: 'Custom Action',
    message: 'Are you sure you want to perform this action?<br><small class="text-muted">This will affect your settings.</small>',
    confirmText: 'Yes, Continue',
    cancelText: 'Cancel',
    type: 'warning'
  });
  
  if (confirmed) {
    // Proceed with action
  }
}
```

## Migration from Old SweetAlert

### Before (Old Way)
```typescript
deleteProperty(item: any) {
  Swal.fire({
    title: 'Are you sure want to remove this property?',
    text: 'You will not be able to recover this!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'No, keep it',
    showCloseButton: false
  }).then((result) => {
    if (result.isConfirmed) {
      // Delete logic here
    }
  });
}
```

### After (Modern Way)
```typescript
async deleteProperty(item: any) {
  const confirmed = await this.confirmationDialog.confirmDelete('property');
  
  if (confirmed) {
    // Delete logic here
  }
}
```

## Available Methods

- `confirmDelete(itemName)` - For delete operations
- `confirmRemove(itemName)` - For remove operations  
- `confirmPublish()` - For publish operations
- `confirm(config)` - For custom confirmations

## Styling

The service includes modern CSS with:
- **Custom SVG Icons** - Clean, modern icons for each dialog type
- **Smooth animations** - Icon pulse effects and slide-in transitions
- **Beautiful gradients** - Modern button and background styling
- **Responsive design** - Optimized for all screen sizes
- **Accessible colors** - High contrast, screen reader friendly
- **Modern buttons** - Gradient backgrounds with hover effects

### Icon Types:
- 🗑️ **Delete** - Trash can icon with red styling
- ⚠️ **Warning** - Triangle warning icon with orange styling  
- ℹ️ **Info** - Circle info icon with blue styling
- ✅ **Success** - Checkmark icon with green styling

All styles are automatically included when you import the service.