#!/bin/bash

# COPILOT AUTO-GENERATION TESTING CHECKLIST
# ==========================================
# This script helps verify the implementation is working correctly

echo "🔍 Copilot Auto-Generation Implementation Verification"
echo "======================================================"
echo ""

# Check 1: Verify environment configuration
echo "✓ Check 1: Environment Configuration"
echo "  AI_PROVIDER should be 'github'"
grep "^AI_PROVIDER=" .env.local || echo "  ⚠️  AI_PROVIDER not set"

echo "  COPILOT_CLI_BIN should be 'copilot'"
grep "^COPILOT_CLI_BIN=" .env.local || echo "  ⚠️  COPILOT_CLI_BIN not set"
echo ""

# Check 2: Verify Frontend Code
echo "✓ Check 2: Frontend Implementation"
echo "  Looking for handleGenerateIdeas function..."
grep -q "handleGenerateIdeas" app/ideas/page.tsx && echo "  ✓ Found handleGenerateIdeas" || echo "  ✗ Missing handleGenerateIdeas"

echo "  Looking for topic state variable..."
grep -q "const \[topic" app/ideas/page.tsx && echo "  ✓ Found topic state" || echo "  ✗ Missing topic state"

echo "  Looking for AI generation UI section..."
grep -q "Generate Ideas with AI" app/ideas/page.tsx && echo "  ✓ Found AI generation section" || echo "  ✗ Missing UI section"
echo ""

# Check 3: Verify API Integration
echo "✓ Check 3: API Integration"
echo "  Looking for agent endpoint..."
if [ -f "pages/api/ai/agent.ts" ]; then
  echo "  ✓ Found /api/ai/agent endpoint"
  grep -q "generateIdeas" pages/api/ai/agent.ts && echo "  ✓ Supports generateIdeas action" || echo "  ⚠️  generateIdeas action not found"
else
  echo "  ✗ Missing /api/ai/agent endpoint"
fi
echo ""

# Check 4: Verify AgentProvider
echo "✓ Check 4: AgentProvider Implementation"
if [ -f "lib/ai/agentProvider.ts" ]; then
  echo "  ✓ Found AgentProvider"
  grep -q "generateIdeas" lib/ai/agentProvider.ts && echo "  ✓ generateIdeas method exists" || echo "  ⚠️  generateIdeas method not found"
else
  echo "  ✗ Missing AgentProvider"
fi
echo ""

# Check 5: Verify GitHubModelsProvider
echo "✓ Check 5: GitHub Models Provider"
if [ -f "lib/ai/githubProvider.ts" ]; then
  echo "  ✓ Found GitHubModelsProvider"
  grep -q "copilot" lib/ai/githubProvider.ts && echo "  ✓ Tries copilot command" || echo "  ⚠️  copilot command not found"
else
  echo "  ✗ Missing GitHubModelsProvider"
fi
echo ""

# Check 6: Docker Configuration
echo "✓ Check 6: Docker Configuration"
if [ -f "docker-compose.yml" ]; then
  echo "  ✓ Found docker-compose.yml"
  grep -q "copilot_boot" docker-compose.yml && echo "  ✓ copilot_boot service configured" || echo "  ⚠️  copilot_boot not configured"
else
  echo "  ✗ Missing docker-compose.yml"
fi
echo ""

# Check 7: Files Status
echo "✓ Check 7: Documentation Files"
[ -f "COPILOT_IDEAS_GUIDE.md" ] && echo "  ✓ COPILOT_IDEAS_GUIDE.md exists" || echo "  ⚠️  COPILOT_IDEAS_GUIDE.md missing"
[ -f "IMPLEMENTATION_SUMMARY.md" ] && echo "  ✓ IMPLEMENTATION_SUMMARY.md exists" || echo "  ⚠️  IMPLEMENTATION_SUMMARY.md missing"
echo ""

# Summary
echo "======================================================"
echo "Verification complete! Ready to test implementation:"
echo ""
echo "1. Start Docker:"
echo "   docker compose up"
echo ""
echo "2. Wait for copilot_boot service to complete (download Copilot CLI)"
echo ""
echo "3. Open browser to: http://localhost:3000/ideas"
echo ""
echo "4. Test the feature:"
echo "   - Enter a topic (e.g., 'AI in software development')"
echo "   - Set idea count to 5"
echo "   - Click '✨ Generate Ideas'"
echo "   - Wait for generation (2-5 seconds)"
echo "   - Review the JSON output"
echo "   - Click 'Import Ideas' to save"
echo ""
echo "5. Verify ideas appear in the table below"
echo ""
echo "See COPILOT_IDEAS_GUIDE.md for full usage instructions"
echo "======================================================"

