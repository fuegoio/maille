# Vue.js to React Migration Plan

This document outlines the step-by-step migration process from the Vue.js application (`apps/ui`) to the React application (`apps/ui-react`).

## Current State Analysis

### Vue.js Application (apps/ui)
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia stores (10+ stores)
- **Routing**: Vue Router with 15+ routes
- **API**: GraphQL with generated TypeScript types
- **UI**: Custom design system with Tailwind CSS
- **Key Features**: Financial management, authentication, real-time sync

### React Bootstrap (apps/ui-react)
- **Framework**: React 19 with TypeScript
- **UI**: shadcn components with Tailwind CSS
- **Build**: Vite with basic configuration
- **Current State**: Minimal setup with example component

## Migration Phases

### Phase 1: Infrastructure Setup

#### Step 1.1: Update React Dependencies
```bash
cd apps/ui-react
npm install graphql-request graphql-sse @tanstack/react-query zod dayjs lodash lucide-react
npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

#### Step 1.2: Configure GraphQL Code Generation
- Copy `codegen.ts` from Vue app and adapt for React
- Update `package.json` scripts to include code generation
- Set up GraphQL client wrapper in `src/lib/gql/client.ts`

#### Step 1.3: Set Up State Management
- Install Zustand: `npm install zustand`
- Create base store structure in `src/stores/`
- Implement core store patterns equivalent to Pinia

#### Step 1.4: Configure Routing
- Install TanStack Router: `npm install @tanstack/react-router`
- Set up router configuration in `src/router/index.tsx`
- Create route types and navigation utilities
- Configure TanStack Router with Vite plugin for file-based routing

### Phase 2: Core Architecture Migration

#### Step 2.1: Migrate State Stores
For each Pinia store in Vue app:
1. Create equivalent Zustand store
2. Implement state, actions, and getters
3. Add event handling logic
4. Implement mutation success/error handlers

Priority order:
1. `auth.ts` - Authentication state
2. `accounts.ts` - Account management
3. `activities.ts` - Activity tracking
4. `projects.ts` - Project management
5. `settings.ts` - Application settings

#### Step 2.2: Implement API Service Layer
- Create `src/lib/api/client.ts` with GraphQL client
- Implement query and mutation handlers
- Set up error handling and retry logic
- Create API hooks for React components

#### Step 2.3: Set Up Routing Infrastructure
- Create route definitions matching Vue router using TanStack Router's file-based approach
- Implement route guards (authentication, etc.) using TanStack Router's `beforeLoad` hooks
- Set up route-based code splitting with TanStack Router's lazy loading
- Create navigation utilities with type-safe route references
- Configure TanStack Router's Vite plugin for optimal performance

### Phase 3: Component Migration

#### Step 3.1: Migrate Design System Components
Convert Vue design system components to React:

```bash
# Create component structure
mkdir -p src/components/design-system
```

For each component in `apps/ui/src/components/designSystem/`:
1. Create React equivalent in `src/components/design-system/`
2. Adapt props and event handling
3. Use shadcn primitives where appropriate
4. Maintain Tailwind CSS styling

Priority components:
- `TBtn.vue` → `Button.tsx`
- `TTextField.vue` → `Input.tsx`
- `TSelect.vue` → `Select.tsx`
- `TDatePicker.vue` → `DatePicker.tsx`
- `TAmountInput.vue` → `AmountInput.tsx`

#### Step 3.2: Migrate Layout Components
- Convert `App.vue` to `App.tsx`
- Create layout structure with TanStack Router's `<RouterProvider>` and outlets
- Implement responsive design patterns
- Set up global providers (theme, auth, etc.)
- Configure root route with TanStack Router's file-based routing system

#### Step 3.3: Migrate View Components
Convert Vue views to React components in priority order:

1. **Authentication**:
   - `LoginView.vue` → `LoginPage.tsx`
   - `LoadingDataView.vue` → `LoadingPage.tsx`

2. **Dashboard**:
   - `DashboardView.vue` → `DashboardPage.tsx`

3. **Settings**:
   - `SettingsView.vue` → `SettingsPage.tsx`
   - `SettingsAccountsView.vue` → `SettingsAccountsPage.tsx`
   - `SettingsActivityCategoriesView.vue` → `SettingsCategoriesPage.tsx`
   - `SettingsProfileView.vue` → `SettingsProfilePage.tsx`

4. **Financial Views**:
   - `MovementsView.vue` → `MovementsPage.tsx`
   - `ActivitiesView.vue` → `ActivitiesPage.tsx`
   - `CategoryView.vue` → `CategoryPage.tsx`

5. **Project Management**:
   - `ProjectsView.vue` → `ProjectsPage.tsx`
   - `ProjectView.vue` → `ProjectPage.tsx`

### Phase 4: Feature Implementation

#### Step 4.1: Implement Data Synchronization
- Create event handling system in Zustand stores
- Implement real-time update logic
- Set up conflict resolution for offline changes
- Create sync status indicators

#### Step 4.2: Add Utility Functions
- Migrate date formatting utilities
- Implement currency handling functions
- Create data transformation helpers
- Set up validation utilities with Zod

#### Step 4.3: Implement Forms
- Set up React Hook Form integration
- Create form validation schemas
- Implement form submission handlers
- Add form error handling

### Phase 5: Testing and Optimization

#### Step 5.1: Implement Testing
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

- Create unit tests for critical components
- Add integration tests for key user flows
- Implement end-to-end test setup
- Add test coverage reporting

#### Step 5.2: Performance Optimization
- Implement virtual scrolling for large lists
- Add memoization with `React.memo` and `useMemo`
- Set up code splitting with `React.lazy`
- Optimize bundle size and loading performance

#### Step 5.3: Accessibility Improvements
- Audit components for accessibility
- Add proper ARIA attributes
- Implement keyboard navigation
- Ensure color contrast compliance

### Phase 6: Finalization

#### Step 6.1: Update Deployment Configuration
- Configure production build settings
- Set up environment variables
- Update Docker configuration
- Create deployment scripts

#### Step 6.2: Documentation
- Create component documentation
- Update README with React-specific instructions
- Document migration decisions and patterns
- Add contribution guidelines

## Migration Checklist

- [ ] Phase 1: Infrastructure Setup
  - [ ] Update dependencies
  - [ ] Configure GraphQL codegen
  - [ ] Set up Zustand stores
  - [ ] Implement TanStack Router with Vite plugin

- [ ] Phase 2: Core Architecture
  - [ ] Migrate all Pinia stores to Zustand
  - [ ] Implement API service layer
  - [ ] Set up routing infrastructure

- [ ] Phase 3: Component Migration
  - [ ] Migrate design system components
  - [ ] Convert layout components
  - [ ] Migrate view components

- [ ] Phase 4: Feature Implementation
  - [ ] Implement data synchronization
  - [ ] Add utility functions
  - [ ] Set up forms with validation

- [ ] Phase 5: Testing and Optimization
  - [ ] Implement testing suite
  - [ ] Performance optimization
  - [ ] Accessibility improvements

- [ ] Phase 6: Finalization
  - [ ] Update deployment config
  - [ ] Complete documentation

## TanStack Router Specifics

### Why TanStack Router over React Router

1. **Type Safety**: First-class TypeScript support with type-safe route references and parameters
2. **File-based Routing**: Convention-based routing similar to Next.js, reducing boilerplate
3. **Performance**: Optimized for React 18+ with better bundle size and rendering performance
4. **Modern Features**: Built-in support for:
   - Route-based code splitting
   - Automatic route preloading
   - Type-safe search params and route matching
   - Nested route layouts

### TanStack Router Configuration

#### Basic Setup

1. **Install required packages**:
```bash
npm install @tanstack/react-router @tanstack/router-vite-plugin
```

2. **Configure Vite plugin** in `vite.config.ts`:
```typescript
import { tanstackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    tanstackRouterVite(),
  ],
})
```

3. **Create route structure**:
```
src/
  routes/
    __root.tsx       # Root route
    index.tsx        # Home route
    about.tsx        # About route
    dashboard/
      index.tsx      # Dashboard home
      stats.tsx      # Dashboard stats
```

#### Route Definition Example

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

#### Route with Parameters

```typescript
// src/routes/projects/$projectId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectPage,
  parseParams: (params) => ({
    projectId: z.string().uuid().parse(params.projectId),
  }),
  beforeLoad: async ({ params }) => {
    // Authentication guard
    const auth = await checkAuth()
    if (!auth) {
      throw redirect({ to: '/login' })
    }
    // Data loading
    const project = await fetchProject(params.projectId)
    return { project }
  },
})
```

#### Navigation Utilities

```typescript
// src/lib/navigation.ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Set up the router
export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Type-safe navigation functions
export const navigateToDashboard = () => {
  router.navigate({ to: '/dashboard' })
}

export const navigateToProject = (projectId: string) => {
  router.navigate({ to: '/projects/$projectId', params: { projectId } })
}
```

## Technical Decisions

### State Management
- **Choice**: Zustand over React Context
- **Reason**: Simpler API, better performance, closer to Pinia's reactivity model
- **Implementation**: Create stores with state, actions, and selectors

### Routing
- **Choice**: TanStack Router
- **Reason**: Modern routing solution with first-class TypeScript support, file-based routing, and better performance
- **Implementation**: File-based routing, route-based code splitting, route guards, and type-safe navigation

### Forms
- **Choice**: React Hook Form + Zod
- **Reason**: Excellent TypeScript support, validation integration, performance
- **Implementation**: Schema-based validation, form state management

### GraphQL
- **Choice**: Continue with graphql-request
- **Reason**: Lightweight, familiar to existing codebase
- **Implementation**: Query/mutation hooks, error handling

## Risk Mitigation

### High Risk Items
1. **State Management Migration**: 
   - Strategy: Implement stores incrementally, test thoroughly
   - Fallback: Create compatibility layer if needed

2. **Real-time Sync Logic**:
   - Strategy: Implement event handling early, test with mock data
   - Fallback: Use simpler polling mechanism initially

### Testing Strategy
- Unit tests for all critical components
- Integration tests for key user flows
- End-to-end tests for authentication and data sync
- Performance testing for large datasets

## Success Criteria

1. **Functional Parity**: All Vue app features work in React
2. **Performance**: React app meets or exceeds Vue app performance
3. **Code Quality**: TypeScript coverage, proper error handling
4. **Developer Experience**: Clear documentation, consistent patterns
5. **User Experience**: No regression in functionality or accessibility

## Timeline Estimation

- **Phase 1**: 1-2 days
- **Phase 2**: 3-5 days
- **Phase 3**: 5-7 days
- **Phase 4**: 3-4 days
- **Phase 5**: 2-3 days
- **Phase 6**: 1 day

**Total**: 2-3 weeks for complete migration

## Getting Started

To begin the migration:

```bash
# Start with infrastructure setup
cd apps/ui-react
npm install graphql-request graphql-sse @tanstack/react-query zustand @tanstack/react-router @tanstack/router-vite-plugin

# Copy necessary configuration files
cp ../ui/codegen.ts .
cp ../ui/schema.graphql .

# Update package.json scripts
# Add GraphQL code generation and build commands
```

Then configure TanStack Router in your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    tanstackRouterVite(),
  ],
})
```

Then proceed with Phase 1 steps as outlined above.