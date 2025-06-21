#!/usr/bin/env python3
"""
Simple script to create basic icons for THE QUICKNESS extension
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a circular background
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill=(0, 124, 255, 255), outline=(0, 100, 200, 255), width=2)
    
    # Draw "TQ" text
    try:
        font_size = size // 3
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "TQ"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 2
    
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    return img

def main():
    # Create icons directory if it doesn't exist
    os.makedirs('/app/the-quickness-extension/icons', exist_ok=True)
    
    # Create icons in different sizes
    sizes = [16, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        icon.save(f'/app/the-quickness-extension/icons/icon{size}.png', 'PNG')
        print(f"Created icon{size}.png")

if __name__ == "__main__":
    main()