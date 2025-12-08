import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= REALISTIC INDIA-SPECIFIC DATA =============

// Farmers with realistic South Indian names and locations
const farmers = [
  { email: "ramesh.gowda@agrimitra.in", name: "Ramesh Gowda", village: "Mandya Town", district: "Mandya", phone: "9876543201", landArea: 2.5 },
  { email: "shankarappa@agrimitra.in", name: "Shankarappa B", village: "Maddur", district: "Mandya", phone: "9876543202", landArea: 1.8 },
  { email: "lakshman.shetty@agrimitra.in", name: "Lakshman Shetty", village: "Malavalli", district: "Mandya", phone: "9876543203", landArea: 3.2 },
  { email: "sheela.amma@agrimitra.in", name: "Sheela Amma", village: "Pandavapura", district: "Mandya", phone: "9876543204", landArea: 1.5 },
  { email: "veeresh@agrimitra.in", name: "Veeresh Kumar", village: "Ramanagara Town", district: "Ramanagara", phone: "9876543205", landArea: 2.0 },
  { email: "ningappa@agrimitra.in", name: "Ningappa H", village: "Channapatna", district: "Ramanagara", phone: "9876543206", landArea: 2.8 },
  { email: "savitramma@agrimitra.in", name: "Savitramma", village: "Mysuru Rural", district: "Mysuru", phone: "9876543207", landArea: 1.2 },
  { email: "harshitha@agrimitra.in", name: "Harshitha D", village: "T. Narasipura", district: "Mysuru", phone: "9876543208", landArea: 2.3 },
  { email: "girish@agrimitra.in", name: "Girish Patil", village: "Srirangapatna", district: "Mandya", phone: "9876543209", landArea: 1.7 },
  { email: "ravi.patil@agrimitra.in", name: "Ravi Patil", village: "K.R. Nagar", district: "Mysuru", phone: "9876543210", landArea: 2.1 },
];

// Agents with cluster assignments
const agents = [
  { email: "mahesh.agent@agrimitra.in", name: "Mahesh Kumar", district: "Mandya", phone: "9876543301", cluster: "Mandya Central" },
  { email: "kavya.agent@agrimitra.in", name: "Kavya Sharma", district: "Mandya", phone: "9876543302", cluster: "Maddur-Malavalli" },
  { email: "raghav.agent@agrimitra.in", name: "Raghav Hegde", district: "Mysuru", phone: "9876543303", cluster: "Mysuru Rural" },
  { email: "ananya.agent@agrimitra.in", name: "Ananya Reddy", district: "Ramanagara", phone: "9876543304", cluster: "Ramanagara-Channapatna" },
];

// Transporters with realistic vehicle info
const transporters = [
  { email: "raju.transport@agrimitra.in", name: "Raju Transport Service", district: "Mandya", phone: "9876543401", village: "Mandya Town" },
  { email: "sahana.logistics@agrimitra.in", name: "Sahana Logistics", district: "Mandya", phone: "9876543402", village: "Maddur" },
  { email: "manjunath.truck@agrimitra.in", name: "Manjunath Mini-Truck", district: "Ramanagara", phone: "9876543403", village: "Ramanagara Town" },
  { email: "swaroop.goods@agrimitra.in", name: "Swaroop Goods Carrier", district: "Mandya", phone: "9876543404", village: "Malavalli" },
  { email: "sriram.transport@agrimitra.in", name: "Sri Ram Transport", district: "Mysuru", phone: "9876543405", village: "Mysuru City" },
];

// Buyers with realistic business types
const buyers = [
  { email: "freshmart@agrimitra.in", name: "Suresh Kumar", company: "FreshMart Mandya", type: "retail", district: "Mandya", phone: "9876543501", crops: ["Tomato", "Onion", "Chilli"] },
  { email: "mysuru.wholesale@agrimitra.in", name: "Prakash Rao", company: "Mysuru Veg Wholesale", type: "wholesale", district: "Mysuru", phone: "9876543502", crops: ["Rice", "Ragi", "Maize"] },
  { email: "nalpak@agrimitra.in", name: "Mohammed Imran", company: "Hotel Nalpak Kitchen", type: "restaurant", district: "Mandya", phone: "9876543503", crops: ["Tomato", "Beans", "Potato"] },
  { email: "greenleaf@agrimitra.in", name: "Priya Nair", company: "GreenLeaf Fresh Juices", type: "retail", district: "Mysuru", phone: "9876543504", crops: ["Banana", "Coconut"] },
  { email: "krexports@agrimitra.in", name: "Krishnamurthy R", company: "KR Export Traders", type: "export", district: "Mandya", phone: "9876543505", crops: ["Rice", "Ragi", "Banana"] },
];

const admins = [
  { email: "admin@agrimitra.in", name: "Arun Sharma", role: "super_admin", district: null, phone: "9876543601" },
  { email: "ops@agrimitra.in", name: "Rekha Devi", role: "operations_admin", district: "Mandya", phone: "9876543602" },
];

// Realistic Karnataka crops with growth cycles
const cropTypes = [
  { name: "Tomato", variety: "Arka Rakshak Hybrid", unit: "quintals", growthDays: 75, priceRange: [1200, 2000] },
  { name: "Onion", variety: "Bellary Red", unit: "quintals", growthDays: 120, priceRange: [1800, 2800] },
  { name: "Ragi", variety: "GPU-28", unit: "quintals", growthDays: 110, priceRange: [2200, 3000] },
  { name: "Rice", variety: "Sona Masuri", unit: "quintals", growthDays: 130, priceRange: [2500, 3200] },
  { name: "Banana", variety: "Robusta", unit: "bunches", growthDays: 300, priceRange: [1600, 2500] },
  { name: "Coconut", variety: "East Coast Tall", unit: "nuts", growthDays: 365, priceRange: [1500, 2200] },
  { name: "Chilli", variety: "Byadgi", unit: "quintals", growthDays: 90, priceRange: [2500, 4000] },
  { name: "Beans", variety: "French Beans", unit: "quintals", growthDays: 50, priceRange: [2000, 3500] },
  { name: "Potato", variety: "Kufri Jyoti", unit: "quintals", growthDays: 100, priceRange: [1200, 1800] },
  { name: "Brinjal", variety: "Mysuru Local", unit: "quintals", growthDays: 60, priceRange: [1500, 2500] },
  { name: "Sugarcane", variety: "Co-86032", unit: "tonnes", growthDays: 365, priceRange: [2800, 3500] },
  { name: "Maize", variety: "Pioneer Yellow", unit: "quintals", growthDays: 95, priceRange: [1600, 2200] },
];

// Realistic vehicle types
const vehicleTypes = [
  { type: "Tata Ace", capacity: 750, plate: "KA" },
  { type: "Bolero Pickup", capacity: 2000, plate: "KA" },
  { type: "Eicher Mini Truck", capacity: 3500, plate: "KA" },
  { type: "Ashok Leyland Dost", capacity: 1500, plate: "KA" },
  { type: "Mahindra Supro", capacity: 1200, plate: "KA" },
];

const soilTypes = ["Red Soil", "Black Cotton Soil", "Clay Loam", "Sandy Loam", "Laterite"];

const markets = ["Mandya APMC", "Mysuru APMC", "Ramanagara Market", "Maddur Vegetable Market", "Channapatna Mandi"];

const taskTypes = ["visit", "verify_crop", "harvest_check", "transport_assist"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const results: Record<string, number> = {};
    const userIds: Record<string, string> = {};
    const farmerIds: string[] = [];
    const agentIds: string[] = [];
    const transporterRecordIds: string[] = [];
    const transporterUserIds: string[] = [];
    const buyerRecordIds: string[] = [];
    const farmlandIds: string[] = [];
    const cropIds: string[] = [];
    const cropDetails: Array<{ id: string; farmerId: string; cropName: string; status: string }> = [];

    const today = new Date();

    // Helper to create user
    async function createUser(email: string, password: string, metadata: Record<string, unknown>) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error && !error.message.includes("already been registered")) {
        console.error(`Error creating user ${email}:`, error);
        return null;
      }
      if (data?.user) return data.user.id;
      
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === email);
      return existing?.id || null;
    }

    // Helper to get random date
    function getDateOffset(days: number): string {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    }

    // ============= 1. CREATE FARMERS =============
    console.log("Creating farmers...");
    for (const farmer of farmers) {
      const userId = await createUser(farmer.email, "farmer123", { 
        full_name: farmer.name, 
        role: "farmer", 
        phone: farmer.phone 
      });
      if (userId) {
        userIds[farmer.email] = userId;
        farmerIds.push(userId);
        
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: farmer.name,
          phone: farmer.phone,
          village: farmer.village,
          district: farmer.district,
          total_land_area: farmer.landArea,
        }, { onConflict: "id" });

        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: "farmer",
        }, { onConflict: "user_id,role" });
      }
    }
    results.farmers = farmerIds.length;

    // ============= 2. CREATE AGENTS =============
    console.log("Creating agents...");
    for (const agent of agents) {
      const userId = await createUser(agent.email, "agent123", { 
        full_name: agent.name, 
        role: "agent", 
        phone: agent.phone 
      });
      if (userId) {
        userIds[agent.email] = userId;
        agentIds.push(userId);

        await supabase.from("profiles").upsert({
          id: userId,
          full_name: agent.name,
          phone: agent.phone,
          district: agent.district,
        }, { onConflict: "id" });

        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: "agent",
        }, { onConflict: "user_id,role" });
      }
    }
    results.agents = agentIds.length;

    // ============= 3. CREATE TRANSPORTERS + VEHICLES =============
    console.log("Creating transporters and vehicles...");
    for (let i = 0; i < transporters.length; i++) {
      const trans = transporters[i];
      const userId = await createUser(trans.email, "trans123", { 
        full_name: trans.name, 
        role: "logistics", 
        phone: trans.phone 
      });
      if (userId) {
        userIds[trans.email] = userId;
        transporterUserIds.push(userId);

        await supabase.from("profiles").upsert({
          id: userId,
          full_name: trans.name,
          phone: trans.phone,
          district: trans.district,
        }, { onConflict: "id" });

        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: "logistics",
        }, { onConflict: "user_id,role" });

        const vehicle = vehicleTypes[i % vehicleTypes.length];
        const { data: transRecord } = await supabase.from("transporters").upsert({
          user_id: userId,
          name: trans.name,
          phone: trans.phone,
          operating_district: trans.district,
          operating_village: trans.village,
          vehicle_type: vehicle.type,
          vehicle_capacity: vehicle.capacity,
          registration_number: `KA-${10 + i}-${String.fromCharCode(65 + i)}-${1000 + i * 111}`,
        }, { onConflict: "user_id" }).select().single();

        if (transRecord) {
          transporterRecordIds.push(transRecord.id);
          
          // Create 1-2 vehicles per transporter
          const numVehicles = Math.random() > 0.5 ? 2 : 1;
          for (let v = 0; v < numVehicles; v++) {
            const vType = vehicleTypes[(i + v) % vehicleTypes.length];
            await supabase.from("vehicles").insert({
              transporter_id: transRecord.id,
              vehicle_type: vType.type,
              capacity: vType.capacity,
              number_plate: `KA-${10 + i}${String.fromCharCode(65 + v)}-${2000 + i * 100 + v}`,
              is_active: true,
            });
          }
        }
      }
    }
    results.transporters = transporterRecordIds.length;

    // ============= 4. CREATE BUYERS =============
    console.log("Creating buyers...");
    for (const buyer of buyers) {
      const userId = await createUser(buyer.email, "buyer123", { 
        full_name: buyer.name, 
        role: "buyer", 
        phone: buyer.phone 
      });
      if (userId) {
        userIds[buyer.email] = userId;

        await supabase.from("profiles").upsert({
          id: userId,
          full_name: buyer.name,
          phone: buyer.phone,
          district: buyer.district,
        }, { onConflict: "id" });

        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: "buyer",
        }, { onConflict: "user_id,role" });

        const { data: buyerRecord } = await supabase.from("buyers").upsert({
          user_id: userId,
          name: buyer.name,
          company_name: buyer.company,
          buyer_type: buyer.type,
          district: buyer.district,
          phone: buyer.phone,
          preferred_crops: buyer.crops,
        }, { onConflict: "user_id" }).select().single();

        if (buyerRecord) buyerRecordIds.push(buyerRecord.id);
      }
    }
    results.buyers = buyerRecordIds.length;

    // ============= 5. CREATE ADMINS =============
    console.log("Creating admins...");
    const adminRecordIds: string[] = [];
    for (const admin of admins) {
      const password = admin.role === "super_admin" ? "admin123" : "ops123";
      const userId = await createUser(admin.email, password, { 
        full_name: admin.name, 
        role: "admin", 
        phone: admin.phone 
      });
      if (userId) {
        userIds[admin.email] = userId;

        await supabase.from("profiles").upsert({
          id: userId,
          full_name: admin.name,
          phone: admin.phone,
          district: admin.district,
        }, { onConflict: "id" });

        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: "admin",
        }, { onConflict: "user_id,role" });

        const { data: adminRecord } = await supabase.from("admin_users").upsert({
          user_id: userId,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          assigned_district: admin.district,
        }, { onConflict: "user_id" }).select().single();

        if (adminRecord) adminRecordIds.push(adminRecord.id);
      }
    }
    results.admins = 2;

    // ============= 6. CREATE FARMLANDS (1-2 per farmer) =============
    console.log("Creating farmlands...");
    const farmlandToFarmer: Record<string, number> = {};
    
    for (let i = 0; i < farmerIds.length; i++) {
      const farmerId = farmerIds[i];
      const farmer = farmers[i];
      const numLands = farmer.landArea > 2 ? 2 : 1;
      const landPerPlot = farmer.landArea / numLands;

      for (let j = 0; j < numLands; j++) {
        const landName = numLands === 1 
          ? `${farmer.name.split(" ")[0]}'s Farm`
          : `${farmer.name.split(" ")[0]}'s Farm ${j + 1}`;
        
        const { data: land } = await supabase.from("farmlands").insert({
          farmer_id: farmerId,
          name: landName,
          area: Number(landPerPlot.toFixed(1)),
          area_unit: "acres",
          village: farmer.village,
          district: farmer.district,
          soil_type: soilTypes[(i + j) % soilTypes.length],
          location_lat: 12.3 + (i * 0.05) + (j * 0.01),
          location_long: 76.5 + (i * 0.05) + (j * 0.01),
        }).select().single();

        if (land) {
          farmlandIds.push(land.id);
          farmlandToFarmer[land.id] = i;
        }
      }
    }
    results.farmlands = farmlandIds.length;

    // ============= 7. CREATE CROPS (25 total with realistic distribution) =============
    console.log("Creating crops with realistic growth stages...");
    
    // Distribution: 6 ready, 6 one_week, 8 growing, 5 harvested
    const cropDistribution = [
      // Ready to harvest crops
      { cropIndex: 0, status: "ready", daysToHarvest: 0, landIndex: 0, quantity: 1500 }, // Tomato
      { cropIndex: 1, status: "ready", daysToHarvest: 0, landIndex: 1, quantity: 2000 }, // Onion
      { cropIndex: 6, status: "ready", daysToHarvest: 0, landIndex: 2, quantity: 800 },  // Chilli
      { cropIndex: 7, status: "ready", daysToHarvest: 0, landIndex: 3, quantity: 600 },  // Beans
      { cropIndex: 9, status: "ready", daysToHarvest: 0, landIndex: 4, quantity: 1200 }, // Brinjal
      { cropIndex: 8, status: "ready", daysToHarvest: 0, landIndex: 5, quantity: 1800 }, // Potato
      
      // 1 week to harvest
      { cropIndex: 0, status: "one_week", daysToHarvest: 5, landIndex: 6, quantity: 2200 },  // Tomato
      { cropIndex: 1, status: "one_week", daysToHarvest: 3, landIndex: 7, quantity: 1800 },  // Onion
      { cropIndex: 2, status: "one_week", daysToHarvest: 7, landIndex: 8, quantity: 2500 },  // Ragi
      { cropIndex: 3, status: "one_week", daysToHarvest: 4, landIndex: 9, quantity: 3000 },  // Rice
      { cropIndex: 8, status: "one_week", daysToHarvest: 6, landIndex: 0, quantity: 1500 },  // Potato
      { cropIndex: 11, status: "one_week", daysToHarvest: 2, landIndex: 1, quantity: 2000 }, // Maize
      
      // Growing crops
      { cropIndex: 0, status: "growing", daysToHarvest: 25, landIndex: 2, quantity: 1800 },  // Tomato
      { cropIndex: 4, status: "growing", daysToHarvest: 180, landIndex: 3, quantity: 500 },  // Banana
      { cropIndex: 5, status: "growing", daysToHarvest: 200, landIndex: 4, quantity: 800 },  // Coconut
      { cropIndex: 10, status: "growing", daysToHarvest: 250, landIndex: 5, quantity: 12 },  // Sugarcane (tonnes)
      { cropIndex: 2, status: "growing", daysToHarvest: 45, landIndex: 6, quantity: 2000 },  // Ragi
      { cropIndex: 3, status: "growing", daysToHarvest: 60, landIndex: 7, quantity: 2800 },  // Rice
      { cropIndex: 6, status: "growing", daysToHarvest: 35, landIndex: 8, quantity: 900 },   // Chilli
      { cropIndex: 11, status: "growing", daysToHarvest: 40, landIndex: 9, quantity: 2200 }, // Maize
      
      // Harvested crops (historical data)
      { cropIndex: 0, status: "harvested", daysToHarvest: -10, landIndex: 0, quantity: 1400 }, // Tomato
      { cropIndex: 1, status: "harvested", daysToHarvest: -15, landIndex: 2, quantity: 1900 }, // Onion
      { cropIndex: 7, status: "harvested", daysToHarvest: -7, landIndex: 4, quantity: 700 },   // Beans
      { cropIndex: 8, status: "harvested", daysToHarvest: -20, landIndex: 6, quantity: 1600 }, // Potato
      { cropIndex: 9, status: "harvested", daysToHarvest: -12, landIndex: 8, quantity: 1100 }, // Brinjal
    ];

    for (const cropInfo of cropDistribution) {
      const cropType = cropTypes[cropInfo.cropIndex];
      const landId = farmlandIds[cropInfo.landIndex % farmlandIds.length];
      const farmerIndex = farmlandToFarmer[landId];
      const farmerId = farmerIds[farmerIndex];
      
      const sowingDaysAgo = cropType.growthDays - cropInfo.daysToHarvest;
      const sowingDate = getDateOffset(-sowingDaysAgo);
      const harvestDate = getDateOffset(cropInfo.daysToHarvest);

      const { data: crop } = await supabase.from("crops").insert({
        farmer_id: farmerId,
        land_id: landId,
        crop_name: cropType.name,
        variety: cropType.variety,
        sowing_date: sowingDate,
        harvest_estimate: harvestDate,
        status: cropInfo.status as "growing" | "one_week" | "ready" | "harvested",
        estimated_quantity: cropInfo.quantity,
        quantity_unit: cropType.unit === "tonnes" ? "quintals" : cropType.unit,
      }).select().single();

      if (crop) {
        cropIds.push(crop.id);
        cropDetails.push({
          id: crop.id,
          farmerId: farmerId,
          cropName: cropType.name,
          status: cropInfo.status,
        });
      }
    }
    results.crops = cropIds.length;

    // ============= 8. CREATE AGENT TASKS (18 tasks) =============
    console.log("Creating agent tasks...");
    
    const agentTaskData = [
      // Completed tasks (4)
      { agentIdx: 0, farmerIdx: 0, cropIdx: 0, type: "visit", status: "completed", daysOffset: -5, priority: 1, notes: "Visited Ramesh Gowda's farm. Tomato crop healthy, ready for harvest. Advised on optimal harvest timing." },
      { agentIdx: 1, farmerIdx: 2, cropIdx: 6, type: "verify_crop", status: "completed", daysOffset: -3, priority: 2, notes: "Verified chilli crop quality. Grade A estimated at 60%, Grade B 30%. Good color and size." },
      { agentIdx: 2, farmerIdx: 6, cropIdx: 4, type: "harvest_check", status: "completed", daysOffset: -2, priority: 1, notes: "Beans harvest complete. Actual yield 620kg vs estimated 600kg. Quality excellent." },
      { agentIdx: 3, farmerIdx: 4, cropIdx: 5, type: "transport_assist", status: "completed", daysOffset: -1, priority: 3, notes: "Coordinated transport for Veeresh's brinjal. Raju Transport assigned. Pickup completed." },
      
      // In-progress tasks (6)
      { agentIdx: 0, farmerIdx: 1, cropIdx: 1, type: "harvest_check", status: "in_progress", daysOffset: 0, priority: 1, notes: "Onion crop inspection started. Bulb formation looks good. Checking moisture levels." },
      { agentIdx: 1, farmerIdx: 3, cropIdx: 7, type: "visit", status: "in_progress", daysOffset: 0, priority: 2, notes: "Routine visit to Sheela Amma. Discussing upcoming tomato harvest planning." },
      { agentIdx: 2, farmerIdx: 7, cropIdx: 8, type: "verify_crop", status: "in_progress", daysOffset: 1, priority: 1, notes: "Verifying ragi crop health. Early signs of fungal infection detected. Suggesting treatment." },
      { agentIdx: 3, farmerIdx: 5, cropIdx: 9, type: "harvest_check", status: "in_progress", daysOffset: 0, priority: 2, notes: "Rice crop nearing harvest. Checking grain maturity and moisture content." },
      { agentIdx: 0, farmerIdx: 8, cropIdx: 10, type: "visit", status: "in_progress", daysOffset: 1, priority: 3, notes: "Visiting Girish Patil for potato crop assessment. Previous yield was excellent." },
      { agentIdx: 1, farmerIdx: 9, cropIdx: 11, type: "transport_assist", status: "in_progress", daysOffset: 0, priority: 1, notes: "Arranging transport for Ravi Patil's maize harvest. Coordinating with local transporters." },
      
      // Pending tasks (8)
      { agentIdx: 0, farmerIdx: 2, cropIdx: 12, type: "visit", status: "pending", daysOffset: 2, priority: 2, notes: "Scheduled visit to check tomato seedling progress at Lakshman Shetty's farm." },
      { agentIdx: 1, farmerIdx: 4, cropIdx: 13, type: "verify_crop", status: "pending", daysOffset: 3, priority: 3, notes: "Banana plantation quality verification pending. Need to check for pests." },
      { agentIdx: 2, farmerIdx: 6, cropIdx: 14, type: "harvest_check", status: "pending", daysOffset: 4, priority: 2, notes: "Coconut harvest assessment scheduled. Estimating yield for next quarter." },
      { agentIdx: 3, farmerIdx: 0, cropIdx: 15, type: "transport_assist", status: "pending", daysOffset: 2, priority: 1, notes: "Need to arrange sugarcane transport to Mandya Sugar Factory." },
      { agentIdx: 0, farmerIdx: 3, cropIdx: 16, type: "visit", status: "pending", daysOffset: 5, priority: 3, notes: "Follow-up visit for ragi crop growth monitoring." },
      { agentIdx: 1, farmerIdx: 5, cropIdx: 17, type: "verify_crop", status: "pending", daysOffset: 4, priority: 2, notes: "Rice grain quality check before harvest recommendation." },
      { agentIdx: 2, farmerIdx: 8, cropIdx: 18, type: "harvest_check", status: "pending", daysOffset: 3, priority: 1, notes: "Chilli harvest readiness check. Farmer reports good red coloring." },
      { agentIdx: 3, farmerIdx: 9, cropIdx: 19, type: "transport_assist", status: "pending", daysOffset: 6, priority: 2, notes: "Coordinating transport for upcoming maize harvest." },
    ];

    for (const task of agentTaskData) {
      await supabase.from("agent_tasks").insert({
        agent_id: agentIds[task.agentIdx],
        farmer_id: farmerIds[task.farmerIdx],
        crop_id: cropIds[task.cropIdx % cropIds.length],
        task_type: task.type as "visit" | "verify_crop" | "harvest_check" | "transport_assist",
        task_status: task.status as "pending" | "in_progress" | "completed",
        due_date: getDateOffset(task.daysOffset),
        priority: task.priority,
        notes: task.notes,
      });
    }
    results.agent_tasks = agentTaskData.length;

    // ============= 9. CREATE AGENT DATA (Field Data Collection) =============
    console.log("Creating agent field data...");
    
    const agentFieldData = [
      // Mahesh - Mandya Central cluster
      { agentIdx: 0, farmerIdx: 0, location: "Mandya Town", soil: "Red Soil", moisture: "Medium", ph: 6.5, crop: "Tomato", health: "Excellent", notes: "Healthy plants. Fruit setting stage. Recommend calcium spray to prevent blossom end rot." },
      { agentIdx: 0, farmerIdx: 1, location: "Maddur", soil: "Black Cotton Soil", moisture: "High", ph: 7.2, crop: "Onion", health: "Good", notes: "Bulb development on track. Some yellowing in lower leaves - normal senescence." },
      { agentIdx: 0, farmerIdx: 8, location: "Srirangapatna", soil: "Clay Loam", moisture: "Medium", ph: 6.8, crop: "Potato", health: "Good", notes: "Tuber formation started. Recommend earthing up for better yield." },
      
      // Kavya - Maddur-Malavalli cluster
      { agentIdx: 1, farmerIdx: 2, location: "Malavalli", soil: "Red Soil", moisture: "Low", ph: 6.2, crop: "Chilli", health: "Moderate", notes: "Some wilting observed. Drip irrigation recommended. Pest inspection needed." },
      { agentIdx: 1, farmerIdx: 3, location: "Pandavapura", soil: "Sandy Loam", moisture: "Medium", ph: 6.7, crop: "Beans", health: "Excellent", notes: "Flowering stage. Good pod setting. Market ready in 10 days." },
      { agentIdx: 1, farmerIdx: 9, location: "K.R. Nagar", soil: "Laterite", moisture: "Medium", ph: 5.8, crop: "Maize", health: "Good", notes: "Cob formation excellent. Yellow variety showing good grain fill." },
      
      // Raghav - Mysuru Rural cluster
      { agentIdx: 2, farmerIdx: 6, location: "Mysuru Rural", soil: "Red Soil", moisture: "Medium", ph: 6.4, crop: "Ragi", health: "Good", notes: "Earhead formation complete. Grain maturity progressing well. Harvest in 7-10 days." },
      { agentIdx: 2, farmerIdx: 7, location: "T. Narasipura", soil: "Black Cotton Soil", moisture: "High", ph: 7.0, crop: "Rice", health: "Excellent", notes: "Panicle fully formed. Golden color appearing. Ready for harvest next week." },
      { agentIdx: 2, farmerIdx: 6, location: "Mysuru Rural", soil: "Sandy Loam", moisture: "Low", ph: 6.6, crop: "Coconut", health: "Good", notes: "Young palms healthy. Recommend fertilizer application. First yield expected in 6 months." },
      
      // Ananya - Ramanagara-Channapatna cluster
      { agentIdx: 3, farmerIdx: 4, location: "Ramanagara Town", soil: "Clay Loam", moisture: "Medium", ph: 6.9, crop: "Brinjal", health: "Excellent", notes: "Heavy fruiting. Purple variety showing excellent size and shine. Ready for market." },
      { agentIdx: 3, farmerIdx: 5, location: "Channapatna", soil: "Red Soil", moisture: "High", ph: 6.3, crop: "Banana", health: "Good", notes: "Robusta variety in vegetative stage. Suckers removed. Bunch expected in 4 months." },
      { agentIdx: 3, farmerIdx: 4, location: "Ramanagara Town", soil: "Black Cotton Soil", moisture: "Medium", ph: 7.1, crop: "Sugarcane", health: "Excellent", notes: "Healthy growth. Internodes developing well. Harvest in 8 months. Expected yield 80 tonnes/ha." },
    ];

    for (const data of agentFieldData) {
      await supabase.from("agent_data").insert({
        agent_id: agentIds[data.agentIdx],
        farmer_id: farmerIds[data.farmerIdx],
        farm_location: data.location,
        soil_type: data.soil,
        soil_moisture: data.moisture,
        soil_ph: data.ph,
        crop_type: data.crop,
        crop_health: data.health,
        latitude: 12.3 + (data.farmerIdx * 0.05),
        longitude: 76.5 + (data.farmerIdx * 0.05),
        notes: data.notes,
      });
    }
    results.agent_data = agentFieldData.length;

    // ============= 10. CREATE TRANSPORT REQUESTS (12 requests) =============
    console.log("Creating transport requests...");
    
    const transportRequests = [
      // REQUESTED (4)
      { farmerIdx: 0, cropIdx: 0, status: "requested", quantity: 1500, location: "Mandya Town", village: "Mandya Town", date: 2, time: "Morning", notes: "Tomato harvest ready. Need transport to Mandya APMC. Fresh produce, handle carefully." },
      { farmerIdx: 2, cropIdx: 2, status: "requested", quantity: 800, location: "Malavalli", village: "Malavalli", date: 3, time: "Afternoon", notes: "Chilli ready for pickup. Packed in gunny bags. Destination: Mysuru APMC." },
      { farmerIdx: 6, cropIdx: 8, status: "requested", quantity: 2500, location: "Mysuru Rural", village: "Mysuru Rural", date: 4, time: "Morning", notes: "Ragi harvest. Need covered transport. Delivery to Mysuru warehouse." },
      { farmerIdx: 4, cropIdx: 4, status: "requested", quantity: 1200, location: "Ramanagara Town", village: "Ramanagara Town", date: 2, time: "Evening", notes: "Brinjal in crates. Handle with care. Destination: Ramanagara Market." },
      
      // ASSIGNED (3)
      { farmerIdx: 1, cropIdx: 1, status: "assigned", quantity: 2000, location: "Maddur", village: "Maddur", date: 1, time: "Morning", transporterIdx: 0, notes: "Onion in mesh bags. Raju Transport assigned. Pickup from farm gate." },
      { farmerIdx: 3, cropIdx: 3, status: "assigned", quantity: 600, location: "Pandavapura", village: "Pandavapura", date: 1, time: "Afternoon", transporterIdx: 1, notes: "Beans in crates. Sahana Logistics handling. Delivery to Hotel Nalpak." },
      { farmerIdx: 7, cropIdx: 9, status: "assigned", quantity: 3000, location: "T. Narasipura", village: "T. Narasipura", date: 2, time: "Morning", transporterIdx: 4, notes: "Rice bags. Sri Ram Transport assigned. Destination: Mysuru Rice Mill." },
      
      // EN_ROUTE (3)
      { farmerIdx: 5, cropIdx: 5, status: "en_route", quantity: 1800, location: "Channapatna", village: "Channapatna", date: 0, time: "Morning", transporterIdx: 2, notes: "Potato in gunny bags. Manjunath's vehicle en route. ETA 2 hours to Ramanagara." },
      { farmerIdx: 8, cropIdx: 10, status: "en_route", quantity: 1500, location: "Srirangapatna", village: "Srirangapatna", date: 0, time: "Afternoon", transporterIdx: 3, notes: "Potato load picked up. Swaroop Goods en route to Mandya APMC." },
      { farmerIdx: 9, cropIdx: 11, status: "en_route", quantity: 2000, location: "K.R. Nagar", village: "K.R. Nagar", date: 0, time: "Morning", transporterIdx: 4, notes: "Maize in bags. Sri Ram Transport heading to Mysuru Wholesale Market." },
      
      // DELIVERED (2)
      { farmerIdx: 0, cropIdx: 20, status: "delivered", quantity: 1400, location: "Mandya Town", village: "Mandya Town", date: -2, time: "Morning", transporterIdx: 0, distance: 25, notes: "Previous tomato batch delivered successfully to FreshMart Mandya." },
      { farmerIdx: 2, cropIdx: 21, status: "delivered", quantity: 1900, location: "Malavalli", village: "Malavalli", date: -3, time: "Afternoon", transporterIdx: 1, distance: 35, notes: "Onion delivery completed. Buyer confirmed quality. Payment pending." },
    ];

    for (const req of transportRequests) {
      const requestData: Record<string, unknown> = {
        farmer_id: farmerIds[req.farmerIdx],
        crop_id: cropIds[req.cropIdx % cropIds.length],
        quantity: req.quantity,
        quantity_unit: "kg",
        pickup_location: req.location,
        pickup_village: req.village,
        preferred_date: getDateOffset(req.date),
        preferred_time: req.time,
        status: req.status,
        notes: req.notes,
      };

      if (req.transporterIdx !== undefined && transporterUserIds[req.transporterIdx]) {
        requestData.transporter_id = transporterUserIds[req.transporterIdx];
      }

      if (req.status === "delivered") {
        requestData.completed_at = new Date(new Date().setDate(new Date().getDate() + req.date)).toISOString();
        requestData.distance_km = req.distance;
      }

      await supabase.from("transport_requests").insert(requestData);
    }
    results.transport_requests = transportRequests.length;

    // ============= 11. CREATE MARKET ORDERS (10 orders) =============
    console.log("Creating market orders...");
    
    const marketOrders = [
      // REQUESTED (4)
      { buyerIdx: 0, farmerIdx: 0, cropIdx: 0, quantity: 500, price: 1800, status: "requested", payment: "pending", date: 5, address: "FreshMart Store, MG Road, Mandya", notes: "Fresh tomatoes needed for weekend sale. Grade A preferred." },
      { buyerIdx: 2, farmerIdx: 3, cropIdx: 3, quantity: 200, price: 3200, status: "requested", payment: "pending", date: 4, address: "Hotel Nalpak Kitchen, Main Road, Mandya", notes: "French beans for restaurant. Daily fresh supply needed." },
      { buyerIdx: 3, farmerIdx: 6, cropIdx: 13, quantity: 100, price: 2200, status: "requested", payment: "pending", date: 6, address: "GreenLeaf Juices, Commercial Street, Mysuru", notes: "Robusta bananas for juice making. Ripe fruits preferred." },
      { buyerIdx: 4, farmerIdx: 7, cropIdx: 9, quantity: 1000, price: 2800, status: "requested", payment: "pending", date: 7, address: "KR Export Warehouse, Industrial Area, Mandya", notes: "Sona Masuri rice for export. Quality certification needed." },
      
      // CONFIRMED (3)
      { buyerIdx: 1, farmerIdx: 6, cropIdx: 8, quantity: 800, price: 2600, status: "confirmed", payment: "pending", date: 3, address: "Mysuru Veg Wholesale, APMC Yard, Mysuru", notes: "Ragi order confirmed. Will arrange pickup through our transport." },
      { buyerIdx: 0, farmerIdx: 1, cropIdx: 1, quantity: 600, price: 2400, status: "confirmed", payment: "partial", date: 2, address: "FreshMart Store, MG Road, Mandya", notes: "Bellary Red onions. 50% advance paid. Balance on delivery." },
      { buyerIdx: 2, farmerIdx: 4, cropIdx: 4, quantity: 300, price: 2000, status: "confirmed", payment: "pending", date: 4, address: "Hotel Nalpak Kitchen, Main Road, Mandya", notes: "Brinjal for restaurant. Regular weekly order." },
      
      // IN_TRANSPORT (2)
      { buyerIdx: 1, farmerIdx: 7, cropIdx: 17, quantity: 1500, price: 3000, status: "in_transport", payment: "pending", date: 1, address: "Mysuru Veg Wholesale, APMC Yard, Mysuru", notes: "Rice shipment in transit. Expected delivery by evening." },
      { buyerIdx: 4, farmerIdx: 9, cropIdx: 11, quantity: 1000, price: 2000, status: "in_transport", payment: "partial", date: 0, address: "KR Export Warehouse, Industrial Area, Mandya", notes: "Maize for export. Quality checked and approved." },
      
      // DELIVERED (1)
      { buyerIdx: 0, farmerIdx: 0, cropIdx: 20, quantity: 400, price: 1600, status: "delivered", payment: "completed", date: -5, address: "FreshMart Store, MG Road, Mandya", notes: "Previous tomato order delivered. Payment completed. Quality: Excellent." },
    ];

    for (const order of marketOrders) {
      await supabase.from("market_orders").insert({
        buyer_id: buyerRecordIds[order.buyerIdx],
        farmer_id: farmerIds[order.farmerIdx],
        crop_id: cropIds[order.cropIdx % cropIds.length],
        quantity: order.quantity,
        quantity_unit: "kg",
        price_offered: order.price,
        status: order.status,
        payment_status: order.payment,
        delivery_date: getDateOffset(order.date),
        delivery_address: order.address,
        notes: order.notes,
      });
    }
    results.market_orders = marketOrders.length;

    // ============= 12. CREATE MARKET PRICES (Realistic prices) =============
    console.log("Creating market prices...");
    
    const priceData = [
      { crop: "Tomato", prices: { "Mandya APMC": { modal: 1800, min: 1500, max: 2200, trend: "up" }, "Mysuru APMC": { modal: 1900, min: 1600, max: 2300, trend: "up" }, "Ramanagara Market": { modal: 1750, min: 1400, max: 2100, trend: "flat" }, "Maddur Vegetable Market": { modal: 1850, min: 1550, max: 2150, trend: "up" } }},
      { crop: "Onion", prices: { "Mandya APMC": { modal: 2400, min: 2000, max: 2800, trend: "down" }, "Mysuru APMC": { modal: 2350, min: 1950, max: 2750, trend: "down" }, "Ramanagara Market": { modal: 2500, min: 2100, max: 2900, trend: "flat" }, "Maddur Vegetable Market": { modal: 2300, min: 1900, max: 2700, trend: "down" } }},
      { crop: "Ragi", prices: { "Mandya APMC": { modal: 2800, min: 2500, max: 3100, trend: "up" }, "Mysuru APMC": { modal: 2750, min: 2450, max: 3050, trend: "up" }, "Ramanagara Market": { modal: 2700, min: 2400, max: 3000, trend: "flat" }, "Channapatna Mandi": { modal: 2650, min: 2350, max: 2950, trend: "up" } }},
      { crop: "Rice", prices: { "Mandya APMC": { modal: 3000, min: 2700, max: 3300, trend: "flat" }, "Mysuru APMC": { modal: 3050, min: 2750, max: 3350, trend: "up" }, "Ramanagara Market": { modal: 2950, min: 2650, max: 3250, trend: "flat" }, "Maddur Vegetable Market": { modal: 2900, min: 2600, max: 3200, trend: "flat" } }},
      { crop: "Banana", prices: { "Mandya APMC": { modal: 2000, min: 1700, max: 2400, trend: "up" }, "Mysuru APMC": { modal: 2100, min: 1800, max: 2500, trend: "up" }, "Ramanagara Market": { modal: 1950, min: 1650, max: 2350, trend: "flat" }, "Channapatna Mandi": { modal: 1900, min: 1600, max: 2300, trend: "up" } }},
      { crop: "Chilli", prices: { "Mandya APMC": { modal: 3500, min: 3000, max: 4200, trend: "up" }, "Mysuru APMC": { modal: 3600, min: 3100, max: 4300, trend: "up" }, "Ramanagara Market": { modal: 3400, min: 2900, max: 4100, trend: "flat" }, "Maddur Vegetable Market": { modal: 3450, min: 2950, max: 4150, trend: "up" } }},
      { crop: "Beans", prices: { "Mandya APMC": { modal: 2800, min: 2400, max: 3400, trend: "down" }, "Mysuru APMC": { modal: 2900, min: 2500, max: 3500, trend: "flat" }, "Ramanagara Market": { modal: 2750, min: 2350, max: 3350, trend: "down" }, "Maddur Vegetable Market": { modal: 2850, min: 2450, max: 3450, trend: "down" } }},
      { crop: "Potato", prices: { "Mandya APMC": { modal: 1500, min: 1200, max: 1800, trend: "flat" }, "Mysuru APMC": { modal: 1550, min: 1250, max: 1850, trend: "up" }, "Ramanagara Market": { modal: 1450, min: 1150, max: 1750, trend: "flat" }, "Channapatna Mandi": { modal: 1400, min: 1100, max: 1700, trend: "down" } }},
      { crop: "Brinjal", prices: { "Mandya APMC": { modal: 1800, min: 1500, max: 2200, trend: "up" }, "Mysuru APMC": { modal: 1850, min: 1550, max: 2250, trend: "up" }, "Ramanagara Market": { modal: 1750, min: 1450, max: 2150, trend: "flat" }, "Maddur Vegetable Market": { modal: 1700, min: 1400, max: 2100, trend: "up" } }},
      { crop: "Maize", prices: { "Mandya APMC": { modal: 1900, min: 1700, max: 2200, trend: "down" }, "Mysuru APMC": { modal: 1950, min: 1750, max: 2250, trend: "flat" }, "Ramanagara Market": { modal: 1850, min: 1650, max: 2150, trend: "down" }, "Channapatna Mandi": { modal: 1800, min: 1600, max: 2100, trend: "down" } }},
    ];

    let priceCount = 0;
    for (const cropData of priceData) {
      for (const [market, prices] of Object.entries(cropData.prices)) {
        await supabase.from("market_prices").insert({
          crop_name: cropData.crop,
          market_name: market,
          modal_price: prices.modal,
          min_price: prices.min,
          max_price: prices.max,
          trend_direction: prices.trend as "up" | "down" | "flat",
          date: today.toISOString().split("T")[0],
        });
        priceCount++;
      }
    }
    results.market_prices = priceCount;

    // ============= 13. CREATE AI LOGS =============
    console.log("Creating AI logs...");

    // Agent AI Logs - Visit Prioritization & Cluster Summary
    const agentAILogs = [
      {
        agentIdx: 0,
        logs: [
          { type: "visit_prioritization", context: { farmers: 4, pending: 3, region: "Mandya Central" }, output: "🎯 **Priority Visit Order for Today:**\n\n1. **Ramesh Gowda (Mandya Town)** - HIGH PRIORITY\n   - Tomato harvest ready, 1500kg waiting\n   - Risk: Quality degradation if delayed\n   - Action: Coordinate immediate transport\n\n2. **Shankarappa B (Maddur)** - MEDIUM PRIORITY\n   - Onion bulb check needed\n   - Harvest in 3 days\n   - Action: Verify moisture levels\n\n3. **Girish Patil (Srirangapatna)** - ROUTINE\n   - Potato crop assessment\n   - Action: Monitor growth stage\n\n📊 Estimated travel: 45km, 3.5 hours" },
          { type: "cluster_summary", context: { region: "Mandya Central", farmers: 4, crops: 8 }, output: "📊 **Mandya Central Cluster Health Report**\n\n**Overall Status:** 🟢 GOOD (82%)\n\n**Crop Distribution:**\n- Ready for Harvest: 3 crops (Tomato, Onion, Potato)\n- One Week Away: 2 crops\n- Growing: 3 crops\n\n**Key Risks:**\n⚠️ Tomato price volatility expected next week\n⚠️ Water stress in 2 farms - irrigation needed\n\n**Recommendations:**\n1. Prioritize tomato transport before price dip\n2. Schedule irrigation visits for Girish's farm\n3. Coordinate bulk transport for onion harvest\n\n**Transport Status:** 2 active, 1 pending assignment" },
        ]
      },
      {
        agentIdx: 1,
        logs: [
          { type: "visit_prioritization", context: { farmers: 3, pending: 4, region: "Maddur-Malavalli" }, output: "🎯 **Priority Visit Order for Today:**\n\n1. **Lakshman Shetty (Malavalli)** - HIGH PRIORITY\n   - Chilli crop showing wilting signs\n   - Risk: Potential 20% yield loss\n   - Action: Pest inspection, irrigation check\n\n2. **Sheela Amma (Pandavapura)** - HIGH PRIORITY\n   - Beans ready for harvest\n   - Hotel Nalpak order pending\n   - Action: Quality grading needed\n\n3. **Ravi Patil (K.R. Nagar)** - MEDIUM\n   - Maize transport coordination\n   - Action: Confirm transporter availability\n\n📊 Estimated travel: 55km, 4 hours" },
          { type: "cluster_summary", context: { region: "Maddur-Malavalli", farmers: 3, crops: 6 }, output: "📊 **Maddur-Malavalli Cluster Health Report**\n\n**Overall Status:** 🟡 MODERATE (68%)\n\n**Alerts:**\n🔴 Chilli wilting at Malavalli - URGENT\n🟡 Maize transport delayed by 2 days\n\n**Crop Status:**\n- Healthy: 4 crops\n- Needs Attention: 2 crops\n\n**Action Items:**\n1. Immediate visit to Lakshman Shetty\n2. Arrange drip irrigation consultation\n3. Reschedule maize transport\n\n**Weather Impact:** Dry spell expected - monitor closely" },
        ]
      },
      {
        agentIdx: 2,
        logs: [
          { type: "visit_prioritization", context: { farmers: 3, pending: 3, region: "Mysuru Rural" }, output: "🎯 **Priority Visit Order for Today:**\n\n1. **Harshitha D (T. Narasipura)** - HIGH PRIORITY\n   - Rice harvest imminent\n   - 3000kg ready, buyer confirmed\n   - Action: Coordinate transport, quality check\n\n2. **Savitramma (Mysuru Rural)** - MEDIUM\n   - Ragi grain maturity check\n   - Harvest window: 7-10 days\n   - Action: Schedule transport\n\n3. **Coconut inspection** - ROUTINE\n   - Fertilizer application due\n   - Action: Recommend NPK schedule\n\n📊 Estimated travel: 40km, 3 hours" },
          { type: "cluster_summary", context: { region: "Mysuru Rural", farmers: 3, crops: 7 }, output: "📊 **Mysuru Rural Cluster Health Report**\n\n**Overall Status:** 🟢 EXCELLENT (88%)\n\n**Highlights:**\n✅ Rice harvest on track - premium quality\n✅ Ragi crop healthy, good yield expected\n✅ Coconut plantation thriving\n\n**Opportunities:**\n💰 Rice prices up 5% - good selling window\n💰 Ragi demand high from Mysuru Wholesale\n\n**Next Steps:**\n1. Complete rice harvest this week\n2. Book transport for Harshitha's farm\n3. Connect Savitramma with buyers\n\n**Forecast:** Strong harvest week ahead" },
        ]
      },
      {
        agentIdx: 3,
        logs: [
          { type: "visit_prioritization", context: { farmers: 2, pending: 2, region: "Ramanagara-Channapatna" }, output: "🎯 **Priority Visit Order for Today:**\n\n1. **Veeresh Kumar (Ramanagara)** - HIGH PRIORITY\n   - Brinjal harvest ongoing\n   - 1200kg ready, transport needed\n   - Action: Quality grading, arrange pickup\n\n2. **Ningappa H (Channapatna)** - MEDIUM\n   - Banana plantation check\n   - Sugarcane progress monitoring\n   - Action: Growth stage documentation\n\n📊 Estimated travel: 30km, 2.5 hours\n\n**Note:** Both farms accessible via single route - efficient coverage possible" },
          { type: "cluster_summary", context: { region: "Ramanagara-Channapatna", farmers: 2, crops: 5 }, output: "📊 **Ramanagara-Channapatna Cluster Report**\n\n**Overall Status:** 🟢 GOOD (78%)\n\n**Active Harvests:**\n- Brinjal: Ready, Grade A quality\n- Potato: Transport in progress\n\n**Long-term Crops:**\n- Banana: 4 months to harvest\n- Sugarcane: 8 months remaining\n\n**Market Insights:**\n📈 Brinjal prices rising - good time to sell\n📉 Potato supply high - consider storage\n\n**Recommendations:**\n1. Fast-track brinjal transport\n2. Explore cold storage for potato\n3. Regular banana monitoring needed" },
        ]
      },
    ];

    for (const agent of agentAILogs) {
      for (const log of agent.logs) {
        await supabase.from("ai_agent_logs").insert({
          agent_id: agentIds[agent.agentIdx],
          log_type: log.type,
          input_context: log.context,
          output_text: log.output,
        });
      }
    }
    results.ai_agent_logs = agentAILogs.reduce((sum, a) => sum + a.logs.length, 0);

    // Transport AI Logs
    const transportAILogs = [
      { transIdx: 0, type: "route_optimization", data: { pickups: 3, locations: ["Mandya Town", "Maddur", "Srirangapatna"], loads: ["Tomato 1500kg", "Onion 2000kg", "Potato 1500kg"] }, output: "🚚 **Optimized Route Plan**\n\n**Route:** Mandya Town → Maddur → Srirangapatna → Mandya APMC\n\n**Pickup Schedule:**\n1. 6:00 AM - Ramesh Gowda, Mandya Town\n   - Load: Tomato 1500kg\n   - Time: 30 mins\n\n2. 7:15 AM - Shankarappa, Maddur\n   - Load: Onion 2000kg\n   - Time: 45 mins\n\n3. 9:00 AM - Girish Patil, Srirangapatna\n   - Load: Potato 1500kg\n   - Time: 30 mins\n\n**Delivery:** 10:30 AM at Mandya APMC\n\n📊 **Efficiency:**\n- Total Distance: 52km (vs 78km unoptimized)\n- Fuel Savings: ₹450 estimated\n- Time Saved: 1.5 hours" },
      { transIdx: 1, type: "route_optimization", data: { pickups: 2, locations: ["Pandavapura", "Malavalli"], loads: ["Beans 600kg", "Chilli 800kg"] }, output: "🚚 **Optimized Route Plan**\n\n**Route:** Maddur → Pandavapura → Malavalli → Mysuru APMC\n\n**Pickup Schedule:**\n1. 7:00 AM - Sheela Amma, Pandavapura\n   - Load: Beans 600kg\n   - Destination: Hotel Nalpak (partial)\n\n2. 8:30 AM - Lakshman Shetty, Malavalli\n   - Load: Chilli 800kg\n   - Destination: Mysuru APMC\n\n**Delivery Split:**\n- 10:00 AM: 200kg Beans to Hotel Nalpak\n- 11:00 AM: Remaining to Mysuru APMC\n\n📊 Total Distance: 65km | Fuel: ₹520" },
      { transIdx: 2, type: "reverse_logistics", data: { currentLocation: "Ramanagara", emptyReturn: true, nearbyFarms: 3 }, output: "📦 **Reverse Load Opportunity**\n\n**Current Status:** Empty return from Ramanagara Market\n\n**Nearby Pickup Options:**\n1. **Veeresh Kumar, Ramanagara Town** (3km)\n   - Load: Brinjal 1200kg\n   - Destination: Same route (Channapatna)\n   - Revenue: ₹800 additional\n\n2. **Input Delivery Option**\n   - Channapatna Agri Store has fertilizers\n   - Delivery to Ningappa H's farm\n   - Revenue: ₹400\n\n💰 **Recommendation:** Accept Veeresh's load\n- Extra 15 mins detour\n- ₹800 additional income\n- Utilizes empty capacity" },
      { transIdx: 3, type: "route_optimization", data: { pickups: 2, locations: ["Malavalli", "Srirangapatna"], loads: ["Onion 1900kg", "Potato 1600kg"] }, output: "🚚 **Optimized Route Plan**\n\n**Route:** Malavalli → Srirangapatna → Mandya APMC\n\n**Schedule:**\n1. 6:30 AM - Malavalli pickup (Onion)\n2. 8:00 AM - Srirangapatna pickup (Potato)\n3. 9:30 AM - Mandya APMC delivery\n\n**Vehicle Capacity Check:**\n- Eicher Mini: 3500kg capacity\n- Total Load: 3500kg\n- Status: ✅ Optimal utilization\n\n📊 Distance: 48km | ETA: 3 hours total" },
      { transIdx: 4, type: "reverse_logistics", data: { currentLocation: "Mysuru", emptyReturn: true, nearbyFarms: 4 }, output: "📦 **Reverse Load Opportunity**\n\n**Current Status:** Delivered rice to Mysuru, returning empty\n\n**Available Loads (Return Route):**\n1. **Mysuru Agri Depot** (2km detour)\n   - Seeds and fertilizers for T. Narasipura farms\n   - 5 deliveries, ₹1200 total\n\n2. **Harshitha D, T. Narasipura** (on route)\n   - Rice bags 500kg for Mandya\n   - ₹600 for delivery\n\n💰 **Best Option:** Combine both\n- Seeds delivery + Rice pickup\n- Total additional: ₹1800\n- Extra time: 45 mins\n- Route: Mysuru → Depot → T. Narasipura → Mandya" },
    ];

    for (const log of transportAILogs) {
      await supabase.from("ai_transport_logs").insert({
        transporter_id: transporterRecordIds[log.transIdx],
        log_type: log.type,
        input_data: log.data,
        output_text: log.output,
      });
    }
    results.ai_transport_logs = transportAILogs.length;

    // Market/Buyer AI Logs
    const marketAILogs = [
      { buyerIdx: 0, module: "price_forecast", data: { crop: "Tomato", region: "Mandya", quantity: 500 }, output: "📈 **Tomato Price Forecast - Mandya Region**\n\n**Current Price:** ₹18/kg (Mandya APMC)\n\n**7-Day Forecast:**\n- Day 1-3: ₹18-19/kg (stable)\n- Day 4-5: ₹20-21/kg (expected rise)\n- Day 6-7: ₹19-20/kg (slight correction)\n\n**Analysis:**\n✅ Supply reducing due to harvest completion\n✅ Festival demand increasing\n⚠️ Mysuru prices slightly higher\n\n💡 **Recommendation:** BUY NOW\n- Current price is optimal\n- Expected 12% rise in 5 days\n- Risk Level: LOW\n\n**Suggested Action:** Place order for 500kg today" },
      { buyerIdx: 1, module: "substitute_suggestion", data: { preferredCrop: "Rice", shortage: true, quantity: 1500 }, output: "🔄 **Smart Substitute Recommendations**\n\n**Issue:** Sona Masuri rice shortage expected\n\n**Alternative Options:**\n\n1. **Ragi (GPU-28)**\n   - Availability: HIGH (2500kg in cluster)\n   - Price: ₹28/kg vs Rice ₹30/kg\n   - Quality: Premium grade\n   - Health trend: Growing demand\n\n2. **Ponni Rice** (from Hassan)\n   - Availability: MODERATE\n   - Price: ₹27/kg\n   - Transport: Additional ₹3/kg\n\n3. **Brown Rice**\n   - Limited availability\n   - Premium pricing\n\n💡 **Recommendation:** Ragi as partial substitute\n- 40% Ragi + 60% available Rice\n- Cost savings: ₹2/kg average\n- Market trend favorable" },
      { buyerIdx: 2, module: "demand_intelligence", data: { businessType: "restaurant", crops: ["Tomato", "Beans", "Potato"] }, output: "📊 **Weekly Demand Intelligence - Hotel Nalpak**\n\n**Recommended Stock Levels:**\n\n**Tomato:**\n- Current: Low stock\n- Suggested: 200kg for this week\n- Trend: Weekend demand +40%\n- Source: Ramesh Gowda (ready stock)\n\n**Beans:**\n- Current: Out of stock\n- Suggested: 100kg urgent order\n- Trend: Stable demand\n- Source: Sheela Amma (fresh harvest)\n\n**Potato:**\n- Current: Adequate\n- Suggested: No immediate order\n- Trend: Stable\n\n💡 **Cost Optimization:**\n- Bundle order from 2 farmers\n- Shared transport saves ₹300\n- Freshness: Same-day delivery possible" },
      { buyerIdx: 3, module: "price_forecast", data: { crop: "Banana", region: "Mysuru", quantity: 100 }, output: "📈 **Banana Price Forecast - Mysuru Region**\n\n**Current Price:** ₹21/kg (Mysuru APMC)\n\n**7-Day Forecast:**\n- Trend: Gradually rising\n- Expected peak: ₹24-25/kg (Day 5)\n- Reason: Festival season approaching\n\n**Quality Alert:**\n🟢 Robusta variety excellent this week\n🟢 Optimal ripeness available\n\n💡 **Recommendation:** ORDER TODAY\n- Lock in current prices\n- Ningappa H has 500 bunches ready\n- Quality: Grade A (90%)\n\n**Juice Business Insight:**\n- Ripe bananas ideal for juice\n- Request 2-day ripened batch\n- Saves 15% on processing" },
      { buyerIdx: 4, module: "demand_intelligence", data: { businessType: "export", crops: ["Rice", "Ragi", "Banana"] }, output: "📊 **Export Market Intelligence - KR Traders**\n\n**Current Export Demand:**\n\n**Rice (Sona Masuri):**\n- UAE demand: HIGH\n- Singapore: MODERATE\n- Quality requirement: Grade A only\n- Available: 3000kg (Harshitha D)\n- Certification: Pending\n\n**Ragi:**\n- Health food markets: GROWING\n- US/UK organic stores interested\n- Premium: +30% for organic certified\n- Local availability: 2500kg\n\n**Banana:**\n- Gulf markets: Stable demand\n- Quality focus: Size & color\n- Logistics: Cold chain required\n\n💡 **Strategic Recommendation:**\n1. Secure Rice from T. Narasipura\n2. Explore organic Ragi certification\n3. Partner with cold storage for Banana" },
    ];

    for (const log of marketAILogs) {
      await supabase.from("ai_market_logs").insert({
        buyer_id: buyerRecordIds[log.buyerIdx],
        module_type: log.module,
        input_data: log.data,
        output_text: log.output,
      });
    }
    results.ai_market_logs = marketAILogs.length;

    // Admin AI Logs
    if (adminRecordIds.length > 0) {
      const adminAILogs = [
        { module: "cluster_intelligence", data: { districts: ["Mandya", "Mysuru", "Ramanagara"], timeframe: "7_days" }, output: "📊 **Ecosystem Cluster Health Dashboard**\n\n**Overall Health Score:** 79% 🟢\n\n**District Breakdown:**\n\n**Mandya (85%)**\n- Active Farmers: 5\n- Crops Ready: 8\n- Transport Utilization: 78%\n- ✅ Strong harvest week\n\n**Mysuru (82%)**\n- Active Farmers: 3\n- Crops Ready: 4\n- Transport Utilization: 65%\n- ✅ Rice harvest on track\n\n**Ramanagara (68%)**\n- Active Farmers: 2\n- Crops Ready: 3\n- Transport Utilization: 55%\n- ⚠️ Low transporter coverage\n\n**Critical Alerts:**\n🔴 Chilli wilting in Malavalli cluster\n🟡 Transport shortage in Ramanagara\n🟡 Price volatility expected for Tomato\n\n**Recommendations:**\n1. Deploy additional transporter to Ramanagara\n2. Fast-track irrigation support for Malavalli\n3. Coordinate bulk tomato transport" },
        { module: "supply_demand_forecast", data: { crops: ["Tomato", "Onion", "Rice", "Ragi", "Banana"], horizon: "7_days" }, output: "📈 **7-Day Supply-Demand Forecast**\n\n**SURPLUS EXPECTED:**\n🍅 **Tomato** (+35% oversupply)\n- Supply: 8,500kg | Demand: 6,300kg\n- Action: Accelerate buyer outreach\n- Price impact: -8% likely\n\n🧅 **Onion** (+15% oversupply)\n- Supply: 5,800kg | Demand: 5,000kg\n- Action: Storage recommended\n- Price impact: -5% expected\n\n**BALANCED:**\n🍚 **Rice**\n- Supply: 6,000kg | Demand: 5,800kg\n- Status: Healthy market\n- Action: No intervention needed\n\n**SHORTAGE ALERT:**\n🌾 **Ragi** (-20% shortfall)\n- Supply: 2,500kg | Demand: 3,100kg\n- Action: Connect additional farmers\n- Price impact: +12% expected\n\n🍌 **Banana** (-10% shortfall)\n- Supply: 800 bunches | Demand: 900\n- Action: Expedite Ningappa harvest\n- Price impact: +8% likely\n\n**Strategic Priorities:**\n1. Find Ragi suppliers from adjacent districts\n2. Negotiate cold storage for tomato surplus\n3. Alert buyers about banana shortage" },
        { module: "price_anomaly", data: { markets: ["Mandya APMC", "Mysuru APMC"], period: "7_days" }, output: "🔍 **Price Anomaly Detection Report**\n\n**Anomalies Detected: 3**\n\n**1. Chilli Price Spike (Mandya APMC)**\n- Expected: ₹32/kg\n- Actual: ₹40/kg (+25%)\n- Cause: Byadgi supply disruption\n- Duration: Likely 5-7 days\n- Action: Advise farmers to sell now\n\n**2. Potato Price Drop (Ramanagara)**\n- Expected: ₹16/kg\n- Actual: ₹12/kg (-25%)\n- Cause: Oversupply from Channapatna\n- Action: Recommend cold storage\n\n**3. Rice Premium (Mysuru APMC)**\n- Expected: ₹29/kg\n- Actual: ₹32/kg (+10%)\n- Cause: Festival demand surge\n- Status: Normal seasonal pattern\n\n**No Anomaly (Stable):**\n✅ Tomato, Onion, Ragi, Beans\n\n**Recommendations:**\n1. Alert Malavalli chilli farmers\n2. Coordinate Channapatna potato storage\n3. Expedite rice sales from Mysuru cluster" },
        { module: "operational_efficiency", data: { period: "weekly", metrics: ["transport", "agent_visits", "orders"] }, output: "⚡ **Operational Efficiency Report**\n\n**Transport Metrics:**\n- Fleet Utilization: 72% (Target: 80%)\n- On-time Delivery: 89% ✅\n- Empty Returns: 18% (Target: <15%)\n- Avg Load/Trip: 2,100kg\n\n💡 **Improvement:** Enable reverse logistics alerts\n\n**Agent Performance:**\n- Visits Completed: 24/28 (86%)\n- Avg Visit Time: 45 mins\n- Data Quality Score: 91% ✅\n- Farmer Satisfaction: 4.2/5\n\n💡 **Top Performer:** Mahesh (Mandya)\n💡 **Support Needed:** Ananya (Ramanagara)\n\n**Order Fulfillment:**\n- Orders Received: 15\n- Fulfilled: 12 (80%)\n- Avg Fulfillment Time: 2.3 days\n- Cancellation Rate: 6%\n\n**Bottlenecks Identified:**\n1. Transport assignment delay (avg 4 hours)\n2. Grading completion (24% pending)\n3. Payment collection (35% delayed)\n\n**Priority Actions:**\n1. Auto-assign transporters for ready crops\n2. Conduct agent training in Ramanagara\n3. Implement payment reminder system" },
      ];

      for (const log of adminAILogs) {
        await supabase.from("ai_admin_logs").insert({
          admin_id: adminRecordIds[0],
          module_type: log.module,
          input_data: log.data,
          output_text: log.output,
        });
      }
      results.ai_admin_logs = adminAILogs.length;
    }

    // ============= 14. CREATE NOTIFICATIONS (20 realistic notifications) =============
    console.log("Creating notifications...");
    
    const notificationData = [
      // Harvest notifications
      { farmerIdx: 0, title: "🍅 Tomato Harvest Ready!", message: "Your tomato crop in Mandya Town is ready for harvest. 1500kg estimated. Consider requesting transport to Mandya APMC.", type: "harvest", read: false },
      { farmerIdx: 1, title: "🧅 Onion Harvest in 3 Days", message: "Your Bellary Red onions will be ready for harvest in 3 days. Start planning transport and buyer connections.", type: "harvest", read: false },
      { farmerIdx: 2, title: "🌶️ Chilli Harvest Alert", message: "Byadgi chilli crop ready. Current market price ₹40/kg (25% above normal). Good selling opportunity!", type: "harvest", read: false },
      
      // Weather alerts
      { farmerIdx: 0, title: "⛈️ Heavy Rainfall Expected", message: "IMD forecasts heavy rain in Mandya district tomorrow. Cover harvested produce and delay field work.", type: "weather", read: false },
      { farmerIdx: 4, title: "🌡️ Dry Spell Warning", message: "No rain expected for next 5 days in Ramanagara. Ensure irrigation for growing crops.", type: "weather", read: true },
      { farmerIdx: 6, title: "☀️ Favorable Drying Weather", message: "Sunny weather expected for 3 days in Mysuru. Good conditions for ragi drying post-harvest.", type: "weather", read: true },
      
      // Transport updates
      { farmerIdx: 5, title: "🚚 Transport Assigned", message: "Manjunath Mini-Truck assigned for your potato load. Pickup scheduled tomorrow morning at 6:00 AM.", type: "transport", read: false },
      { farmerIdx: 8, title: "📦 Pickup Completed", message: "Swaroop Goods picked up your potato load (1500kg). En route to Mandya APMC. ETA: 2 hours.", type: "transport", read: true },
      { farmerIdx: 9, title: "✅ Delivery Confirmed", message: "Your maize delivery completed at Mysuru Wholesale Market. Payment of ₹3,800 credited.", type: "transport", read: true },
      
      // Price alerts
      { farmerIdx: 0, title: "📈 Tomato Price Rising", message: "Tomato prices up 12% at Mandya APMC (₹20/kg). Good time to sell your ready harvest.", type: "price", read: false },
      { farmerIdx: 1, title: "📉 Onion Price Dip", message: "Onion prices down 8% due to oversupply. Consider storage if possible, prices may recover next week.", type: "price", read: false },
      { farmerIdx: 7, title: "💰 Rice Premium Price", message: "Sona Masuri rice at ₹32/kg in Mysuru (10% premium). Festival demand pushing prices up.", type: "price", read: false },
      
      // Agent visits
      { farmerIdx: 0, title: "👨‍🌾 Agent Visit Today", message: "Mahesh Kumar will visit your farm today at 10:00 AM for tomato harvest assessment and transport coordination.", type: "visit", read: true },
      { farmerIdx: 2, title: "🔍 Crop Inspection Scheduled", message: "Kavya Sharma scheduled to inspect your chilli crop tomorrow. Will assess quality grading.", type: "visit", read: false },
      { farmerIdx: 6, title: "✅ Visit Completed", message: "Raghav Hegde completed field visit. Ragi crop rated 'Excellent'. Harvest recommended in 7 days.", type: "visit", read: true },
      
      // Order updates
      { farmerIdx: 0, title: "🛒 New Order Received", message: "FreshMart Mandya ordered 500kg tomatoes at ₹18/kg. Total: ₹9,000. Accept or negotiate?", type: "order", read: false },
      { farmerIdx: 3, title: "✅ Order Confirmed", message: "Hotel Nalpak confirmed beans order. 200kg at ₹32/kg. Pickup arranged for tomorrow.", type: "order", read: true },
      { farmerIdx: 7, title: "💳 Payment Received", message: "KR Export Traders paid ₹45,000 for rice order. Amount credited to your bank account.", type: "order", read: true },
      
      // Advisory
      { farmerIdx: 2, title: "🐛 Pest Alert - Aphids", message: "Aphid infestation reported in Malavalli area. Inspect your chilli crop and apply neem-based pesticide if needed.", type: "advisory", read: false },
      { farmerIdx: 4, title: "💧 Irrigation Advisory", message: "Soil moisture low in your brinjal field. Recommend drip irrigation to maintain fruit quality.", type: "advisory", read: false },
    ];

    for (const notif of notificationData) {
      await supabase.from("notifications").insert({
        user_id: farmerIds[notif.farmerIdx],
        title: notif.title,
        message: notif.message,
        type: notif.type,
        is_read: notif.read,
      });
    }
    results.notifications = notificationData.length;

    // ============= RETURN SUCCESS =============
    return new Response(JSON.stringify({
      success: true,
      message: "✅ Comprehensive test data seeded successfully!",
      summary: results,
      details: {
        description: "Realistic India-specific agricultural data for Karnataka region",
        coverage: {
          users: "10 farmers, 4 agents, 5 transporters, 5 buyers, 2 admins",
          agriculture: "25 crops across 15 farmlands with realistic growth stages",
          operations: "18 agent tasks, 12 transport requests, 10 market orders",
          intelligence: "40+ market prices, 20 notifications, 15+ AI analysis logs",
        },
      },
      credentials: {
        farmers: { emails: farmers.map(f => f.email), password: "farmer123" },
        agents: { emails: agents.map(a => a.email), password: "agent123" },
        transporters: { emails: transporters.map(t => t.email), password: "trans123" },
        buyers: { emails: buyers.map(b => b.email), password: "buyer123" },
        admins: [
          { email: "admin@agrimitra.in", password: "admin123", role: "super_admin" },
          { email: "ops@agrimitra.in", password: "ops123", role: "operations_admin" },
        ],
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Seeder error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(JSON.stringify({ 
      error: errorMessage,
      stack: errorStack 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
