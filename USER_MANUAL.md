# LEGAL ARCH AIU USER MANUAL

## 1. Introduction

LEGAL ARCH AIU is an AI-assisted legal document management and archiving system designed to help organizations store, classify, search, and retrieve legal documents efficiently. The system uses artificial intelligence to automatically generate document titles, descriptions, and remarks, suggest folder categories, and power both keyword and meaning-based (semantic) search.

The system is composed of two major modules:

- Administrator Web Dashboard
- Staff Web Dashboard

This user manual serves as a guide for all users of the LEGAL ARCH AIU system. It provides step-by-step instructions on how to use the features and functionalities available for each user role.

## 2. System Overview

LEGAL ARCH AIU is a web-based document management and information system developed for centralized legal document archiving, AI-assisted processing, and intelligent retrieval.

### i. Objectives of the System

The system aims to:

a. Provide centralized storage and archiving of legal documents
b. Automatically classify and tag documents using AI
c. Enable fast keyword and semantic (meaning-based) document search
d. Allow users to chat with an AI assistant about their documents
e. Provide audit logging and activity monitoring for accountability
f. Provide centralized account and permission management for administrators

### ii. Major Modules

#### a. Administrator Web Dashboard

The administrator module allows the assigned admin to:

- Log in with two-factor authentication
- Upload and process documents (AI-assisted or manual)
- Manage documents, folders, and categories
- Manage users, accounts, and access permissions
- Approve or decline staff permission requests
- Use the AI assistant to search and analyze documents
- View dashboard analytics and summary reports
- Export reports and activity logs (PDF / Excel / CSV)
- Monitor system activity through audit logs
- Configure system settings (AI service keys, scanner choices)

#### b. Staff Web Dashboard

The staff module allows registered staff users to:

- Log in with two-factor authentication
- View and search documents
- Upload and process documents (subject to permission)
- Edit document metadata (subject to permission)
- Use the AI assistant to search and analyze documents
- Request additional access permissions from administrators
- View their own dashboard statistics and recent files

## 3. System Requirements

### i. Web Module Requirements (Users)

| Requirement | Specification |
|-------------|---------------|
| Browser | Google Chrome, Mozilla Firefox, Microsoft Edge |
| Internet Connection | Stable broadband connection |
| Screen Resolution | 1366 x 768 or higher |

### ii. Server / Deployment Requirements

| Requirement | Specification |
|-------------|---------------|
| Application Stack | Laravel (PHP) + Inertia.js + React/TypeScript |
| Web Server | PHP 8.x with the Laravel application server |
| Database | MySQL / MariaDB |
| AI Services | Python (Flask) microservices — embedding, text extraction, AI bridge, chatbot |
| Scanner Bridge | Node.js scanner service (for hardware document scanning) |
| AI Provider | Groq API key (primary) with a local Llama model fallback |

## 4. Access Guide

### i. Starting the System (Administrator / Deployment)

The full application is launched on the host machine using the provided launcher.

Step 1: Run the Launcher

Run `share_app.bat`. It builds the frontend, then starts the AI services, the scanner bridge, the queue worker, and the web server.

Step 2: Note the Network Address

The launcher prints the host machine's LAN IP address. Other staff on the same network connect to the system using this address (for example, `http://<host-ip>:8000`).

Step 3: Confirm Services Are Running

For AI features and scanning to work, the AI microservices and the Node scanner bridge must be running. Each service opens in its own window.

### ii. Accessing the Dashboard (All Users)

Step 1: Open a web browser.

Step 2: Enter the provided system URL.

Step 3: Log in using your credentials (see Section 6 or 7 for your role).

## 5. User Roles and Access Permissions

| User Role | Access Permissions |
|-----------|--------------------|
| Administrator | Full system management and monitoring; all document permissions; account and settings management |
| Staff | View, search, and (if granted) upload, edit, or delete documents; request additional permissions |

Staff permissions are granular and assigned by an administrator:

| Permission | Allows the user to |
|------------|--------------------|
| View | View and search documents |
| Upload | Upload and process new documents |
| Edit | Edit document metadata |
| Delete | Delete documents |

> Note: Administrators have all permissions enabled by default. Staff users have View permission by default; other permissions are granted by an administrator or requested by the staff user.

## 6. Common Features (All Users)

### i. User Login

**Purpose**

Allows registered users to access their accounts.

**Steps**

1. Open the system URL in a web browser.
2. Open the Login window.
3. Enter your email address.
4. Enter your password.
5. Click the Login button.

**Two-Factor Authentication (if enabled)**

If two-factor authentication (2FA) is enabled on your account, you will be asked for a second verification step after entering your password:

- **Authenticator App (TOTP):** Enter the 6-digit code from your authenticator app (e.g., Google Authenticator).
- **Email Code:** Enter the 6-digit code sent to your email address. You may click *Resend Code* if it does not arrive.
- **Recovery Code:** If you cannot access your authenticator or email, enter one of your saved recovery codes.

**Expected Output**

The user is redirected to their dashboard.

### ii. Enabling Two-Factor Authentication

**Purpose**

Adds an extra layer of security to your account.

**Steps**

1. Open your Profile settings.
2. Enable Two-Factor Authentication.
3. Choose a method:
   - **Authenticator App:** Scan the displayed QR code (or enter the secret key) in your authenticator app, then enter the generated code to confirm.
   - **Email:** Confirm the 6-digit code sent to your email.
4. Save your recovery codes in a safe place.

**Important Note**

Recovery codes can each be used only once. Store them securely — they are your backup if you lose access to your authenticator or email.

**Expected Output**

Two-factor authentication is enabled for your account.

### iii. The AI Assistant

**Purpose**

Allows users to chat with an AI assistant to search, summarize, compare, and analyze documents.

**Steps**

1. Open the AI Assistant page.
2. (Optional) Click the attachment icon and select one or more documents to use as context.
3. Type your question — for example:
   - "Find documents about payment terms."
   - "Compare contract A and contract B."
   - "What clauses mention liability?"
4. Send the message.

**How the Assistant Finds Documents**

- If you attach documents, the assistant uses only those.
- If you mention a folder name, results are limited to that folder.
- For meaning-based questions, the assistant uses semantic search over document embeddings.
- For keyword questions, the assistant searches document titles and descriptions.

**Expected Output**

The assistant returns an answer along with the relevant documents it referenced. You can click a referenced document to open it.

**Organizing Conversations**

- Create chat folders to group conversations by topic.
- Star important conversations for quick access.
- Conversation history is saved automatically. You can delete a conversation to remove it and its history.

### iv. Searching for Documents

**Purpose**

Allows users to locate documents quickly.

**Search Types**

- **Keyword (metadata) search:** Matches words in a document's title and description.
- **Semantic search:** Finds documents by meaning rather than exact words, using AI embeddings.

### v. Viewing and Downloading Documents

**Purpose**

Allows users to open and retrieve documents.

**Steps**

1. Open the Documents page.
2. Locate a document using the list or search.
3. Click the document to open the viewer (PDF/text displays inline).
4. To download, use the Download option.

**Expected Output**

The document opens in the viewer, or downloads to your device. Downloads are recorded in the activity log.

### vi. Logout

**Purpose**

Allows users to securely exit the system.

**Steps**

1. Open the profile menu.
2. Click Logout.

**Expected Output**

The user session ends securely.

## 7. Staff User Manual

### i. Overview

The staff dashboard allows staff users to manage and search documents and to use the AI assistant within the permissions granted to them.

### ii. Staff Dashboard

**Purpose**

Displays personal statistics and recent activity.

**Features**

- Total documents in the system
- Documents you uploaded
- Documents uploaded today
- Monthly uploads chart
- Documents by folder/category chart
- Your recent files (last 24 hours)

### iii. Uploading a Document (AI Processing)

**Purpose**

Uploads a document and lets the AI suggest its title, description, remarks, and folder.

**Steps**

1. Open the document upload page.
2. Choose a file (PDF, DOC, DOCX, or TXT).
3. Select AI Processing.
4. Wait while the system extracts text, generates embeddings, and produces AI suggestions.
5. Review the AI-suggested title, description, remarks, and folder.
6. Edit any fields as needed and add the physical location and reference ID if applicable.
7. Confirm to finalize processing.

**Important Note**

AI processing runs in the background. A document may briefly show a "processing" status until it is ready.

**Expected Output**

The document is processed, classified, and made searchable.

### iv. Uploading a Document (Manual Processing)

**Purpose**

Uploads a document and lets you enter all details manually.

**Steps**

1. Open the document upload page.
2. Choose a file (PDF, DOC, DOCX, or TXT).
3. Select Manual Processing.
4. Enter the document title, description, folder, physical location, remarks, and reference ID.
5. Confirm to save.

**Expected Output**

The document is saved, renamed to match its title, and filed under the selected folder.

### v. Editing Document Metadata

**Purpose**

Allows updating document details (requires Edit permission).

**Steps**

1. Open a document.
2. Open its metadata/details.
3. Update the title, description, folder, physical location, or reference ID.
4. Save changes.

**Expected Output**

The document details are updated, and the change is recorded in the activity log.

### vi. Requesting Additional Permissions

**Purpose**

Allows staff to request access (Upload, Edit, Delete) from an administrator.

**Steps**

1. Open your account/profile.
2. Select Request Permissions.
3. Check the permissions you need (Upload, Edit, Delete).
4. Optionally enter a reason.
5. Submit the request.

**Expected Output**

The request is sent to administrators for review. You can view its status under "My Permission Requests" and you will be notified of the outcome.

### vii. Notifications

**Purpose**

Keeps staff informed of relevant events.

**Types of Notifications**

- Permission request outcomes (granted/updated permissions)
- System notifications

## 8. Administrator User Manual

### i. Overview

The administrator dashboard is used for centralized management and monitoring of the LEGAL ARCH AIU system.

### ii. Administrator Dashboard

**Purpose**

Displays operational statistics and monitoring tools.

**Features**

- Total documents, total folders, total staff users, and documents uploaded today
- Monthly uploads chart (last 12 months)
- Documents by folder/category analytics
- Recent files (last 24 hours)
- Recent activities (last 24 hours)
- Documents by category breakdown
- Staff leaderboard (ranked by uploads)

### iii. Managing User Accounts

**Purpose**

Allows administrators to manage user accounts.

**Functions**

- Add users
- Edit user information
- Set user roles and permissions
- Activate or deactivate accounts
- Reset user passwords
- View a user's documents

**Steps**

1. Open Account Management.
2. To add a user, fill in the name, email, password, role, status, and permissions, then save.
3. To edit a user, select the user, update the fields, and save.
4. To remove a user, select the user and delete.

**Important Note**

When you change a staff user's permissions, that user is automatically notified of the granted or revoked permissions.

### iv. Approving Permission Requests

**Purpose**

Allows administrators to approve or decline staff permission requests.

**Steps**

1. Open the pending permission requests.
2. Review the requested permissions and the staff member's reason.
3. Accept or decline the request.

**Expected Output**

On acceptance, the staff user's permissions are updated and the user is notified. On decline, the request is marked as denied.

### v. Document Management

**Purpose**

Allows administrators to manage all documents in the system.

**Functions**

- View all documents
- Upload and process documents (AI or manual)
- Edit document metadata
- Download documents
- Delete documents (single or bulk)
- Organize documents into folders and categories

### vi. Folder and Category Management

**Purpose**

Allows administrators to organize documents into a folder structure.

**Functions**

- Create folders and subfolders
- Assign documents to folders
- View document counts per folder

> Note: When documents are uploaded with AI processing, the system suggests an appropriate folder automatically.

### vii. Reports and Exports

**Purpose**

Allows administrators to generate and export summary reports.

**Available Reports**

- Total documents (all-time, this month, this week)
- Active users
- Storage usage estimate
- Documents by category breakdown

**Export Options**

- PDF export (summary statistics and category breakdown, with optional date range)
- Excel / CSV export (statistics, categories, detailed document list, activity summary)
- Activity logs export (Excel / CSV / PDF, with optional date range and user filter)

**Steps**

1. Open the Reports page.
2. Choose an export format (PDF, Excel, or CSV).
3. (Optional) Set a date range or user filter.
4. Generate and download the report.

### viii. Viewing Activity Logs

**Purpose**

Allows administrators to monitor system activities and maintain an audit trail.

**Logged Activities**

- Login and logout
- Document uploaded
- AI processing completed
- Metadata confirmed and document updated
- Document downloaded
- Document deleted
- Permission requested, approved, or denied

**Steps**

1. Open the Activity Logs page.
2. Review the recent activity entries (action, document, user, and time).
3. (Optional) Filter by user.
4. (Optional) Export the logs.

### ix. System Settings

**Purpose**

Allows administrators to configure AI services and scanning.

**Functions**

- Set the Groq API key (for the AI chat model)
- Set the Groq OCR API key (for document text extraction)
- Configure scanner choices

**Important Note**

After updating AI service keys, the related AI services may need to be restarted to use the new keys.

### x. Logout

**Purpose**

Securely exits the administrator account.

**Steps**

1. Open the profile menu.
2. Select Logout.

**Expected Output**

The administrator session ends securely.

## 9. Troubleshooting Guide

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| Cannot log in | Incorrect credentials | Verify your email and password |
| Cannot complete 2FA | Wrong or expired code | Re-enter the current code, use *Resend Code* (email), or use a recovery code |
| AI assistant not responding | AI services not running or API key missing | Ensure the AI services are running and a valid Groq API key is configured in Settings |
| Document stuck on "processing" | Background job still running | Wait and refresh; ensure the queue worker and AI services are running |
| Upload rejected as duplicate | Identical file already exists | The system blocks uploading the exact same file content; check existing documents |
| Document text not extracted | OCR / text extraction service not running or OCR key missing | Ensure the text extraction service is running and the Groq OCR key is set |
| Scanner upload not working | Scanner bridge service not running | Ensure the Node scanner service is running |
| Dashboard not loading | Browser compatibility issue | Use a supported browser (Chrome, Firefox, Edge) |
| "Permission denied" on an action | Missing permission | Request the needed permission from an administrator |

## 10. Frequently Asked Questions (FAQ)

**Q1. Is an internet connection required to use LEGAL ARCH AIU?**
A stable connection is required to reach the system and to use cloud AI features (Groq). A local AI model is available as a fallback.

**Q2. What file types can I upload?**
PDF, DOC, DOCX, and TXT files.

**Q3. What is the difference between AI processing and manual processing?**
AI processing automatically extracts text and suggests the title, description, remarks, and folder. Manual processing lets you enter all of these details yourself.

**Q4. What is the difference between keyword search and semantic search?**
Keyword search matches words in a document's title and description. Semantic search finds documents by meaning using AI embeddings, even when the exact words differ.

**Q5. Why was my upload blocked as a duplicate?**
The system detects identical file content and prevents uploading the same file twice.

**Q6. I'm a staff user and can't upload or edit. Why?**
Your account may not have the required permission. Submit a permission request to an administrator.

**Q7. Can I recover my account if I lose my 2FA device?**
Yes. Use one of the recovery codes you saved when enabling two-factor authentication. Each recovery code works only once.

**Q8. Are my actions recorded?**
Yes. Logins, uploads, edits, downloads, deletions, and permission changes are recorded in the activity log for auditing.

## 11. Contact and Support Information

For technical concerns and support, contact:

LEGAL ARCH AIU Development Team

*(Add your team's organization, email, and phone number here.)*
