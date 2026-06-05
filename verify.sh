#!/bin/bash
# Sakinah Project Verification Script
# This script validates all pages have correct branding and structure

echo "🔍 Sakinah Project Verification"
echo "================================"
echo ""

# Array of HTML files to check
files=(
    "index.html"
    "login.html"
    "budget.html"
    "vendors.html"
    "recommendations.html"
    "checklist.html"
    "guestlist.html"
    "timeline.html"
    "profile.html"
    "seserahan.html"
    "panitia.html"
)

# Check 1: Verify all pages have Sakinah branding
echo "✓ Checking Branding..."
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        # Check for Sakinah title
        if grep -q "– Sakinah" "$file"; then
            echo "  ✓ $file has Sakinah title"
        else
            echo "  ✗ $file missing Sakinah title"
        fi
    else
        echo "  ✗ $file not found"
    fi
done

echo ""
echo "✓ Checking Navbar..."
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "✨ Sakinah" "$file"; then
            echo "  ✓ $file has correct navbar brand"
        else
            echo "  ✗ $file has old navbar brand"
        fi
    fi
done

echo ""
echo "✓ Checking CSS..."
if [ -f "css/style.css" ]; then
    if grep -q "#d4af85" css/style.css; then
        echo "  ✓ CSS has primary color (#d4af85)"
    fi
    if grep -q "#8b9a6e" css/style.css; then
        echo "  ✓ CSS has accent color (#8b9a6e)"
    fi
    if grep -q "#faf6f1" css/style.css; then
        echo "  ✓ CSS has background color (#faf6f1)"
    fi
fi

echo ""
echo "✓ Checking Utilities..."
if [ -f "js/utils.js" ]; then
    echo "  ✓ js/utils.js exists"
    if grep -q "showLoading" js/utils.js; then
        echo "  ✓ showLoading function found"
    fi
    if grep -q "showToast" js/utils.js; then
        echo "  ✓ showToast function found"
    fi
fi

echo ""
echo "✓ Checking Documentation..."
doc_files=("README.md" "DEPLOYMENT_GUIDE.md" "REBUILD_SUMMARY.md" "PROJECT_STATUS.md")
for doc in "${doc_files[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✓ $doc exists"
    else
        echo "  ✗ $doc missing"
    fi
done

echo ""
echo "================================"
echo "✨ Verification Complete!"
echo ""
echo "Next steps:"
echo "1. Test on local server: firebase serve"
echo "2. Check responsive design: Open DevTools (F12) → Toggle Device Toolbar"
echo "3. Test auth flow: Login/Register on login.html"
echo "4. Verify all pages load: Click through navigation"
echo "5. Deploy: firebase deploy"
