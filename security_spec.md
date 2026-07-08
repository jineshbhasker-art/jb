# Security Specification: Al Qusaidat Mobile POS

## 1. Data Invariants
- A **Sale** must have a unique `invoiceNumber`.
- A **SaleItem** must reference a valid `productId` and have positive `quantity` and `unitPrice`.
- **Products** can only be modified by authorized staff (Admin/Manager).
- **Users** can only read/write their own profile unless they are an Admin.
- **Accounting Transactions** are immutable once created (except for Admins).
- UAE VAT (5%) must be correctly applied to all taxable items.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing**: Attempt to create a Sale with a `cashierId` that doesn't match `request.auth.uid`.
2. **Price Manipulation**: Attempt to create a Sale where `unitPrice` is 0 or negative.
3. **VAT Avoidance**: Attempt to create a Sale with `vatAmount` set to 0 when items are taxable.
4. **Inventory Poisoning**: Attempt to update a Product with a 2MB `description` string.
5. **Unauthorized Stock Update**: A Cashier attempting to update `costPrice` of a product.
6. **Orphaned Sale**: Attempt to create a Sale for a non-existent `customerId`.
7. **Role Escalation**: A User attempting to set their own `role` to 'admin' in their profile.
8. **Terminal State Break**: Attempting to update a Sale once its status is 'COMPLETED'.
9. **Bulk Scraping**: Attempting a `list` query on `sales` without any filters as a guest.
10. **ID Injection**: Creating a product with a document ID containing special characters (e.g., `../poison`).
11. **Timestamp Spoofing**: Sending a `createdAt` date from 2020 in a new Sale payload.
12. **PII Leak**: A non-admin user trying to `get` another user's email via the `users` collection.

## 3. Test Runner Strategy
All operations must return `PERMISSION_DENIED` for the above payloads.
