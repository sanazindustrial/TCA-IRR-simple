#!/usr/bin/env python3
"""
Test all module pages to ensure they're working correctly
"""

import requests
import time

# List of all modules to test
modules = [
    'tca', 'risk', 'benchmark', 'macro', 'gap', 'growth', 'funder', 'team',
    'strategic'
]

BASE_URL = "http://localhost:3003"


def test_module_redirect(module):
    """Test that dashboard module page redirects properly"""
    try:
        # Test the dashboard route (should redirect)
        dashboard_url = f"{BASE_URL}/dashboard/evaluation/modules/{module}"
        response = requests.get(dashboard_url,
                                timeout=10,
                                allow_redirects=False)

        # Test the direct analysis route
        analysis_url = f"{BASE_URL}/analysis/modules/{module}"
        analysis_response = requests.get(analysis_url, timeout=10)

        if analysis_response.status_code == 200:
            print(
                f"✅ {module.upper()} module - Analysis page OK (status: {analysis_response.status_code})"
            )
            print(f"   Dashboard redirect: {dashboard_url}")
            print(f"   Analysis page: {analysis_url}")
            return True
        else:
            print(
                f"❌ {module.upper()} module - Analysis page failed (status: {analysis_response.status_code})"
            )
            return False
    except Exception as e:
        print(f"❌ {module.upper()} module - Error: {e}")
        return False


def test_main_module_pages():
    """Test the main module listing pages"""
    try:
        # Test main modules page
        modules_url = f"{BASE_URL}/dashboard/evaluation/modules"
        response = requests.get(modules_url, timeout=10)

        if response.status_code == 200:
            print(f"✅ Main modules page OK (status: {response.status_code})")
            print(f"   URL: {modules_url}")
            return True
        else:
            print(
                f"❌ Main modules page failed (status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Main modules page error: {e}")
        return False


def main():
    """Run all module tests"""
    print("🚀 Testing All Module Pages")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing {len(modules)} modules...")
    print()

    # Test main pages first
    main_ok = test_main_module_pages()
    print()

    # Test each module
    results = []
    for module in modules:
        print(f"🧪 Testing {module.upper()} module...")
        result = test_module_redirect(module)
        results.append((module, result))
        print()
        time.sleep(0.5)  # Brief delay between tests

    # Summary
    print("📊 Test Results Summary")
    print("=" * 60)
    passed = sum(1 for _, result in results if result)
    total = len(results)

    print(f"Main modules page: {'✅ PASS' if main_ok else '❌ FAIL'}")
    for module, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {module.upper()} module")

    print()
    print(
        f"Individual modules passed: {passed}/{total} ({passed/total*100:.1f}%)"
    )

    if main_ok and passed == total:
        print("🎉 All module pages are working correctly!")
        print()
        print("📝 Quick Access URLs:")
        print(f"- Main modules page: {BASE_URL}/dashboard/evaluation/modules")
        for module in modules:
            print(
                f"- {module.upper()}: {BASE_URL}/dashboard/evaluation/modules/{module} → {BASE_URL}/analysis/modules/{module}"
            )
    else:
        failed = total - passed + (0 if main_ok else 1)
        print(f"⚠️ {failed} page(s) failed. Check the output above.")

    return main_ok and passed == total


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)