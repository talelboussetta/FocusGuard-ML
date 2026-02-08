from PIL import Image
import os

# Path to the garden images
image_dir = r"client\focusguard-dashboard\src\assets\images\garden_images"
images = [
    "GST DACAR 121-02.jpg",
    "GST DACAR 121-03.jpg",
    "GST DACAR 121-04.jpg",
    "GST DACAR 121-05.jpg"
]

def remove_white_background(image_path, output_path, threshold=240):
    """
    Remove white background from an image and save as PNG with transparency.
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the output PNG
        threshold: Brightness threshold for white (0-255, default 240)
    """
    # Open the image
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    # Get pixel data
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # If pixel is close to white (all RGB values above threshold), make it transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)
    
    # Update image data
    img.putdata(new_data)
    
    # Save as PNG
    img.save(output_path, "PNG")
    print(f"Processed: {os.path.basename(image_path)} -> {os.path.basename(output_path)}")

# Process all images
for image_name in images:
    input_path = os.path.join(image_dir, image_name)
    output_name = image_name.replace('.jpg', '.png')
    output_path = os.path.join(image_dir, output_name)
    
    if os.path.exists(input_path):
        remove_white_background(input_path, output_path, threshold=240)
    else:
        print(f"Image not found: {input_path}")

print("\nAll images processed! White backgrounds removed and saved as PNG files.")
