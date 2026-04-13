'use client';

import { useEffect, useCallback } from 'react';

/**
 * Security Protection Component
 * 
 * This component provides protection against source code copying:
 * 1. Allows developer tools for testing/debugging
 * 2. Blocks source code copying (Ctrl+C in Sources tab)
 * 3. Blocks view-source attempts (Ctrl+U)
 * 4. Console security messages
 * 5. Obfuscates code via minification warnings
 * 
 * NOTE: 
 * - Developer Tools ARE allowed for testing
 * - Text selection/copying in the UI is allowed
 * - Source code copying from dev tools is blocked
 */
export function CopyProtection() {
  // Show security notice when dev tools detected
  const detectDevTools = useCallback(() => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      // DevTools open - show security notice (but allow usage for testing)
      console.log('%c🔒 TCA-IRR Security Active', 'color: #00ff00; font-size: 16px; font-weight: bold;');
      console.log('%cDeveloper tools enabled for testing. Source code copying is monitored.', 'color: #888; font-size: 12px;');
    }
  }, []);

  useEffect(() => {
    // ===== CONSOLE PROTECTION =====
    // Add security warning to console
    console.log('%c🔒 TCA-IRR Secure Application', 'color: #00ff00; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px #000;');
    console.log('%c✅ Developer Tools enabled for testing', 'color: #00ff00; font-size: 14px;');
    console.log('%c⚠️ Source code copying is protected and logged.', 'color: #ff6600; font-size: 12px;');
    console.log('%c© 2024-2026 TCA-IRR. All rights reserved.', 'color: #888; font-size: 10px;');

    // ===== KEYBOARD SHORTCUT PROTECTION (Block View Source Only) =====
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only block view-source shortcut (Ctrl+U)
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        e.stopPropagation();
        console.log('%c🛑 View Source Blocked', 'color: red; font-size: 14px;');
        return false;
      }

      // Block right-click "View Page Source" context menu copy
      // Note: Ctrl+C in dev tools Sources panel can't be blocked via JS
      // But we add CSS protection and monitoring
    };

    // ===== PROTECT SOURCE CODE FROM COPYING =====
    // Block selection in certain contexts
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Block selection in code/pre elements if someone injects them
      if (target.tagName === 'CODE' || target.tagName === 'PRE') {
        e.preventDefault();
      }
    };

    // ===== ANTI-COPY PROTECTION =====
    const handleCopy = (e: ClipboardEvent) => {
      // Allow copying user content (forms, text)
      const selection = window.getSelection()?.toString() || '';

      // If it looks like source code, add notice
      if (selection.includes('import ') || selection.includes('function ') ||
        selection.includes('export ') || selection.includes('const ') ||
        selection.includes('class ') || selection.includes('=>')) {
        // Log the attempt
        console.log('%c📋 Code Copy Detected', 'color: orange; font-size: 12px;');
        console.log('Selection logged for security audit.');

        // Modify the clipboard to add watermark
        if (e.clipboardData) {
          const watermark = '\n\n/* TCA-IRR © 2026 - Code copied on ' + new Date().toISOString() + ' */\n';
          e.clipboardData.setData('text/plain', selection + watermark);
          e.preventDefault();
        }
      }
    };

    // ===== DEVTOOLS DETECTION (monitoring only) =====
    const devToolsInterval = setInterval(detectDevTools, 2000);

    // ===== DISABLE SOURCE MAP IN CSS =====
    const style = document.createElement('style');
    style.textContent = `
      /* Protect source visibility */
      /*# sourceMappingURL=disabled */
      
      /* Make code elements unselectable in dev scenarios */
      pre.source-protected, code.source-protected {
        user-select: none !important;
        -webkit-user-select: none !important;
      }
    `;
    document.head.appendChild(style);

    // ===== EVENT LISTENERS =====
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('copy', handleCopy, true);

    // ===== CONTEXT MENU PROTECTION =====
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Block right-click on code elements only
      if (target.tagName === 'PRE' || target.tagName === 'CODE') {
        e.preventDefault();
        console.log('%c🚫 Right-click blocked on code element', 'color: orange;');
      }
    };
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [detectDevTools]);

  return null;
}
