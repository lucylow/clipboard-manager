# 📋 Clipboard Manager

An offline-first clipboard history application built with **React Native, Expo, and TypeScript**. Capture copied text and images, search your clipboard history, organize entries into Favorites, Work, and Personal, and quickly reuse saved content whenever you need it.

Clipboard history is persisted locally on your device using AsyncStorage. Image OCR is powered by a backend tRPC endpoint connected to a language-model service.

> **Project status:** The repository contains a working local-first application and an Express/tRPC backend. Clipboard history is stored locally and is not synchronized to a cloud database. Clipboard Pro and billing screens are currently local previews; production in-app purchases are not integrated.

---

## 📑 Table of Contents

- [Features](#-features)
- [Application Screens](#-application-screens)
- [System Architecture](#-system-architecture)
- [Application Workflows](#-application-workflows)
- [Data Model](#-data-model)
- [Local Persistence](#-local-persistence)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Available Commands](#-available-commands)
- [Project Structure](#-project-structure)
- [API Architecture](#-api-architecture)
- [Privacy and Security](#-privacy-and-security)
- [Known Limitations](#-known-limitations)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 📥 Clipboard Capture

- **Text capture:** Save text from the system clipboard using the in-app Paste action.
- **Image capture:** Detect and save clipboard images with image dimensions when available.
- **Image drag and drop:** Import images through the web application's drag-and-drop interface.
- **Duplicate detection:** Prevent identical text and image payloads from being unnecessarily added to history.
- **Quick copy:** Copy previously saved clipboard content back to the system clipboard.
- **Automatic persistence:** Save clipboard entries locally using AsyncStorage.

### 🔎 Search and Organization

- Search clipboard history by content.
- Search OCR-extracted text from saved images.
- Filter entries by type, category, and favorite status.
- Organize clipboard entries into Work and Personal categories.
- Mark frequently used entries as Favorites.
- View detailed information about individual clipboard entries.
- Preview saved images using a full-screen lightbox.
- Perform bulk actions on multiple selected entries.

### 🖼️ Image and OCR Processing

- Extract readable text from saved images.
- Search images using their extracted OCR text.
- Display image dimensions and OCR status.
- Retry OCR extraction when processing fails.
- Preserve images locally even when OCR is unavailable.
- Share images using platform-supported sharing functionality.

### ⚡ Performance and Reliability

- Offline-first clipboard history.
- Asynchronous local persistence.
- Serialized storage writes to reduce race conditions.
- Storage operation timeouts.
- Automatic validation and repair of stored records.
- Optimistic UI updates with persistence rollback.
- Protection against overlapping media operations.
- Guards against stale asynchronous responses.
- Reduced-motion accessibility support.
- Haptic feedback where supported.

---

## 📱 Application Screens

The application currently provides three primary navigation tabs.

| Screen | Description |
|---|---|
| History | Main clipboard collection, search, filters, capture, image previews, and bulk actions. |
| Favorites | Displays favorited text and image entries. |
| Settings | Clipboard preferences, appearance settings, local usage measurement, and Clipboard Pro preview. |

### History

The History screen is the main interface for managing clipboard entries.

Users can:

- Capture clipboard content.
- Search saved entries.
- Filter by content type and category.
- Open individual entries.
- Copy saved content.
- Add or remove favorites.
- Change categories.
- Select multiple entries.
- Delete selected entries.

### Favorites

Provides a dedicated view of frequently used clipboard entries.

Users can:

- Browse favorited entries.
- Copy saved text.
- Open saved images.
- Manage favorite status.

### Settings

Provides application preferences and configuration.

Available functionality includes:

- Clipboard preferences.
- Appearance settings.
- Local usage measurement controls.
- Clipboard Pro preview.
- Local entitlement and upgrade-interest previews.

---

## 🏗️ System Architecture

Clipboard Manager uses a layered architecture that separates the Expo application, local persistence, and backend API services.

### High-Level Architecture

```mermaid
flowchart TB
    USER["User"]

    subgraph CLIENT["Mobile / Web Application"]
        ROUTER["Expo Router"]
        SCREENS["History / Favorites / Settings"]
        ACTIONS["Clipboard Actions"]
        SEARCH["Search and Filtering"]
        MEDIA["Image and Media Processing"]
        PERSISTENCE["History Persistence Hook"]
        STORAGE[("AsyncStorage")]
        CLIPBOARD["Expo Clipboard"]
        TRPC_CLIENT["tRPC Client"]

        ROUTER --> SCREENS
        SCREENS --> ACTIONS
        SCREENS --> SEARCH
        SCREENS --> MEDIA
        ACTIONS --> PERSISTENCE
        PERSISTENCE <--> STORAGE
        ACTIONS --> CLIPBOARD
        MEDIA --> TRPC_CLIENT
    end

    subgraph SERVER["Backend API"]
        EXPRESS["Express Server"]
        TRPC["tRPC Router"]
        OCR["OCR Extraction Procedure"]
        LLM["LLM Gateway Client"]

        EXPRESS --> TRPC
        TRPC --> OCR
        OCR --> LLM
    end

    subgraph EXTERNAL["External Services"]
        MODEL["Configured AI Model Service"]
        DATABASE[("MySQL Database")]
    end

    USER --> ROUTER
    TRPC_CLIENT --> EXPRESS
    LLM --> MODEL
    MODEL --> LLM

    EXPRESS -.-> DATABASE

    classDef client fill:#dbeafe,stroke:#2563eb,color:#172554
    classDef server fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef storage fill:#fef3c7,stroke:#d97706,color:#78350f

    class ROUTER,SCREENS,ACTIONS,SEARCH,MEDIA,TRPC_CLIENT client
    class EXPRESS,TRPC,OCR,LLM server
    class STORAGE,DATABASE storage
```

### Architecture Components

| Component | Responsibility |
|---|---|
| Expo Router | Application navigation and screen routing. |
| React Native | Cross-platform user interface. |
| Clipboard Actions | Capturing, copying, deleting, and modifying entries. |
| Search and Filtering | Finding clipboard entries using content and metadata. |
| History Persistence Hook | Managing history hydration, updates, and rollback. |
| AsyncStorage | Persistent local clipboard history. |
| Expo Clipboard | Reading and writing clipboard content. |
| tRPC Client | Communicating with backend procedures. |
| Express | HTTP server and API infrastructure. |
| tRPC Router | Typed backend API procedures. |
| OCR Procedure | Processing image-to-text extraction requests. |
| LLM Gateway | Sending image extraction requests to the configured model service. |
| MySQL / Drizzle | Database infrastructure for the user/auth integration. |

### Important Data Boundary

The clipboard collection is stored locally using AsyncStorage.

The existing Drizzle schema defines a users table for the authentication integration. It does not define a cloud clipboard-history table.

The backend currently provides OCR functionality and supporting integration routes. It is not a clipboard-history synchronization service.

---

## 🔄 Application Workflows

### 1. Clipboard Capture Workflow

The application reads clipboard content when the user explicitly initiates the Paste action.

```mermaid
flowchart TD
    START["User taps Paste"]

    START --> CHECK{"Clipboard contains image?"}

    CHECK -->|Yes| IMAGE["Read image as PNG data"]

    IMAGE --> VALIDATE{"Valid size and not duplicate?"}

    VALIDATE -->|No| ERROR["Display status message"]

    VALIDATE -->|Yes| SAVE_IMAGE["Save image entry locally"]

    SAVE_IMAGE --> OCR["Send image to OCR API"]

    OCR --> RESULT{"OCR successful?"}

    RESULT -->|Yes| TEXT["Attach extracted text"]

    TEXT --> UPDATE["Update local history"]

    RESULT -->|No| FALLBACK["Preserve image without OCR text"]

    CHECK -->|No| CLIP_TEXT["Read clipboard text"]

    CLIP_TEXT --> TEXT_VALIDATE{"Non-empty and not duplicate?"}

    TEXT_VALIDATE -->|No| ERROR

    TEXT_VALIDATE -->|Yes| CREATE["Create clipboard entry"]

    CREATE --> SAVE["Persist to AsyncStorage"]

    UPDATE --> COMPLETE["Display saved entry"]

    FALLBACK --> COMPLETE

    SAVE --> COMPLETE
```

**Capture sequence:**

1. User initiates clipboard capture.
2. The application checks the clipboard content.
3. Image content is processed as an image entry.
4. Text content is processed as a text entry.
5. Duplicate and size checks are performed where applicable.
6. The new entry is saved locally.
7. Images can be submitted to the OCR backend.
8. Extracted text is attached to the corresponding image entry.
9. The History screen displays the updated collection.

OCR failure does not delete an image already saved locally.

### 2. Search and Filtering Workflow

```mermaid
flowchart LR
    A["Local Clipboard History"]

    B["Normalize Search Fields"]

    C["Search Query"]

    D["Apply Category Filter"]

    E["Apply Type / Favorite Filter"]

    F["Filtered Results"]

    G["Open Clipboard Entry"]

    H["Copy / Favorite / Categorize / Delete"]

    I["Persist Changes"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
```

The search implementation supports matching against:

- Clipboard content.
- OCR-extracted text.
- Source metadata.
- Category.
- Clipboard item type.

Search and filtering are applied together.

### 3. Image OCR Workflow

The OCR workflow uses the backend API instead of performing model inference on the device.

```mermaid
sequenceDiagram
    autonumber

    actor User
    participant App as Expo Application
    participant Storage as AsyncStorage
    participant API as Express / tRPC
    participant OCR as OCR Procedure
    participant AI as Model Service

    User->>App: Capture image

    App->>Storage: Save image locally

    Storage-->>App: Save successful

    App->>API: ocr.extract(imageData)

    API->>OCR: Validate request

    OCR->>AI: Submit image extraction request

    AI-->>OCR: Extracted text

    OCR-->>API: Structured OCR result

    API-->>App: Return extracted text

    App->>Storage: Update OCR metadata

    Storage-->>App: Persist updated entry

    App-->>User: Display image with extracted text
```

If OCR processing fails, the image remains available in local history. Users can retry OCR through the image detail interface.

### 4. Local Persistence Workflow

```mermaid
flowchart TD
    A["User modifies clipboard entry"]

    B["Create updated immutable collection"]

    C["Update in-memory state"]

    D["Serialized write queue"]

    E["AsyncStorage write"]

    F{"Write completed before timeout?"}

    G["Keep updated state"]

    H{"Is failed write the latest revision?"}

    I["Restore previous state"]

    J["Preserve newer state"]

    K["Display persistence warning"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F

    F -->|Yes| G
    F -->|No| H

    H -->|Yes| I
    H -->|No| J

    I --> K
    J --> K
```

This approach minimizes stale writes and prevents a failed older operation from overwriting a newer user action.

---

## 🗄️ Data Model

Clipboard entries are stored as a JSON array using AsyncStorage.

The primary storage key is:

```text
clipboard-manager-items
```

### ClipboardItem Interface

```typescript
type ClipboardItem = {
  id: string;

  type: "text" | "image";

  content: string;

  imageData?: string;

  imageSize?: {
    width: number;
    height: number;
  };

  ocrText?: string;

  timestamp: number;

  favorite: boolean;

  category?: "Work" | "Personal";

  source?: string;
};
```

### Data Model Diagram

```mermaid
classDiagram
    class ClipboardItem {
        +string id
        +string type
        +string content
        +string imageData
        +number timestamp
        +boolean favorite
        +string category
        +string ocrText
        +string source
        +ImageSize imageSize
    }

    class ImageSize {
        +number width
        +number height
    }

    ClipboardItem "0..1" --> "0..1" ImageSize : image dimensions
```

### Field Descriptions

| Field | Type | Description |
|---|---|---|
| id | string | Unique entry identifier. |
| type | text / image | Clipboard content type. |
| content | string | Text content or image label. |
| imageData | string | Base64-encoded image data. |
| imageSize | object | Image width and height. |
| ocrText | string | Extracted image text. |
| timestamp | number | Unix timestamp in milliseconds. |
| favorite | boolean | Whether the entry is favorited. |
| category | string | Work or Personal. |
| source | string | Optional source metadata. |

Image-specific properties are optional, allowing text and image entries to coexist in the same collection.

---

## 💾 Local Persistence

Persistence is implemented through:

- `hooks/use-history-persistence.ts`
- `lib/clipboard-storage.ts`
- `lib/safe-storage.ts`

### Persistence Strategy

The application uses several reliability mechanisms.

**1. Hydration**

Read stored clipboard entries when the History screen initializes or refreshes.

**2. Validation**

Validate stored records and discard malformed entries while preserving valid ones.

**3. Serialized Writes**

Use a shared promise queue to reduce write-order conflicts.

**4. Timeout Protection**

Storage operations use bounded timeouts, currently five seconds in the shared helpers.

**5. Optimistic Updates**

Update the interface immediately while asynchronous persistence completes.

**6. Rollback**

Restore the previous collection when the latest persistence operation fails.

**7. Application Resume Recovery**

Refresh clipboard history when the application returns to the foreground.

**8. Session Guards**

Prevent stale OCR, sharing, and image-preview operations from updating an unrelated screen session.

### AsyncStorage Keys

| Key | Purpose |
|---|---|
| `clipboard-manager-items` | Clipboard history and image metadata. |
| `clipboard-manager-settings` | Local preferences. |
| `clipboard-manager-premium` | Legacy local premium flag. |
| `clipboard-manager-entitlement` | Local preview entitlement state. |
| `clipboard-manager-usage` | OCR and export usage counters. |
| `clipboard-manager-telemetry-enabled` | Local telemetry preference. |
| `clipboard-manager-monetization-events` | Local upgrade-interest signals. |

These keys represent local application state, not a remote account or verified purchase.

---

## 🧰 Technology Stack

| Category | Technology |
|---|---|
| Framework | React Native |
| Application Platform | Expo SDK 54 |
| Language | TypeScript |
| UI | React 19 |
| Navigation | Expo Router 6 |
| Navigation Infrastructure | React Navigation 7 |
| Styling | NativeWind 4 |
| CSS Utilities | Tailwind CSS 3 |
| Local Database | AsyncStorage |
| Clipboard | Expo Clipboard |
| Image Processing | Expo Image |
| File Handling | Expo File System |
| Sharing | Expo Sharing |
| API Client | tRPC 11 |
| Server State | TanStack Query 5 |
| Serialization | SuperJSON |
| Backend | Node.js |
| HTTP Server | Express 4 |
| Database ORM | Drizzle ORM |
| Database Driver | MySQL2 |
| OCR | Server-side LLM gateway |
| Model Route | Gemini 3 Flash Preview |
| Testing | Vitest |
| Linting | ESLint |
| Formatting | Prettier |
| Build Tool | esbuild |
| Package Manager | pnpm |

---

## 🚀 Getting Started

### Prerequisites

Install the following development tools:

- Node.js LTS compatible with Expo SDK 54.
- pnpm 9.12.0.
- Git.
- Android Studio or Xcode for native development.
- A physical iOS/Android device or simulator.
- Backend LLM gateway credentials for image OCR functionality.

Clipboard text capture and local history do not require the OCR service.

### 1. Clone the Repository

```bash
git clone https://github.com/lucylow/clipboard-manager.git

cd clipboard-manager
```

### 2. Activate pnpm

```bash
corepack enable

corepack prepare pnpm@9.12.0 --activate
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment Variables

Create a `.env` file in the repository root.

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

BUILT_IN_FORGE_API_KEY=your-api-key

BUILT_IN_FORGE_API_URL=https://forge.manus.im
```

See [Environment Configuration](#-environment-configuration) for additional information.

### 5. Start Development

Start the backend and Expo web development environment:

```bash
pnpm dev
```

The default development configuration uses:

| Service | Port |
|---|---|
| Expo Web / Metro | 8081 |
| Express API | 3000 |

Open the Expo URL printed in your terminal.

### 6. Run on iOS

Use two terminal windows.

Terminal 1:

```bash
pnpm dev:server
```

Terminal 2:

```bash
pnpm ios
```

### 7. Run on Android

Terminal 1:

```bash
pnpm dev:server
```

Terminal 2:

```bash
pnpm android
```

For physical devices, configure `EXPO_PUBLIC_API_BASE_URL` using a network address accessible from the device.

Remember that `localhost` on a physical phone refers to the phone itself rather than your development computer.

---

## ⚙️ Environment Configuration

The application supports local clipboard functionality without requiring a database connection.

The OCR feature requires a configured backend LLM gateway.

### Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API address. | Only for non-default routing or device testing. |
| `BUILT_IN_FORGE_API_KEY` | Backend LLM gateway credential. | Required for OCR. |
| `BUILT_IN_FORGE_API_URL` | Optional LLM gateway URL override. | No. |
| `DATABASE_URL` | MySQL connection for Drizzle commands. | Required for database operations. |

### Example Configuration

```dotenv
# Application API endpoint
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Backend-only OCR credential
BUILT_IN_FORGE_API_KEY=your-secret-api-key

# Optional model gateway URL
BUILT_IN_FORGE_API_URL=https://forge.manus.im

# Optional MySQL connection
DATABASE_URL=mysql://username:password@localhost:3306/clipboard_manager
```

The server appends `/v1/chat/completions` to the configured model gateway base URL.

Authentication and OAuth integrations contain additional deployment configuration, including application identity and session-related settings. These are not required for the local clipboard history workflow.

**Security recommendations:**

- Never commit `.env` files.
- Never expose backend credentials through `EXPO_PUBLIC_*` variables.
- Use environment secrets in deployment environments.
- Avoid sending sensitive images to third-party OCR services.
- Review model-provider data handling and retention policies before production deployment.

---

## 📦 Available Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start backend and Expo development environment. |
| `pnpm dev:server` | Start Express API in watch mode. |
| `pnpm dev:metro` | Start Expo web/Metro only. |
| `pnpm ios` | Start iOS development environment. |
| `pnpm android` | Start Android development environment. |
| `pnpm build` | Build the Node.js server using esbuild. |
| `pnpm start` | Run the built backend server. |
| `pnpm check` | Run TypeScript type checking. |
| `pnpm lint` | Run ESLint. |
| `pnpm test` | Run Vitest test suite. |
| `pnpm format` | Format files with Prettier. |
| `pnpm db:push` | Apply Drizzle database schema changes. |
| `pnpm release:check` | Run iOS release verification. |
| `pnpm qr` | Generate a QR code using the repository script. |

---

## 📂 Project Structure

```text
clipboard-manager/
│
├── app/
│   └── (tabs)/
│       ├── index.tsx
│       ├── favorites.tsx
│       └── settings.tsx
│
├── assets/
│   └── images/
│
├── components/
│
├── constants/
│
├── docs/
│
├── drizzle/
│   └── schema.ts
│
├── hooks/
│   └── use-history-persistence.ts
│
├── lib/
│   ├── clipboard-storage.ts
│   ├── safe-storage.ts
│   └── trpc.ts
│
├── scripts/
│
├── server/
│   ├── _core/
│   │   └── index.ts
│   └── routers.ts
│
├── shared/
│
├── tests/
│
├── app.config.ts
├── eas.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
```

### Important Implementation Files

| File | Responsibility |
|---|---|
| `app/(tabs)/index.tsx` | History screen, capture, search, filtering, and bulk actions. |
| `app/(tabs)/favorites.tsx` | Favorites screen and image actions. |
| `app/(tabs)/settings.tsx` | Settings, local usage measurement, and entitlement preview. |
| `hooks/use-history-persistence.ts` | Hydration, persistence, optimistic updates, and rollback. |
| `lib/clipboard-storage.ts` | Clipboard storage and record validation. |
| `lib/safe-storage.ts` | AsyncStorage timeout and safety helpers. |
| `lib/trpc.ts` | Backend API client. |
| `server/_core/index.ts` | Express server and tRPC registration. |
| `server/routers.ts` | API procedures, including OCR extraction. |
| `drizzle/schema.ts` | Database schema for user/auth integration. |

---

## 🔌 API Architecture

The backend uses Express and tRPC to expose typed API procedures.

### Backend Structure

```mermaid
flowchart TB
    CLIENT["Expo Application"]

    subgraph BACKEND["Express Backend"]
        EXPRESS["Express HTTP Server"]

        HEALTH["Health Endpoint"]

        ROUTES["API Routes"]

        TRPC["tRPC Middleware"]

        AUTH["Authentication Router"]

        OCR["OCR Router"]

        VALIDATION["Zod Input Validation"]

        GATEWAY["LLM Gateway Client"]

        EXPRESS --> HEALTH

        EXPRESS --> ROUTES

        EXPRESS --> TRPC

        TRPC --> AUTH

        TRPC --> OCR

        OCR --> VALIDATION

        VALIDATION --> GATEWAY
    end

    MODEL["External Model Service"]

    CLIENT --> EXPRESS

    GATEWAY --> MODEL

    MODEL --> GATEWAY

    GATEWAY --> OCR
```

### OCR Procedure

The image extraction procedure accepts image data and forwards the request to the configured model gateway.

Conceptually, the request follows this structure:

```typescript
{
  imageData: "base64-encoded-image"
}
```

The model service returns extracted text.

Conceptually, the response contains:

```typescript
{
  text: "Extracted text from the image"
}
```

The application then associates this text with the original image entry.

The actual request and response contracts are defined by the backend tRPC procedure and its Zod validation.

---

## 🔐 Privacy and Security

Clipboard content can contain sensitive information. Privacy is therefore an important architectural consideration.

### Local Storage

The following information is stored locally:

- Clipboard text.
- Base64 image content.
- Favorite status.
- Categories.
- Timestamps.
- OCR-extracted text.
- Application preferences.

### Network Communication

Image OCR is the main clipboard-content workflow that sends user data to the backend.

When OCR is requested:

1. The application sends image data to its backend.
2. The backend validates the request.
3. The backend forwards the image to the configured model service.
4. The model service extracts readable text.
5. The backend returns the result to the application.

### Privacy Boundaries

| Data | Storage / Processing |
|---|---|
| Clipboard text | Local AsyncStorage. |
| Clipboard images | Local AsyncStorage. |
| OCR-extracted text | Local AsyncStorage after extraction. |
| OCR requests | Backend and configured model provider. |
| Categories and favorites | Local AsyncStorage. |
| User/auth data | Database integration where configured. |
| Usage counters | Local application storage. |

### Important Privacy Notes

- Clipboard history is not automatically uploaded to an account.
- There is no implemented multi-device clipboard synchronization.
- Clipboard capture is user-initiated.
- OCR requires sending image content to an external processing service.
- Local usage measurement can be disabled through application settings.
- Local entitlement flags do not represent verified purchases.

Users should avoid submitting sensitive clipboard images to external OCR services unless they understand and accept the service's data-handling policies.

---

## ⚠️ Known Limitations

The following are current implementation limitations:

1. **No background clipboard monitoring:** Clipboard capture uses the explicit Paste action rather than continuous operating-system monitoring.

2. **No cloud synchronization:** Clipboard entries are stored locally and are not synchronized between devices.

3. **OCR dependency:** Image text extraction requires an available backend API and valid model gateway credentials.

4. **Image size restrictions:** A local size guard prevents excessively large image payloads from being saved.

5. **Preview billing:** Clipboard Pro and related upgrade screens are currently previews and do not complete production store transactions.

6. **Authentication/database separation:** The current MySQL schema supports the user/auth integration and is not the clipboard history database.

7. **File System dependency:** The History screen imports `expo-file-system/legacy`, but `expo-file-system` is not declared as a direct dependency in `package.json`. For reproducible installs and native builds, consider declaring it explicitly:

   ```bash
   pnpm exec expo install expo-file-system
   ```

8. **External OCR provider:** OCR functionality depends on the configured third-party model gateway.

---

## 🧪 Testing

Run the following commands before submitting changes:

### Type Checking

```bash
pnpm check
```

### Linting

```bash
pnpm lint
```

### Unit Tests

```bash
pnpm test
```

### Recommended Regression Coverage

Testing should cover:

- Clipboard text capture.
- Image capture and validation.
- Duplicate detection.
- Local storage hydration.
- Malformed storage recovery.
- Serialized persistence writes.
- Persistence timeout handling.
- Optimistic update rollback.
- Favorite and category changes.
- Bulk operations.
- OCR success and failure.
- Asynchronous image preview guards.

UI changes should also be checked on narrow mobile viewports and with reduced-motion preferences enabled.

---

## 🤝 Contributing

Contributions are welcome.

### Development Guidelines

1. Fork the repository.
2. Create a feature branch.
3. Keep changes focused and maintainable.
4. Preserve local storage compatibility.
5. Add tests for new functionality.
6. Document new environment variables.
7. Avoid exposing secrets or sensitive clipboard content.
8. Run type checking, linting, and tests.
9. Submit a pull request with a clear description.

### Suggested Workflow

```bash
git checkout -b feature/my-feature

pnpm install

pnpm check

pnpm lint

pnpm test

git add .

git commit -m "feat: describe your change"

git push origin feature/my-feature
```

### Architectural Contribution Principles

- Keep clipboard records local unless a documented synchronization architecture is introduced.
- Preserve backward compatibility when changing clipboard item structures.
- Validate user-provided and stored data.
- Protect asynchronous media operations from stale responses.
- Keep backend credentials server-side.
- Clearly document any new third-party data transfers.

---

## 🗺️ Future Development Ideas

Potential improvements for future releases include:

- Optional encrypted cloud backup.
- Secure cross-device clipboard synchronization.
- Native background clipboard monitoring where platform permissions permit.
- Production subscription and in-app purchase integration.
- Improved image OCR and extraction workflows.
- Advanced clipboard search.
- Additional clipboard categories.
- Rich-text clipboard support.
- Configurable automatic cleanup and history retention.
- End-to-end encrypted synchronization.

These are potential roadmap items and are not represented as currently implemented features.

---

## 📄 License

No `LICENSE` file was present in the repository root when this README was prepared.

Add an appropriate license file before distributing or reusing the project under an open-source license.

---

<p align="center">
  Built with ❤️ using React Native, Expo, and TypeScript.
</p>

<p align="center">
  <b>Clipboard Manager</b> — Your clipboard history, organized.
</p>
