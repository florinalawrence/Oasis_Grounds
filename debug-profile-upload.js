// Debug script to test different FormData configurations for profile picture upload
// This can be run in browser console to test the API directly

async function testProfilePictureUpload() {
    console.log('🧪 Testing Profile Picture Upload API...');
    
    // Get the auth token from localStorage
    const token = localStorage.getItem('AccessToken');
    if (!token) {
        console.error('❌ No auth token found');
        return;
    }
    
    // Create a test file input to get a file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('📁 Selected file:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Test different FormData configurations
        const testConfigs = [
            { fieldName: 'file', includeUserId: false },
            { fieldName: 'profilePicture', includeUserId: false },
            { fieldName: 'image', includeUserId: false },
            { fieldName: 'avatar', includeUserId: false },
            { fieldName: 'file', includeUserId: true },
            { fieldName: 'profilePicture', includeUserId: true },
        ];
        
        for (const config of testConfigs) {
            console.log(`\n🧪 Testing config:`, config);
            
            const formData = new FormData();
            formData.append(config.fieldName, file);
            
            if (config.includeUserId) {
                // Try to get userId from somewhere
                const userId = 'test-user-id'; // Replace with actual userId
                formData.append('userId', userId);
            }
            
            try {
                const response = await fetch('https://jmrpropertiesapi.techneatsolutions.com/jmr-properties-api/v1/profile/upload/profilepicture', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    console.log('✅ SUCCESS with config:', config);
                    console.log('📥 Response:', result);
                    break;
                } else {
                    console.log('❌ FAILED with config:', config);
                    console.log('📥 Error response:', result);
                }
            } catch (error) {
                console.log('❌ NETWORK ERROR with config:', config);
                console.log('📥 Error:', error);
            }
            
            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    };
    
    // Trigger file selection
    input.click();
}

// Usage: Run testProfilePictureUpload() in browser console
console.log('🔧 Debug script loaded. Run testProfilePictureUpload() to test the API.');