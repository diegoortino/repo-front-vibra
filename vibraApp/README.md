# React + TypeScript

docs/                       # All technical documentation related for desein this project.
│   ├── images/
│   ├── docs/
│   └── others/
│
public/                     # Static assets like index.html and favicons
│   ├── data/data.json      # Mock data (json server)
│   ├── index.html
│   └── favicon.ico
src/
│   ├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── components/
│   ├── common/ (for highly reusable, generic components like buttons, inputs)
│   ├── specific/ (for components specific to a feature or page)
│   └── layouts/ (for components defining page structure like headers, footers)
├── contexts/ (for React Context API providers and related logic)
├── hooks/ (for custom reusable React Hooks)
├── pages/ or views/ (for top-level components representing application pages or routes)
│   ├── HomePage/
│   │   ├── index.js
│   │   └── HomePageComponents/
│   ├── LoginPage/
│   │   ├── index.js
│   │   └── LoginForm.js
│   └── ...
├── services/ or api/ (for API calls and external service integrations)
├── types/ (for to keep all your types and interfaces.)
├── store/ (for state management, e.g., Redux, Zustand, including actions, reducers, etc.)
├── styles/ (for global styles, themes, utility CSS)
├── utils/ or helpers/ (for reusable utility functions)
├── App.js
├── index.js
└── reportWebVitals.js


# Key Considerations:

    Grouping by Feature or Route:
    This approach places all related files for a specific feature or page (components, hooks, styles, tests) within a single directory, improving locality and making it easier to understand and modify features.
    
    Grouping by File Type:
    This method organizes files based on their type (e.g., all components in components/, all hooks in hooks/). This can be simpler for smaller projects.
    
    Scalability:
    For larger applications, a feature-based structure often proves more scalable, as it minimizes cross-directory dependencies and facilitates team collaboration.
    
    Atomic Design Principles:
    Some projects adopt principles like Atomic Design, categorizing components as atoms, molecules, organisms, templates, and pages for a structured hierarchy.
    
    Testing:
    Placing tests alongside the code they test (e.g., ComponentName.test.js within the ComponentName folder) can improve test discoverability and organization.

# Naming convention for files in react project

1. Components:

    PascalCase for Component Files:
    Files containing React components should be named using PascalCase (e.g., MyComponent.jsx, UserProfile.tsx). This clearly distinguishes them as components.
    Match Component Name to File Name:
    The component's name should match its file name (e.g., a component named UserProfile should reside in UserProfile.jsx).

2. Other Files (Non-Components):

    Kebab-case or CamelCase for Non-Component Files: For files that do not export React components (e.g., utility functions, services, hooks), use either kebab-case (e.g., auth-service.js, use-data-fetch.ts) or camelCase (e.g., authService.js, useDataFetch.ts). Consistency within your project is key.

3. Index Files:

    index.js or index.ts: Often used for barrel files to export multiple modules from a directory, or as the main entry point for a feature or component group.

4. Folder Names:

    Kebab-case or CamelCase: Folder names typically follow kebab-case (e.g., components, pages, utils, services) or camelCase (e.g., components, pages, utils, services).

General Considerations:

    Descriptive Names: Choose names that clearly indicate the file's purpose and content.
    Consistency: The most important aspect is to establish and adhere to a consistent naming convention throughout your entire project. This improves collaboration and reduces confusion for all developers working on the codebase.
    Avoid Special Characters: Stick to alphanumeric characters, hyphens, and underscores to prevent potential issues across different operating systems or tools.

    Consistent file naming in React improves readability and maintainability, but different projects may use varying conventions
    . The most common approach is to use PascalCase for files that contain React components and kebab-case for everything else. 
    For components
    Name your component files using PascalCase and match the file name to the component's name. This practice aligns with how components are declared and referenced in JSX, starting with a capital letter. 

# Examples:
Example:

    Component file: UserProfileCard.jsx
    Component export: export default function UserProfileCard() { ... } 

For an index.js or index.jsx file inside a component directory, the component is often named after the directory. 
Example:

    Component directory: src/components/UserProfileCard/
    Component file: index.jsx
    Component export: export default function UserProfileCard() { ... } 

For other files
Use kebab-case for file names that do not contain a React component, such as:

    Utility files
    Asset files
    CSS or other style files 

Examples:

    api-service.js
    date-utils.js
    main-logo.svg
    global-styles.css

For CSS modules
When using CSS modules, files are named with the .module.css extension to scope the styles locally. The rest of the file name can follow kebab-case. 
Example:

    user-profile-card.module.css

For custom hooks
Custom hooks should be named using camelCase for consistency with other JavaScript functions, but the file containing the hook may follow kebab-case or camelCase depending on your project's convention. 
Example:

    Hook function: function useUserData() { ... }
    Hook file (Option 1): use-user-data.js
    Hook file (Option 2): useUserData.js 

Best practices for a consistent approach

    Be descriptive: Use clear, explicit names to make the purpose of each file obvious at a glance.
    Stay consistent: Whatever convention you choose, ensure the entire team follows it. Consistency is more important than the specific convention.
    Use ESLint: Tools like ESLint can help you enforce your chosen naming conventions and style rules automatically. 
