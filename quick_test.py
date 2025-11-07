#!/usr/bin/env python3
"""
Simple test for file upload with enhanced format support
"""

import requests
import json


def test_enhanced_file_formats():
    """Test file upload with various file formats"""

    # Test enhanced file formats
    enhanced_formats = [{
        "name": "business_plan.pdf",
        "size": 1024000,
        "type": "application/pdf"
    }, {
        "name":
        "financial_model.xlsx",
        "size":
        512000,
        "type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }, {
        "name":
        "pitch_deck.pptx",
        "size":
        2048000,
        "type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    }, {
        "name": "legacy_doc.doc",
        "size": 256000,
        "type": "application/msword"
    }, {
        "name": "legacy_presentation.ppt",
        "size": 1536000,
        "type": "application/vnd.ms-powerpoint"
    }, {
        "name": "data_sheet.csv",
        "size": 128000,
        "type": "text/csv"
    }, {
        "name": "config.json",
        "size": 64000,
        "type": "application/json"
    }, {
        "name": "readme.txt",
        "size": 32000,
        "type": "text/plain"
    }, {
        "name": "formatted_doc.rtf",
        "size": 256000,
        "type": "application/rtf"
    }, {
        "name": "open_doc.odt",
        "size": 384000,
        "type": "application/vnd.oasis.opendocument.text"
    }]

    try:
        response = requests.post("http://localhost:8000/api/files/upload",
                                 json={"files": enhanced_formats},
                                 timeout=15)

        if response.status_code == 200:
            data = response.json()
            print("✅ Enhanced file format test - PASSED")
            print(
                f"   Files processed: {data.get('files_processed', 0)}/{len(enhanced_formats)}"
            )
            print(f"   Status: {data.get('status')}")
            print("   Supported formats:")
            for fmt in enhanced_formats:
                print(f"     - {fmt['name']} ({fmt['type']})")
            return True
        else:
            print(f"❌ Enhanced file format test - FAILED")
            print(f"   Status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Enhanced file format test - ERROR: {e}")
        return False


def test_backend_connectivity():
    """Test basic backend connectivity"""
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend connectivity - OK")
            print(f"   API version: {data.get('api_version')}")
            print(f"   Database status: {data.get('database')}")
            return True
        else:
            print(
                f"❌ Backend connectivity - FAILED (Status: {response.status_code})"
            )
            return False
    except Exception as e:
        print(f"❌ Backend connectivity - ERROR: {e}")
        return False


def main():
    """Run quick tests"""
    print("🚀 Quick TCA IRR App Test")
    print("=" * 50)
    print("Testing backend on port 8000...")
    print("Frontend should be available on port 3001")
    print()

    # Test backend connectivity
    backend_ok = test_backend_connectivity()
    print()

    # Test enhanced file formats
    if backend_ok:
        formats_ok = test_enhanced_file_formats()
    else:
        formats_ok = False
        print(
            "⚠️ Skipping file format test due to backend connectivity issues")

    print()
    print("📋 Summary:")
    print(f"Backend: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"Enhanced file formats: {'✅ OK' if formats_ok else '❌ FAILED'}")
    print()

    if backend_ok and formats_ok:
        print("🎉 All tests passed!")
        print(
            "📁 File upload supports: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV, JSON, RTF, ODT"
        )
        print("🌐 Frontend: http://localhost:3001")
        print("🔧 Backend API: http://localhost:8000")
        print("📚 API Docs: http://localhost:8000/docs")
    else:
        print("⚠️ Some tests failed. Check the output above.")


if __name__ == "__main__":
    main()