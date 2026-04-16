const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PharmacyMVP API",
      version: "1.0.0",
      description: "Complete REST API documentation for PharmacyMVP backend",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
      {
        url: "https://main-frontend-iota.vercel.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [],
    paths: {
      // ─── Auth ────────────────────────────────────────────────────────────────
      "/api/signup": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password", "role"],
                  properties: {
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", example: "john@example.com" },
                    password: { type: "string", example: "Secret@123" },
                    role: { type: "string", enum: ["User", "Store"], example: "User" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation error" },
          },
        },
      },
      "/api/login": {
        post: {
          tags: ["Auth"],
          summary: "Login (User / Store / Admin)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                    password: { type: "string", example: "Secret@123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful, returns JWT token" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset email",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Reset email sent" },
            404: { description: "User not found" },
          },
        },
      },
      // ─── User / Profile ───────────────────────────────────────────────────────
      "/api/fetchdata": {
        get: {
          tags: ["User"],
          summary: "Fetch logged-in user/store profile data",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "User data returned" },
          },
        },
      },
      "/api/patientprofile": {
        post: {
          tags: ["User"],
          summary: "Update patient profile (supports profile image upload)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    profileImage: { type: "string", format: "binary" },
                    name: { type: "string" },
                    phone: { type: "string" },
                    address: { type: "string" },
                    dateOfBirth: { type: "string", format: "date" },
                    gender: { type: "string", enum: ["Male", "Female", "Other"] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Profile updated" },
          },
        },
      },
      "/api/store-profile": {
        put: {
          tags: ["Store"],
          summary: "Update store profile",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    storeName: { type: "string" },
                    address: { type: "string" },
                    phone: { type: "string" },
                    openingHours: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Store profile updated" } },
        },
      },
      // ─── Admin ────────────────────────────────────────────────────────────────
      "/api/adminfetchdata": {
        get: {
          tags: ["Admin"],
          summary: "Fetch all admin dashboard data",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Admin data returned" } },
        },
      },
      "/api/store-requests": {
        get: {
          tags: ["Admin"],
          summary: "Get all store approval requests",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of store requests" } },
        },
        post: {
          tags: ["Admin"],
          summary: "Submit a new store approval request (with licence file)",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["storeName", "ownerName", "email", "storeLicenceFile"],
                  properties: {
                    storeName: { type: "string" },
                    ownerName: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" },
                    address: { type: "string" },
                    storeLicenceFile: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Request submitted" } },
        },
      },
      "/api/store-requests/{id}/review": {
        patch: {
          tags: ["Admin"],
          summary: "Approve or reject a store approval request",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { type: "string", enum: ["approved", "rejected"] },
                    remarks: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Request reviewed" } },
        },
      },
      "/api/stores/{id}/status": {
        patch: {
          tags: ["Admin"],
          summary: "Update store active/inactive status",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", enum: ["active", "inactive"] } },
                },
              },
            },
          },
          responses: { 200: { description: "Status updated" } },
        },
      },
      "/api/allstores": {
        get: {
          tags: ["Admin"],
          summary: "Get all registered stores",
          responses: { 200: { description: "List of stores" } },
        },
      },
      "/api/stores": {
        post: {
          tags: ["Admin"],
          summary: "Add a new store (admin)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["storeName", "email", "password"],
                  properties: {
                    storeName: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                    address: { type: "string" },
                    phone: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Store created" } },
        },
      },
      // ─── Medicines ────────────────────────────────────────────────────────────
      "/api/allmedicines": {
        get: {
          tags: ["Medicines"],
          summary: "Get all medicines in the pharmacy",
          responses: { 200: { description: "Array of medicines" } },
        },
      },
      "/api/addmedicine": {
        post: {
          tags: ["Medicines"],
          summary: "Add a new medicine to the store",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "price", "quantity"],
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    quantity: { type: "number" },
                    category: { type: "string" },
                    manufacturer: { type: "string" },
                    expiryDate: { type: "string", format: "date" },
                    description: { type: "string" },
                    requiresPrescription: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Medicine added" } },
        },
      },
      "/api/deletemedicine": {
        post: {
          tags: ["Medicines"],
          summary: "Delete a medicine by ID",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["medicineId"],
                  properties: { medicineId: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "Medicine deleted" } },
        },
      },
      "/api/medicines-by-store/{storeId}": {
        get: {
          tags: ["Medicines"],
          summary: "Get medicines for a specific store",
          parameters: [{ in: "path", name: "storeId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Medicines by store" } },
        },
      },
      // ─── Cart ─────────────────────────────────────────────────────────────────
      "/api/cart": {
        get: {
          tags: ["Cart"],
          summary: "Get current user cart",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Cart items" } },
        },
      },
      "/api/additemstocart": {
        post: {
          tags: ["Cart"],
          summary: "Add items to cart",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          medicineId: { type: "string" },
                          quantity: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Items added to cart" } },
        },
      },
      "/api/updatecartquantity": {
        post: {
          tags: ["Cart"],
          summary: "Increase cart item quantity",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "string" },
                    medicineId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Quantity updated" } },
        },
      },
      "/api/decreaseupdatecartquantity": {
        post: {
          tags: ["Cart"],
          summary: "Decrease cart item quantity",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "string" },
                    medicineId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Quantity decreased" } },
        },
      },
      "/api/deletefullcart": {
        post: {
          tags: ["Cart"],
          summary: "Clear all items from cart",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { userId: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "Cart cleared" } },
        },
      },
      // ─── Orders ───────────────────────────────────────────────────────────────
      "/api/updateorderedmedicines": {
        post: {
          tags: ["Orders"],
          summary: "Confirm ordered medicines",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: { type: "string" },
                    medicines: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Order updated" } },
        },
      },
      "/api/addaddress": {
        post: {
          tags: ["Orders"],
          summary: "Save delivery address for order",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "address"],
                  properties: {
                    userId: { type: "string" },
                    address: {
                      type: "object",
                      properties: {
                        line1: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        pincode: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Address saved" } },
        },
      },
      "/api/addpayment": {
        post: {
          tags: ["Orders"],
          summary: "Process payment and place order",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId", "paymentMethod"],
                  properties: {
                    userId: { type: "string" },
                    paymentMethod: { type: "string", enum: ["COD", "card", "upi"] },
                    transactionId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Payment processed, order placed" } },
        },
      },
      "/api/orders/me": {
        get: {
          tags: ["Orders"],
          summary: "Get all orders for the logged-in user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Array of orders" } },
        },
      },
      "/api/orders/{orderId}": {
        get: {
          tags: ["Orders"],
          summary: "Get order detail by ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "orderId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Order detail" } },
        },
      },
      "/api/orders/{orderId}/tracking": {
        patch: {
          tags: ["Orders"],
          summary: "Update order tracking status (Store)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "orderId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { type: "string", enum: ["processing", "packed", "shipped", "delivered", "cancelled"] },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Tracking updated" } },
        },
      },
      "/api/store-orders": {
        get: {
          tags: ["Orders"],
          summary: "Get all orders for the logged-in store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Store orders" } },
        },
      },
      // ─── Prescriptions ────────────────────────────────────────────────────────
      "/api/uploadpres": {
        post: {
          tags: ["Prescriptions"],
          summary: "Upload prescription file (no auth required)",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: { prescription: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: { 200: { description: "Prescription uploaded" } },
        },
      },
      "/api/prescriptions/upload": {
        post: {
          tags: ["Prescriptions"],
          summary: "Upload prescription request (User)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    prescription: { type: "string", format: "binary" },
                    notes: { type: "string" },
                    storeId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Prescription request created" } },
        },
      },
      "/api/prescriptions/me": {
        get: {
          tags: ["Prescriptions"],
          summary: "Get all prescription requests for logged-in user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "User prescription requests" } },
        },
      },
      "/api/prescriptions/store": {
        get: {
          tags: ["Prescriptions"],
          summary: "Get all prescription requests for logged-in store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Store prescription requests" } },
        },
      },
      "/api/prescriptions/{id}/reupload": {
        patch: {
          tags: ["Prescriptions"],
          summary: "Re-upload prescription file",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: { prescription: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: { 200: { description: "Prescription re-uploaded" } },
        },
      },
      "/api/prescriptions/{id}/review": {
        patch: {
          tags: ["Prescriptions"],
          summary: "Review a prescription request (Store)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { type: "string", enum: ["approved", "rejected", "pending"] },
                    items: { type: "array", items: { type: "object" } },
                    totalAmount: { type: "number" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Prescription reviewed" } },
        },
      },
      "/api/prescriptions/{id}/checkout": {
        get: {
          tags: ["Prescriptions"],
          summary: "Get prescription checkout data",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Checkout data" } },
        },
      },
      "/api/prescriptions/{id}/place-order": {
        post: {
          tags: ["Prescriptions"],
          summary: "Place order from prescription",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    paymentMethod: { type: "string", enum: ["COD", "card", "upi"] },
                    address: { type: "object" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Order placed from prescription" } },
        },
      },
      // ─── Prescription Auto-Fill ───────────────────────────────────────────────
      "/api/prescriptions/auto-fill/upload": {
        post: {
          tags: ["Prescriptions Auto-Fill"],
          summary: "Upload prescription for AI auto-fill",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: { prescription: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: { 201: { description: "Prescription queued for extraction" } },
        },
      },
      "/api/prescriptions/auto-fill/{prescriptionId}/extract": {
        post: {
          tags: ["Prescriptions Auto-Fill"],
          summary: "Extract medicines from uploaded prescription using AI",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "prescriptionId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Extracted medicines list" } },
        },
      },
      "/api/prescriptions/auto-fill": {
        get: {
          tags: ["Prescriptions Auto-Fill"],
          summary: "Get user prescription uploads",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Prescription uploads" } },
        },
      },
      "/api/prescriptions/auto-fill/{prescriptionId}/add-to-cart": {
        post: {
          tags: ["Prescriptions Auto-Fill"],
          summary: "Add extracted medicines to cart",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "prescriptionId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    medicines: { type: "array", items: { type: "object", properties: { medicineId: { type: "string" }, quantity: { type: "number" } } } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Medicines added to cart" } },
        },
      },
      // ─── Notifications ────────────────────────────────────────────────────────
      "/api/user-notifications": {
        get: {
          tags: ["Notifications"],
          summary: "Get user notification preferences",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Notification preferences" } },
        },
        put: {
          tags: ["Notifications"],
          summary: "Update user notification preferences",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    emailNotifications: { type: "boolean" },
                    smsNotifications: { type: "boolean" },
                    orderUpdates: { type: "boolean" },
                    promotions: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Preferences updated" } },
        },
      },
      // ─── Queries ──────────────────────────────────────────────────────────────
      "/api/queries": {
        post: {
          tags: ["Queries"],
          summary: "Create a user query",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["subject", "message"],
                  properties: {
                    subject: { type: "string" },
                    message: { type: "string" },
                    storeId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Query created" } },
        },
        get: {
          tags: ["Queries"],
          summary: "Get all queries of the logged-in user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "User queries" } },
        },
      },
      "/api/queries/store": {
        get: {
          tags: ["Queries"],
          summary: "Get queries directed to the logged-in store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Store queries" } },
        },
      },
      "/api/queries/{id}/answer": {
        patch: {
          tags: ["Queries"],
          summary: "Answer a user query (Store)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["answer"],
                  properties: { answer: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "Query answered" } },
        },
      },
      // ─── Store Staff ──────────────────────────────────────────────────────────
      "/api/store-staff": {
        get: {
          tags: ["Store Staff"],
          summary: "Get all staff members of the store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Staff list" } },
        },
        post: {
          tags: ["Store Staff"],
          summary: "Create a new staff member",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "role"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" },
                    role: { type: "string", enum: ["pharmacist", "cashier", "manager", "delivery"] },
                    salary: { type: "number" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Staff member created" } },
        },
      },
      "/api/store-staff/{id}": {
        put: {
          tags: ["Store Staff"],
          summary: "Update staff member details",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    role: { type: "string" },
                    salary: { type: "number" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Staff updated" } },
        },
        delete: {
          tags: ["Store Staff"],
          summary: "Delete a staff member",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Staff deleted" } },
        },
      },
      "/api/store-staff/{id}/status": {
        patch: {
          tags: ["Store Staff"],
          summary: "Toggle staff active/inactive status",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", enum: ["active", "inactive"] } },
                },
              },
            },
          },
          responses: { 200: { description: "Status updated" } },
        },
      },
      "/api/store-staff/permissions": {
        get: {
          tags: ["Store Staff"],
          summary: "Get role-based permissions for the store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Role permissions" } },
        },
      },
      // ─── Staff Performance ────────────────────────────────────────────────────
      "/api/staff/performance": {
        post: {
          tags: ["Staff Performance"],
          summary: "Create a performance record",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["staffId", "rating"],
                  properties: {
                    staffId: { type: "string" },
                    rating: { type: "number", minimum: 1, maximum: 5 },
                    notes: { type: "string" },
                    month: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Performance record created" } },
        },
        get: {
          tags: ["Staff Performance"],
          summary: "Get all performance records",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Performance records" } },
        },
      },
      // ─── Staff Attendance ─────────────────────────────────────────────────────
      "/api/staff/attendance": {
        post: {
          tags: ["Staff Attendance"],
          summary: "Create an attendance record",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["staffId", "date"],
                  properties: {
                    staffId: { type: "string" },
                    date: { type: "string", format: "date" },
                    shift: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Attendance record created" } },
        },
        get: {
          tags: ["Staff Attendance"],
          summary: "Get attendance records",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Attendance records" } },
        },
      },
      "/api/staff/attendance/{id}/check-in": {
        patch: {
          tags: ["Staff Attendance"],
          summary: "Check-in a staff member",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Checked in" } },
        },
      },
      "/api/staff/attendance/{id}/check-out": {
        patch: {
          tags: ["Staff Attendance"],
          summary: "Check-out a staff member",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Checked out" } },
        },
      },
      // ─── Staff Training ───────────────────────────────────────────────────────
      "/api/staff/training": {
        post: {
          tags: ["Staff Training"],
          summary: "Create a training record",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["staffId", "trainingName"],
                  properties: {
                    staffId: { type: "string" },
                    trainingName: { type: "string" },
                    completedDate: { type: "string", format: "date" },
                    certificateUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Training record created" } },
        },
        get: {
          tags: ["Staff Training"],
          summary: "Get all training records",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Training records" } },
        },
      },
      // ─── Compliance ───────────────────────────────────────────────────────────
      "/api/compliance/checklist": {
        post: {
          tags: ["Compliance"],
          summary: "Create a compliance checklist item",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "dueDate"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    dueDate: { type: "string", format: "date" },
                    category: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Checklist item created" } },
        },
        get: {
          tags: ["Compliance"],
          summary: "Get compliance checklist items",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Checklist items" } },
        },
      },
      "/api/compliance/checklist/{id}": {
        put: {
          tags: ["Compliance"],
          summary: "Update a compliance checklist item",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    completed: { type: "boolean" },
                    dueDate: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Item updated" } },
        },
      },
      "/api/compliance/reminders": {
        get: {
          tags: ["Compliance"],
          summary: "Get upcoming compliance reminders",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Compliance reminders" } },
        },
      },
      // ─── Finance ──────────────────────────────────────────────────────────────
      "/api/finance/invoices": {
        post: {
          tags: ["Finance"],
          summary: "Create an invoice",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["supplierId", "items", "totalAmount"],
                  properties: {
                    supplierId: { type: "string" },
                    items: { type: "array", items: { type: "object" } },
                    totalAmount: { type: "number" },
                    dueDate: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Invoice created" } },
        },
        get: {
          tags: ["Finance"],
          summary: "Get all invoices for the store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Invoice list" } },
        },
      },
      "/api/finance/invoices/{invoiceId}/payments": {
        patch: {
          tags: ["Finance"],
          summary: "Reconcile payment for an invoice",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "invoiceId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: { type: "number" },
                    paymentDate: { type: "string", format: "date" },
                    method: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Payment reconciled" } },
        },
      },
      "/api/finance/reconciliation": {
        get: {
          tags: ["Finance"],
          summary: "Get payment reconciliation report",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Reconciliation report" } },
        },
      },
      "/api/finance/profit-margin": {
        get: {
          tags: ["Finance"],
          summary: "Get profit margin report",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Profit margin report" } },
        },
      },
      "/api/finance/tax-report": {
        get: {
          tags: ["Finance"],
          summary: "Get tax report",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Tax report" } },
        },
      },
      // ─── Suppliers ────────────────────────────────────────────────────────────
      "/api/suppliers": {
        post: {
          tags: ["Suppliers"],
          summary: "Create a supplier",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "contactEmail"],
                  properties: {
                    name: { type: "string" },
                    contactEmail: { type: "string" },
                    phone: { type: "string" },
                    address: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Supplier created" } },
        },
        get: {
          tags: ["Suppliers"],
          summary: "Get all suppliers",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Supplier list" } },
        },
      },
      "/api/suppliers/{supplierId}": {
        put: {
          tags: ["Suppliers"],
          summary: "Update supplier",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "supplierId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    contactEmail: { type: "string" },
                    phone: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Supplier updated" } },
        },
        delete: {
          tags: ["Suppliers"],
          summary: "Delete supplier",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "supplierId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Supplier deleted" } },
        },
      },
      "/api/suppliers/{supplierId}/payments": {
        patch: {
          tags: ["Suppliers"],
          summary: "Add a payment to a supplier",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "supplierId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: { type: "number" },
                    paymentDate: { type: "string", format: "date" },
                    method: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Payment added" } },
        },
      },
      // ─── Marketing / Campaigns ────────────────────────────────────────────────
      "/api/marketing/campaigns": {
        post: {
          tags: ["Marketing"],
          summary: "Create a promotional campaign (Store)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "discount", "startDate", "endDate"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    discount: { type: "number" },
                    couponCode: { type: "string" },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Campaign created" } },
        },
        get: {
          tags: ["Marketing"],
          summary: "Get campaigns for the store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Campaign list" } },
        },
      },
      "/api/marketing/campaigns/public": {
        get: {
          tags: ["Marketing"],
          summary: "Get active public promotional campaigns",
          responses: { 200: { description: "Public campaigns" } },
        },
      },
      "/api/marketing/campaigns/validate-coupon": {
        post: {
          tags: ["Marketing"],
          summary: "Validate a coupon code",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["couponCode"],
                  properties: {
                    couponCode: { type: "string" },
                    storeId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Coupon valid" }, 404: { description: "Invalid coupon" } },
        },
      },
      "/api/marketing/campaigns/{campaignId}/status": {
        patch: {
          tags: ["Marketing"],
          summary: "Update campaign status (active/paused)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "campaignId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", enum: ["active", "paused", "ended"] } },
                },
              },
            },
          },
          responses: { 200: { description: "Status updated" } },
        },
      },
      "/api/marketing/campaigns/{campaignId}": {
        delete: {
          tags: ["Marketing"],
          summary: "Delete a campaign",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "campaignId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Campaign deleted" } },
        },
      },
      // ─── Vaccinations ─────────────────────────────────────────────────────────
      "/api/vaccinations": {
        post: {
          tags: ["Vaccinations"],
          summary: "Upsert a user vaccination record",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["vaccinationMasterId", "dateAdministered"],
                  properties: {
                    vaccinationMasterId: { type: "string" },
                    dateAdministered: { type: "string", format: "date" },
                    nextDueDate: { type: "string", format: "date" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Vaccination record upserted" } },
        },
        get: {
          tags: ["Vaccinations"],
          summary: "Get all vaccinations for the user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Vaccination list" } },
        },
      },
      "/api/vaccination-master": {
        get: {
          tags: ["Vaccinations"],
          summary: "Get vaccination master list",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Master vaccination list" } },
        },
      },
      "/api/user-vaccinations": {
        get: {
          tags: ["Vaccinations"],
          summary: "Get user vaccinations for dashboard",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "User vaccinations dashboard view" } },
        },
      },
      "/api/user-vaccinations/{vaccinationId}": {
        put: {
          tags: ["Vaccinations"],
          summary: "Update vaccination record by master ID",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "vaccinationId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    dateAdministered: { type: "string", format: "date" },
                    nextDueDate: { type: "string", format: "date" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Vaccination updated" } },
        },
      },
      // ─── Inventory ────────────────────────────────────────────────────────────
      "/api/store-inventory": {
        get: {
          tags: ["Inventory"],
          summary: "Get store inventory",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Inventory list" } },
        },
        post: {
          tags: ["Inventory"],
          summary: "Add medicine to store inventory",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "quantity", "price"],
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "number" },
                    price: { type: "number" },
                    expiryDate: { type: "string", format: "date" },
                    batchNumber: { type: "string" },
                    manufacturer: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Medicine added to inventory" } },
        },
      },
      "/api/store-inventory/{medicineId}": {
        put: {
          tags: ["Inventory"],
          summary: "Update inventory medicine",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "medicineId", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    quantity: { type: "number" },
                    price: { type: "number" },
                    expiryDate: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Inventory updated" } },
        },
        delete: {
          tags: ["Inventory"],
          summary: "Remove medicine from inventory",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "medicineId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Medicine removed from inventory" } },
        },
      },
      // ─── Manufacturers ────────────────────────────────────────────────────────
      "/api/manufacturers": {
        get: {
          tags: ["Inventory"],
          summary: "Get store manufacturers",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Manufacturer list" } },
        },
        post: {
          tags: ["Inventory"],
          summary: "Create a manufacturer",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    country: { type: "string" },
                    contactEmail: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Manufacturer created" } },
        },
      },
      // ─── Wishlist ─────────────────────────────────────────────────────────────
      "/api/wishlist": {
        get: {
          tags: ["Wishlist"],
          summary: "Get user wishlist",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Wishlist items" } },
        },
        post: {
          tags: ["Wishlist"],
          summary: "Add medicine to wishlist",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["medicineId"],
                  properties: { medicineId: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "Added to wishlist" } },
        },
      },
      "/api/wishlist/{medicineId}": {
        delete: {
          tags: ["Wishlist"],
          summary: "Remove medicine from wishlist",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "medicineId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Removed from wishlist" } },
        },
      },
      // ─── Health Management ────────────────────────────────────────────────────
      "/api/health/trackers": {
        get: {
          tags: ["Health"],
          summary: "Get medicine trackers for the user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Medicine trackers" } },
        },
        post: {
          tags: ["Health"],
          summary: "Create a medicine tracker",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["medicineName", "frequency"],
                  properties: {
                    medicineName: { type: "string" },
                    frequency: { type: "string", enum: ["daily", "twice-daily", "weekly"] },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                    reminderTime: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Tracker created" } },
        },
      },
      "/api/health/trackers/{id}/intake": {
        patch: {
          tags: ["Health"],
          summary: "Log medicine intake",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    takenAt: { type: "string", format: "date-time" },
                    skipped: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Intake logged" } },
        },
      },
      "/api/health/interactions/check": {
        post: {
          tags: ["Health"],
          summary: "Check drug interactions",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["medicines"],
                  properties: {
                    medicines: { type: "array", items: { type: "string" }, example: ["Aspirin", "Warfarin"] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Interaction result" } },
        },
      },
      "/api/health/timeline": {
        get: {
          tags: ["Health"],
          summary: "Get medical timeline for the user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Medical timeline" } },
        },
      },
      "/api/health/export/pdf": {
        get: {
          tags: ["Health"],
          summary: "Export health records as PDF",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "PDF file stream" } },
        },
      },
      // ─── Reviews ──────────────────────────────────────────────────────────────
      "/api/reviews": {
        get: {
          tags: ["Reviews"],
          summary: "Get public reviews",
          responses: { 200: { description: "Reviews list" } },
        },
        post: {
          tags: ["Reviews"],
          summary: "Create a review (User)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["storeId", "rating", "comment"],
                  properties: {
                    storeId: { type: "string" },
                    rating: { type: "number", minimum: 1, maximum: 5 },
                    comment: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Review created" } },
        },
      },
      "/api/reviews/me": {
        get: {
          tags: ["Reviews"],
          summary: "Get all reviews by the logged-in user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "User reviews" } },
        },
      },
      "/api/reviews/store/me": {
        get: {
          tags: ["Reviews"],
          summary: "Get reviews for the logged-in store",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Store reviews" } },
        },
      },
      "/api/reviews/store/{storeId}": {
        get: {
          tags: ["Reviews"],
          summary: "Get reviews for a specific store",
          parameters: [{ in: "path", name: "storeId", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Store reviews" } },
        },
      },
      "/api/reviews/{id}": {
        put: {
          tags: ["Reviews"],
          summary: "Update a review (User)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    rating: { type: "number" },
                    comment: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Review updated" } },
        },
        delete: {
          tags: ["Reviews"],
          summary: "Delete a review (User)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Review deleted" } },
        },
      },
      "/api/reviews/{id}/reply": {
        patch: {
          tags: ["Reviews"],
          summary: "Reply to a review (Store)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["reply"],
                  properties: { reply: { type: "string" } },
                },
              },
            },
          },
          responses: { 200: { description: "Reply posted" } },
        },
      },
      // ─── Audit & Reports ──────────────────────────────────────────────────────
      "/api/audit/logs": {
        get: {
          tags: ["Audit & Reports"],
          summary: "Get store audit logs",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Audit logs" } },
        },
      },
      "/api/audit/logs/export": {
        get: {
          tags: ["Audit & Reports"],
          summary: "Export audit logs as CSV",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "CSV file stream" } },
        },
      },
      "/api/reports/daily-close": {
        get: {
          tags: ["Audit & Reports"],
          summary: "Get daily close report",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Daily close report" } },
        },
      },
      "/api/reports/prescription-turnaround": {
        get: {
          tags: ["Audit & Reports"],
          summary: "Get prescription turnaround report",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Turnaround report" } },
        },
      },
      "/api/reports/inventory-risk": {
        get: {
          tags: ["Audit & Reports"],
          summary: "Get inventory risk report",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Inventory risk report" } },
        },
      },
      // ─── Patients ─────────────────────────────────────────────────────────────
      "/api/patients/import-csv": {
        post: {
          tags: ["Patients"],
          summary: "Import patients from a CSV file (Store)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: { patientsCsv: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: { 200: { description: "Patients imported" } },
        },
      },
    },
  },
  apis: [], // all paths are defined inline above
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
