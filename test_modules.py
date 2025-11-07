#!/usr/bin/env python3
"""
Test all dashboard evaluation module child pages
"""

import requests
import time


def test_module_redirects():
    """Test all module pages redirect properly"""

    # List of all modules from the codebase
    modules = [
        'tca', 'risk', 'benchmark', 'macro', 'gap', 'growth', 'funder', 'team',
        'strategic'
    ]

    base_dashboard_url = "http://localhost:3000/dashboard/evaluation/modules"
    base_analysis_url = "http://localhost:3000/analysis/modules"

    results = []

    print("🧪 Testing Dashboard Module Redirects")
    print("=" * 50)

    for module in modules:
        print(f"Testing module: {module}")

        try:
            # Test dashboard redirect
            dashboard_url = f"{base_dashboard_url}/{module}"
            response = requests.get(dashboard_url,
                                    allow_redirects=True,
                                    timeout=10)

            if response.status_code == 200:
                expected_target = f"{base_analysis_url}/{module}"
                if expected_target in response.url:
                    print(
                        f"  ✅ {module}: Redirect working (200, redirected to analysis)"
                    )
                    results.append(
                        (module, "✅ PASS", f"Redirected to {response.url}"))
                else:
                    print(
                        f"  ⚠️  {module}: Loaded but unexpected URL: {response.url}"
                    )
                    results.append(
                        (module, "⚠️ PARTIAL", f"Loaded at {response.url}"))
            else:
                print(f"  ❌ {module}: HTTP {response.status_code}")
                results.append(
                    (module, "❌ FAIL", f"HTTP {response.status_code}"))

        except requests.exceptions.RequestException as e:
            print(f"  ❌ {module}: Connection error - {e}")
            results.append((module, "❌ FAIL", f"Connection error: {e}"))

        # Small delay to avoid overwhelming the server
        time.sleep(0.5)

    print("\n📊 Summary Report")
    print("=" * 50)

    for module, status, detail in results:
        print(f"{status} {module:<12} - {detail}")

    passed = sum(1 for _, status, _ in results if "✅" in status)
    total = len(results)

    print(
        f"\nResults: {passed}/{total} modules working ({passed/total*100:.1f}%)"
    )

    return results


def test_direct_analysis_pages():
    """Test direct access to analysis module pages"""

    modules = [
        'tca', 'risk', 'benchmark', 'macro', 'gap', 'growth', 'funder', 'team',
        'strategic'
    ]
    base_url = "http://localhost:3000/analysis/modules"

    print("\n🎯 Testing Direct Analysis Module Access")
    print("=" * 50)

    results = []

    for module in modules:
        try:
            url = f"{base_url}/{module}"
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                print(f"  ✅ {module}: Direct access OK")
                results.append((module, True))
            else:
                print(f"  ❌ {module}: HTTP {response.status_code}")
                results.append((module, False))

        except requests.exceptions.RequestException as e:
            print(f"  ❌ {module}: Error - {e}")
            results.append((module, False))

        time.sleep(0.3)

    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(
        f"\nDirect access: {passed}/{total} modules working ({passed/total*100:.1f}%)"
    )

    return results


if __name__ == "__main__":
    print("🚀 TCA Module Pages Test Suite")
    print("Testing frontend on http://localhost:3000")
    print()

    # Test redirects first
    redirect_results = test_module_redirects()

    # Test direct access
    direct_results = test_direct_analysis_pages()

    print("\n🎉 Test Complete!")
    redirect_passed = sum(1 for _, status, _ in redirect_results
                          if "✅" in status)
    direct_passed = sum(1 for _, success in direct_results if success)

    print(
        f"Dashboard redirects: {redirect_passed}/{len(redirect_results)} working"
    )
    print(
        f"Direct analysis access: {direct_passed}/{len(direct_results)} working"
    )

    if redirect_passed == len(redirect_results) and direct_passed == len(
            direct_results):
        print("✅ All module pages are working correctly!")
    else:
        print("⚠️ Some issues found. Check the results above.")