#!/usr/bin/env python3
"""
Create Chrome extension icons from THE QUICKNESS logo
Resize to 16x16, 48x48, and 128x128 pixels
"""

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

import os
import sys

def create_icons_with_pil():
    """Create icons using PIL (Pillow)"""
    try:
        # Load the original logo
        with Image.open('original-logo.png') as img:
            # Convert to RGBA if not already (for transparency support)
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Define the sizes needed for Chrome extension
            sizes = [16, 48, 128]
            
            for size in sizes:
                # Resize image maintaining aspect ratio
                resized = img.resize((size, size), Image.Resampling.LANCZOS)
                
                # Save to icons directory
                icon_path = f'icons/icon{size}.png'
                resized.save(icon_path, 'PNG')
                print(f"✅ Created {icon_path} ({size}x{size})")
            
            return True
            
    except Exception as e:
        print(f"❌ Error with PIL: {e}")
        return False

def create_icons_with_imagemagick():
    """Create icons using ImageMagick convert command"""
    try:
        sizes = [16, 48, 128]
        success = True
        
        for size in sizes:
            icon_path = f'icons/icon{size}.png'
            cmd = f'convert original-logo.png -resize {size}x{size} {icon_path}'
            result = os.system(cmd)
            
            if result == 0:
                print(f"✅ Created {icon_path} ({size}x{size})")
            else:
                print(f"❌ Failed to create {icon_path}")
                success = False
        
        return success
        
    except Exception as e:
        print(f"❌ Error with ImageMagick: {e}")
        return False

def main():
    print("🎨 THE QUICKNESS - Creating Chrome Extension Icons")
    print("=" * 50)
    
    # Check if original logo exists
    if not os.path.exists('original-logo.png'):
        print("❌ Error: original-logo.png not found!")
        return
    
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    # Try PIL first, then ImageMagick as fallback
    if PIL_AVAILABLE:
        print("📦 Using PIL (Pillow) for image processing...")
        if create_icons_with_pil():
            print("\n🎉 Successfully created all icon files using PIL!")
            return
        else:
            print("⚠️  PIL failed, trying ImageMagick...")
    
    print("📦 Using ImageMagick for image processing...")
    if create_icons_with_imagemagick():
        print("\n🎉 Successfully created all icon files using ImageMagick!")
    else:
        print("\n❌ Both PIL and ImageMagick failed.")
        print("💡 Please install either:")
        print("   - PIL: pip install Pillow")
        print("   - ImageMagick: apt-get install imagemagick")

if __name__ == "__main__":
    main()