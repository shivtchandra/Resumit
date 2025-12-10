import os
import sys
import io
from pathlib import Path
import pandas as pd
from tqdm import tqdm
from datasets import load_from_disk

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.ingestion.pdf_parser import PDFParser
from app.services.features.extractor import FeatureExtractor

def extract_mode1_features():
    """Extract features from Kaggle Resume Dataset (PDFs)."""
    print("\n[Mode 1] Extracting features from resumes...")
    
    pdf_parser = PDFParser()
    feature_extractor = FeatureExtractor()
    
    # Find all resume files
    # 1. Kaggle Dataset
    kaggle_dir = Path("data/mode1/raw/data/data")
    kaggle_files = list(kaggle_dir.glob("**/*.pdf")) if kaggle_dir.exists() else []
    
    # 2. Innovatiana Dataset
    innovatiana_dir = Path("data/innovatiana/data/data")
    innovatiana_files = list(innovatiana_dir.glob("**/*.pdf")) if innovatiana_dir.exists() else []
    
    pdf_files = kaggle_files + innovatiana_files
    print(f"Found {len(pdf_files)} PDF resumes ({len(kaggle_files)} Kaggle, {len(innovatiana_files)} Innovatiana)")
    
    features_list = []
    
    # Process first 200 for speed (100 from each if possible)
    # For production, remove the slice [:200]
    files_to_process = pdf_files[:200]
    
    for pdf_path in tqdm(files_to_process, desc="Processing resumes"):
        try:
            with open(pdf_path, 'rb') as f:
                file_bytes = f.read()
            
            # Parse
            parsing_result = pdf_parser.parse(file_bytes)
            
            # Extract features
            features = feature_extractor.extract_features(parsing_result)
            
            # Add label (heuristic based on folder name)
            category = pdf_path.parent.name
            features['label'] = category
            features['filename'] = pdf_path.name
            
            features_list.append(features)
            
        except Exception as e:
            # print(f"  Error processing {pdf_path.name}: {e}")
            continue
            
    df = pd.DataFrame(features_list)
    
    # Save processed features
    output_dir = Path("data/mode1/processed")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "features.csv"
    df.to_csv(output_path, index=False)
    print(f"✓ Saved to {output_path}")
    
    # Print label distribution
    if len(df) > 0:
        print("\nLabel Distribution:")
        print(df['label'].value_counts().head())
    else:
        print("\n⚠ No resumes processed.")
    
    return df

def extract_layout_features():
    """
    Extract features from MikePfunk28/resume-training-dataset (Images/PDFs).
    Validates OCR and 'Scanned Resume' handling.
    """
    print("\n[Mode 1/2] Extracting features from Layout Dataset...")
    
    try:
        dataset = load_from_disk("data/layout_dataset")
    except Exception as e:
        print(f"⚠ Could not load layout dataset: {e}")
        return

    print(f"Found {len(dataset['train'])} layout examples")
    
    pdf_parser = PDFParser()
    feature_extractor = FeatureExtractor()
    
    results = []
    # Process first 50 examples for testing (OCR is slow)
    limit = 50
    print(f"Processing first {limit} examples (OCR is resource intensive)...")
    
    for i, example in enumerate(tqdm(dataset['train'], total=limit)):
        if i >= limit:
            break
            
        try:
            # Convert PIL Image to PDF bytes
            image = example['image']
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PDF')
            file_bytes = img_byte_arr.getvalue()
            
            # Parse (triggers OCR if needed)
            parsing_result = pdf_parser.parse(file_bytes)
            
            # Extract features
            features = feature_extractor.extract_features(parsing_result)
            
            results.append({
                'is_image_based': features.get('is_image_based', False),
                'text_len': len(parsing_result.get('raw_text', '')),
                'has_tables': features.get('has_tables', False),
                'has_multi_column': features.get('has_multi_column', False),
                'ocr_success': len(parsing_result.get('raw_text', '')) > 100
            })
            
        except Exception as e:
            print(f"Error processing example {i}: {e}")
            import traceback
            traceback.print_exc()
            continue
            
    # Statistics
    df = pd.DataFrame(results)
    if len(df) > 0:
        print("\nLayout Analysis Results (First 50):")
        print(f"  • Image-based PDFs detected: {df['is_image_based'].sum()} ({df['is_image_based'].mean()*100:.1f}%)")
        print(f"  • OCR Successful (>100 chars): {df['ocr_success'].sum()} ({df['ocr_success'].mean()*100:.1f}%)")
        print(f"  • Tables detected: {df['has_tables'].sum()}")
        print(f"  • Multi-column detected: {df['has_multi_column'].sum()}")
        print(f"  • Avg extracted text length: {df['text_len'].mean():.0f} chars")
    else:
        print("⚠ No results generated")

def main():
    print("=" * 60)
    print("ATS V2 Feature Extraction Script")
    print("=" * 60)
    
    # Extract Mode 1 features
    extract_mode1_features()
    
    # Skip Mode 2 for now
    print("\n[Mode 2] Skipping feature extraction")
    print("  ⚠ Dataset format mismatch: has 'text' field instead of separate 'resume_text' and 'job_description'")
    print("  → Using heuristic ranker (no training needed)")
    
    # Extract Layout Features (New Dataset)
    extract_layout_features()
    
    print("\n" + "=" * 60)
    print("✓ Feature extraction complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
