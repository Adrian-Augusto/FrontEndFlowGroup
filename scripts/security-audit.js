#!/usr/bin/env node

/**
 * 🔒 Security Audit Script
 * Verifica headers de segurança críticos em um domínio
 * 
 * Uso: node scripts/security-audit.js https://seu-site.com
 */

const url = process.argv[2];

if (!url) {
  console.log("\n📌 Uso: node security-audit.js https://seu-site.com\n");
  process.exit(1);
}

// Validar URL
try {
  new URL(url);
} catch {
  console.error("\n❌ URL inválida:", url);
  process.exit(1);
}

// Headers críticos de segurança
const CRITICAL_HEADERS = [
  {
    name: "content-security-policy",
    level: "critical",
    description: "Previne XSS e ataques de injeção"
  },
  {
    name: "strict-transport-security",
    level: "critical",
    description: "Força HTTPS em todas as conexões"
  },
  {
    name: "x-frame-options",
    level: "critical",
    description: "Previne clickjacking"
  },
  {
    name: "x-content-type-options",
    level: "high",
    description: "Previne MIME type sniffing"
  },
  {
    name: "referrer-policy",
    level: "high",
    description: "Controla informações de referência"
  },
  {
    name: "permissions-policy",
    level: "medium",
    description: "Controla APIs do navegador"
  },
  {
    name: "x-xss-protection",
    level: "medium",
    description: "Proteção contra XSS (legado)"
  }
];

async function auditSecurity() {
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("🔒 AUDITORIA DE SEGURANÇA");
    console.log(`${"=".repeat(60)}\n`);
    console.log(`📍 Alvo: ${url}\n`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow"
    });

    clearTimeout(timeoutId);

    const headers = res.headers;
    const results = {
      critical: { found: 0, missing: 0 },
      high: { found: 0, missing: 0 },
      medium: { found: 0, missing: 0 }
    };

    console.log(`📊 Status HTTP: ${res.status} ${res.statusText}`);
    console.log(`🔗 URL final: ${res.url}\n`);
    console.log(`${"─".repeat(60)}`);
    console.log("HEADERS DE SEGURANÇA:\n");

    // Verificar headers críticos
    CRITICAL_HEADERS.forEach(({ name, level, description }) => {
      const value = headers.get(name);
      const status = value ? "✅" : "❌";
      
      if (value) {
        results[level].found++;
        console.log(`${status} [${level.toUpperCase()}] ${name}`);
        console.log(`   📝 ${description}`);
        console.log(`   💾 Valor: ${value.substring(0, 80)}${value.length > 80 ? "..." : ""}\n`);
      } else {
        results[level].missing++;
        console.log(`${status} [${level.toUpperCase()}] ${name}`);
        console.log(`   📝 ${description}\n`);
      }
    });

    // Resumo final
    console.log(`${"─".repeat(60)}`);
    console.log("📋 RESUMO:\n");

    const criticalScore = (results.critical.found / (results.critical.found + results.critical.missing)) * 100;
    const totalHeaders = CRITICAL_HEADERS.length;
    const foundHeaders = results.critical.found + results.high.found + results.medium.found;

    console.log(`⚡ Headers Críticos: ${results.critical.found}/${results.critical.found + results.critical.missing} (${criticalScore.toFixed(0)}%)`);
    console.log(`📌 Headers de Alto Nível: ${results.high.found}/${results.high.found + results.high.missing}`);
    console.log(`ℹ️  Headers Médios: ${results.medium.found}/${results.medium.found + results.medium.missing}`);
    console.log(`\n🎯 Score Total: ${foundHeaders}/${totalHeaders} headers (${((foundHeaders / totalHeaders) * 100).toFixed(0)}%)\n`);

    // Recomendações
    if (foundHeaders < totalHeaders) {
      console.log("💡 RECOMENDAÇÕES:\n");
      
      if (!headers.get("content-security-policy")) {
        console.log("  1️⃣  Configure CSP (Content-Security-Policy) para prevenir XSS");
      }
      if (!headers.get("strict-transport-security")) {
        console.log("  2️⃣  Ative HSTS (Strict-Transport-Security) para forçar HTTPS");
      }
      if (!headers.get("x-frame-options")) {
        console.log("  3️⃣  Configure X-Frame-Options para prevenir clickjacking");
      }
      if (!headers.get("permissions-policy")) {
        console.log("  4️⃣  Configure Permissions-Policy para restringir APIs do navegador");
      }
      console.log("\n");
    }

    console.log(`${"=".repeat(60)}\n`);

    // Exit code baseado no score
    process.exit(foundHeaders === totalHeaders ? 0 : 1);

  } catch (err) {
    if (err.name === "AbortError") {
      console.error("❌ Erro: Timeout na requisição (10s)");
    } else {
      console.error("❌ Erro ao acessar URL:", err.message);
    }
    process.exit(1);
  }
}

auditSecurity();
