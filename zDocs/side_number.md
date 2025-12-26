To integrate the "Side Number" (**የጉን ቁጥር**) correctly across your three sub-projects, you can use these targeted prompts. They focus on the specific role this number plays in Ethiopian transport regulation.

---

### 1️⃣ For **web-admin** (Data Management)
**Prompt:** "Add a mandatory **'Side Number' (የጉን ቁጥር)** field to the vehicle management module. In Ethiopia, this is a 4-digit operational ID painted on the vehicle for public identification.
* **Schema:** Ensure it is stored as a unique string (allow leading zeros).
* **UI:** Include it in the vehicle registration form, table columns, and search filters.
* **Logic:** While the Plate Number is the legal ID, the Side Number is the primary reference for public complaints; ensure both are visible in 'Detailed View'."


### 2️⃣ For **mobile-inspector** (Field Verification)
**Prompt:** "Update the vehicle verification screen to prominently display the **'Side Number' (የጉን ቁጥር)**.
* **UX:** Since this number is large and painted on the side of the taxi, it is the first thing an inspector sees visually before scanning.
* **UI:** Display it in a high-contrast 'badge' or large typography next to the Plate Number so the inspector can quickly cross-check the physical vehicle against the digital record on their screen."


### 3️⃣ For **backend** (API & Logic)
**Prompt:** "Update the Vehicle entity to include a `side_number` field.
* **Validation:** It should be a 4-digit string.
* **Indexing:** Create a database index for `side_number` as it will be a high-frequency search term (often used by the public or dispatchers who don't have the full plate number).
* **API:** Ensure the 'Verify' endpoint supports lookups by either `plate_number` or `side_number` to accommodate manual entry if a QR code is damaged."
