# Ethiopian Term,Standard English,Common Usage
# Bollo / Bolo,Annual Inspection Sticker / Road Tax,"""I need to renew my Bollo."""
# Chance / Chansi,Chassis Number / VIN,"""The traffic police checked my chance number."""# 

- In Vehicle registration, the "chance number" refers to the chassis number or Vehicle Identification Number (VIN) of a vehicle and i want this field to be included in the vehicle registration form and uniquely identify each vehicle. and I want this field to be mandatory. and also displayed in the vehicle details page.
- Again in Vehicle registration, the "bollo" refers to the annual inspection sticker or road tax that vehicles must have to be legally driven on the road. I want to include a field for "bollo" in the vehicle registration form where users can upload a photo or provide details of their bollo. This field should also be mandatory and displayed in the vehicle details page and also mobile app when verifified inspectors see the vehicle details. and on this bollo field i want the system to check time left before expiry and show colors (green, yellow, red) based on how close it is to expiry. when the bollo is below 90 days to expiry i want it to show yellow color and when its below 30 days i want it to show red color. and otherwise green color.
I want the system to send auto reminders to vehicle owners and admins when the bollo is about to expire (at 90 days, 30 days, and on the expiry date).

- and i want the vehicle registration forms to suppoer mulltiple owners (third party owners) so that when registering a vehicle the user can add multiple owners with their details (name, id number, contact info) and all owners should be displayed in the vehicle details page and mobile app when verified inspectors see the vehicle details.

- Also I want the vehicle registration form to support multiple documents upload so that users can upload multiple supporting documents (like insurance, previous inspection reports, etc.) during vehicle registration. and all uploaded documents should be listed in the vehicle details page and mobile app when verified inspectors see the vehicle details.

- Finally I want the vehicle registration form to support vehicle history log so that users can add previous owners and service history during vehicle registration. and all history logs should be displayed in the vehicle details page and mobile app when verified inspectors see the vehicle details. (previous owners should include name, id number, contact info, ownership period and service history should include service date, service type, service provider, notes) (and i want this field to be activated after the user checks a checkbox "Add Vehicle History Log" in the vehicle registration form)

---
- Driver's License,National ID Card:
 on vehicle registration form i want the form to include "add drive information" and when the user checks this checkbox the form should show fields to add driver information (driver's license number, issue date, expiry date, license class) and national id card information (id number, issue date, expiry date) and these fields should be mandatory when the checkbox is checked. and all this information should be displayed in the vehicle details page and mobile app when verified inspectors see the vehicle details. and also i want the system to check the expiry date of both driver's license and national id card and show colors (green, yellow, red) based on how close it is to expiry. when the expiry date is below 90 days i want it to show yellow color and when its below 30 days i want it to show red color. and otherwise green color.
 and i want the system to send auto reminders to driver, vehicle owners and admins when the driver's license or national id card is about to expire (at 90 days, 30 days, and on the expiry date).



- I want the admin be able to flag vehicles for review so that if an admin finds any suspicious or non-compliant vehicle during inspection or review, they can flag the vehicle for further investigation. flagged vehicles should be listed in a separate "Flagged Vehicles" page for admins to review and take action (like re-inspection, suspension, etc.)

- I want the qr code printing works or print the intended content perfectly on one page and i want the QR code to have city administration logo on the center of the QR code.


- overall make the system to look and operate like production ready and fill any gap you see in the system.