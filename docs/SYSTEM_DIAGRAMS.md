# Unit-Trek System Diagrams

## Table of Contents
1. [Context Diagrams](#1-context-diagrams)
2. [Container Diagrams](#2-container-diagrams)
3. [Component Diagrams](#3-component-diagrams)
4. [Sequence Diagrams](#4-sequence-diagrams)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Deployment Diagrams](#6-deployment-diagrams)

---

## 1. Context Diagrams

### 1.1 System Context Overview

```mermaid
graph TB
    subgraph "Users & Stakeholders"
        Admin[Inventory Administrator]
        Manager[Warehouse Manager]
        Staff[Warehouse Staff]
        Auditor[Auditor/Reviewer]
    end

    subgraph "External Systems"
        Barcode[Barcode Scanners<br/>Mobile Devices]
        Email[Email System<br/>Notifications]
        Excel[Excel Files<br/>Import/Export]
        ERP[ERP Systems<br/>Future Integration]
    end

    subgraph "Unit-Trek System"
        UT[Unit-Trek<br/>Inventory Management System]
    end

    %% User interactions with UT
    Admin --> UT "User management<br/>System configuration<br/>Analytics & reporting"
    Manager --> UT "Warehouse management<br/>Inventory oversight<br/>Movement approval"
    Staff --> UT "Item scanning<br/>Movement recording<br/>Stock checks"
    Auditor --> UT "History review<br/>Audit reports<br/>Compliance checks"

    %% External system interactions
    Barcode --> UT "Barcode input<br/>Item identification"
    Excel <--> UT "Data import<br/>Report export"
    UT --> Email "Notifications<br/>Alerts<br/>Reports"
    ERP <--> UT "Data synchronization<br/>Future integration"

    %% Styling
    classDef user fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef system fill:#e8f5e8,stroke:#1b5e20,stroke-width:3px

    class Admin,Manager,Staff,Auditor user
    class Barcode,Email,Excel,ERP external
    class UT system
```

### 1.2 Business Context

```mermaid
graph TB
    subgraph "Business Processes"
        Receiving[Goods Receiving]
        Picking[Order Picking]
        StockAdjust[Stock Adjustment]
        Auditing[Stock Auditing]
        Reporting[Management Reporting]
    end

    subgraph "Unit-Trek Capabilities"
        MultiWarehouse[Multi-Warehouse Support]
        BarcodeMgmt[Barcode Management]
        Tracking[Real-time Tracking]
        Analytics[Analytics & Insights]
        Notifications[Alert System]
    end

    subgraph "Business Outcomes"
        Efficiency[Operational Efficiency]
        Accuracy[Inventory Accuracy]
        Compliance[Regulatory Compliance]
        Insights[Business Intelligence]
    end

    %% Process to capabilities
    Receiving --> MultiWarehouse
    Receiving --> BarcodeMgmt
    Picking --> Tracking
    StockAdjust --> Tracking
    Auditing --> Analytics
    Reporting --> Analytics

    %% Capabilities to outcomes
    MultiWarehouse --> Efficiency
    BarcodeMgmt --> Accuracy
    Tracking --> Accuracy
    Analytics --> Insights
    Notifications --> Compliance

    %% Styling
    classDef process fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef capability fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef outcome fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class Receiving,Picking,StockAdjust,Auditing,Reporting process
    class MultiWarehouse,BarcodeMgmt,Tracking,Analytics,Notifications capability
    class Efficiency,Accuracy,Compliance,Insights outcome
```

---

## 2. Container Diagrams

### 2.1 High-Level Container Architecture

```mermaid
graph TB
    subgraph "User Interface Layer"
        WebApp[React Web Application<br/>Single Page Application]
        MobileApp[Mobile App<br/>Future Enhancement]
    end

    subgraph "Application Layer"
        APIGateway[API Gateway<br/>Rate Limiting & Routing]
        AuthService[Authentication Service<br/>JWT Management]
        InventoryAPI[Inventory API<br/>Core Business Logic]
        ReportingAPI[Reporting API<br/>Analytics & Reports]
    end

    subgraph "Integration Layer"
        EmailService[Email Service<br/>Notifications]
        FileService[File Service<br/>Excel Processing]
        BarcodeService[Barcode Service<br/>Scanning & Generation]
    end

    subgraph "Data Layer"
        Database[(PostgreSQL/MySQL<br/>Primary Database)]
        FileStorage[File Storage<br/>Uploads & Exports]
        Cache[Cache Layer<br/>Redis - Future]
    end

    subgraph "Monitoring & Observability"
        Logging[Logging Service<br/>Winston/ELK]
        Monitoring[Performance Monitoring<br/>APM - Future]
        ErrorTracking[Error Tracking<br/>Sentry - Future]
    end

    %% User Interface connections
    WebApp --> APIGateway
    MobileApp --> APIGateway

    %% API Gateway routing
    APIGateway --> AuthService
    APIGateway --> InventoryAPI
    APIGateway --> ReportingAPI

    %% Service dependencies
    AuthService --> Database
    InventoryAPI --> Database
    InventoryAPI --> Cache
    ReportingAPI --> Database
    ReportingAPI --> Cache

    %% Integration dependencies
    InventoryAPI --> EmailService
    InventoryAPI --> FileService
    InventoryAPI --> BarcodeService
    ReportingAPI --> FileService
    ReportingAPI --> EmailService

    %% File storage
    FileService --> FileStorage

    %% Monitoring
    AuthService --> Logging
    InventoryAPI --> Logging
    ReportingAPI --> Logging
    InventoryAPI --> Monitoring
    InventoryAPI --> ErrorTracking

    %% Styling
    classDef ui fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef app fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef integration fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef monitoring fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class WebApp,MobileApp ui
    class APIGateway,AuthService,InventoryAPI,ReportingAPI app
    class EmailService,FileService,BarcodeService integration
    class Database,FileStorage,Cache data
    class Logging,Monitoring,ErrorTracking monitoring
```

### 2.2 Detailed Container Interactions

```mermaid
sequenceDiagram
    participant User as User
    participant WebApp as React SPA
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant API as Inventory API
    participant DB as Database
    participant Email as Email Service
    participant File as File Service

    User->>WebApp: Login request
    WebApp->>Gateway: POST /api/auth/login
    Gateway->>Auth: Authenticate credentials
    Auth->>DB: Validate user
    DB-->>Auth: User data
    Auth-->>Gateway: JWT tokens
    Gateway-->>WebApp: Auth response
    WebApp-->>User: Login success

    User->>WebApp: Create movement
    WebApp->>Gateway: POST /api/movements
    Gateway->>API: Validated request
    API->>DB: Record movement
    DB-->>API: Success confirmation
    API->>Email: Send notification
    API-->>Gateway: Movement data
    Gateway-->>WebApp: Response
    WebApp-->>User: Movement created

    User->>WebApp: Export report
    WebApp->>Gateway: GET /api/reports/export
    Gateway->>API: Report request
    API->>DB: Query data
    DB-->>API: Report data
    API->>File: Generate Excel
    File-->>API: File URL
    API-->>Gateway: Download link
    Gateway-->>WebApp: Response
    WebApp-->>User: Download starts
```

---

## 3. Component Diagrams

### 3.1 Frontend Component Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        subgraph "Pages"
            Dashboard[Dashboard Page<br/>Analytics & KPIs]
            Inventory[Inventory Page<br/>Item Management]
            Movement[Movement Page<br/>Stock Operations]
            History[History Page<br/>Audit Trail]
            Warehouse[Warehouse Page<br/>Location Management]
            Analytics[Analytics Page<br/>Advanced Reports]
            Barcode[Barcode Tools<br/>Scanning & Gen]
        end

        subgraph "Shared Components"
            Layout[App Layout<br/>Navigation & Header]
            ThemeProvider[Theme Provider<br/>Dark/Light Mode]
            I18nProvider[Internationalization<br/>EN/AR Support]
            ErrorBoundary[Error Boundary<br/>Error Handling]
        end
    end

    subgraph "Component Library"
        subgraph "UI Components"
            Forms[Form Components<br/>Input & Validation]
            Tables[Table Components<br/>Data Display]
            Charts[Chart Components<br/>Data Visualization]
            Dialogs[Dialog Components<br/>Modals & Overlays]
            Notifications[Toast Notifications<br/>User Feedback]
        end

        subgraph "Business Components"
            ItemCard[Item Card<br/>Item Display]
            MovementForm[Movement Form<br/>Stock Operations]
            BarcodeScanner[Barcode Scanner<br/>Scanning Interface]
            SearchFilters[Search Filters<br/>Data Filtering]
            DataTable[Data Table<br/>Sortable/Paginated]
        end
    end

    subgraph "State Management"
        subgraph "Contexts"
            AuthContext[Authentication Context<br/>User Session]
            WarehouseContext[Warehouse Context<br/>Selected Warehouse]
            InventoryContext[Inventory Context<br/>Items & Movements]
            ThemeContext[Theme Context<br/>UI Theme]
            LocaleContext[Locale Context<br/>Language]
            NotificationContext[Notification Context<br/>System Messages]
        end

        subgraph "Data Layer"
            ApiClient[API Client<br/>HTTP Requests]
            QueryClient[React Query<br/>Server State]
            LocalStorage[Local Storage<br/>User Preferences]
        end
    end

    subgraph "Utilities"
        Hooks[Custom Hooks<br/>Business Logic]
        Utils[Utility Functions<br/>Helpers & Tools]
        Validators[Form Validators<br/>Input Validation]
        Formatters[Data Formatters<br/>Display Formatting]
    end

    %% Page connections
    Dashboard --> Charts
    Dashboard --> DataTable
    Inventory --> ItemCard
    Inventory --> SearchFilters
    Movement --> MovementForm
    Movement --> BarcodeScanner
    History --> DataTable
    Analytics --> Charts
    Barcode --> BarcodeScanner

    %% Layout connections
    Layout --> Dashboard
    Layout --> Inventory
    Layout --> Movement
    Layout --> History
    Layout --> Warehouse
    Layout --> Analytics
    Layout --> Barcode

    %% Theme and providers
    ThemeProvider --> Layout
    I18nProvider --> Layout
    ErrorBoundary --> Layout

    %% Component library usage
    Forms --> MovementForm
    Tables --> DataTable
    Charts --> Charts
    Dialogs --> Forms
    Notifications --> Layout

    %% State management
    AuthContext --> ApiClient
    WarehouseContext --> ApiClient
    InventoryContext --> QueryClient
    ThemeContext --> ThemeProvider
    LocaleContext --> I18nProvider
    NotificationContext --> Notifications

    %% Data layer
    ApiClient --> QueryClient
    QueryClient --> LocalStorage

    %% Utilities usage
    Hooks --> Forms
    Utils --> ItemCard
    Validators --> Forms
    Formatters --> DataTable

    %% Styling
    classDef page fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef shared fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef component fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef state fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef utility fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class Dashboard,Inventory,Movement,History,Warehouse,Analytics,Barcode page
    class Layout,ThemeProvider,I18nProvider,ErrorBoundary shared
    class Forms,Tables,Charts,Dialogs,Notifications,ItemCard,MovementForm,BarcodeScanner,SearchFilters,DataTable component
    class AuthContext,WarehouseContext,InventoryContext,ThemeContext,LocaleContext,NotificationContext,ApiClient,QueryClient,LocalStorage state
    class Hooks,Utils,Validators,Formatters utility
```

### 3.2 Backend Component Architecture

```mermaid
graph TB
    subgraph "API Layer"
        subgraph "Route Handlers"
            AuthRoutes[Auth Routes<br/>/api/auth/*]
            UserRoutes[User Routes<br/>/api/users/*]
            WarehouseRoutes[Warehouse Routes<br/>/api/warehouses/*]
            ItemRoutes[Item Routes<br/>/api/items/*]
            MovementRoutes[Movement Routes<br/>/api/movements/*]
            HistoryRoutes[History Routes<br/>/api/history/*]
            UnitRoutes[Unit Routes<br/>/api/units/*]
        end

        subgraph "Middleware"
            AuthMiddleware[JWT Authentication<br/>Token Validation]
            ValidationMiddleware[Request Validation<br/>Zod Schemas]
            ErrorMiddleware[Error Handling<br/>Graceful Responses]
            RateLimitMiddleware[Rate Limiting<br/>Abuse Prevention]
            CorsMiddleware[CORS Handling<br/>Cross-Origin Requests]
            LoggingMiddleware[Request Logging<br/>Audit Trail]
        end
    end

    subgraph "Business Logic Layer"
        subgraph "Services"
            AuthService[Auth Service<br/>User Management]
            UserService[User Service<br/>Profile Management]
            WarehouseService[Warehouse Service<br/>Location Management]
            ItemService[Item Service<br/>Inventory Management]
            MovementService[Movement Service<br/>Stock Operations]
            HistoryService[History Service<br/>Audit Management]
            UnitService[Unit Service<br/>Measurement Units]
            EmailService[Email Service<br/>Notifications]
        end

        subgraph "Business Rules"
            ValidationRules[Validation Rules<br/>Business Logic]
            PermissionRules[Permission Rules<br/>Access Control]
            NotificationRules[Notification Rules<br/>Alert Logic]
            AuditRules[Audit Rules<br/>Logging Rules]
        end
    end

    subgraph "Data Access Layer"
        subgraph "Database Components"
            DatabaseAdapter[Database Adapter<br/>Multi-DB Support]
            ConnectionPool[Connection Pool<br/>DB Connections]
            TransactionManager[Transaction Manager<br/>ACID Operations]
            MigrationEngine[Migration Engine<br/>Schema Management]
        end

        subgraph "Models & Schemas"
            UserModel[User Model<br/>profiles table]
            WarehouseModel[Warehouse Model<br/>warehouses table]
            ItemModel[Item Model<br/>items table]
            MovementModel[Movement Model<br/>history_entries table]
            UnitModel[Unit Model<br/>units table]
        end
    end

    subgraph "Infrastructure"
        subgraph "Security"
            JWTManager[JWT Manager<br/>Token Operations]
            PasswordHasher[Password Hasher<br/>bcrypt]
            InputSanitizer[Input Sanitizer<br/>XSS Prevention]
            RateLimitStore[Rate Limit Store<br/>Memory Store]
        end

        subgraph "Monitoring"
            Logger[Winston Logger<br/>Structured Logs]
            MetricsCollector[Metrics Collector<br/>Performance Data]
            HealthChecker[Health Checker<br/>System Status]
        end

        subgraph "Utilities"
            ErrorHandler[Error Handler<br/>Centralized Errors]
            ResponseFormatter[Response Formatter<br/>Standard Responses]
            DateHelper[Date Helper<br/>Date Operations]
            Validator[Validator<br/>Input Validation]
        end
    end

    %% Route to middleware flow
    AuthRoutes --> AuthMiddleware
    UserRoutes --> AuthMiddleware
    WarehouseRoutes --> AuthMiddleware
    ItemRoutes --> AuthMiddleware
    MovementRoutes --> AuthMiddleware
    HistoryRoutes --> AuthMiddleware
    UnitRoutes --> AuthMiddleware

    %% Middleware chain
    AuthMiddleware --> ValidationMiddleware
    ValidationMiddleware --> RateLimitMiddleware
    RateLimitMiddleware --> LoggingMiddleware
    LoggingMiddleware --> ErrorMiddleware

    %% Routes to services
    AuthRoutes --> AuthService
    UserRoutes --> UserService
    WarehouseRoutes --> WarehouseService
    ItemRoutes --> ItemService
    MovementRoutes --> MovementService
    HistoryRoutes --> HistoryService
    UnitRoutes --> UnitService

    %% Services to business rules
    AuthService --> ValidationRules
    UserService --> PermissionRules
    MovementService --> NotificationRules
    HistoryService --> AuditRules

    %% Services to data access
    AuthService --> DatabaseAdapter
    UserService --> DatabaseAdapter
    WarehouseService --> DatabaseAdapter
    ItemService --> DatabaseAdapter
    MovementService --> DatabaseAdapter
    HistoryService --> DatabaseAdapter
    UnitService --> DatabaseAdapter

    %% Database adapter components
    DatabaseAdapter --> ConnectionPool
    DatabaseAdapter --> TransactionManager
    DatabaseAdapter --> MigrationEngine

    %% Models
    DatabaseAdapter --> UserModel
    DatabaseAdapter --> WarehouseModel
    DatabaseAdapter --> ItemModel
    DatabaseAdapter --> MovementModel
    DatabaseAdapter --> UnitModel

    %% Infrastructure dependencies
    AuthMiddleware --> JWTManager
    AuthService --> PasswordHasher
    ValidationMiddleware --> InputSanitizer
    RateLimitMiddleware --> RateLimitStore

    ErrorMiddleware --> Logger
    UserService --> MetricsCollector
    DatabaseAdapter --> HealthChecker

    %% Utility usage
    ErrorMiddleware --> ErrorHandler
    ErrorMiddleware --> ResponseFormatter
    MovementService --> DateHelper
    ValidationMiddleware --> Validator

    %% Email integration
    MovementService --> EmailService
    AuthService --> EmailService

    %% Styling
    classDef route fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef middleware fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef service fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef infra fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class AuthRoutes,UserRoutes,WarehouseRoutes,ItemRoutes,MovementRoutes,HistoryRoutes,UnitRoutes route
    class AuthMiddleware,ValidationMiddleware,ErrorMiddleware,RateLimitMiddleware,CorsMiddleware,LoggingMiddleware middleware
    class AuthService,UserService,WarehouseService,ItemService,MovementService,HistoryService,UnitService,EmailService service
    class DatabaseAdapter,ConnectionPool,TransactionManager,MigrationEngine,UserModel,WarehouseModel,ItemModel,MovementModel,UnitModel data
    class JWTManager,PasswordHasher,InputSanitizer,RateLimitStore,Logger,MetricsCollector,HealthChecker,ErrorHandler,ResponseFormatter,DateHelper,Validator infra
```

---

## 4. Sequence Diagrams

### 4.1 User Authentication Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as React App
    participant API as API Server
    participant Auth as Auth Service
    participant DB as Database
    participant Logger as Logger

    User->>Frontend: Enter credentials
    Frontend->>Frontend: Validate input format
    Frontend->>API: POST /api/auth/login<br/>{email, password}

    API->>Auth: Validate credentials
    Auth->>DB: SELECT * FROM profiles<br/>WHERE email = ?
    DB-->>Auth: User record
    Auth->>Auth: Verify password hash

    alt Valid credentials
        Auth->>Auth: Generate JWT tokens
        Auth->>DB: Update last_login
        Auth-->>API: {access_token, refresh_token, user}
        API->>Logger: Log successful login
        API-->>Frontend: 200 OK + tokens
        Frontend->>Frontend: Store tokens securely
        Frontend->>Frontend: Update auth context
        Frontend-->>User: Redirect to dashboard
    else Invalid credentials
        Auth-->>API: Authentication failed
        API->>Logger: Log failed attempt
        API-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show error message
    end

    Note over Frontend,DB: Token refresh flow (when access token expires)
    Frontend->>API: Request with expired token
    API-->>Frontend: 401 Unauthorized
    Frontend->>Frontend: Use refresh token
    Frontend->>API: POST /api/auth/refresh<br/>{refresh_token}
    API->>Auth: Validate refresh token
    Auth->>Auth: Generate new access token
    Auth-->>API: New access_token
    API-->>Frontend: 200 OK + new token
    Frontend->>API: Retry original request<br/>with new token
```

### 4.2 Inventory Movement Flow

```mermaid
sequenceDiagram
    participant User as Warehouse Staff
    participant Frontend as React App
    participant API as API Server
    participant Movement as Movement Service
    participant Item as Item Service
    participant DB as Database
    participant Email as Email Service
    participant Cache as Cache Layer

    User->>Frontend: Scan barcode/Select item
    Frontend->>API: GET /api/items/:barcode
    API->>Item: Get item details
    Item->>Cache: Check cache
    alt Cache hit
        Cache-->>Item: Cached item data
    else Cache miss
        Item->>DB: SELECT * FROM items<br/>WHERE barcode = ?
        DB-->>Item: Item record
        Item->>Cache: Store in cache
    end
    Item-->>API: Item details
    API-->>Frontend: Item information
    Frontend-->>User: Display item details

    User->>Frontend: Enter movement details<br/>(quantity, type, notes)
    Frontend->>Frontend: Validate input
    Frontend->>API: POST /api/movements<br/>{item_id, quantity, type, notes}

    API->>Movement: Create movement
    Movement->>DB: BEGIN TRANSACTION
    Movement->>DB: INSERT INTO history_entries<br/>(item_id, quantity, type, ...)
    Movement->>DB: UPDATE items<br/>SET quantity = quantity + ?
    Movement->>DB: COMMIT TRANSACTION
    DB-->>Movement: Success confirmation

    Movement->>Cache: Invalidate item cache
    Movement->>Email: Queue notification
    Movement-->>API: Movement record

    API->>Logger: Log movement created
    API-->>Frontend: 201 Created + movement data
    Frontend->>Frontend: Update local cache
    Frontend-->>User: Success message

    Note over Email,User: Background notification
    Email->>Email: Send stock alert<br/>(if below minimum)
    Email-->>User: Email notification
```

### 4.3 Data Export Flow

```mermaid
sequenceDiagram
    participant User as Manager
    participant Frontend as React App
    participant API as API Server
    participant Report as Report Service
    participant DB as Database
    participant File as File Service
    participant Storage as File Storage

    User->>Frontend: Request export<br/>(date range, warehouse, type)
    Frontend->>API: GET /api/reports/export?<br/>start_date=&end_date=&warehouse=

    API->>Report: Generate report
    Report->>DB: Complex query with joins<br/>across multiple tables
    DB-->>Report: Report data (potentially large)

    Report->>Report: Process and format data
    Report->>File: Create Excel file
    File->>File: Generate XLSX content
    File->>Storage: Upload file to storage
    Storage-->>File: File URL
    File-->>Report: File metadata

    Report->>DB: Log export request
    Report-->>API: {download_url, file_name, size}

    API-->>Frontend: 200 OK + download info
    Frontend->>Frontend: Show download button
    Frontend-->>User: Ready for download

    User->>Frontend: Click download
    Frontend->>Storage: GET file URL
    Storage-->>Frontend: File stream
    Frontend->>Frontend: Trigger download
    Frontend-->>User: File downloaded

    Note over API,Storage: Cleanup old files<br/>(scheduled task)
    API->>Storage: Delete files older than 7 days
    Storage-->>API: Cleanup confirmation
```

---

## 5. Data Flow Diagrams

### 5.1 Master Data Management Flow

```mermaid
flowchart TD
    Start([Start]) --> Input{Data Input Type}

    Input -->|Manual Entry| Manual[Manual Data Entry<br/>Web Form]
    Input -->|Import| Import[Excel Import<br/>File Upload]
    Input -->|API| APIInput[API Input<br/>External System]

    Manual --> Validation[Data Validation<br/>Zod Schemas]
    Import --> Parse[Parse Excel File<br/>Extract Records]
    APIInput --> Validation

    Parse --> Validation
    Validation --> ValidCheck{Data Valid?}

    ValidCheck -->|No| Error[Error Response<br/>Validation Messages]
    ValidCheck -->|Yes| Transform[Data Transformation<br/>Business Rules]

    Transform --> DuplicateCheck{Duplicate Check}
    DuplicateCheck -->|Duplicate| DuplicateHandle[Handle Duplicates<br/>Skip/Update/Merge]
    DuplicateCheck -->|New| Persist[Persist to Database]

    DuplicateHandle --> Persist
    Persist --> Cache[Update Cache<br/>Invalidate Related]
    Cache --> Notify[Trigger Notifications<br/>Stock Alerts, etc.]
    Notify --> Success[Success Response]

    Error --> End([End])
    Success --> End

    %% Styling
    classDef process fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef data fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef terminal fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class Manual,Import,APIInput,Validation,Parse,Transform,Persist,Cache,Notify process
    class Error,Success data
    class Input,ValidCheck,DuplicateCheck decision
    class Start,End terminal
```

### 5.2 Real-time Data Synchronization Flow

```mermaid
flowchart LR
    subgraph "Frontend"
        UI[User Interface]
        State[Component State]
        Cache_Local[Local Cache]
    end

    subgraph "API Layer"
        API_Client[API Client]
        Queue[Request Queue]
    end

    subgraph "Backend"
        API_Server[API Server]
        Validation_Service[Validation Service]
        Business_Logic[Business Logic]
    end

    subgraph "Data Layer"
        Database[(Database)]
        Cache_Server[Server Cache]
    end

    subgraph "Other Clients"
        Client1[Client 1]
        Client2[Client 2]
        ClientN[Client N]
    end

    %% User action flow
    UI --> State
    State --> API_Client
    API_Client --> Queue
    Queue --> API_Server

    %% Server processing
    API_Server --> Validation_Service
    Validation_Service --> Business_Logic
    Business_Logic --> Database
    Database --> Cache_Server

    %% Response flow
    Database --> Business_Logic
    Business_Logic --> API_Server
    API_Server --> API_Client
    API_Client --> Cache_Local
    API_Client --> State
    State --> UI

    %% Real-time updates
    Cache_Server -.->|WebSocket/Event| Client1
    Cache_Server -.->|WebSocket/Event| Client2
    Cache_Server -.->|WebSocket/Event| ClientN
    Cache_Server -.->|WebSocket/Event| API_Client

    %% Cache updates
    Cache_Server -->|Invalidate| Cache_Local
    Cache_Local --> State
    State --> UI

    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef api fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class UI,State,Cache_Local frontend
    class API_Client,Queue api
    class API_Server,Validation_Service,Business_Logic backend
    class Database,Cache_Server data
```

### 5.3 Error Handling and Recovery Flow

```mermaid
flowchart TD
    Request([API Request]) --> Process[Request Processing]
    Process --> ErrorCheck{Error Occurred?}

    ErrorCheck -->|No| Success[Success Response]
    ErrorCheck -->|Yes| ErrorType{Error Type}

    ErrorType -->|Validation| ValidationError[Validation Error<br/>400 Bad Request]
    ErrorType -->|Authentication| AuthError[Auth Error<br/>401 Unauthorized]
    ErrorType -->|Authorization| ForbiddenError[Forbidden Error<br/>403 Forbidden]
    ErrorType -->|Not Found| NotFoundError[Not Found Error<br/>404 Not Found]
    ErrorType -->|Database| DatabaseError[Database Error<br/>500 Internal Server]
    ErrorType -->|Network| NetworkError[Network Error<br/>502 Bad Gateway]

    ValidationError --> LogError[Log Error Details]
    AuthError --> LogError
    ForbiddenError --> LogError
    NotFoundError --> LogError
    DatabaseError --> Rollback[Rollback Transaction]
    NetworkError --> RetryCheck{Should Retry?}

    Rollback --> LogError
    RetryCheck -->|Yes| Wait[Wait & Retry]
    RetryCheck -->|No| LogError

    Wait --> Process

    LogError --> UserError[User-Friendly Error Message]
    UserError --> Notify[Notify Monitoring System]
    Notify --> Response[Error Response]

    Success --> Response
    Response --> End([End])

    %% Styling
    classDef process fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef terminal fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class Request,Process,Success,Response process
    class ValidationError,AuthError,ForbiddenError,NotFoundError,DatabaseError,NetworkError,LogError,UserError error
    class ErrorCheck,ErrorType,RetryCheck decision
    class Wait,Rollback,Notify,End terminal
```

---

## 6. Deployment Diagrams

### 6.1 Development Environment Architecture

```mermaid
graph TB
    subgraph "Developer Machine"
        IDE[IDE/VS Code]
        Terminal[Terminal]
        Browser[Web Browser]
    end

    subgraph "Development Services"
        FrontendDev[Vite Dev Server<br/>Port 8080]
        BackendDev[Node.js Server<br/>Port 3001]
        DB_Local[(Local Database<br/>PostgreSQL/MySQL)]
        Redis_Local[Local Redis<br/>Optional]
    end

    subgraph "Development Tools"
        ESLint[ESLint<br/>Code Quality]
        Prettier[Prettier<br/>Code Formatting]
        Vitest[Vitest<br/>Unit Testing]
        Playwright[Playwright<br/>E2E Testing]
        Git[Git<br/>Version Control]
    end

    subgraph "Development Data"
        Migrations[Database Migrations]
        SeedData[Seed Data]
        TestDB[(Test Database)]
    end

    %% Development workflow
    IDE --> Terminal
    Terminal --> FrontendDev
    Terminal --> BackendDev
    FrontendDev --> Browser
    Browser --> BackendDev

    BackendDev --> DB_Local
    BackendDev --> Redis_Local

    %% Development tools integration
    IDE --> ESLint
    IDE --> Prettier
    IDE --> Vitest
    IDE --> Playwright
    IDE --> Git

    %% Database management
    Terminal --> Migrations
    Migrations --> DB_Local
    SeedData --> DB_Local
    Vitest --> TestDB

    %% Styling
    classDef dev fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef service fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef tool fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class IDE,Terminal,Browser dev
    class FrontendDev,BackendDev,DB_Local,Redis_Local service
    class ESLint,Prettier,Vitest,Playwright,Git tool
    class Migrations,SeedData,TestDB data
```

### 6.2 Production Deployment Architecture

```mermaid
graph TB
    subgraph "Internet"
        Users[End Users]
        Internet[Internet]
    end

    subgraph "CDN & Static Assets"
        CDN[CDN (Cloudflare/AWS CloudFront)<br/>Frontend Assets]
        S3[S3 Storage<br/>Static Files]
    end

    subgraph "Load Balancing"
        LB[Load Balancer (NGINX/HAProxy)<br/>SSL Termination]
    end

    subgraph "Application Servers"
        API1[API Server 1<br/>Node.js + PM2]
        API2[API Server 2<br/>Node.js + PM2]
        API3[API Server N<br/>Node.js + PM2]
    end

    subgraph "Database Layer"
        Master[(Master Database<br/>PostgreSQL)]
        Replica1[(Read Replica 1<br/>PostgreSQL)]
        Replica2[(Read Replica N<br/>PostgreSQL)]
        Redis[(Redis Cache<br/>Session & Query Cache)]
    end

    subgraph "File Storage"
        FileStorage[File Storage<br/>AWS S3/MinIO]
    end

    subgraph "Monitoring & Logging"
        ELK[ELK Stack<br/>Logging]
        Prometheus[Prometheus<br/>Metrics]
        Grafana[Grafana<br/>Dashboards]
        Sentry[Sentry<br/>Error Tracking]
    end

    subgraph "External Services"
        EmailProvider[Email Service<br/>SendGrid/SES]
        BackupService[Backup Service<br/>Automated Backups]
    end

    %% User flow
    Users --> Internet
    Internet --> CDN
    Internet --> LB

    %% Static assets
    CDN --> S3

    %% Load balancing
    LB --> API1
    LB --> API2
    LB --> API3

    %% Database connections
    API1 --> Master
    API2 --> Master
    API3 --> Master

    API1 --> Replica1
    API2 --> Replica1
    API3 --> Replica2

    %% Cache layer
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis

    %% File storage
    API1 --> FileStorage
    API2 --> FileStorage
    API3 --> FileStorage

    %% Monitoring
    API1 --> ELK
    API2 --> ELK
    API3 --> ELK

    API1 --> Prometheus
    API2 --> Prometheus
    API3 --> Prometheus

    Prometheus --> Grafana
    ELK --> Grafana

    API1 --> Sentry
    API2 --> Sentry
    API3 --> Sentry

    %% External services
    API1 --> EmailProvider
    API2 --> EmailProvider
    API3 --> EmailProvider

    Master --> BackupService

    %% Styling
    classDef user fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef static fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef loadbalancer fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef server fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef data fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef monitoring fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef external fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class Users,Internet user
    class CDN,S3 static
    class LB loadbalancer
    class API1,API2,API3 server
    class Master,Replica1,Replica2,Redis,FileStorage data
    class ELK,Prometheus,Grafana,Sentry monitoring
    class EmailProvider,BackupService external
```

### 6.3 Microservices Evolution Architecture

```mermaid
graph TB
    subgraph "Current Architecture (Monolithic)"
        Monolith[Unit-Trek API<br/>Single Service]
        DB_Monolith[(Single Database)]
    end

    subgraph "Evolution Path"
        Evolution[Service Decomposition<br/>Gradual Migration]
    end

    subgraph "Target Architecture (Microservices)"
        subgraph "API Gateway"
            Gateway[API Gateway<br/>Kong/AWS API Gateway]
        end

        subgraph "Core Services"
            AuthService[Auth Service<br/>User Management]
            InventoryService[Inventory Service<br/>Item & Stock Management]
            WarehouseService[Warehouse Service<br/>Location Management]
            ReportingService[Reporting Service<br/>Analytics & Reports]
            NotificationService[Notification Service<br/>Alerts & Emails]
        end

        subgraph "Supporting Services"
            FileService[File Service<br/>Upload & Export]
            BarcodeService[Barcode Service<br/>Scanning & Generation]
            AuditService[Audit Service<br/>Compliance & Logging]
        end

        subgraph "Data Layer"
            AuthDB[(Auth Database)]
            InventoryDB[(Inventory Database)]
            WarehouseDB[(Warehouse Database)]
            ReportingDB[(Reporting Database)]
            EventStore[(Event Store<br/>For Auditing)]
        end

        subgraph "Infrastructure"
            MessageBroker[Message Broker<br/>RabbitMQ/Kafka]
            ServiceMesh[Service Mesh<br/>Istio/Linkerd]
            ConfigServer[Config Server<br/>Centralized Config]
            Registry[Service Registry<br/>Consul/Eureka]
        end
    end

    %% Evolution connections
    Monolith --> Evolution
    Evolution --> Gateway

    %% Gateway to services
    Gateway --> AuthService
    Gateway --> InventoryService
    Gateway --> WarehouseService
    Gateway --> ReportingService
    Gateway --> NotificationService

    %% Service communications
    AuthService --> MessageBroker
    InventoryService --> MessageBroker
    WarehouseService --> MessageBroker
    ReportingService --> MessageBroker
    NotificationService --> MessageBroker

    %% Supporting services
    InventoryService --> FileService
    InventoryService --> BarcodeService
    ReportingService --> AuditService
    NotificationService --> AuditService

    %% Service databases
    AuthService --> AuthDB
    InventoryService --> InventoryDB
    WarehouseService --> WarehouseDB
    ReportingService --> ReportingDB
    AuditService --> EventStore

    %% Infrastructure
    Gateway --> ServiceMesh
    AuthService --> ConfigServer
    InventoryService --> ConfigServer
    WarehouseService --> ConfigServer
    ReportingService --> ConfigServer

    AuthService --> Registry
    InventoryService --> Registry
    WarehouseService --> Registry
    ReportingService --> Registry

    %% Styling
    classDef current fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef evolution fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef gateway fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef service fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef support fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef data fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef infra fill:#e1f5fe,stroke:#01579b,stroke-width:2px

    class Monolith,DB_Monolith current
    class Evolution evolution
    class Gateway gateway
    class AuthService,InventoryService,WarehouseService,ReportingService,NotificationService service
    class FileService,BarcodeService,AuditService support
    class AuthDB,InventoryDB,WarehouseDB,ReportingDB,EventStore data
    class MessageBroker,ServiceMesh,ConfigServer,Registry infra
```

---

## Conclusion

These diagrams provide a comprehensive visual representation of the Unit-Trek Inventory Management System architecture at various levels of abstraction:

1. **Context Diagrams** show the system's relationship with users and external systems
2. **Container Diagrams** illustrate the high-level technology choices and interactions
3. **Component Diagrams** detail the internal structure of frontend and backend applications
4. **Sequence Diagrams** demonstrate the flow of interactions for key processes
5. **Data Flow Diagrams** visualize how data moves through the system
6. **Deployment Diagrams** show how the system is deployed in different environments

These diagrams serve as living documentation that should be updated as the system evolves and new features are added.