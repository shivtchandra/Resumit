#!/usr/bin/env python3
"""
Download Datasets Script
Downloads all required datasets for the ATS Emulator (Mode 1, Mode 2, and V3 Upgrades).
"""

import os
from datasets import load_dataset
from pathlib import Path

def download_mode1_dataset():
    """Download Kaggle Resume Dataset for Mode 1 (Friendliness Classifier)."""
    print("\n[Mode 1] Downloading Kaggle Resume Dataset...")
    
    target_dir = Path("data/mode1/raw")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if already exists
    if (target_dir / "data").exists():
        print("  ✓ Dataset already exists in data/mode1/raw/")
        return

    print("⬇️  Downloading Kaggle Resume Dataset...")
    try:
        import kaggle
        kaggle.api.authenticate()
        kaggle.api.dataset_download_files(
            "snehaanbhawal/resume-dataset",
            path=target_dir,
            unzip=True
        )
        print(f"  ✓ Mode 1 dataset downloaded to {target_dir}")
    except Exception as e:
        print(f"  ⚠️  Skipping Kaggle download (Credentials missing or error): {e}")
        print("      (If you already have the data, this is fine.)")

def download_mode2_datasets():
    """Download HuggingFace datasets for Mode 2 (Visibility Ranker)."""
    print("\n[Mode 2] Downloading HuggingFace datasets...")
    
    target_dir = Path("data/mode2")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    hf_token = os.getenv("HF_TOKEN")
    
    # Download primary dataset (REQUIRED)
    try:
        print("  Downloading 0xnbk/resume-ats-score-v1-en...")
        dataset1 = load_dataset("0xnbk/resume-ats-score-v1-en", token=hf_token)
        dataset1.save_to_disk("data/mode2/ats_score_v1")
        print(f"  ✓ Saved {len(dataset1['train'])} training examples")
    except Exception as e:
        print(f"  ❌ Primary dataset failed: {e}")

    # Download supplementary dataset (OPTIONAL)
    try:
        print("  Downloading netsol/resume-score-details (optional)...")
        dataset2 = load_dataset("netsol/resume-score-details", token=hf_token)
        dataset2.save_to_disk("data/mode2/resume_scores")
        print(f"  ✓ Saved {len(dataset2['train'])} supplementary examples")
    except Exception as e:
        print(f"  ⚠ Supplementary dataset failed (skipping): {e}")

def download_layout_dataset():
    """Download MikePfunk28/resume-training-dataset for layout analysis."""
    print("\n[Mode 1/2] Downloading Layout Analysis Dataset...")
    
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("  ⚠ HF_TOKEN not set. Skipping gated dataset.")
        return

    try:
        print("  Downloading MikePfunk28/resume-training-dataset...")
        dataset = load_dataset("MikePfunk28/resume-training-dataset", token=hf_token)
        dataset.save_to_disk("data/layout_dataset")
        print(f"  ✓ Saved {len(dataset['train'])} layout examples")
    except Exception as e:
        print(f"  ⚠ Layout dataset failed: {e}")
        print("  → Ensure you have accepted terms at: https://huggingface.co/datasets/MikePfunk28/resume-training-dataset")

def download_v3_datasets():
    """Download V3 Upgrade Datasets (ResuméAtlas and NER)."""
    print("\n[V3 Upgrade] Downloading New Datasets...")
    
    # 1. ResuméAtlas
    print("⬇️  Downloading ResuméAtlas (ahmedheakl/resume-atlas)...")
    try:
        ds_atlas = load_dataset("ahmedheakl/resume-atlas")
        ds_atlas.save_to_disk("data/mode1/resume_atlas")
        print("  ✓ Saved ResuméAtlas")
    except Exception as e:
        print(f"  ❌ Failed to download ResuméAtlas: {e}")

    # 2. NER Dataset
    # We use a pre-trained model (yashpwr/resume-ner-bert-v2) so no training data needed.
    print("  ✓ NER: Using pre-trained model (no download needed)")

def download_datasets():
    print("=" * 60)
    print("ATS V2 Dataset Download Script")
    print("=" * 60)
    
    download_mode1_dataset()
    download_mode2_datasets()
    download_layout_dataset()
    download_v3_datasets()
    
    print("\n" + "=" * 60)
    print("✓ Download process complete!")
    print("=" * 60)

if __name__ == "__main__":
    download_datasets()
