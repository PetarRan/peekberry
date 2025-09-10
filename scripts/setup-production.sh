#!/bin/bash

# 🚀 Peekberry Production Setup Script
# This script helps set up your production environment

set -e

echo "🎯 Setting up Peekberry for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_status "Dependencies check passed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm ci
    print_status "Dependencies installed"
}

# Build the webapp
build_webapp() {
    print_info "Building webapp for production..."
    npm run build
    print_status "Webapp built successfully"
}

# Build the extension
build_extension() {
    print_info "Building Chrome extension for production..."
    npm run build:extension:prod
    print_status "Extension built successfully"
}

# Create production environment template
create_env_template() {
    if [ ! -f ".env.production" ]; then
        print_info "Creating production environment template..."
        cat > .env.production << EOF
# 🌐 Peekberry Production Environment Variables
# Copy this file and fill in your actual values

# Next.js
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Clerk Authentication (Get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase (Get from https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT Secret for extension tokens (Generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-...
EOF
        print_status "Production environment template created"
        print_warning "Please edit .env.production with your actual values"
    else
        print_info "Production environment file already exists"
    fi
}

# Create deployment package
create_deployment_package() {
    print_info "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment
    
    # Copy built webapp
    cp -r .next deployment/
    cp -r public deployment/
    cp package.json deployment/
    cp package-lock.json deployment/
    
    # Copy built extension
    mkdir -p deployment/extension
    cp -r dist/extension/* deployment/extension/
    
    # Create extension zip
    cd deployment/extension
    zip -r ../peekberry-extension-v1.0.0.zip .
    cd ../..
    
    print_status "Deployment package created in ./deployment/"
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    # Check if test script exists
    if npm run test --silent 2>/dev/null; then
        print_status "All tests passed"
    else
        print_warning "No tests found or tests failed"
    fi
}

# Main setup function
main() {
    echo "🎯 Peekberry Production Setup"
    echo "=============================="
    
    check_dependencies
    install_dependencies
    create_env_template
    
    # Ask user if they want to build now
    read -p "Do you want to build the application now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_webapp
        build_extension
        create_deployment_package
    fi
    
    echo
    echo "🎉 Setup complete!"
    echo
    print_info "Next steps:"
    echo "1. Edit .env.production with your actual values"
    echo "2. Set up your Supabase database (see DEPLOYMENT_GUIDE.md)"
    echo "3. Configure Clerk authentication"
    echo "4. Deploy to your hosting provider"
    echo "5. Submit extension to Chrome Web Store"
    echo
    print_info "For detailed instructions, see DEPLOYMENT_GUIDE.md"
}

# Run main function
main "$@"