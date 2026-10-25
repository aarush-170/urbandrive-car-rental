// UrbanDrive MongoDB seed (run with: mongosh "<MONGODB_URI>" mongodb/seed.js)
// Database: urbandrive. Collections: vehicle_inspections, vehicle_reviews.
// IDs (vehicle_id, booking_id, customer_id) reference rows in the MySQL database.
const d = db.getSiblingDB("urbandrive");
d.vehicle_inspections.drop();
d.vehicle_reviews.drop();

const dt = (s) => new Date(s + "Z");

// One inspection at pickup and one at return per completed booking; damage list is variable-shape.
d.vehicle_inspections.insertMany([
  { booking_id: 1, vehicle_id: 1, type: "pickup", inspected_at: dt("2026-07-03T10:00:00"), fuel_level: "Full", odometer: 12000, damages: [], photos: ["alto_front_0703.jpg"] },
  { booking_id: 1, vehicle_id: 1, type: "return", inspected_at: dt("2026-07-06T09:30:00"), fuel_level: "3/4", odometer: 12480, damages: [], photos: [] },
  { booking_id: 2, vehicle_id: 2, type: "pickup", inspected_at: dt("2026-07-10T09:00:00"), fuel_level: "Full", odometer: 21000, damages: [{ part: "rear bumper", severity: "minor", note: "existing scratch" }], photos: ["swift_rear_0710.jpg"] },
  { booking_id: 2, vehicle_id: 2, type: "return", inspected_at: dt("2026-07-13T13:00:00"), fuel_level: "1/2", odometer: 21650, damages: [{ part: "rear bumper", severity: "minor", note: "existing scratch" }], photos: [] },
  { booking_id: 5, vehicle_id: 8, type: "pickup", inspected_at: dt("2026-08-02T09:00:00"), fuel_level: "Full", odometer: 15000, damages: [], photos: [] },
  { booking_id: 5, vehicle_id: 8, type: "return", inspected_at: dt("2026-08-05T15:00:00"), fuel_level: "1/4", odometer: 15800, damages: [{ part: "clutch", severity: "major", note: "slipping under load", estimated_cost: 18500 }], photos: ["xuv700_clutch.jpg"] },
  { booking_id: 6, vehicle_id: 9, type: "return", inspected_at: dt("2026-08-12T09:00:00"), fuel_level: "Full", odometer: 25900, damages: [], photos: [] },
  { booking_id: 8, vehicle_id: 12, type: "return", inspected_at: dt("2026-08-22T11:00:00"), fuel_level: "1/2", odometer: 9400, damages: [{ part: "alloy wheel", severity: "minor", note: "kerb rash on front-left" }], photos: ["bmw_wheel_0822.jpg"] },
  { booking_id: 10, vehicle_id: 7, type: "return", inspected_at: dt("2026-09-09T14:00:00"), fuel_level: "3/4", odometer: 22800, damages: [], photos: [] },
  { booking_id: 11, vehicle_id: 13, type: "return", inspected_at: dt("2026-09-14T09:00:00"), fuel_level: "Full", odometer: 6350, damages: [], photos: [] },
  { booking_id: 12, vehicle_id: 18, type: "return", inspected_at: dt("2026-09-21T09:00:00"), battery_percent: 22, odometer: 11500, damages: [], photos: [] },
  { booking_id: 9, vehicle_id: 16, type: "return", inspected_at: dt("2026-09-04T09:00:00"), battery_percent: 31, odometer: 7300, damages: [{ part: "charging port cover", severity: "minor", note: "cracked hinge" }], photos: ["nexon_port.jpg"] },
]);

d.vehicle_reviews.insertMany([
  { booking_id: 1, vehicle_id: 1, customer_id: 1, category_id: 1, rating: 4, comment: "Compact and easy to park in the city, very good mileage.", tags: ["city", "fuel-efficient"], created_at: dt("2026-07-07T08:00:00") },
  { booking_id: 2, vehicle_id: 2, customer_id: 2, category_id: 2, rating: 3, comment: "Comfortable but the return process at Koramangala was slow.", tags: ["comfort", "slow-return"], created_at: dt("2026-07-14T10:00:00") },
  { booking_id: 3, vehicle_id: 4, customer_id: 3, category_id: 3, rating: 5, comment: "Smooth sedan for a long weekend drive, spotless interior.", tags: ["comfort", "clean"], created_at: dt("2026-07-22T09:00:00") },
  { booking_id: 4, vehicle_id: 6, customer_id: 4, category_id: 4, rating: 5, comment: "Creta handled the highway brilliantly and boot space was ample.", tags: ["highway", "spacious"], created_at: dt("2026-07-31T09:00:00") },
  { booking_id: 5, vehicle_id: 8, customer_id: 5, category_id: 4, rating: 2, comment: "Clutch felt weak during the trip, had to return late.", tags: ["mechanical-issue"], created_at: dt("2026-08-06T09:00:00") },
  { booking_id: 6, vehicle_id: 9, customer_id: 6, category_id: 5, rating: 5, comment: "Fortuner was powerful and perfect for the family trip.", tags: ["family", "powerful"], created_at: dt("2026-08-13T09:00:00") },
  { booking_id: 7, vehicle_id: 10, customer_id: 7, category_id: 7, rating: 4, comment: "Innova is roomy; seats a bit worn but reliable.", tags: ["family", "spacious"], created_at: dt("2026-08-19T09:00:00") },
  { booking_id: 8, vehicle_id: 12, customer_id: 8, category_id: 6, rating: 5, comment: "Premium feel, great ride quality for business travel.", tags: ["business", "luxury"], created_at: dt("2026-08-23T09:00:00") },
  { booking_id: 9, vehicle_id: 16, customer_id: 1, category_id: 10, rating: 4, comment: "EV was quiet and cheap to run, charging stations were easy to find.", tags: ["electric", "city"], created_at: dt("2026-09-05T09:00:00") },
  { booking_id: 10, vehicle_id: 7, customer_id: 9, category_id: 4, rating: 4, comment: "Seltos looks great and feels modern, pickup was quick at the airport.", tags: ["airport", "modern"], created_at: dt("2026-09-10T09:00:00") },
  { booking_id: 11, vehicle_id: 13, customer_id: 10, category_id: 6, rating: 5, comment: "E-Class was immaculate and chauffeur-grade comfort.", tags: ["luxury", "clean"], created_at: dt("2026-09-15T09:00:00") },
  { booking_id: 12, vehicle_id: 18, customer_id: 11, category_id: 10, rating: 3, comment: "Good range but the battery was low when I picked it up.", tags: ["electric", "battery"], created_at: dt("2026-09-22T09:00:00") },
]);

d.vehicle_inspections.createIndex({ vehicle_id: 1, inspected_at: -1 });
d.vehicle_inspections.createIndex({ booking_id: 1, type: 1 });
d.vehicle_inspections.createIndex({ "damages.severity": 1 });
d.vehicle_reviews.createIndex({ vehicle_id: 1, created_at: -1 });
d.vehicle_reviews.createIndex({ category_id: 1, rating: -1 });
d.vehicle_reviews.createIndex({ comment: "text", tags: "text" });

print("inspections:", d.vehicle_inspections.countDocuments(), "reviews:", d.vehicle_reviews.countDocuments());
