import os
import mimetypes
from supabase import create_client, Client

# Load env vars
from dotenv import load_dotenv
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

FILES = [
    "software_engineer_mid.pdf",
    "data_scientist_senior.pdf",
    "product_manager_mid.pdf",
    "designer_ux_mid.pdf"
]

PREVIEWS_DIR = "previews"

def upload_files():
    print(f"🚀 Connecting to Supabase at {url}...")
    
    # Ensure bucket exists
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        if "templates" not in bucket_names:
            print("📦 Creating 'templates' bucket...")
            supabase.storage.create_bucket("templates", options={"public": True})
    except Exception as e:
        print(f"⚠️  Bucket check warning: {e}")

    for filename in FILES:
        file_path = os.path.join(PREVIEWS_DIR, filename)
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            continue

        print(f"Cc Uploading {filename}...")
        try:
            with open(file_path, 'rb') as f:
                supabase.storage.from_("templates").upload(
                    path=filename,
                    file=f,
                    file_options={"content-type": "application/pdf", "upsert": "true"}
                )
            print(f"✅ Uploaded: {filename}")
        except Exception as e:
            print(f"❌ Failed to upload {filename}: {e}")

if __name__ == "__main__":
    upload_files()
