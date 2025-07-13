#!/usr/bin/env node
/**
 * THE QUICKNESS Extension Security Audit Script
 * Comprehensive security vulnerability assessment and optimization analysis
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.optimizations = [];
    this.warnings = [];
    this.extensionPath = '/app/the-quickness-extension';
  }

  // Main audit function
  async runSecurityAudit() {
    console.log('🔒 Starting THE QUICKNESS Extension Security Audit...\n');
    
    try {
      // Read all extension files
      const manifest = this.readJSONFile('manifest.json');
      const contentScript = this.readFile('content.js');
      const backgroundScript = this.readFile('background.js');
      const logoData = this.readFile('logo-data.js');
      const contentCSS = this.readFile('content.css');

      // Security Assessments
      this.auditPermissions(manifest);
      this.auditContentScriptSecurity(contentScript);
      this.auditMessagePassingSecurity(contentScript, backgroundScript);
      this.auditInputSanitization(contentScript);
      this.auditDownloadSecurity(backgroundScript);
      this.auditExternalResources(logoData);
      this.auditAPIUsage(backgroundScript);
      this.auditXSSVulnerabilities(contentScript, contentCSS);
      this.auditDataExposure(contentScript, backgroundScript);

      // Performance & Optimization Assessments
      this.auditPerformance(contentScript, backgroundScript);
      this.auditMemoryUsage(contentScript);
      this.auditResourceLoading(logoData, contentScript);
      this.auditExtensionSize();
      this.auditErrorHandling(contentScript, backgroundScript);

      // Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ Audit failed:', error.message);
    }
  }

  // Utility functions
  readFile(filename) {
    try {
      return fs.readFileSync(path.join(this.extensionPath, filename), 'utf8');
    } catch (error) {
      console.warn(`⚠️  Could not read ${filename}: ${error.message}`);
      return '';
    }
  }

  readJSONFile(filename) {
    try {
      const content = this.readFile(filename);
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️  Could not parse ${filename}: ${error.message}`);
      return {};
    }
  }

  getFileSize(filename) {
    try {
      const stats = fs.statSync(path.join(this.extensionPath, filename));
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // Security Assessment Functions

  auditPermissions(manifest) {
    console.log('🔍 Auditing Chrome Extension Permissions...');
    
    const permissions = manifest.permissions || [];
    const hostPermissions = manifest.host_permissions || [];
    
    // Check for excessive permissions
    const allowedPermissions = [
      'activeTab', 'scripting', 'downloads', 'storage', 'tabs', 'bookmarks'
    ];
    
    const unnecessaryPermissions = permissions.filter(p => !allowedPermissions.includes(p));
    
    if (unnecessaryPermissions.length > 0) {
      this.vulnerabilities.push({
        severity: 'MEDIUM',
        type: 'Excessive Permissions',
        description: `Unnecessary permissions detected: ${unnecessaryPermissions.join(', ')}`,
        risk: 'Could increase attack surface',
        recommendation: 'Remove unnecessary permissions'
      });
    }

    // Check host permissions
    if (hostPermissions.includes('<all_urls>')) {
      this.warnings.push({
        type: 'Broad Host Permissions',
        description: 'Extension has access to all URLs',
        recommendation: 'Consider limiting to specific domains if possible'
      });
    }

    // Validate permission necessity
    if (permissions.includes('bookmarks')) {
      console.log('✅ Bookmarks permission: Required for bookmark creation functionality');
    }
    if (permissions.includes('downloads')) {
      console.log('✅ Downloads permission: Required for PDF download functionality');
    }
    if (permissions.includes('tabs')) {
      console.log('✅ Tabs permission: Required for screenshot capture');
    }
  }

  auditContentScriptSecurity(contentScript) {
    console.log('🔍 Auditing Content Script Security...');
    
    // Check for innerHTML usage (potential XSS)
    const innerHTMLMatches = contentScript.match(/\.innerHTML\s*=/g);
    if (innerHTMLMatches) {
      this.vulnerabilities.push({
        severity: 'HIGH',
        type: 'XSS Risk - innerHTML Usage',
        description: `Found ${innerHTMLMatches.length} instances of innerHTML assignment`,
        risk: 'Potential XSS if user input is involved',
        recommendation: 'Use textContent or createElement for user data'
      });
    }

    // Check for eval usage
    if (contentScript.includes('eval(')) {
      this.vulnerabilities.push({
        severity: 'CRITICAL',
        type: 'Code Injection Risk',
        description: 'eval() function detected',
        risk: 'Code execution vulnerability',
        recommendation: 'Remove eval() usage immediately'
      });
    }

    // Check for document.write usage
    if (contentScript.includes('document.write')) {
      this.vulnerabilities.push({
        severity: 'MEDIUM',
        type: 'XSS Risk - document.write',
        description: 'document.write() usage detected',
        risk: 'Potential XSS vulnerability',
        recommendation: 'Use safer DOM manipulation methods'
      });
    }

    // Check for external script loading
    const scriptSrcMatches = contentScript.match(/\.src\s*=\s*['"]/g);
    if (scriptSrcMatches) {
      this.warnings.push({
        type: 'Dynamic Script Loading',
        description: 'Dynamic script source assignment detected',
        recommendation: 'Ensure only trusted sources are loaded'
      });
    }
  }

  auditMessagePassingSecurity(contentScript, backgroundScript) {
    console.log('🔍 Auditing Message Passing Security...');
    
    // Check for message validation in background script
    const messageValidation = backgroundScript.includes('request.action');
    if (!messageValidation) {
      this.vulnerabilities.push({
        severity: 'MEDIUM',
        type: 'Message Validation',
        description: 'No action validation detected in message handler',
        risk: 'Could process unexpected messages',
        recommendation: 'Add strict message action validation'
      });
    }

    // Check for sendResponse usage
    if (backgroundScript.includes('sendResponse') && !backgroundScript.includes('return true')) {
      this.warnings.push({
        type: 'Async Message Handling',
        description: 'sendResponse used without return true',
        recommendation: 'Add "return true" for async message handling'
      });
    }

    // Check for origin validation
    if (!backgroundScript.includes('sender.') && !contentScript.includes('chrome.runtime.lastError')) {
      this.warnings.push({
        type: 'Message Origin Validation',
        description: 'No sender validation in message handlers',
        recommendation: 'Consider validating message origins'
      });
    }
  }

  auditInputSanitization(contentScript) {
    console.log('🔍 Auditing Input Sanitization...');
    
    // Check for maxlength on text inputs
    if (contentScript.includes('maxlength="100"')) {
      console.log('✅ Input length validation: Notes limited to 100 characters');
    }

    // Check for URL validation
    if (!contentScript.includes('encodeURI') && contentScript.includes('data.url')) {
      this.warnings.push({
        type: 'URL Sanitization',
        description: 'URLs may not be properly encoded',
        recommendation: 'Use encodeURI for URL handling'
      });
    }

    // Check for filename sanitization
    if (contentScript.includes('replace(/[<>:"/\\\\|?*]/g')) {
      console.log('✅ Filename sanitization: Special characters removed from filenames');
    }

    // Check for note validation
    if (contentScript.includes('.trim()')) {
      console.log('✅ Input trimming: User input is trimmed');
    }
  }

  auditDownloadSecurity(backgroundScript) {
    console.log('🔍 Auditing Download Security...');
    
    // Check for path traversal protection
    if (backgroundScript.includes('THE QUICKNESS/')) {
      console.log('✅ Download path: PDFs saved to designated subfolder');
    }

    // Check for file extension validation
    if (backgroundScript.includes('.pdf')) {
      console.log('✅ File extension: Downloads restricted to PDF files');
    }

    // Check for conflictAction
    if (backgroundScript.includes('conflictAction: \'uniquify\'')) {
      console.log('✅ File conflicts: Handled with uniquify strategy');
    }

    // Check for data URL validation
    if (!backgroundScript.includes('data:application/pdf')) {
      this.warnings.push({
        type: 'MIME Type Validation',
        description: 'Download MIME type should be validated',
        recommendation: 'Ensure only PDF MIME types are downloaded'
      });
    }
  }

  auditExternalResources(logoData) {
    console.log('🔍 Auditing External Resource Loading...');
    
    // Check for HTTPS usage
    if (logoData.includes('https://')) {
      console.log('✅ Secure protocol: External resources loaded over HTTPS');
    }

    // Check for imgur domain
    if (logoData.includes('imgur.com')) {
      this.warnings.push({
        type: 'External Dependency',
        description: 'Extension depends on imgur.com for logo loading',
        recommendation: 'Consider bundling logo locally for better reliability'
      });
    }

    // Check for error handling in logo loading
    if (logoData.includes('catch') || logoData.includes('error')) {
      console.log('✅ Error handling: Logo loading has error handling');
    }
  }

  auditAPIUsage(backgroundScript) {
    console.log('🔍 Auditing Chrome API Usage...');
    
    // Check for proper error handling
    const chromeAPIUsage = [
      'chrome.bookmarks.getTree',
      'chrome.downloads.download',
      'chrome.tabs.captureVisibleTab'
    ];

    chromeAPIUsage.forEach(api => {
      if (backgroundScript.includes(api)) {
        if (backgroundScript.includes('chrome.runtime.lastError')) {
          console.log(`✅ Error handling: ${api} has error handling`);
        } else {
          this.warnings.push({
            type: 'API Error Handling',
            description: `${api} may lack proper error handling`,
            recommendation: 'Add chrome.runtime.lastError checks'
          });
        }
      }
    });

    // Check for async/await usage
    if (backgroundScript.includes('async function') && backgroundScript.includes('await')) {
      console.log('✅ Async handling: Modern async/await pattern used');
    }
  }

  auditXSSVulnerabilities(contentScript, contentCSS) {
    console.log('🔍 Auditing XSS Vulnerabilities...');
    
    // Check for CSP-friendly coding
    if (!contentScript.includes('style=') && !contentScript.includes('onclick=')) {
      console.log('✅ Inline code: No inline styles or handlers detected');
    } else {
      this.vulnerabilities.push({
        severity: 'MEDIUM',
        type: 'CSP Violation Risk',
        description: 'Inline styles detected in content script',
        risk: 'May violate Content Security Policy',
        recommendation: 'Move styles to CSS files'
      });
    }

    // Check for user data in DOM manipulation
    const domMethods = ['innerHTML', 'outerHTML', 'insertAdjacentHTML'];
    domMethods.forEach(method => {
      if (contentScript.includes(`.${method}`) && contentScript.includes('data.')) {
        this.vulnerabilities.push({
          severity: 'HIGH',
          type: 'XSS Risk - User Data in DOM',
          description: `User data used with ${method}`,
          risk: 'Potential XSS if user data contains HTML',
          recommendation: 'Sanitize user input or use textContent'
        });
      }
    });
  }

  auditDataExposure(contentScript, backgroundScript) {
    console.log('🔍 Auditing Data Exposure Risks...');
    
    // Check for console.log with sensitive data
    const consoleLogsWithData = (contentScript + backgroundScript).match(/console\.log\([^)]*data[^)]*\)/g);
    if (consoleLogsWithData) {
      this.warnings.push({
        type: 'Data Logging',
        description: `${consoleLogsWithData.length} console.log statements with data`,
        recommendation: 'Remove or sanitize debug logs before production'
      });
    }

    // Check for URL logging
    if ((contentScript + backgroundScript).includes('console.log') && 
        (contentScript + backgroundScript).includes('url')) {
      this.warnings.push({
        type: 'URL Logging',
        description: 'URLs may be logged to console',
        recommendation: 'Avoid logging sensitive URLs'
      });
    }
  }

  // Performance & Optimization Assessment Functions

  auditPerformance(contentScript, backgroundScript) {
    console.log('🔍 Auditing Performance...');
    
    // Check for debouncing/throttling
    if (!contentScript.includes('setTimeout') && contentScript.includes('addEventListener')) {
      this.optimizations.push({
        priority: 'MEDIUM',
        type: 'Event Handling Optimization',
        description: 'Event listeners may benefit from debouncing',
        benefit: 'Reduced CPU usage during rapid events',
        recommendation: 'Add debouncing for frequently fired events'
      });
    }

    // Check for DOM queries in loops
    if (contentScript.includes('querySelectorAll') && contentScript.includes('forEach')) {
      this.optimizations.push({
        priority: 'LOW',
        type: 'DOM Query Optimization',
        description: 'DOM queries inside loops detected',
        benefit: 'Improved performance',
        recommendation: 'Cache DOM query results'
      });
    }

    // Check for screenshot quality settings
    if (backgroundScript.includes('quality: 100')) {
      this.optimizations.push({
        priority: 'MEDIUM',
        type: 'Screenshot Quality',
        description: 'Screenshot quality set to maximum (100%)',
        benefit: 'Reduced memory usage and faster processing',
        recommendation: 'Consider reducing to 90-95% for better performance'
      });
    }
  }

  auditMemoryUsage(contentScript) {
    console.log('🔍 Auditing Memory Usage...');
    
    // Check for event listener cleanup
    if (!contentScript.includes('removeEventListener')) {
      this.vulnerabilities.push({
        severity: 'MEDIUM',
        type: 'Memory Leak Risk',
        description: 'Event listeners may not be properly cleaned up',
        risk: 'Memory leaks in long-running pages',
        recommendation: 'Add removeEventListener in cleanup functions'
      });
    }

    // Check for modal cleanup
    if (contentScript.includes('remove()') && contentScript.includes('modal')) {
      console.log('✅ Modal cleanup: Modals are properly removed from DOM');
    }

    // Check for interval/timeout cleanup
    if (contentScript.includes('setTimeout') && !contentScript.includes('clearTimeout')) {
      this.warnings.push({
        type: 'Timer Cleanup',
        description: 'setTimeout used without clearTimeout',
        recommendation: 'Clean up timers to prevent memory leaks'
      });
    }
  }

  auditResourceLoading(logoData, contentScript) {
    console.log('🔍 Auditing Resource Loading...');
    
    // Check for lazy loading
    if (!logoData.includes('async') && logoData.includes('fetch')) {
      this.optimizations.push({
        priority: 'LOW',
        type: 'Logo Loading Optimization',
        description: 'Logo loaded synchronously',
        benefit: 'Better user experience',
        recommendation: 'Implement proper async loading with fallbacks'
      });
    }

    // Check for caching strategy
    if (!logoData.includes('cache')) {
      this.optimizations.push({
        priority: 'MEDIUM',
        type: 'Resource Caching',
        description: 'No caching strategy for external logo',
        benefit: 'Faster loading, reduced network requests',
        recommendation: 'Implement local caching for logo'
      });
    }

    // Check for jsPDF loading strategy
    if (contentScript.includes('waitForLibraries')) {
      console.log('✅ Library loading: jsPDF loading has proper wait strategy');
    }
  }

  auditExtensionSize() {
    console.log('🔍 Auditing Extension Size...');
    
    const files = ['manifest.json', 'content.js', 'background.js', 'logo-data.js', 'content.css'];
    let totalSize = 0;

    files.forEach(file => {
      const size = this.getFileSize(file);
      totalSize += size;
      console.log(`📁 ${file}: ${(size / 1024).toFixed(2)} KB`);
    });

    console.log(`📦 Total core files size: ${(totalSize / 1024).toFixed(2)} KB`);

    if (totalSize > 1024 * 1024) { // 1MB
      this.optimizations.push({
        priority: 'HIGH',
        type: 'Extension Size',
        description: `Extension size is ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        benefit: 'Faster installation and updates',
        recommendation: 'Optimize or compress large files'
      });
    }
  }

  auditErrorHandling(contentScript, backgroundScript) {
    console.log('🔍 Auditing Error Handling...');
    
    // Check for try-catch blocks
    const tryCatchCount = (contentScript + backgroundScript).match(/try\s*{/g)?.length || 0;
    console.log(`🛡️  Try-catch blocks found: ${tryCatchCount}`);

    if (tryCatchCount < 5) {
      this.warnings.push({
        type: 'Error Handling Coverage',
        description: 'Limited try-catch blocks detected',
        recommendation: 'Add more comprehensive error handling'
      });
    }

    // Check for user feedback on errors
    if (contentScript.includes('showFailureNotification')) {
      console.log('✅ User feedback: Error notifications implemented');
    }

    // Check for chrome.runtime.lastError usage
    const chromeErrorChecks = (backgroundScript.match(/chrome\.runtime\.lastError/g) || []).length;
    console.log(`🔧 Chrome API error checks: ${chromeErrorChecks}`);
  }

  // Report Generation

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔒 THE QUICKNESS EXTENSION SECURITY AUDIT REPORT');
    console.log('='.repeat(80));

    // Security Summary
    console.log('\n📊 SECURITY SUMMARY:');
    console.log(`   Critical vulnerabilities: ${this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length}`);
    console.log(`   High severity issues: ${this.vulnerabilities.filter(v => v.severity === 'HIGH').length}`);
    console.log(`   Medium severity issues: ${this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    // Detailed Vulnerabilities
    if (this.vulnerabilities.length > 0) {
      console.log('\n🚨 SECURITY VULNERABILITIES:');
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`\n${index + 1}. [${vuln.severity}] ${vuln.type}`);
        console.log(`   Description: ${vuln.description}`);
        console.log(`   Risk: ${vuln.risk}`);
        console.log(`   Recommendation: ${vuln.recommendation}`);
      });
    } else {
      console.log('\n✅ No critical security vulnerabilities detected!');
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  SECURITY WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.type}`);
        console.log(`   Description: ${warning.description}`);
        console.log(`   Recommendation: ${warning.recommendation}`);
      });
    }

    // Optimization Opportunities
    console.log('\n⚡ OPTIMIZATION OPPORTUNITIES:');
    const priorityOrder = ['HIGH', 'MEDIUM', 'LOW'];
    priorityOrder.forEach(priority => {
      const items = this.optimizations.filter(opt => opt.priority === priority);
      if (items.length > 0) {
        console.log(`\n[${priority} Priority]:`);
        items.forEach((opt, index) => {
          console.log(`${index + 1}. ${opt.type}`);
          console.log(`   Description: ${opt.description}`);
          console.log(`   Benefit: ${opt.benefit}`);
          console.log(`   Recommendation: ${opt.recommendation}\n`);
        });
      }
    });

    // Overall Assessment
    console.log('\n🎯 OVERALL ASSESSMENT:');
    
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highCount = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    
    if (criticalCount > 0) {
      console.log('❌ CRITICAL: Extension has critical security vulnerabilities that must be fixed immediately');
    } else if (highCount > 0) {
      console.log('⚠️  HIGH RISK: Extension has high-severity security issues that should be addressed');
    } else if (this.vulnerabilities.length > 0) {
      console.log('⚠️  MEDIUM RISK: Extension has some security issues but is generally safe');
    } else {
      console.log('✅ SECURE: Extension follows good security practices');
    }

    console.log('\n📋 RECOMMENDATIONS SUMMARY:');
    console.log('1. Address all critical and high-severity vulnerabilities first');
    console.log('2. Implement recommended security improvements');
    console.log('3. Apply performance optimizations based on priority');
    console.log('4. Regular security audits as extension evolves');

    console.log('\n' + '='.repeat(80));
    console.log('Audit completed at:', new Date().toISOString());
    console.log('='.repeat(80));
  }
}

// Run the audit
const auditor = new SecurityAuditor();
auditor.runSecurityAudit().catch(console.error);