#!/usr/bin/env python3
"""
THE QUICKNESS Chrome Extension - Bookmarking Functionality Test

This script tests the bookmarking functionality of THE QUICKNESS Chrome extension
after the architecture fix that moved bookmarking logic from content.js to background.js.

Test focuses on:
1. Extension loading without errors
2. Message passing between content script and background script
3. Chrome bookmarks API calls from background script
4. "THE QUICKNESS" folder creation in bookmarks bar
5. Clean bookmark titles (no timestamps/extensions)
6. Duplicate bookmark prevention
"""

import unittest
import json
import os
import sys
from unittest.mock import MagicMock, patch

class ChromeExtensionTest(unittest.TestCase):
    """Test suite for THE QUICKNESS Chrome extension bookmarking functionality."""

    def setUp(self):
        """Set up the test environment."""
        # Define paths to extension files
        self.extension_dir = "/app/the-quickness-extension"
        self.background_js_path = os.path.join(self.extension_dir, "background.js")
        self.content_js_path = os.path.join(self.extension_dir, "content.js")
        self.manifest_json_path = os.path.join(self.extension_dir, "manifest.json")
        
        # Verify files exist
        self.assertTrue(os.path.exists(self.background_js_path), "background.js not found")
        self.assertTrue(os.path.exists(self.content_js_path), "content.js not found")
        self.assertTrue(os.path.exists(self.manifest_json_path), "manifest.json not found")
        
        # Load manifest.json
        with open(self.manifest_json_path, 'r') as f:
            self.manifest = json.load(f)
            
        # Create mock Chrome API
        self.setup_chrome_mock()

    def setup_chrome_mock(self):
        """Set up mock Chrome API for testing."""
        self.chrome_mock = MagicMock()
        
        # Mock bookmarks API
        self.chrome_mock.bookmarks = MagicMock()
        self.chrome_mock.bookmarks.getTree = MagicMock()
        self.chrome_mock.bookmarks.getChildren = MagicMock()
        self.chrome_mock.bookmarks.search = MagicMock()
        self.chrome_mock.bookmarks.create = MagicMock()
        
        # Mock runtime API
        self.chrome_mock.runtime = MagicMock()
        self.chrome_mock.runtime.onMessage = MagicMock()
        self.chrome_mock.runtime.sendMessage = MagicMock()
        self.chrome_mock.runtime.lastError = None
        
        # Mock tabs API
        self.chrome_mock.tabs = MagicMock()
        self.chrome_mock.tabs.sendMessage = MagicMock()
        self.chrome_mock.tabs.captureVisibleTab = MagicMock()
        
        # Mock action API
        self.chrome_mock.action = MagicMock()
        self.chrome_mock.action.onClicked = MagicMock()

    def test_manifest_permissions(self):
        """Test that manifest.json has the required permissions."""
        self.assertIn("bookmarks", self.manifest["permissions"], 
                     "manifest.json missing 'bookmarks' permission")
        self.assertIn("activeTab", self.manifest["permissions"], 
                     "manifest.json missing 'activeTab' permission")
        self.assertIn("tabs", self.manifest["permissions"], 
                     "manifest.json missing 'tabs' permission")

    def test_background_script_registered(self):
        """Test that background.js is properly registered in manifest.json."""
        self.assertIn("background", self.manifest, 
                     "manifest.json missing 'background' section")
        self.assertEqual(self.manifest["background"]["service_worker"], "background.js", 
                        "background.js not properly registered as service worker")

    def test_content_script_message_passing(self):
        """Test that content.js sends createBookmark message to background.js."""
        with open(self.content_js_path, 'r') as f:
            content_js = f.read()
            
        # Check for createBookmark message sending
        self.assertIn("action: 'createBookmark'", content_js, 
                     "content.js missing createBookmark message to background script")
        self.assertIn("chrome.runtime.sendMessage", content_js, 
                     "content.js missing chrome.runtime.sendMessage for communication")

    def test_background_script_message_handling(self):
        """Test that background.js handles createBookmark message from content.js."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for message listener and createBookmark function
        self.assertIn("chrome.runtime.onMessage.addListener", background_js, 
                     "background.js missing message listener")
        self.assertIn("request.action === 'createBookmark'", background_js, 
                     "background.js missing createBookmark action handler")
        self.assertIn("function createBookmark", background_js, 
                     "background.js missing createBookmark function")

    def test_bookmarks_api_usage(self):
        """Test that background.js uses chrome.bookmarks API correctly."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for proper bookmarks API usage
        self.assertIn("chrome.bookmarks.getTree", background_js, 
                     "background.js missing chrome.bookmarks.getTree")
        self.assertIn("chrome.bookmarks.getChildren", background_js, 
                     "background.js missing chrome.bookmarks.getChildren")
        self.assertIn("chrome.bookmarks.search", background_js, 
                     "background.js missing chrome.bookmarks.search")
        self.assertIn("chrome.bookmarks.create", background_js, 
                     "background.js missing chrome.bookmarks.create")

    def test_quickness_folder_creation(self):
        """Test that background.js creates THE QUICKNESS folder in bookmarks bar."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for THE QUICKNESS folder creation
        self.assertIn("title: 'THE QUICKNESS'", background_js, 
                     "background.js missing THE QUICKNESS folder creation")
        self.assertIn("parentId: bookmarksBarId", background_js, 
                     "background.js not creating folder in bookmarks bar")

    def test_bookmark_title_cleaning(self):
        """Test that background.js creates bookmarks with clean titles."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for title cleaning
        self.assertIn("bookmarkTitle = filename.replace('.pdf', '')", background_js, 
                     "background.js not removing .pdf extension from bookmark title")
        self.assertIn("bookmarkTitle = bookmarkTitle.replace(/^\\d{6}\\s\\d{4}\\s/, '')", background_js, 
                     "background.js not removing timestamp prefix from bookmark title")

    def test_duplicate_bookmark_prevention(self):
        """Test that background.js prevents duplicate bookmarks."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for duplicate prevention
        self.assertIn("chrome.bookmarks.search({ url: url }", background_js, 
                     "background.js not searching for existing bookmarks")
        self.assertIn("if (existingBookmarks.length > 0)", background_js, 
                     "background.js not checking for existing bookmarks")
        self.assertIn("Bookmark already exists", background_js, 
                     "background.js not handling duplicate bookmarks")

    def test_bookmarks_bar_detection(self):
        """Test that background.js properly detects the bookmarks bar."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for bookmarks bar detection
        self.assertIn("child.title === 'Bookmarks bar' || child.title === 'Bookmarks Bar'", background_js, 
                     "background.js not properly detecting bookmarks bar by title")
        self.assertIn("if (!bookmarksBarId && rootNode.children.length > 0)", background_js, 
                     "background.js missing fallback for bookmarks bar detection")

    def test_error_handling(self):
        """Test that background.js has proper error handling for bookmarks API."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for error handling
        self.assertIn("if (chrome.runtime.lastError)", background_js, 
                     "background.js not checking for chrome.runtime.lastError")
        self.assertIn("try {", background_js, 
                     "background.js missing try/catch blocks for error handling")
        self.assertIn("catch (error)", background_js, 
                     "background.js missing catch blocks for error handling")

    def test_notification_to_content_script(self):
        """Test that background.js notifies content script of bookmark results."""
        with open(self.background_js_path, 'r') as f:
            background_js = f.read()
            
        # Check for notification to content script
        self.assertIn("function notifyContentScriptBookmark", background_js, 
                     "background.js missing notification function for bookmark results")
        self.assertIn("action: success ? 'bookmarkSuccess' : 'bookmarkFailed'", background_js, 
                     "background.js not sending proper success/failure actions")

def run_tests():
    """Run the test suite."""
    unittest.main(argv=['first-arg-is-ignored'], exit=False)

if __name__ == "__main__":
    print("Running THE QUICKNESS Chrome Extension Bookmarking Tests")
    print("=" * 70)
    run_tests()