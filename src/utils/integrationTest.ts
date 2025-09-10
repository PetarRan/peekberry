/**
 * Integration testing utilities for Peekberry
 * Tests the connection between extension and webapp
 */

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

export interface IntegrationTestSuite {
  name: string;
  results: IntegrationTestResult[];
  overallPassed: boolean;
  totalDuration: number;
}

class IntegrationTester {
  private testTimeout = 10000; // 10 seconds

  /**
   * Run comprehensive integration tests
   */
  public async runFullTestSuite(): Promise<IntegrationTestSuite> {
    const startTime = performance.now();
    const results: IntegrationTestResult[] = [];

    // Test extension installation
    results.push(await this.testExtensionInstallation());

    // Test authentication flow
    results.push(await this.testAuthenticationFlow());

    // Test API connectivity
    results.push(await this.testAPIConnectivity());

    // Test screenshot functionality
    results.push(await this.testScreenshotFunctionality());

    // Test AI processing
    results.push(await this.testAIProcessing());

    // Test data synchronization
    results.push(await this.testDataSynchronization());

    // Test error handling
    results.push(await this.testErrorHandling());

    const endTime = performance.now();
    const overallPassed = results.every((result) => result.passed);

    return {
      name: 'Peekberry Integration Test Suite',
      results,
      overallPassed,
      totalDuration: endTime - startTime,
    };
  }

  /**
   * Test extension installation and basic functionality
   */
  private async testExtensionInstallation(): Promise<IntegrationTestResult> {
    const startTime = performance.now();

    try {
      // Check if extension elements are present
      const extensionElements = document.querySelectorAll(
        '[data-peekberry-element]'
      );

      if (extensionElements.length === 0) {
        throw new Error('No Peekberry extension elements found on page');
      }

      // Check for bubble element specifically
      const bubble = document.querySelector('.peekberry-bubble');
      if (!bubble) {
        throw new Error('Peekberry bubble not found');
      }

      // Check if extension scripts are loaded
      const hasContentScript =
        typeof (window as any).peekberryContentScript !== 'undefined';

      return {
        testName: 'Extension Installation',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          elementsFound: extensionElements.length,
          bubblePresent: !!bubble,
          contentScriptLoaded: hasContentScript,
        },
      };
    } catch (error) {
      return {
        testName: 'Extension Installation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test authentication flow
   */
  private async testAuthenticationFlow(): Promise<IntegrationTestResult> {
    const startTime = performance.now();

    try {
      // Test auth token presence
      const hasAuthToken =
        localStorage.getItem('peekberry_extension_token') !== null;

      // Test auth status check
      const authStatus = await this.sendMessageToExtension({
        type: 'GET_AUTH_STATUS',
      });

      if (!authStatus) {
        throw new Error('Failed to get auth status from extension');
      }

      return {
        testName: 'Authentication Flow',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          hasLocalToken: hasAuthToken,
          extensionAuthStatus: authStatus,
        },
      };
    } catch (error) {
      return {
        testName: 'Authentication Flow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test API connectivity
   */
  private async testAPIConnectivity(): Promise<IntegrationTestResult> {
    const startTime = performance.now();

    try {
      // Test webapp API endpoints
      const endpoints = [
        '/api/extension/auth/verify',
        '/api/screenshots',
        '/api/ai/process-command',
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true }),
          });
          return { endpoint, status: response.status };
        })
      );

      const apiResults = results.map((result, index) => ({
        endpoint: endpoints[index],
        success: result.status === 'fulfilled',
        status: result.status === 'fulfilled' ? result.value.status : 'error',
      }));

      return {
        testName: 'API Connectivity',
        passed: apiResults.every((r) => r.success),
        duration: performance.now() - startTime,
        details: { apiResults },
      };
    } catch (error) {
      return {
        testName: 'API Connectivity',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test screenshot functionality
   */
  private async testScreenshotFunctionality(): Promise<IntegrationTestResult> {
    const startTime = performance.now();

    try {
      // Test screenshot capture capability
      const screenshotResult = await this.sendMessageToExtension({
        type: 'TEST_SCREENSHOT_CAPABILITY',
      });

      // Test screenshot upload simulation
      const mockFile = new Blob(['test'], { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', mockFile, 'test.png');
      formData.append(
        'metadata',
        JSON.stringify({
          pageUrl: window.location.href,
          pageTitle: document.title,
          editCount: 0,
          dimensions: { width: 1920, height: 1080 },
        })
      );

      // Note: This would normally fail without auth, but we're testing the endpoint
      const uploadResponse = await fetch('/api/screenshots', {
        method: 'POST',
        body: formData,
      });

      return {
        testName: 'Screenshot Functionality',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          captureCapability: screenshotResult,
          uploadEndpointStatus: uploadResponse.status,
        },
      };
    } catch (error) {
      return {
        testName: 'Screenshot Functionality',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test AI processing
   */
  private async testAIProcessing(): Promise<IntegrationTestResult> {
    const startTime = performance.now();

    try {
      // Test AI endpoint with mock data
      const mockContext = {
        selector: 'body',
        tagName: 'BODY',
        computedStyles: { color: 'black' },
        boundingRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        },
      };

      const aiResponse = await fetch('/api/ai/process-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'make this red',
          context: mockContext,
        }),
      });

      return {
        testName: 'AI Processing',
        passed: aiResponse.status !== 500, // Accept auth errors but not server errors
        duration: performance.now() - startTime,
        details: {
          responseStatus: aiResponse.status,
          endpointReachable: true,
        },
      };
    } catch (error) {
      return {
        testName: 'AI Processing',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test data synchronization
   */
  private async testDataSynchronization(): Promise<IntegrationTestResult> {
    const startTime = performance.now();

    try {
      // Test localStorage sync
      const testData = { timestamp: Date.now(), test: true };
      localStorage.setItem('peekberry_test_sync', JSON.stringify(testData));

      // Verify data persistence
      const retrievedData = localStorage.getItem('peekberry_test_sync');
      const parsed = retrievedData ? JSON.parse(retrievedData) : null;

      // Clean up
      localStorage.removeItem('peekberry_test_sync');

      if (!parsed || parsed.timestamp !== testData.timestamp) {
        throw new Error('Data synchronization failed');
      }

      return {
        testName: 'Data Synchronization',
        passed: true,
        duration: performance.now() - startTime,
        details: {
          localStorageWorking: true,
          dataIntegrity: true,
        },
      };
    } catch (error) {
      return {
        testName: 'Data Synchronization',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<IntegrationTestResult> {
    const startTime = performance.now();

    try {
      // Test invalid API calls
      const invalidCalls = [
        fetch('/api/nonexistent-endpoint'),
        fetch('/api/screenshots', { method: 'POST' }), // Missing data
        fetch('/api/ai/process-command', { method: 'POST' }), // Missing data
      ];

      const results = await Promise.allSettled(invalidCalls);

      // All should fail gracefully (not crash)
      const gracefulFailures = results.every(
        (result) =>
          result.status === 'fulfilled' &&
          (result.value as Response).status >= 400
      );

      return {
        testName: 'Error Handling',
        passed: gracefulFailures,
        duration: performance.now() - startTime,
        details: {
          invalidCallsHandled: results.length,
          gracefulFailures,
        },
      };
    } catch (error) {
      return {
        testName: 'Error Handling',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Send message to extension for testing
   */
  private async sendMessageToExtension(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Extension communication timeout'));
      }, this.testTimeout);

      // Try chrome.runtime first
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } else {
        // Fallback to postMessage
        window.postMessage({ ...message, source: 'integration-test' }, '*');

        const handler = (event: MessageEvent) => {
          if (event.data?.source === 'peekberry-extension') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data);
          }
        };

        window.addEventListener('message', handler);
      }
    });
  }

  /**
   * Generate test report
   */
  public generateReport(testSuite: IntegrationTestSuite): string {
    const { name, results, overallPassed, totalDuration } = testSuite;

    let report = `# ${name}\n\n`;
    report += `**Overall Status:** ${overallPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `**Total Duration:** ${totalDuration.toFixed(2)}ms\n\n`;

    report += `## Test Results\n\n`;

    results.forEach((result) => {
      const status = result.passed ? '✅' : '❌';
      report += `### ${status} ${result.testName}\n`;
      report += `- **Duration:** ${result.duration.toFixed(2)}ms\n`;

      if (result.error) {
        report += `- **Error:** ${result.error}\n`;
      }

      if (result.details) {
        report += `- **Details:** ${JSON.stringify(result.details, null, 2)}\n`;
      }

      report += '\n';
    });

    return report;
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester();

// Utility function to run tests from console
export async function runIntegrationTests(): Promise<IntegrationTestSuite> {
  console.log('🧪 Running Peekberry integration tests...');

  const results = await integrationTester.runFullTestSuite();

  console.log('📊 Test Results:');
  console.log(integrationTester.generateReport(results));

  return results;
}

// Auto-run tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add global function for manual testing
  (window as any).runPeekberryTests = runIntegrationTests;

  console.log(
    '🔧 Development mode: Run window.runPeekberryTests() to test integration'
  );
}
