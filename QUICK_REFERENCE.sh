#!/bin/bash
# Quick Reference Card - Copy & Paste This
# Supabase + Clerk + GitHub Copilot Integration

echo "═══════════════════════════════════════════════════════════════"
echo "  IDEAS CONTENT ENGINE - Integration Setup Reference"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 DOCUMENTATION FILES${NC}"
echo "├─ 00_START_HERE.md ..................... Read this first!"
echo "├─ QUICKSTART.md ........................ 15-min setup"
echo "├─ INTEGRATION_SETUP.md ................ Full setup guide"
echo "├─ ARCHITECTURE.md ..................... Visual diagrams"
echo "├─ DEVELOPER_REFERENCE.md .............. Code examples"
echo "└─ INTEGRATION_INDEX.md ................ Documentation index"
echo ""

echo -e "${BLUE}🔑 CREDENTIALS YOU NEED${NC}"
echo "From Supabase (supabase.com):"
echo "  • NEXT_PUBLIC_SUPABASE_URL"
echo "  • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  • SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "From Clerk (clerk.com):"
echo "  • NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "  • CLERK_SECRET_KEY"
echo ""
echo "Optional:"
echo "  • OPENAI_API_KEY (for auto-generation)"
echo "  • GITHUB_TOKEN (for PR publishing)"
echo ""

echo -e "${BLUE}⚙️  .ENV.LOCAL TEMPLATE${NC}"
cat > /tmp/env_template.txt << 'EOF'
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Copilot (Optional - use defaults below)
COPILOT_ENABLED=true
COPILOT_USE_OPENAI=false
OPENAI_API_KEY=sk-xxxxx

# GitHub (Optional)
GITHUB_TOKEN=ghp_xxxxx
GITHUB_TARGET_REPO=username/blog-repo

# Feature Flags
USE_SUPABASE=true
USE_LOCAL_KNOWLEDGE=false
DEV_AUTH_DISABLED=false
EOF
echo "See .env.example for complete template"
echo ""

echo -e "${BLUE}🚀 SETUP TIMELINE${NC}"
echo "Step 1 (5 min):   Create Supabase account → Get credentials"
echo "Step 2 (5 min):   Create Clerk account → Get credentials"
echo "Step 3 (3 min):   Add credentials to .env.local"
echo "Step 4 (1 min):   Run Supabase migrations"
echo "Step 5 (1 min):   npm run dev"
echo ""

echo -e "${BLUE}✅ QUICK VERIFICATION${NC}"
echo "$ npm run dev"
echo "$ curl http://localhost:3000"
echo "$ Visit http://localhost:3000/sign-in"
echo "$ Create test account"
echo "$ Try creating an idea"
echo ""

echo -e "${BLUE}📝 NEW FILES CREATED${NC}"
echo "Code:"
echo "  • middleware.ts"
echo "  • lib/clerk.ts"
echo "  • lib/supabase.ts (updated)"
echo "  • pages/api/ai/copilot.ts"
echo ""
echo "Documentation (7 files):"
echo "  • 00_START_HERE.md"
echo "  • QUICKSTART.md"
echo "  • INTEGRATION_SETUP.md"
echo "  • ARCHITECTURE.md"
echo "  • DEVELOPER_REFERENCE.md"
echo "  • INTEGRATION_COMPLETE.md"
echo "  • INTEGRATION_FILES.md"
echo ""

echo -e "${BLUE}🎯 NEXT STEP${NC}"
echo -e "${GREEN}Open: 00_START_HERE.md${NC}"
echo "or"
echo -e "${GREEN}Open: QUICKSTART.md${NC}"
echo ""

echo "═══════════════════════════════════════════════════════════════"

