/**
 * 🔍 MASTER SCANNER: Ejecuta todos los scanners
 * 
 * Orquesta la ejecución de todos los scanners y genera reporte consolidado
 */

const fs = require('fs');
const path = require('path');
const { scanConsoleLogs } = require('./scan-console-logs');
const { scanHardcodedUrls } = require('./scan-hardcoded-urls');
const { scanOrganizationId } = require('./scan-organization-id');
const { scanComponentSize } = require('./scan-component-size');

interface ScanResult {
  scanner: string;
  violations: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  passed: boolean;
}

async function runAllScans(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  console.log('🛡️  DOBACKSOFT GUARDRAILS - FULL SCAN\n');
  console.log('================================================\n');
  
  // 1. Console.log detector
  console.log('1️⃣  Scanning console.* calls...');
  try {
    const consoleViolations = await scanConsoleLogs();
    results.push({
      scanner: 'Console Logs',
      violations: consoleViolations.length,
      severity: 'critical',
      passed: consoleViolations.length === 0
    });
    console.log(`   ${consoleViolations.length === 0 ? '✅' : '❌'} Found ${consoleViolations.length} violations\n`);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
  
  // 2. Hardcoded URLs detector
  console.log('2️⃣  Scanning hardcoded URLs...');
  try {
    const urlViolations = await scanHardcodedUrls();
    results.push({
      scanner: 'Hardcoded URLs',
      violations: urlViolations.length,
      severity: 'high',
      passed: urlViolations.length === 0
    });
    console.log(`   ${urlViolations.length === 0 ? '✅' : '❌'} Found ${urlViolations.length} violations\n`);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
  
  // 3. OrganizationId filter detector
  console.log('3️⃣  Scanning organizationId filters...');
  try {
    const orgIdViolations = await scanOrganizationId();
    results.push({
      scanner: 'OrganizationId Filters',
      violations: orgIdViolations.length,
      severity: 'critical',
      passed: orgIdViolations.length === 0
    });
    console.log(`   ${orgIdViolations.length === 0 ? '✅' : '❌'} Found ${orgIdViolations.length} violations\n`);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
  
  // 4. Component size detector
  console.log('4️⃣  Scanning component sizes...');
  try {
    const sizeViolations = await scanComponentSize();
    results.push({
      scanner: 'Component Size',
      violations: sizeViolations.length,
      severity: 'medium',
      passed: sizeViolations.length === 0
    });
    console.log(`   ${sizeViolations.length === 0 ? '✅' : '⚠️'} Found ${sizeViolations.length} oversized components\n`);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
  
  return results;
}

function generateSummary(results: ScanResult[]) {
  console.log('\n================================================');
  console.log('📊 SUMMARY\n');
  
  const critical = results.filter(r => r.severity === 'critical' && !r.passed);
  const high = results.filter(r => r.severity === 'high' && !r.passed);
  const medium = results.filter(r => r.severity === 'medium' && !r.passed);
  const low = results.filter(r => r.severity === 'low' && !r.passed);
  
  console.log(`🔴 CRITICAL: ${critical.length} scanner(s) with violations`);
  critical.forEach(r => console.log(`   - ${r.scanner}: ${r.violations} violations`));
  
  console.log(`\n🟠 HIGH: ${high.length} scanner(s) with violations`);
  high.forEach(r => console.log(`   - ${r.scanner}: ${r.violations} violations`));
  
  console.log(`\n🟡 MEDIUM: ${medium.length} scanner(s) with violations`);
  medium.forEach(r => console.log(`   - ${r.scanner}: ${r.violations} violations`));
  
  console.log(`\n🟢 LOW: ${low.length} scanner(s) with violations`);
  low.forEach(r => console.log(`   - ${r.scanner}: ${r.violations} violations`));
  
  const totalViolations = results.reduce((sum, r) => sum + r.violations, 0);
  const allPassed = results.every(r => r.passed);
  
  console.log('\n================================================');
  console.log(`\nTotal violations: ${totalViolations}`);
  console.log(`Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Guardar resumen
  const reportPath = path.join(__dirname, '../reports/summary.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalViolations,
    passed: allPassed,
    results
  }, null, 2));
  
  console.log(`📄 Full summary saved to: ${reportPath}\n`);
  
  return allPassed;
}

async function main() {
  const startTime = Date.now();
  
  const results = await runAllScans();
  const passed = generateSummary(results);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️  Scan completed in ${duration}s\n`);
  
  // Exit code basado en violaciones críticas
  const hasCriticalViolations = results.some(
    r => r.severity === 'critical' && !r.passed
  );
  
  process.exit(hasCriticalViolations ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runAllScans, generateSummary };

