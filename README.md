# NeokRED Support Portal - Full-Stack Monorepo

This project is a complete enterprise support portal built with a React frontend and a Node.js/Express/MongoDB backend, organized within a scalable monorepo structure. It features multi-role authentication, ticket management, user and product administration, notifications, and an audit log.

## Project Structure

The project is managed as a monorepo using npm workspaces. The code is split into two main packages: `frontend` and `backend`.

```
neokred-support-portal/
├── README.md
├── package.json        # Root package.json with workspace definitions
└── packages/
    ├── frontend/
    │   ├── index.html      # Entry point for the frontend
    │   ├── package.json
    │   └── src/            # All frontend source code
    │       ├── App.tsx
    │       ├── index.tsx
    │       ├── types.ts
    │       ├── constants.tsx
    │       ├── data.ts       # Mock data for seeding
    │       ├── components/   # Shared React components (Layout, UI)
    │       └── pages/        # Page-level components
    │
    └── backend/
        ├── package.json
        ├── .env.example    # Environment variable template
        ├── tsconfig.json
        └── src/            # All backend source code
            ├── server.ts     # Main server entry point
            ├── config/
            ├── controllers/
            ├── middleware/
            ├── models/
            ├── routes/
            └── utils/
```

---

## Prerequisites

-   **Node.js**: v18 or later is recommended.
-   **npm**: v8 or later (usually included with Node.js).
-   **MongoDB**: A running instance is required. This can be a local installation or a cloud-based service like MongoDB Atlas.

---

## Local Setup Guide

Follow these steps to get the entire application running on your local machine.

### Step 1: Clone and Install Dependencies

First, clone the repository. Then, from the **root directory** of the project, run the installation command. This will install all dependencies for the root, frontend, and backend packages.

```bash
# Navigate to the project root
cd your-project-folder

# Install all dependencies for all workspaces
npm install --workspaces --if-present
```

### Step 2: Configure Backend Environment

The backend server requires environment variables for the database connection and security tokens.

1.  Navigate into the backend package: `cd packages/backend`
2.  Create a new `.env` file by copying the provided template: `cp .env.example .env`
3.  Open the newly created `.env` file and provide the necessary values:

    ```env
    # The port for the backend server
    PORT=5001

    # Your MongoDB connection string
    # Example for a local MongoDB instance: mongodb://127.0.0.1:27017/neokred_support
    MONGODB_URI=your_mongodb_connection_string

    # A long, random, and secret string for signing JSON Web Tokens
    JWT_SECRET=your_super_secret_jwt_key
    ```
4.  Navigate back to the project's root directory: `cd ../..`

### Step 3: Seed the Database (First-Time Setup)

Before you can use the application, you must populate the database with initial data. A seeder script is included for this purpose.

1.  Make sure your MongoDB server is running.
2.  From the **root directory**, start the backend server:
    ```bash
    npm start --workspace=backend
    ```
3.  The server will automatically connect to your database. Now, to seed the data, open a new terminal or your web browser and make a `GET` request to the following endpoint:

    **http://localhost:5001/api/seed**

    You should see a "Database seeded successfully!" message in your browser or terminal. The database is now populated with default users, products, tickets, and more.
    
### Step 4 (Optional): Manually Add an Admin User
If you prefer not to use the seeder, you can add an admin user manually. Connect to your MongoDB instance using a tool like MongoDB Compass or the `mongosh` CLI.
1. Select your database (e.g., `use neokred_support`).
2. Insert a new user into the `users` collection. The password will be automatically hashed.

```javascript
db.users.insertOne({
    "name": "Your Admin Name",
    "email": "youradmin@email.com",
    "mobile": "1234567890",
    "role": "Admin",
    "status": "Active",
    "password": "your_secure_password", // This will be hashed on save
    "createdAt": new Date().toLocaleDateString('en-GB')
});
```

### Step 5: Run the Full Application

After seeding the database, you can stop the server (`Ctrl + C`) and restart it using the development script, which runs both the frontend and backend concurrently.

From the **root directory**, run:

```bash
npm run dev
```

This command will:
-   Start the backend server in development mode (e.g., on `http://localhost:5001`).
-   Provide the URL for the frontend application.

### Step 6: Access the Frontend

Open your web browser and navigate to the frontend URL provided in the terminal.

The application is now fully running. You can log in with one of the seeded user accounts from the dropdown on the login page. The default password for all seeded users is `password123`.

---

## API Documentation

Here is the documentation for all the backend API endpoints.

### Authentication

**`POST /api/auth/login`**
*   **Description**: Authenticates a user and returns a JWT token.
*   **Access**: Public
*   **Request Body**:
    ```json
    {
      "email": "admin@company.com",
      "password": "password123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "id": "60d5ecb4b392e11234567890",
      "name": "System Administrator",
      "email": "admin@company.com",
      "role": "Admin",
      "token": "ey..."
    }
    ```
*   **Error Response (401 Unauthorized)**:
    ```json
    {
      "message": "Invalid email or password"
    }
    ```

### Users

*All user routes require authentication. Access levels are specified per route.*

**`GET /api/users`**
*   **Description**: Retrieves a list of all users.
*   **Access**: Authenticated (Used for login dropdown)

**`POST /api/users`**
*   **Description**: Creates a new user.
*   **Access**: Admin, Support Manager

**`PUT /api/users/:id`**
*   **Description**: Updates an existing user's details.
*   **Access**: Admin, Support Manager

**`DELETE /api/users/:id`**
*   **Description**: Deletes a user.
*   **Access**: Admin

### Tickets

*All ticket routes require authentication.*

**`GET /api/tickets`**
*   **Description**: Retrieves a list of tickets. Returns all tickets for support roles, but only tickets created by the user if the role is 'Merchant'.

**`POST /api/tickets`**
*   **Description**: Creates a new ticket.

**`PUT /api/tickets/:id`**
*   **Description**: Updates a ticket's status, assignment, or comments. The `:id` here refers to the custom ticket ID (e.g., `TK002`).

### Products

**`GET /api/products`**
*   **Description**: Retrieves a list of all products.
*   **Access**: Authenticated

**`POST /api/products`**
*   **Description**: Creates a new product.
*   **Access**: Admin

### Notifications

**`GET /api/notifications`**
*   **Description**: Retrieves a list of all notifications.
*   **Access**: Authenticated

**`POST /api/notifications`**
*   **Description**: Creates and sends a new notification.
*   **Access**: Admin, Support Manager

### Dashboard

**`GET /api/dashboard/stats`**
*   **Description**: Retrieves key statistics for the dashboard cards.
*   **Access**: Authenticated

### Audit Log

**`GET /api/audit-logs`**
*   **Description**: Retrieves the full audit log.
*   **Access**: Admin

---

## Postman Collection

You can import the following JSON into Postman to get a ready-to-use collection for testing the API. Remember to set the `baseUrl` variable in your Postman environment to `http://localhost:5001`.

```json
{
	"info": {
		"_postman_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
		"name": "NeokRED Support Portal",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Auth",
			"item": [
				{
					"name": "Login",
					"event": [
						{
							"listen": "test",
							"script": {
								"exec": [
									"pm.test(\"Status code is 200\", function () {",
									"    pm.response.to.have.status(200);",
									"});",
									"",
									"const response = pm.response.json();",
									"pm.collectionVariables.set(\"authToken\", response.token);",
									""
								],
								"type": "text/javascript"
							}
						}
					],
					"request": {
						"method": "POST",
						"header": [],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"email\": \"admin@company.com\",\n    \"password\": \"password123\"\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{baseUrl}}/api/auth/login",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"api",
								"auth",
								"login"
							]
						}
					},
					"response": []
				}
			]
		},
		{
			"name": "Tickets",
			"item": [
				{
					"name": "Get All Tickets",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "{{authToken}}",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/api/tickets",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"api",
								"tickets"
							]
						}
					},
					"response": []
				}
			]
		},
		{
			"name": "Users",
			"item": [
				{
					"name": "Get All Users",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "{{authToken}}",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/api/users",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"api",
								"users"
							]
						}
					},
					"response": []
				}
			]
		},
		{
			"name": "Admin",
			"item": [
				{
					"name": "Get Audit Logs",
					"request": {
						"auth": {
							"type": "bearer",
							"bearer": [
								{
									"key": "token",
									"value": "{{authToken}}",
									"type": "string"
								}
							]
						},
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/api/audit-logs",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"api",
								"audit-logs"
							]
						}
					},
					"response": []
				},
				{
					"name": "Seed Database",
					"request": {
						"method": "GET",
						"header": [],
						"url": {
							"raw": "{{baseUrl}}/api/seed",
							"host": [
								"{{baseUrl}}"
							],
							"path": [
								"api",
								"seed"
							]
						}
					},
					"response": []
				}
			]
		}
	],
	"event": [
		{
			"listen": "prerequest",
			"script": {
				"type": "text/javascript",
				"exec": [
					""
				]
			}
		},
		{
			"listen": "test",
			"script": {
				"type": "text/javascript",
				"exec": [
					""
				]
			}
		}
	],
	"variable": [
		{
			"key": "baseUrl",
			"value": "http://localhost:5001"
		},
		{
			"key": "authToken",
			"value": ""
		}
	]
}
```