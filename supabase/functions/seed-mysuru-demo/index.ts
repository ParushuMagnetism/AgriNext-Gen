import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= MYSURU DEMO ECOSYSTEM V2 DATA =============
const DEMO_TAG = "mysuru_demo_v2";

// Hullahalli Hobli Villages (Mysuru District)
const villages = [
  "Hullahalli", "Bannur", "Somanathapura", "Talakadu", 
  "Sosale", "Malavalli", "Kollegal", "Yelandur",
  "Chamarajanagar", "Gundlupet", "Nanjangud", "Mysuru Rural"
];

// 15 Farmers with realistic distribution
const demoFarmers = [
  // Small farmers (1-3 acres) - 6
  { email: "demo.farmer01@agrimitra.demo", name: "Ramaiah Gowda", village: "Hullahalli", taluk: "Mysuru", area: 1.5, soilType: "Red Soil" },
  { email: "demo.farmer02@agrimitra.demo", name: "Lakshmamma", village: "Bannur", taluk: "Mysuru", area: 2.0, soilType: "Black Cotton Soil" },
  { email: "demo.farmer03@agrimitra.demo", name: "Chennappa", village: "Somanathapura", taluk: "Mysuru", area: 2.5, soilType: "Laterite" },
  { email: "demo.farmer04@agrimitra.demo", name: "Puttamma", village: "Talakadu", taluk: "Mysuru", area: 1.8, soilType: "Clay Loam" },
  { email: "demo.farmer05@agrimitra.demo", name: "Basavaiah", village: "Sosale", taluk: "Mysuru", area: 3.0, soilType: "Sandy Loam" },
  { email: "demo.farmer06@agrimitra.demo", name: "Mahadevi", village: "Malavalli", taluk: "Nanjangud", area: 2.2, soilType: "Red Soil" },
  // Medium farmers (4-10 acres) - 6
  { email: "demo.farmer07@agrimitra.demo", name: "Shivanna Patil", village: "Hullahalli", taluk: "Mysuru", area: 5.5, soilType: "Black Cotton Soil" },
  { email: "demo.farmer08@agrimitra.demo", name: "Rangamma", village: "Kollegal", taluk: "Mysuru", area: 6.0, soilType: "Red Soil" },
  { email: "demo.farmer09@agrimitra.demo", name: "Thimmaiah", village: "Yelandur", taluk: "Nanjangud", area: 4.5, soilType: "Clay Loam" },
  { email: "demo.farmer10@agrimitra.demo", name: "Nagarathnamma", village: "Bannur", taluk: "Mysuru", area: 7.0, soilType: "Laterite" },
  { email: "demo.farmer11@agrimitra.demo", name: "Siddappa Gowda", village: "Chamarajanagar", taluk: "Mysuru", area: 8.5, soilType: "Sandy Loam" },
  { email: "demo.farmer12@agrimitra.demo", name: "Jayamma", village: "Gundlupet", taluk: "Nanjangud", area: 6.5, soilType: "Black Cotton Soil" },
  // Large farmers (10-25 acres) - 3
  { email: "demo.farmer13@agrimitra.demo", name: "Krishna Reddy", village: "Nanjangud", taluk: "Nanjangud", area: 15.0, soilType: "Red Soil" },
  { email: "demo.farmer14@agrimitra.demo", name: "Manjunath Shetty", village: "Mysuru Rural", taluk: "Mysuru", area: 20.0, soilType: "Black Cotton Soil" },
  { email: "demo.farmer15@agrimitra.demo", name: "Savitha Amma", village: "Hullahalli", taluk: "Mysuru", area: 12.0, soilType: "Clay Loam" },
];

// 4 Agents with village coverage
const demoAgents = [
  { email: "demo.agent01@agrimitra.demo", name: "Mahesh Kumar", villages: ["Hullahalli", "Bannur", "Somanathapura", "Talakadu", "Sosale"] },
  { email: "demo.agent02@agrimitra.demo", name: "Kavitha Sharma", villages: ["Malavalli", "Kollegal", "Yelandur", "Chamarajanagar"] },
  { email: "demo.agent03@agrimitra.demo", name: "Raghavendra Rao", villages: ["Gundlupet", "Nanjangud", "Mysuru Rural"] },
  { email: "demo.agent04@agrimitra.demo", name: "Priya Devi", villages: [] }, // Backup/floating agent
];

// 6 Transporters
const demoTransporters = [
  { email: "demo.transporter01@agrimitra.demo", name: "Raju Mini Truck", vehicleType: "Tata Ace", capacity: 750, district: "Mysuru" },
  { email: "demo.transporter02@agrimitra.demo", name: "Kumar Transport", vehicleType: "Bolero Pickup", capacity: 1500, district: "Mysuru" },
  { email: "demo.transporter03@agrimitra.demo", name: "Sahana Logistics", vehicleType: "Eicher Mini Truck", capacity: 3500, district: "Mysuru" },
  { email: "demo.transporter04@agrimitra.demo", name: "Manjunath Goods", vehicleType: "Ashok Leyland Dost", capacity: 2000, district: "Mysuru" },
  { email: "demo.transporter05@agrimitra.demo", name: "Sri Lakshmi Transport", vehicleType: "Mahindra Supro", capacity: 1200, district: "Mysuru" },
  { email: "demo.transporter06@agrimitra.demo", name: "Karnataka Carriers", vehicleType: "Tata 407", capacity: 4000, district: "Mysuru" },
];

// 6 Buyers
const demoBuyers = [
  { email: "demo.buyer01@agrimitra.demo", name: "Prakash Wholesale", company: "Mysuru APMC Wholesale", type: "wholesale", district: "Mysuru", crops: ["Ragi", "Rice", "Maize"] },
  { email: "demo.buyer02@agrimitra.demo", name: "FreshMart Mysuru", company: "FreshMart Retail", type: "retail", district: "Mysuru", crops: ["Tomato", "Onion", "Chilli"] },
  { email: "demo.buyer03@agrimitra.demo", name: "Hotel Nalpak", company: "Hotel Nalpak Kitchen", type: "restaurant", district: "Mysuru", crops: ["Tomato", "Beans", "Potato"] },
  { email: "demo.buyer04@agrimitra.demo", name: "GreenLeaf Exports", company: "GreenLeaf Export Traders", type: "export", district: "Mysuru", crops: ["Banana", "Coconut", "Rice"] },
  { email: "demo.buyer05@agrimitra.demo", name: "Mysuru Traders", company: "Mysuru Veg Traders", type: "wholesale", district: "Mysuru", crops: ["Onion", "Potato", "Tomato"] },
  { email: "demo.buyer06@agrimitra.demo", name: "Organic Foods Co", company: "Organic Foods Cooperative", type: "retail", district: "Mysuru", crops: ["Ragi", "Tur Dal", "Banana"] },
];

// 6 Scoped Admins
const demoAdmins = [
  { email: "demo.admin01@agrimitra.demo", name: "Super Admin", role: "super_admin", scopeLevel: "all", scopeValue: "all" },
  { email: "demo.admin02@agrimitra.demo", name: "Karnataka State Admin", role: "state_admin", scopeLevel: "state", scopeValue: "Karnataka" },
  { email: "demo.admin03@agrimitra.demo", name: "Mysuru District Admin", role: "district_admin", scopeLevel: "district", scopeValue: "Mysuru" },
  { email: "demo.admin04@agrimitra.demo", name: "Mysuru Taluk Admin", role: "taluk_admin", scopeLevel: "taluk", scopeValue: "Mysuru" },
  { email: "demo.admin05@agrimitra.demo", name: "Hullahalli Village Admin", role: "village_admin", scopeLevel: "village", scopeValue: "Hullahalli" },
  { email: "demo.admin06@agrimitra.demo", name: "Bannur Village Admin", role: "village_admin", scopeLevel: "village", scopeValue: "Bannur" },
];

// Crops with realistic growth data
const cropTypes = [
  { name: "Ragi", variety: "GPU-28", unit: "quintals", growthDays: 110, priceRange: [2200, 3000] },
  { name: "Paddy", variety: "Sona Masuri", unit: "quintals", growthDays: 130, priceRange: [2500, 3200] },
  { name: "Tomato", variety: "Arka Rakshak", unit: "quintals", growthDays: 75, priceRange: [1200, 2000] },
  { name: "Onion", variety: "Bellary Red", unit: "quintals", growthDays: 120, priceRange: [1800, 2800] },
  { name: "Banana", variety: "Robusta", unit: "bunches", growthDays: 300, priceRange: [1600, 2500] },
  { name: "Maize", variety: "Pioneer Yellow", unit: "quintals", growthDays: 95, priceRange: [1600, 2200] },
  { name: "Tur Dal", variety: "BRG-2", unit: "quintals", growthDays: 150, priceRange: [5000, 7000] },
  { name: "Sugarcane", variety: "Co-86032", unit: "tonnes", growthDays: 365, priceRange: [2800, 3500] },
];

// Nearby districts for price comparison
const nearbyDistricts = ["Mysuru", "Mandya", "Hassan", "Chamarajanagar"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (action === "reset") {
      return await resetDemoData(supabase);
    }

    return await generateDemoData(supabase);
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function resetDemoData(supabase: any) {
  console.log("Resetting Mysuru Demo Ecosystem v2...");
  
  // Delete in correct FK order
  const deleteOrder = [
    "transport_issues",
    "escalations",
    "notifications",
    "market_orders",
    "transport_status_events",
    "trips",
    "transport_requests",
    "price_forecasts",
    "market_prices_agg",
    "market_prices",
    "agent_visits",
    "agent_tasks",
    "agent_data",
    "agent_farmer_assignments",
    "crops",
    "farmlands",
    "admin_scopes",
    "admin_users",
    "vehicles",
    "transporters",
    "buyers",
    "user_roles",
    "profiles",
  ];

  const deleteCounts: Record<string, number> = {};

  for (const table of deleteOrder) {
    try {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq("demo_tag", DEMO_TAG)
        .select("id");
      
      deleteCounts[table] = data?.length || 0;
      if (error) console.error(`Error deleting from ${table}:`, error);
    } catch (e) {
      console.error(`Error with table ${table}:`, e);
    }
  }

  // Delete auth users (demo users only)
  const demoEmails = [
    ...demoFarmers.map(f => f.email),
    ...demoAgents.map(a => a.email),
    ...demoTransporters.map(t => t.email),
    ...demoBuyers.map(b => b.email),
    ...demoAdmins.map(a => a.email),
  ];

  let authDeleted = 0;
  for (const email of demoEmails) {
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find((u: any) => u.email === email);
      if (user) {
        await supabase.auth.admin.deleteUser(user.id);
        authDeleted++;
      }
    } catch (e) {
      console.error(`Error deleting auth user ${email}:`, e);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Mysuru Demo Ecosystem v2 reset successfully",
    deleted: { ...deleteCounts, auth_users: authDeleted },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function generateDemoData(supabase: any) {
  console.log("Generating Mysuru Demo Ecosystem v2...");
  
  const results: Record<string, number> = {};
  const credentials: any[] = [];
  const PASSWORD = "Demo@12345";
  
  // Track IDs for relationships
  const farmerIds: string[] = [];
  const agentIds: string[] = [];
  const transporterUserIds: string[] = [];
  const transporterRecordIds: string[] = [];
  const buyerRecordIds: string[] = [];
  const adminIds: string[] = [];
  const farmlandIds: string[] = [];
  const cropIds: string[] = [];
  const cropDetails: any[] = [];

  const today = new Date();
  const getDateOffset = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  // Helper to create user
  async function createUser(email: string, metadata: Record<string, unknown>) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error && !error.message.includes("already been registered")) {
      console.error(`Error creating user ${email}:`, error);
      return null;
    }
    if (data?.user) return data.user.id;
    
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === email);
    return existing?.id || null;
  }

  // ============= 1. CREATE FARMERS =============
  console.log("Creating farmers...");
  for (let i = 0; i < demoFarmers.length; i++) {
    const farmer = demoFarmers[i];
    const userId = await createUser(farmer.email, { 
      full_name: farmer.name, 
      role: "farmer",
      demo: true,
    });
    
    if (userId) {
      farmerIds.push(userId);
      credentials.push({ role: "Farmer", email: farmer.email, password: PASSWORD, name: farmer.name });
      
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: farmer.name,
        phone: `98765432${String(i).padStart(2, '0')}`,
        village: farmer.village,
        taluk: farmer.taluk,
        district: "Mysuru",
        total_land_area: farmer.area,
        demo_tag: DEMO_TAG,
      }, { onConflict: "id" });

      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "farmer",
        demo_tag: DEMO_TAG,
      }, { onConflict: "user_id,role" });
    }
  }
  results.farmers = farmerIds.length;

  // ============= 2. CREATE AGENTS =============
  console.log("Creating agents...");
  for (let i = 0; i < demoAgents.length; i++) {
    const agent = demoAgents[i];
    const userId = await createUser(agent.email, { 
      full_name: agent.name, 
      role: "agent",
      demo: true,
    });
    
    if (userId) {
      agentIds.push(userId);
      credentials.push({ role: "Agent", email: agent.email, password: PASSWORD, name: agent.name });
      
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: agent.name,
        phone: `98765433${String(i).padStart(2, '0')}`,
        district: "Mysuru",
        demo_tag: DEMO_TAG,
      }, { onConflict: "id" });

      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "agent",
        demo_tag: DEMO_TAG,
      }, { onConflict: "user_id,role" });
    }
  }
  results.agents = agentIds.length;

  // ============= 3. CREATE TRANSPORTERS =============
  console.log("Creating transporters...");
  for (let i = 0; i < demoTransporters.length; i++) {
    const trans = demoTransporters[i];
    const userId = await createUser(trans.email, { 
      full_name: trans.name, 
      role: "logistics",
      demo: true,
    });
    
    if (userId) {
      transporterUserIds.push(userId);
      credentials.push({ role: "Transporter", email: trans.email, password: PASSWORD, name: trans.name });
      
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: trans.name,
        phone: `98765434${String(i).padStart(2, '0')}`,
        district: trans.district,
        demo_tag: DEMO_TAG,
      }, { onConflict: "id" });

      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "logistics",
        demo_tag: DEMO_TAG,
      }, { onConflict: "user_id,role" });

      const { data: transRecord } = await supabase.from("transporters").insert({
        user_id: userId,
        name: trans.name,
        phone: `98765434${String(i).padStart(2, '0')}`,
        operating_district: trans.district,
        vehicle_type: trans.vehicleType,
        vehicle_capacity: trans.capacity,
        registration_number: `KA-09-${String.fromCharCode(65 + i)}-${1000 + i * 111}`,
        demo_tag: DEMO_TAG,
      }).select().single();

      if (transRecord) {
        transporterRecordIds.push(transRecord.id);
        
        await supabase.from("vehicles").insert({
          transporter_id: transRecord.id,
          vehicle_type: trans.vehicleType,
          capacity: trans.capacity,
          number_plate: `KA-09-${String.fromCharCode(65 + i)}-${1000 + i * 111}`,
          is_active: true,
          demo_tag: DEMO_TAG,
        });
      }
    }
  }
  results.transporters = transporterRecordIds.length;

  // ============= 4. CREATE BUYERS =============
  console.log("Creating buyers...");
  for (let i = 0; i < demoBuyers.length; i++) {
    const buyer = demoBuyers[i];
    const userId = await createUser(buyer.email, { 
      full_name: buyer.name, 
      role: "buyer",
      demo: true,
    });
    
    if (userId) {
      credentials.push({ role: "Buyer", email: buyer.email, password: PASSWORD, name: buyer.name });
      
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: buyer.name,
        phone: `98765435${String(i).padStart(2, '0')}`,
        district: buyer.district,
        demo_tag: DEMO_TAG,
      }, { onConflict: "id" });

      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "buyer",
        demo_tag: DEMO_TAG,
      }, { onConflict: "user_id,role" });

      const { data: buyerRecord } = await supabase.from("buyers").insert({
        user_id: userId,
        name: buyer.name,
        company_name: buyer.company,
        buyer_type: buyer.type,
        district: buyer.district,
        phone: `98765435${String(i).padStart(2, '0')}`,
        preferred_crops: buyer.crops,
        demo_tag: DEMO_TAG,
      }).select().single();

      if (buyerRecord) buyerRecordIds.push(buyerRecord.id);
    }
  }
  results.buyers = buyerRecordIds.length;

  // ============= 5. CREATE ADMINS WITH SCOPES =============
  console.log("Creating scoped admins...");
  for (let i = 0; i < demoAdmins.length; i++) {
    const admin = demoAdmins[i];
    const userId = await createUser(admin.email, { 
      full_name: admin.name, 
      role: "admin",
      demo: true,
    });
    
    if (userId) {
      adminIds.push(userId);
      credentials.push({ role: `Admin (${admin.role})`, email: admin.email, password: PASSWORD, name: admin.name });
      
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: admin.name,
        phone: `98765436${String(i).padStart(2, '0')}`,
        district: "Mysuru",
        demo_tag: DEMO_TAG,
      }, { onConflict: "id" });

      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "admin",
        demo_tag: DEMO_TAG,
      }, { onConflict: "user_id,role" });

      const { data: adminRecord } = await supabase.from("admin_users").insert({
        user_id: userId,
        name: admin.name,
        email: admin.email,
        phone: `98765436${String(i).padStart(2, '0')}`,
        role: admin.role,
        assigned_district: admin.scopeLevel === "district" ? admin.scopeValue : (admin.scopeLevel === "all" ? null : "Mysuru"),
        demo_tag: DEMO_TAG,
      }).select().single();

      if (adminRecord) {
        await supabase.from("admin_scopes").insert({
          admin_user_id: adminRecord.id,
          scope_level: admin.scopeLevel,
          scope_value: admin.scopeValue,
          active: true,
          demo_tag: DEMO_TAG,
        });
      }
    }
  }
  results.admins = adminIds.length;

  // ============= 6. CREATE FARMLANDS =============
  console.log("Creating farmlands...");
  for (let i = 0; i < farmerIds.length; i++) {
    const farmer = demoFarmers[i];
    const numLands = farmer.area > 5 ? 2 : 1;
    const areaPerLand = farmer.area / numLands;

    for (let j = 0; j < numLands; j++) {
      const { data: land } = await supabase.from("farmlands").insert({
        farmer_id: farmerIds[i],
        name: numLands === 1 ? `${farmer.name.split(" ")[0]}'s Farm` : `${farmer.name.split(" ")[0]}'s Farm ${j + 1}`,
        area: Number(areaPerLand.toFixed(1)),
        area_unit: "acres",
        village: farmer.village,
        district: "Mysuru",
        soil_type: farmer.soilType,
        location_lat: 12.1 + (i * 0.02) + (j * 0.005),
        location_long: 76.5 + (i * 0.02) + (j * 0.005),
        demo_tag: DEMO_TAG,
      }).select().single();

      if (land) farmlandIds.push(land.id);
    }
  }
  results.farmlands = farmlandIds.length;

  // ============= 7. CREATE CROPS (60+ crops with distribution) =============
  console.log("Creating crops...");
  const statusDistribution = ["growing", "growing", "growing", "one_week", "one_week", "ready", "ready", "harvested"];
  
  for (let i = 0; i < farmlandIds.length; i++) {
    const numCrops = 2 + Math.floor(Math.random() * 3); // 2-4 crops per farmland
    
    for (let j = 0; j < numCrops; j++) {
      const cropType = cropTypes[(i + j) % cropTypes.length];
      const status = statusDistribution[(i + j) % statusDistribution.length];
      const daysToHarvest = status === "ready" ? 0 : status === "one_week" ? Math.floor(Math.random() * 7) : status === "harvested" ? -10 - Math.floor(Math.random() * 20) : 20 + Math.floor(Math.random() * 60);
      
      const { data: crop } = await supabase.from("crops").insert({
        farmer_id: farmerIds[i % farmerIds.length],
        land_id: farmlandIds[i],
        crop_name: cropType.name,
        variety: cropType.variety,
        sowing_date: getDateOffset(-cropType.growthDays + daysToHarvest),
        harvest_estimate: getDateOffset(daysToHarvest),
        status: status,
        estimated_quantity: 500 + Math.floor(Math.random() * 2000),
        quantity_unit: cropType.unit,
        demo_tag: DEMO_TAG,
      }).select().single();

      if (crop) {
        cropIds.push(crop.id);
        cropDetails.push({ id: crop.id, farmerId: farmerIds[i % farmerIds.length], name: cropType.name, status });
      }
    }
  }
  results.crops = cropIds.length;

  // ============= 8. CREATE AGENT-FARMER ASSIGNMENTS =============
  console.log("Creating agent-farmer assignments...");
  for (let i = 0; i < farmerIds.length; i++) {
    const farmer = demoFarmers[i];
    // Find agent covering this village
    let assignedAgentIdx = demoAgents.findIndex(a => a.villages.includes(farmer.village));
    if (assignedAgentIdx === -1) assignedAgentIdx = 3; // Backup agent
    
    await supabase.from("agent_farmer_assignments").insert({
      agent_id: agentIds[assignedAgentIdx],
      farmer_id: farmerIds[i],
      active: true,
      demo_tag: DEMO_TAG,
    });
  }
  results.agent_assignments = farmerIds.length;

  // ============= 9. CREATE AGENT TASKS =============
  console.log("Creating agent tasks...");
  const taskTypes = ["visit", "verify_crop", "harvest_check", "transport_assist"] as const;
  const taskStatuses = ["pending", "pending", "pending", "in_progress", "in_progress", "completed"] as const;
  
  for (let i = 0; i < 30; i++) {
    const agentIdx = i % agentIds.length;
    const farmerIdx = i % farmerIds.length;
    const taskType = taskTypes[i % taskTypes.length];
    const taskStatus = taskStatuses[i % taskStatuses.length];
    
    await supabase.from("agent_tasks").insert({
      agent_id: agentIds[agentIdx],
      farmer_id: farmerIds[farmerIdx],
      crop_id: cropIds[i % cropIds.length],
      task_type: taskType,
      task_status: taskStatus,
      due_date: getDateOffset(taskStatus === "completed" ? -Math.floor(Math.random() * 7) : Math.floor(Math.random() * 14)),
      priority: 1 + (i % 3),
      notes: `Demo task: ${taskType} for farmer ${demoFarmers[farmerIdx].name}`,
      demo_tag: DEMO_TAG,
    });
  }
  results.agent_tasks = 30;

  // ============= 10. CREATE TRANSPORT REQUESTS (40 requests) =============
  console.log("Creating transport requests...");
  const transportStatuses = [
    "requested", "requested", "requested", "requested", "requested", // 15 requested
    "requested", "requested", "requested", "requested", "requested",
    "requested", "requested", "requested", "requested", "requested",
    "assigned", "assigned", "assigned", "assigned", "assigned", // 10 assigned
    "assigned", "assigned", "assigned", "assigned", "assigned",
    "en_route", "en_route", "en_route", "en_route", "en_route", // 7 en_route
    "en_route", "en_route",
    "picked_up", "picked_up", "picked_up", "picked_up", "picked_up", // 5 picked_up
    "delivered", "delivered", "delivered", // 3 delivered
  ];

  for (let i = 0; i < 40; i++) {
    const status = transportStatuses[i];
    const farmerIdx = i % farmerIds.length;
    const farmer = demoFarmers[farmerIdx];
    
    const requestData: any = {
      farmer_id: farmerIds[farmerIdx],
      crop_id: cropIds[i % cropIds.length],
      quantity: 500 + Math.floor(Math.random() * 2000),
      quantity_unit: "kg",
      pickup_location: `${farmer.village}, Mysuru District`,
      pickup_village: farmer.village,
      drop_location: "Mysuru APMC",
      preferred_date: getDateOffset(status === "delivered" ? -Math.floor(Math.random() * 7) : Math.floor(Math.random() * 7)),
      status: status,
      notes: `Transport request from ${farmer.name}`,
      demo_tag: DEMO_TAG,
    };

    if (["assigned", "en_route", "picked_up", "delivered"].includes(status)) {
      requestData.transporter_id = transporterUserIds[i % transporterUserIds.length];
    }
    if (status === "delivered") {
      requestData.completed_at = new Date().toISOString();
      requestData.distance_km = 15 + Math.floor(Math.random() * 30);
    }

    const { data: transportReq } = await supabase.from("transport_requests").insert(requestData).select().single();

    // Create trip for assigned+ statuses
    if (transportReq && ["assigned", "en_route", "picked_up", "delivered"].includes(status)) {
      await supabase.from("trips").insert({
        transport_request_id: transportReq.id,
        transporter_id: transporterUserIds[i % transporterUserIds.length],
        status: status === "assigned" ? "assigned" : status === "en_route" ? "en_route" : status === "picked_up" ? "picked_up" : "delivered",
        demo_tag: DEMO_TAG,
      });
    }
  }
  results.transport_requests = 40;

  // ============= 11. CREATE MARKET ORDERS (30 orders) =============
  console.log("Creating market orders...");
  const orderStatuses = ["requested", "requested", "requested", "confirmed", "confirmed", "in_transport", "in_transport", "delivered"];
  
  for (let i = 0; i < 30; i++) {
    const status = orderStatuses[i % orderStatuses.length];
    
    await supabase.from("market_orders").insert({
      buyer_id: buyerRecordIds[i % buyerRecordIds.length],
      farmer_id: farmerIds[i % farmerIds.length],
      crop_id: cropIds[i % cropIds.length],
      quantity: 200 + Math.floor(Math.random() * 1000),
      quantity_unit: "kg",
      price_offered: 1500 + Math.floor(Math.random() * 3000),
      status: status,
      payment_status: status === "delivered" ? "completed" : "pending",
      delivery_date: getDateOffset(status === "delivered" ? -5 : 3),
      delivery_address: `${demoBuyers[i % demoBuyers.length].company}, Mysuru`,
      notes: `Order from ${demoBuyers[i % demoBuyers.length].name}`,
      demo_tag: DEMO_TAG,
    });
  }
  results.market_orders = 30;

  // ============= 12. CREATE MARKET PRICES (Multi-district) =============
  console.log("Creating market prices...");
  for (const crop of cropTypes) {
    for (const district of nearbyDistricts) {
      const basePrice = crop.priceRange[0] + Math.floor(Math.random() * (crop.priceRange[1] - crop.priceRange[0]));
      const variation = district === "Mysuru" ? 0 : (Math.random() - 0.5) * 400;
      
      await supabase.from("market_prices").insert({
        crop_name: crop.name,
        market_name: `${district} APMC`,
        district: district,
        state: "Karnataka",
        modal_price: Math.round(basePrice + variation),
        min_price: Math.round(basePrice + variation - 200),
        max_price: Math.round(basePrice + variation + 300),
        unit: "quintal",
        date: getDateOffset(0),
        trend_direction: ["up", "down", "flat"][Math.floor(Math.random() * 3)] as "up" | "down" | "flat",
        demo_tag: DEMO_TAG,
      });
    }
  }
  results.market_prices = cropTypes.length * nearbyDistricts.length;

  // ============= 13. CREATE PRICE FORECASTS =============
  console.log("Creating price forecasts...");
  for (const crop of cropTypes) {
    await supabase.from("price_forecasts").insert({
      crop_name: crop.name,
      district: "Mysuru",
      state: "Karnataka",
      direction: ["up", "down", "stable"][Math.floor(Math.random() * 3)],
      confidence: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      reason: `Based on ${Math.floor(Math.random() * 10) + 3} data points from nearby markets`,
      based_on_points: Math.floor(Math.random() * 10) + 3,
      demo_tag: DEMO_TAG,
    });
  }
  results.price_forecasts = cropTypes.length;

  // ============= 14. CREATE ESCALATIONS (Agent → Admin) =============
  console.log("Creating escalations...");
  const escalationCategories = ["crop_issue", "pest_outbreak", "weather_damage", "transport_issue", "payment_dispute", "other"] as const;
  const escalationSeverities = ["low", "medium", "high", "critical"] as const;
  
  for (let i = 0; i < 10; i++) {
    await supabase.from("escalations").insert({
      created_by_agent_id: agentIds[i % agentIds.length],
      farmer_id: farmerIds[i % farmerIds.length],
      severity: escalationSeverities[i % escalationSeverities.length],
      category: escalationCategories[i % escalationCategories.length],
      title: `Escalation: ${escalationCategories[i % escalationCategories.length].replace("_", " ")} for ${demoFarmers[i % demoFarmers.length].name}`,
      notes: `Demo escalation requiring admin attention`,
      status: i < 6 ? "open" : i < 8 ? "assigned" : "resolved",
      assigned_admin_id: i >= 6 ? adminIds[2] : null, // District admin
      demo_tag: DEMO_TAG,
    });
  }
  results.escalations = 10;

  // ============= 15. CREATE TRANSPORT ISSUES (8 disputes) =============
  console.log("Creating transport issues...");
  const issueCodes = ["weight_mismatch", "weight_mismatch", "weight_mismatch", "delay", "delay", "route_issue", "damaged_goods", "damaged_goods"] as const;
  
  for (let i = 0; i < 8; i++) {
    await supabase.from("transport_issues").insert({
      transporter_id: transporterUserIds[i % transporterUserIds.length],
      farmer_id: farmerIds[i % farmerIds.length],
      issue_code: issueCodes[i],
      severity: i < 3 ? "high" : "medium",
      reported_by_role: i % 2 === 0 ? "farmer" : "transporter",
      reported_by_id: i % 2 === 0 ? farmerIds[i % farmerIds.length] : transporterUserIds[i % transporterUserIds.length],
      description: `Demo ${issueCodes[i].replace("_", " ")} issue`,
      status: i < 5 ? "open" : "investigating",
      demo_tag: DEMO_TAG,
    });
  }
  results.transport_issues = 8;

  // ============= 16. CREATE NOTIFICATIONS (150) =============
  console.log("Creating notifications...");
  const notificationTypes = ["price_alert", "pickup_update", "order_update", "agent_visit", "advisory"];
  
  for (let i = 0; i < 150; i++) {
    const notifType = notificationTypes[i % notificationTypes.length];
    const userId = i < 50 ? farmerIds[i % farmerIds.length] : 
                   i < 80 ? agentIds[i % agentIds.length] : 
                   i < 110 ? transporterUserIds[i % transporterUserIds.length] : 
                   buyerRecordIds[i % buyerRecordIds.length];
    
    await supabase.from("notifications").insert({
      user_id: userId,
      type: notifType,
      title: `${notifType.replace("_", " ").charAt(0).toUpperCase() + notifType.replace("_", " ").slice(1)}`,
      message: `Demo notification: ${notifType}`,
      is_read: Math.random() > 0.7,
      demo_tag: DEMO_TAG,
    });
  }
  results.notifications = 150;

  return new Response(JSON.stringify({
    success: true,
    message: "Mysuru Demo Ecosystem v2 generated successfully!",
    summary: results,
    credentials: credentials,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
