import os
import shutil
from PIL import Image

# Path configurations
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE_DIR, "images")
AVATARS_DIR = os.path.join(BASE_DIR, "uploads", "avatars")
JS_DIR = os.path.join(BASE_DIR, "js", "toeic")

def optimize_toeic_images():
    print("--- OPTIMIZING TOEIC IMAGES ---")
    toeic_pngs = []
    for root, _, files in os.walk(IMAGES_DIR):
        for file in files:
            if file.lower().endswith(".png"):
                full_path = os.path.join(root, file)
                if os.path.getsize(full_path) > 200 * 1024:  # > 200 KB
                    toeic_pngs.append(full_path)

    if not toeic_pngs:
        print("No large TOEIC PNG images found.")
        return

    # Option: Convert to WebP and update JS, or just compress PNG in-place
    print(f"Found {len(toeic_pngs)} large PNG images.")
    
    # We will compress them as WebP (best savings) AND update JS references
    js_files = [os.path.join(JS_DIR, f) for f in os.listdir(JS_DIR) if f.endswith(".js")]
    
    for png_path in toeic_pngs:
        old_size = os.path.getsize(png_path) / (1024 * 1024)
        webp_path = os.path.splitext(png_path)[0] + ".webp"
        
        try:
            with Image.open(png_path) as img:
                # Resize if width is larger than 1000px (TOEIC photos don't need to be huge)
                if img.width > 1000:
                    ratio = 1000 / float(img.width)
                    new_height = int(float(img.height) * float(ratio))
                    img = img.resize((1000, new_height), Image.Resampling.LANCZOS)
                
                # Convert system if transparent
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3])
                    img = background
                
                # Save as WebP
                img.save(webp_path, "WEBP", quality=80)
            
            new_size = os.path.getsize(webp_path) / (1024 * 1024)
            print(f"Compressed: {os.path.basename(png_path)} ({old_size:.2f}MB) -> WebP ({new_size:.2f}MB) | Saved: {((old_size-new_size)/old_size)*100:.1f}%")
            
            # Update references in JS files
            relative_old = png_path.replace(BASE_DIR + os.sep, "").replace("\\", "/")
            relative_new = webp_path.replace(BASE_DIR + os.sep, "").replace("\\", "/")
            
            for js_file in js_files:
                if os.path.exists(js_file):
                    with open(js_file, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    if relative_old in content:
                        content = content.replace(relative_old, relative_new)
                        with open(js_file, "w", encoding="utf-8") as f:
                            f.write(content)
                        print(f"  Updated JS reference in: {os.path.basename(js_file)}")
            
            # Backup original PNG
            backup_path = png_path + ".bak"
            shutil.move(png_path, backup_path)
            print(f"  Backed up original to {os.path.basename(backup_path)}")
            
        except Exception as e:
            print(f"Error optimizing {os.path.basename(png_path)}: {e}")

def optimize_avatars():
    print("\n--- OPTIMIZING USER AVATARS IN-PLACE ---")
    if not os.path.exists(AVATARS_DIR):
        print("Avatars directory not found.")
        return
        
    avatar_files = []
    for f in os.listdir(AVATARS_DIR):
        if f.lower().endswith((".png", ".jpg", ".jpeg")):
            full_path = os.path.join(AVATARS_DIR, f)
            if os.path.getsize(full_path) > 100 * 1024:  # > 100 KB
                avatar_files.append(full_path)
                
    if not avatar_files:
        print("No large avatar images found.")
        return
        
    for path in avatar_files:
        old_size = os.path.getsize(path) / (1024 * 1024)
        ext = os.path.splitext(path)[1].lower()
        
        # We optimize in-place (keeping the exact same name and extension)
        # to avoid breaking MySQL database references
        temp_path = path + ".tmp"
        try:
            with Image.open(path) as img:
                # Resize avatar to max 200x200 pixels
                img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                
                # Save back to its original format
                if ext == ".png":
                    img.save(temp_path, "PNG", optimize=True)
                else:
                    img.save(temp_path, "JPEG", quality=80, optimize=True)
                    
            # Replace original with optimized version
            shutil.move(temp_path, path)
            new_size = os.path.getsize(path) / (1024 * 1024)
            print(f"Optimized Avatar: {os.path.basename(path)} ({old_size:.2f}MB -> {new_size:.2f}MB) | Saved: {((old_size-new_size)/old_size)*100:.1f}%")
        except Exception as e:
            print(f"Error optimizing avatar {os.path.basename(path)}: {e}")
            if os.path.exists(temp_path):
                os.remove(temp_path)

if __name__ == "__main__":
    optimize_toeic_images()
    optimize_avatars()
    print("\nAll tasks completed successfully!")
