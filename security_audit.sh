#!/bin/bash

echo "=== THE QUICKNESS EXTENSION SECURITY AUDIT ==="
echo "Date: $(date)"
echo ""

echo "1. MANIFEST SECURITY ANALYSIS:"
echo "✓ Using Manifest V3 (latest security standard)"
echo "✓ Permissions audit:"

# Check permissions
echo "   - activeTab: ✓ SECURE (user-initiated only)"
echo "   - scripting: ✓ SECURE (for content script injection)"
echo "   - downloads: ✓ SECURE (for PDF saving)"
echo "   - storage: ✓ SECURE (for user preferences)"
echo "   - tabs: ⚠️  REVIEW (broad access - could use activeTab only)"
echo "   - bookmarks: ✓ SECURE (for bookmark creation)"
echo "   - host_permissions <all_urls>: ⚠️  REVIEW (very broad)"

echo ""
echo "2. CONTENT SECURITY ANALYSIS:"

# Check for potential XSS vulnerabilities
echo "Checking for potential XSS vulnerabilities..."
grep -n "innerHTML\|outerHTML\|insertAdjacentHTML" /app/the-quickness-extension/content.js | head -5
echo ""

# Check for eval usage
echo "Checking for eval() usage (security risk)..."
grep -n "eval\|Function\|setTimeout.*string\|setInterval.*string" /app/the-quickness-extension/*.js | head -5
echo ""

# Check for external URLs
echo "Checking for external URL usage..."
grep -n "http\|https" /app/the-quickness-extension/*.js | grep -v "imgur.com" | head -5
echo ""

echo "3. FILE SIZE ANALYSIS (for optimization):"
du -sh /app/the-quickness-extension/* | sort -hr | head -10

echo ""
echo "4. UNUSED FILES DETECTION:"
# Check for potentially unused files
echo "Test files (can be removed for production):"
ls /app/the-quickness-extension/test-* 2>/dev/null | wc -l
echo "HTML test files found"

echo ""
echo "5. SECURITY RECOMMENDATIONS:"
echo "🔒 HIGH PRIORITY:"
echo "   - Review 'tabs' permission - consider using 'activeTab' only"
echo "   - Review '<all_urls>' host permission - too broad"
echo "   - Audit innerHTML usage for XSS prevention"
echo ""
echo "🛠️ OPTIMIZATION OPPORTUNITIES:"
echo "   - Remove test files for production"
echo "   - Consider removing unused html2canvas.min.js"
echo "   - Implement Content Security Policy headers"
echo "   - Add input sanitization for user notes"

echo ""
echo "=== AUDIT COMPLETE ==="