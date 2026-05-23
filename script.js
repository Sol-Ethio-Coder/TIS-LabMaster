// ==================== SUPABASE CLOUD STORAGE CONFIGURATION ====================
// Default Supabase credentials (pre-configured)
const DEFAULT_SUPABASE_URL = "https://bxtequbmmtzfkgshmtqe.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dGVxdWJtbXR6Zmtnc2htdHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0ODQ3NTUsImV4cCI6MjA5NTA2MDc1NX0.85Wqg7kJqoAgZqlhNB6tbqnrtWGWgyB0a3AfCfD0GAI";

let SUPABASE_CONFIG = {
    url: localStorage.getItem("supabase_url") || DEFAULT_SUPABASE_URL,
    anonKey: localStorage.getItem("supabase_anon_key") || DEFAULT_SUPABASE_ANON_KEY,
    table: "attendance_records"
};

let supabaseClient = null;
let isCloudConnected = false;
let cloudSyncInterval = null;

// ==================== AUTHENTICATION ====================
const VALID_CREDS = { admin: "admin123", teacher: "teacher" };
let currentUser = null;
let isLoggedIn = false;

// ==================== CLASSES & WEIGHTS ====================
const CLASSES = [
    { id: "grade8A", display: "Grade Eight A", weights: { "Practical 1":0.3, "Exam":0.2, "Exercise Book":0.05, "Participation":0.05, "Assign 1":0.05, "Assign 2":0.05, "Practical 2":0.4 } },
    { id: "grade8B", display: "Grade Eight B", weights: { "Practical 1":0.3, "Exam":0.2, "Exercise Book":0.05, "Participation":0.05, "Assign 1":0.05, "Assign 2":0.05, "Practical 2":0.4 } },
    { id: "grade9A", display: "Grade Nine A", weights: { "Project 1":0.3, "Project":0.25, "Quiz":0.05, "Exercise Book":0.05, "Participation":0.05, "Practical 2":0.4 } },
    { id: "grade9B", display: "Grade Nine B", weights: { "Project 1":0.3, "Project":0.25, "Quiz":0.05, "Exercise Book":0.05, "Participation":0.05, "Practice 2":0.4 } },
    { id: "grade10A", display: "Grade Ten A", weights: { "Practical 1":0.3, "Project":0.15, "Quiz":0.05, "Exercise Book":0.05, "Participation":0.05, "Assignment":0.1, "Practical 2":0.4 } },
    { id: "grade11A", display: "Grade Eleven A", weights: { "Practical 1":0.3, "Mid-Exam":0.2, "Assignment":0.1, "Exercise Book":0.05, "Participation":0.05, "Practical 2":0.4 } },
    { id: "grade12A", display: "Grade Twelve A", weights: { "Practical 1":0.3, "Mid-Exam":0.2, "Exercise Book":0.05, "Assignment":0.15, "Practical 2":0.4 } }
];

const rawStudentData = {
    grade8A: ["Amen Addisu","Arsemawit Mhireteab","Arsonia Tadesse","Aymen Abdulaziz","Biruk Abiy","Bisrat Aydefer","Christian Yohannes","Diamond G|Egziahber","Eldaah Zacharias","Eldana Tewodros","Eman Yusuf","Emanda Girma","Eyobed Wossen","Eyosias Yirga","Inam Miraj","Makbel Tekle","Maraki Anteneh","Marken Mesay","Mathias Yohannes","Nahom Abiy","Naomi Tekle","Naomi Daniel","Noah Mohammed","Nobel Addisalem","Rajan Dirriba","Rani Mayur","Rediet Getu","Reyan Abduljelil","Soliyana Alemayehu","Tsinat Abiy","Yafet Alexander","Yohannes Tefera"],
    grade8B: ["Dawit Fasil","Elda Abiy","Eldana Tinsae","Etsubdenk Feyesa","Eyuel Deresse","Fikir Zerihun","Hemen Getnet","Natanim Habtamu","Nejat Abdulaziz","Nobel Bereket","Rekik Anteneh","Robel Zelalem","Ruth Alemayehu","Yeamanuel Melakeselam","Yousuf Awad","Yemariam Tesfaye","Yosyas Addisu","Yusuf Yasin"],
    grade9A: ["Abenezer Moges","Alef Kalkidan","Amen Biniam","Ananiya Seyoum","Arsema Esayas","Betelhem Dawit","Biruktawit Berihu","Dagmawit Yared","Elias Tewodros","Eyosiyas Wondwossen","Heldana Yonas","Hena Michael","Hermon Haile","Hilina Tesfaye","Iuhena Melis","Mariot Dereje","Nahom Natnael","Naomi Mehari","Nathan Bekalu","Nathan Taye","Nolawi Dawit","Rakeb Nesibu","Ramijah Kaleb","Robel Ataklti","Ruth Eyob","Samuel G|Egziabher","Selihom Haftom","Tiewobsta Hailu","Yisak Abebe"],
    grade9B: ["Alazar Astawesegn","Amen Solomon","Amen Teklemariam","Bella Biniam","Bereket Abiy","Bereket Nibret","Bezalel Fikru","Bitania Kassahun","Dawit G|Kidan","Edom Ayal","Eldana Abrham","Eyosias Mekasha","Hasset Fitsum","Helina Mesfin","Hilawee Zelalem","Kibron Tadiyos","Kidus Dawit","Loza Tesfaye","Mathias Gashaw","Naomi Eshetu","Nathan Dawit","Nathanim Henok","Ruth Epherem","Saron Solomon","Semayat Adane","Tihitina Ashenafi","Wildan Shemsedin","Yanet Tegene","Yohana Tinsae","Yuliyana Addis"],
    grade10A: ["Abel Addisu","Abigail Habtamu","Amen Dagnachew","Amen Samuel","Anani Getahun","Arsema Tekle","Arsema Negash","Bersabeh Girma","Beza Alemayehu","Beza Fikadu","Bilisayad Dawit","Christina Semere","David Kirubel","Eden Seifu","Efrata Biniyam","Eliyana Badege","Eyob Birhanu","Eyoram Wossen","Hassiet Elias","Henon Mulutsehay","Hermon Yosef","Hewan Addisalem","Hiyab Birhane","Lielt Kassahun","Lihem Ataklit","Malak Hafed","Mariza Mustofa","Markan Bewket","Mebatsion Dawit","Misgana Ketsela","Naod Tekle","Rihanna Mechelle","Saron Tesfaye","Saron Belete","Soufian Hafed","Soliyana Kassahun","Yamlak Mulugeta","Yanet Berhanu","Yimima Mehariy","Yonathan Teferra","Gelila Fikir","Ezra Fikir"],
    grade11A: ["Abel Alemayehu","Abenezer Nibret","Akshai Bejai","Alador Tadiwos","Amanuel Ayele","Amanuel Solomon","Dawit Gossaye","Eyerusalem Hailay","Habeneyom Yohannes","Jonsen Semere","Milka Birhane","Natanim Fisseha","Nathan Abayneh","Nathan Solomon","Nolawi Mulutsehay","Rudi Kifle","Senay Hagos","Soliyana Addisalem","Selome Tewodros","Yididiya Zelalem","Zema Yared"],
    grade12A: ["Blen Getnet","Desta Letwled","Edidiya Yonatan","Eyosias Aklog","Haneale Aklilu","Hiruy Zegene","Martha Birhane","Mathias Mekuria","Melat Kibruyisfa","Mikiyas Hailu","Naomi Sintayehu","Nathan Samson","Natnael Solomon","Nazrawi Habtamu","Olana Demissie","Rukiya Ahmed","Samuel Ataklti","Soliana Kifle","Yared Abiy","Yitzhak Yosef","Yohannes Mekere"]
};

// ==================== GLOBAL STORAGE ====================
let schoolData = { term1: {}, term2: {}, term3: {} };
let currentTerm = "term2";
let currentClassId = "grade8A";
let currentSort = { column: "name", direction: "asc" };
let searchTerm = "";

// Helper function to get status based on FINAL TOTAL (out of 100)
function getStatusFromTotal(finalTotal) {
    if (finalTotal >= 90) return { text: "🏆 Excellent", class: "status-excellent" };
    if (finalTotal >= 80) return { text: "✅ Very Good", class: "status-very-good" };
    if (finalTotal >= 70) return { text: "📘 Good", class: "status-good" };
    if (finalTotal >= 60) return { text: "📗 Satisfactory", class: "status-satisfactory" };
    if (finalTotal >= 50) return { text: "⚠️ Pass", class: "status-pass" };
    if (finalTotal >= 40) return { text: "📌 Below Average", class: "status-below" };
    return { text: "❌ Needs Improvement", class: "status-fail" };
}

// ==================== LOCAL STORAGE FUNCTIONS ====================
function persistToLocal() {
    localStorage.setItem("tis_labmaster_data", JSON.stringify(schoolData));
}

function loadData() {
    const saved = localStorage.getItem("tis_labmaster_data");
    if (saved) {
        schoolData = JSON.parse(saved);
        return true;
    }
    return false;
}

function initTermData(term, classId) {
    let cls = CLASSES.find(c => c.id === classId);
    if (!cls) return;
    let studentNames = rawStudentData[classId] || [];
    let students = studentNames.map((name, idx) => {
        let gender = (idx % 2 === 0 ? "F" : "M");
        let componentScores = {};
        Object.keys(cls.weights).forEach(comp => { componentScores[comp] = ""; });
        return { name, gender, componentScores, finalExamScore: "", finalTotal: 0 };
    });
    let attendance = {};
    students.forEach(s => { attendance[s.name] = { status: "absent", lastUpdated: new Date().toISOString() }; });
    schoolData[term][classId] = { students, attendance };
}

function initAllTerms() {
    ["term1", "term2", "term3"].forEach(t => {
        schoolData[t] = {};
        CLASSES.forEach(cls => initTermData(t, cls.id));
    });
    persistToLocal();
}

function ensureDataExists() {
    ["term1", "term2", "term3"].forEach(t => {
        if (!schoolData[t]) schoolData[t] = {};
        CLASSES.forEach(cls => {
            if (!schoolData[t][cls.id]) initTermData(t, cls.id);
        });
    });
}

// Compute final total as weighted sum (OUT OF 100)
function computeFinalTotal(componentScores, weights, finalExamScore) {
    // Calculate coursework contribution (70% of final grade)
    let courseworkSum = 0;
    for (let [comp, weight] of Object.entries(weights)) {
        let val = parseFloat(componentScores[comp]);
        if (!isNaN(val) && val !== "") {
            courseworkSum += val * weight;
        }
    }
    
    // Calculate exam contribution (out of 30, converted to 30% of final grade)
    let examVal = parseFloat(finalExamScore);
    let examContribution = 0;
    if (!isNaN(examVal) && examVal !== "") {
        examContribution = (examVal / 30) * 30;
    }
    
    // Final total is out of 100
    let finalTotal = courseworkSum + examContribution;
    
    // Cap at 100
    return Math.min(100, Math.max(0, finalTotal));
}

// ==================== SUPABASE FUNCTIONS ====================
async function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn("Supabase SDK not loaded");
        updateCloudStatusMessage("⚠️ Supabase SDK not loaded - Please refresh the page", "error");
        return false;
    }
    
    // Always try to connect with current config (has defaults)
    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        const { error } = await supabaseClient.from(SUPABASE_CONFIG.table).select('count', { count: 'exact', head: true });
        
        if (error && error.message.includes("does not exist")) {
            updateCloudStatusMessage("📦 Table not found - will create on first sync", "info");
            isCloudConnected = true;
            updateCloudUI(true);
            return true;
        }
        
        if (!error) {
            isCloudConnected = true;
            updateCloudUI(true);
            updateCloudStatusMessage("✅ Supabase connected successfully!", "success");
            return true;
        }
        
        throw error;
    } catch (error) {
        console.error("Supabase connection error:", error);
        updateCloudStatusMessage("❌ Connection failed - check credentials", "error");
        updateCloudUI(false);
        return false;
    }
}

function configureCloud() {
    const url = prompt("Enter your Supabase Project URL:", SUPABASE_CONFIG.url);
    if (!url) return;
    
    const key = prompt("Enter your Supabase Anon Key:", SUPABASE_CONFIG.anonKey);
    if (!key) return;
    
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.anonKey = key;
    localStorage.setItem("supabase_url", url);
    localStorage.setItem("supabase_anon_key", key);
    
    updateCloudStatusMessage("🔌 Testing connection...", "info");
    initSupabase().then(() => {
        if (isCloudConnected) {
            alert("✅ Supabase configured successfully! Click 'Sync to Cloud' to backup your data.");
        } else {
            alert("❌ Connection failed. Please check your URL and Anon Key.");
        }
    });
}

function resetToDefaultCloud() {
    if (confirm("⚠️ Reset to default cloud configuration?\n\nThis will use the default Supabase credentials.")) {
        localStorage.removeItem("supabase_url");
        localStorage.removeItem("supabase_anon_key");
        SUPABASE_CONFIG.url = DEFAULT_SUPABASE_URL;
        SUPABASE_CONFIG.anonKey = DEFAULT_SUPABASE_ANON_KEY;
        updateCloudStatusMessage("🔄 Resetting to default configuration...", "info");
        initSupabase().then(() => {
            if (isCloudConnected) {
                alert("✅ Reset to default cloud configuration successfully!");
            } else {
                alert("❌ Failed to connect to default cloud. Please check your internet.");
            }
        });
    }
}

async function autoSyncToCloud() {
    if (!isCloudConnected || !supabaseClient || !isLoggedIn) {
        return false;
    }
    
    showSyncIndicator(true);
    
    try {
        const syncData = {
            schoolData: schoolData,
            currentTerm: currentTerm,
            currentClassId: currentClassId,
            teacher: currentUser,
            timestamp: new Date().toISOString(),
            version: "2.0"
        };
        
        const { error } = await supabaseClient
            .from(SUPABASE_CONFIG.table)
            .upsert({
                id: `teacher_${currentUser}`,
                data: syncData,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        showSyncIndicator(false);
        return true;
        
    } catch (error) {
        console.error("Auto-sync error:", error);
        showSyncIndicator(false);
        return false;
    }
}

async function syncToSupabase() {
    if (!isCloudConnected || !supabaseClient) {
        updateCloudStatusMessage("⚠️ Cloud not connected - reconnecting...", "warning");
        await initSupabase();
        if (!isCloudConnected) {
            updateCloudStatusMessage("⚠️ Cannot sync - cloud not available", "error");
            return false;
        }
    }
    
    updateCloudStatusMessage("☁️ Syncing to Supabase cloud...", "info");
    
    try {
        ensureDataExists();
        
        const syncData = {
            schoolData: schoolData,
            currentTerm: currentTerm,
            currentClassId: currentClassId,
            teacher: currentUser,
            timestamp: new Date().toISOString(),
            version: "2.0"
        };
        
        const { error } = await supabaseClient
            .from(SUPABASE_CONFIG.table)
            .upsert({
                id: `teacher_${currentUser}`,
                data: syncData,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        updateCloudStatusMessage("✅ Synced to Supabase cloud!", "success");
        localStorage.setItem("tis_last_cloud_sync", new Date().toISOString());
        return true;
        
    } catch (error) {
        console.error("Supabase sync error:", error);
        updateCloudStatusMessage("⚠️ Sync failed: " + (error.message || "Unknown error"), "error");
        return false;
    }
}

async function loadFromSupabase() {
    if (!isCloudConnected || !supabaseClient) return false;
    
    updateCloudStatusMessage("☁️ Loading from Supabase cloud...", "info");
    
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.table)
            .select('data')
            .eq('id', `teacher_${currentUser}`)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                updateCloudStatusMessage("📀 No cloud data found", "info");
                return false;
            }
            throw error;
        }
        
        if (data && data.data && data.data.schoolData) {
            schoolData = data.data.schoolData;
            currentTerm = data.data.currentTerm || "term2";
            currentClassId = data.data.currentClassId || "grade8A";
            persistToLocal();
            updateCloudStatusMessage("✅ Loaded from Supabase cloud!", "success");
            return true;
        }
        
        updateCloudStatusMessage("📀 No valid cloud data found", "info");
        return false;
        
    } catch (error) {
        console.error("Supabase load error:", error);
        updateCloudStatusMessage("📀 Using local storage", "info");
        return false;
    }
}

function updateCloudUI(connected) {
    const cloudStatus = document.getElementById("cloudStatus");
    const cloudStorageStatus = document.getElementById("cloudStorageStatus");
    const cloudStatusMsg = document.getElementById("cloudStatusMsg");
    
    if (connected) {
        if (cloudStatus) {
            cloudStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Cloud: Connected';
            cloudStatus.classList.add("connected");
        }
        if (cloudStorageStatus) cloudStorageStatus.innerHTML = '✅ Connected - Auto-save active';
        if (cloudStatusMsg) cloudStatusMsg.innerHTML = "☁️ Supabase cloud connected • Auto-saves on every change";
    } else {
        if (cloudStatus) {
            cloudStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Cloud: Offline';
            cloudStatus.classList.remove("connected");
        }
        if (cloudStorageStatus) cloudStorageStatus.innerHTML = '⚠️ Connection issue - Check internet';
        if (cloudStatusMsg) cloudStatusMsg.innerHTML = '⚠️ Cloud connection issue • Data saved locally only';
    }
}

function updateCloudStatusMessage(message, type) {
    const cloudStatusMsg = document.getElementById("cloudStatusMsg");
    if (cloudStatusMsg) {
        cloudStatusMsg.innerHTML = message;
        
        if (type !== "error") {
            setTimeout(() => {
                if (cloudStatusMsg && isCloudConnected) {
                    cloudStatusMsg.innerHTML = "☁️ Supabase cloud connected • Auto-saves on every change";
                } else if (cloudStatusMsg && !isCloudConnected) {
                    cloudStatusMsg.innerHTML = '⚠️ Cloud connection issue • Data saved locally only';
                }
            }, 3000);
        }
    }
}

function showSyncIndicator(syncing = true) {
    const indicator = document.getElementById("syncIndicator");
    if (!indicator) return;
    
    if (syncing) {
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
        indicator.style.color = "#ff9800";
    } else {
        indicator.innerHTML = '<i class="fas fa-check"></i> Synced';
        indicator.style.color = "#4caf50";
        setTimeout(() => {
            if (indicator) indicator.innerHTML = "";
        }, 2000);
    }
}

async function manualCloudSync() {
    updateCloudStatusMessage("☁️ Manual sync in progress...", "info");
    const result = await syncToSupabase();
    
    if (result) {
        alert("✅ Data synced to Supabase cloud successfully!");
    } else {
        alert("❌ Sync failed. Please check your internet connection.");
    }
}

async function manualLoadFromCloud() {
    if (!isCloudConnected || !supabaseClient) {
        await initSupabase();
        if (!isCloudConnected) {
            alert("❌ Cannot connect to cloud. Please check your internet connection.");
            return;
        }
    }
    
    updateCloudStatusMessage("☁️ Loading from cloud...", "info");
    
    const result = await loadFromSupabase();
    
    if (result) {
        renderMarklist();
        renderAttendance();
        updateAnalytics();
        updateReportStudentSelect();
        alert("✅ Data loaded from Supabase cloud successfully!");
    } else {
        alert("❌ No cloud data found or load failed.\n\nPlease sync your data to cloud first.");
    }
}

// ==================== THEME FUNCTIONS ====================
function initTheme() {
    const savedTheme = localStorage.getItem("tis_theme");
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }
}

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const isLightMode = document.body.classList.contains("light-mode");
    localStorage.setItem("tis_theme", isLightMode ? "light" : "dark");
}

// ==================== UI RENDER FUNCTIONS ====================
function renderMarklistHeader() {
    let cls = CLASSES.find(c => c.id === currentClassId);
    if (!cls) return;
    document.getElementById("gradeNameDisplay").innerHTML = cls.display;
    let weightsContainer = document.getElementById("weightsContainer");
    weightsContainer.innerHTML = "";
    Object.entries(cls.weights).forEach(([comp, weight]) => {
        let span = document.createElement("span");
        span.className = "weight-badge";
        span.innerHTML = `${comp} <strong>${(weight*100).toFixed(0)}%</strong>`;
        weightsContainer.appendChild(span);
    });
    
    // Add exam weight info
    let examSpan = document.createElement("span");
    examSpan.className = "weight-badge";
    examSpan.style.background = "#ff9800";
    examSpan.style.color = "white";
    examSpan.innerHTML = `Final Exam <strong>30%</strong> (out of 30)`;
    weightsContainer.appendChild(examSpan);
    
    let thead = document.getElementById("marksTableHead");
    thead.innerHTML = "";
    let headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>#</th><th onclick="sortByColumn('name')">Student Name ⬍</th><th>Gender</th>`;
    Object.keys(cls.weights).forEach(comp => { headerRow.innerHTML += `<th>${comp}<br><small>${(cls.weights[comp]*100).toFixed(0)}%</small></th>`; });
    headerRow.innerHTML += `<th>Final Exam<br><small>out of 30 (30%)</small></th><th onclick="sortByColumn('finalTotal')">Final Total<br><small>out of 100</small> ⬍</th><th>Status</th>`;
    thead.appendChild(headerRow);
}

function sortByColumn(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    } else {
        currentSort.column = column;
        currentSort.direction = "asc";
    }
    renderMarklist();
}
window.sortByColumn = sortByColumn;

function renderMarklist() {
    if (!isLoggedIn) return;
    renderMarklistHeader();
    let cls = CLASSES.find(c => c.id === currentClassId);
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    let filteredStudents = data.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    let sortedStudents = [...filteredStudents].sort((a, b) => {
        let valA = currentSort.column === "name" ? a.name : a.finalTotal;
        let valB = currentSort.column === "name" ? b.name : b.finalTotal;
        if (typeof valA === "string") return currentSort.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return currentSort.direction === "asc" ? valA - valB : valB - valA;
    });
    let tbody = document.getElementById("marksTbody");
    tbody.innerHTML = "";
    
    sortedStudents.forEach((student, idx) => {
        let row = tbody.insertRow();
        row.insertCell(0).innerHTML = idx + 1;
        row.insertCell(1).innerHTML = student.name;
        row.insertCell(2).innerHTML = student.gender;
        
        // Component scores (each out of 100, weighted)
        Object.keys(cls.weights).forEach(comp => {
            let cell = row.insertCell();
            let inp = document.createElement("input");
            inp.type = "number";
            inp.value = student.componentScores[comp] || "";
            inp.placeholder = "0-100";
            inp.min = "0";
            inp.max = "100";
            inp.classList.add("score-input");
            inp.onchange = async (e) => {
                let val = e.target.value === "" ? "" : Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                student.componentScores[comp] = val;
                student.finalTotal = computeFinalTotal(student.componentScores, cls.weights, student.finalExamScore);
                persistToLocal();
                renderMarklist();
                updateAnalytics();
                await autoSyncToCloud();
            };
            cell.appendChild(inp);
        });
        
        // Final Exam (out of 30)
        let examCell = row.insertCell();
        let examInput = document.createElement("input");
        examInput.type = "number";
        examInput.placeholder = "0-30";
        examInput.max = "30";
        examInput.min = "0";
        examInput.classList.add("score-input");
        examInput.value = student.finalExamScore || "";
        examInput.onchange = async (e) => {
            let examVal = e.target.value === "" ? "" : Math.min(30, Math.max(0, parseFloat(e.target.value) || 0));
            student.finalExamScore = examVal;
            student.finalTotal = computeFinalTotal(student.componentScores, cls.weights, student.finalExamScore);
            persistToLocal();
            renderMarklist();
            updateAnalytics();
            await autoSyncToCloud();
        };
        examCell.appendChild(examInput);
        
        // Final Total (out of 100)
        let totalCell = row.insertCell();
        totalCell.innerHTML = student.finalTotal.toFixed(1) + "%";
        
        // Status based on FINAL TOTAL (out of 100)
        let status = getStatusFromTotal(student.finalTotal);
        let statusCell = row.insertCell();
        statusCell.innerHTML = status.text;
        statusCell.className = status.class;
    });
}

function renderAttendance() {
    if (!isLoggedIn) return;
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    let tbody = document.getElementById("attendanceTbody");
    tbody.innerHTML = "";
    let filteredStudents = data.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    filteredStudents.forEach((s, idx) => {
        let att = data.attendance[s.name] || { status: "absent", lastUpdated: new Date().toISOString() };
        let row = tbody.insertRow();
        row.insertCell(0).innerHTML = idx + 1;
        row.insertCell(1).innerHTML = s.name;
        row.insertCell(2).innerHTML = s.gender;
        let statusSpan = document.createElement("span");
        statusSpan.innerText = att.status === "present" ? "✅ PRESENT" : "❌ ABSENT";
        statusSpan.className = `attendance-badge ${att.status === "present" ? "present" : "absent"}`;
        row.insertCell(3).appendChild(statusSpan);
        row.insertCell(4).innerHTML = new Date(att.lastUpdated).toLocaleString();
        let toggleBtn = document.createElement("button");
        toggleBtn.innerText = att.status === "present" ? "Mark Absent" : "Mark Present";
        toggleBtn.className = "icon-btn";
        toggleBtn.onclick = async () => {
            let newStatus = att.status === "present" ? "absent" : "present";
            schoolData[currentTerm][currentClassId].attendance[s.name] = { status: newStatus, lastUpdated: new Date().toISOString() };
            persistToLocal();
            renderAttendance();
            updateAnalytics();
            updateAttendanceStats();
            await autoSyncToCloud();
        };
        row.insertCell(5).appendChild(toggleBtn);
    });
    updateAttendanceStats();
}

function updateAttendanceStats() {
    if (!isLoggedIn) return;
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    let total = data.students.length;
    let present = Object.values(data.attendance).filter(a => a.status === "present").length;
    let percentage = total ? ((present / total) * 100).toFixed(1) : 0;
    document.getElementById("totalStudents").innerText = total;
    document.getElementById("presentCount").innerText = present;
    document.getElementById("absentCount").innerText = total - present;
    document.getElementById("attendancePercentage").innerText = percentage;
}

function markAllPresent() {
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    data.students.forEach(s => { data.attendance[s.name] = { status: "present", lastUpdated: new Date().toISOString() }; });
    persistToLocal();
    renderAttendance();
    updateAnalytics();
    autoSyncToCloud();
    alert("All students marked as PRESENT!");
}

function markAllAbsent() {
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    data.students.forEach(s => { data.attendance[s.name] = { status: "absent", lastUpdated: new Date().toISOString() }; });
    persistToLocal();
    renderAttendance();
    updateAnalytics();
    autoSyncToCloud();
    alert("All students marked as ABSENT!");
}

function updateAnalytics() {
    if (!isLoggedIn) return;
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    
    let totals = data.students.map(s => s.finalTotal).filter(v => !isNaN(v) && v > 0);
    
    let avg = totals.length ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1) : 0;
    let sorted = [...totals].sort((a, b) => a - b);
    let median = sorted.length ? sorted[Math.floor(sorted.length / 2)].toFixed(1) : 0;
    let highest = totals.length ? Math.max(...totals).toFixed(1) : 0;
    let lowest = totals.length ? Math.min(...totals).toFixed(1) : 0;
    let passCount = totals.filter(s => s >= 60).length;
    let passRate = totals.length ? ((passCount / totals.length) * 100).toFixed(1) : 0;
    let excellentCount = totals.filter(s => s >= 80).length;
    let presentCount = Object.values(data.attendance).filter(a => a.status === "present").length;
    let attendanceRate = data.students.length ? ((presentCount / data.students.length) * 100).toFixed(1) : 0;
    
    let distribution = `${totals.filter(s => s >= 80).length} A, ${totals.filter(s => s >= 60 && s < 80).length} B, ${totals.filter(s => s >= 50 && s < 60).length} C, ${totals.filter(s => s < 50).length} D`;
    
    document.getElementById("avgScore").innerHTML = avg + "%";
    document.getElementById("medianScore").innerHTML = median + "%";
    document.getElementById("highestScore").innerHTML = highest + "%";
    document.getElementById("lowestScore").innerHTML = lowest + "%";
    document.getElementById("passRate").innerHTML = passRate + "%";
    document.getElementById("excellentCount").innerHTML = excellentCount;
    document.getElementById("attendanceRate").innerHTML = attendanceRate + "%";
    document.getElementById("gradeDistribution").innerHTML = distribution;
}

function addStudent() {
    let name = prompt("Enter student name:");
    if (!name) return;
    let gender = prompt("Enter gender (M/F):", "M");
    let data = schoolData[currentTerm][currentClassId];
    let cls = CLASSES.find(c => c.id === currentClassId);
    let componentScores = {};
    Object.keys(cls.weights).forEach(comp => { componentScores[comp] = ""; });
    data.students.push({ name, gender, componentScores, finalExamScore: "", finalTotal: 0 });
    data.attendance[name] = { status: "absent", lastUpdated: new Date().toISOString() };
    persistToLocal();
    renderMarklist();
    renderAttendance();
    updateAnalytics();
    updateAttendanceStats();
    autoSyncToCloud();
}

function generateReportCard(studentName) {
    let modal = document.getElementById("reportModal");
    let content = document.getElementById("reportContent");
    let termsHtml = "";
    for (let term of ["term1", "term2", "term3"]) {
        let termName = term === "term1" ? "First Term" : term === "term2" ? "Second Term" : "Third Term";
        let data = schoolData[term][currentClassId];
        let student = data?.students.find(s => s.name === studentName);
        if (student) {
            let status = getStatusFromTotal(student.finalTotal);
            termsHtml += `<tr>
                <td>${termName}</td>
                <td>${student.finalTotal.toFixed(1)}%</td>                <td>${student.finalExamScore || "--"} / 30</td>
                <td class="${status.class}">${status.text}</td>
            </tr>`;
        }
    }
    content.innerHTML = `
        <div class="report-card-print">
            <div class="header"><h2>TIS LabMaster</h2><h3>Student Report Card</h3><p>${studentName}</p><p>Generated: ${new Date().toLocaleString()}</p></div>
            <table border="1" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th>Term</th><th>Final Total (%)</th><th>Final Exam</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>${termsHtml}</tbody>
            </table>
            <button class="print-btn" onclick="window.print()">🖨️ Print</button>
            <button class="close-modal" onclick="document.getElementById('reportModal').style.display='none'">Close</button>
        </div>
    `;
    modal.style.display = "flex";
}

function exportAllCSV() {
    let rows = [["Term", "Class", "Student Name", "Gender", "Component Scores", "Final Exam (0-30)", "Final Total (%)", "Status"]];
    for (let term of ["term1", "term2", "term3"]) {
        for (let cls of CLASSES) {
            let data = schoolData[term][cls.id];
            if (data && data.students) {
                data.students.forEach(s => {
                    let components = Object.values(s.componentScores).join("|");
                    let status = getStatusFromTotal(s.finalTotal);
                    rows.push([term, cls.display, s.name, s.gender, components, s.finalExamScore || "", s.finalTotal.toFixed(1) + "%", status.text]);
                });
            }
        }
    }
    let csv = rows.map(r => r.join(",")).join("\n");
    let blob = new Blob([csv], { type: "text/csv" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tis_all_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    alert("✅ CSV exported!");
}

function downloadBackup() {
    const backup = { schoolData: schoolData, timestamp: new Date().toISOString(), version: "2.0", teacher: currentUser };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tis_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Backup downloaded! Save to Google Drive.");
}

function restoreBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            if (backup.schoolData) {
                schoolData = backup.schoolData;
                persistToLocal();
                renderMarklist();
                renderAttendance();
                updateAnalytics();
                autoSyncToCloud();
                alert("✅ Backup restored!");
            } else {
                alert("Invalid backup file");
            }
        } catch (err) {
            alert("Error reading backup file");
        }
    };
    reader.readAsText(file);
}

function resetCurrentTerm() {
    if (confirm("⚠️ Reset current term? This cannot be undone!")) {
        initTermData(currentTerm, currentClassId);
        persistToLocal();
        renderMarklist();
        renderAttendance();
        updateAnalytics();
        autoSyncToCloud();
        alert("Current term reset.");
    }
}

function resetAllData() {
    if (confirm("⚠️ RESET ALL DATA? This will delete everything!")) {
        if (prompt("Type 'CONFIRM' to delete all data") === "CONFIRM") {
            initAllTerms();
            renderMarklist();
            renderAttendance();
            updateAnalytics();
            autoSyncToCloud();
            alert("All data reset.");
        }
    }
}

// Add status styles to the page
function addStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .status-excellent { color: #4caf50; font-weight: bold; }
        .status-very-good { color: #8bc34a; font-weight: bold; }
        .status-good { color: #2196f3; font-weight: bold; }
        .status-satisfactory { color: #00bcd4; font-weight: bold; }
        .status-pass { color: #ff9800; font-weight: bold; }
        .status-below { color: #ff5722; font-weight: bold; }
        .status-fail { color: #f44336; font-weight: bold; }
    `;
    document.head.appendChild(style);
}

// ==================== INITIALIZATION ====================
function initClassDropdown() {
    let select = document.getElementById("classSelector");
    if (!select) return;
    select.innerHTML = "";
    CLASSES.forEach(cls => {
        let opt = document.createElement("option");
        opt.value = cls.id;
        opt.innerText = cls.display;
        select.appendChild(opt);
    });
    select.value = currentClassId;
    select.onchange = (e) => {
        currentClassId = e.target.value;
        renderMarklist();
        renderAttendance();
        updateAnalytics();
        updateReportStudentSelect();
    };
}

function updateReportStudentSelect() {
    let select = document.getElementById("reportStudentSelect");
    if (!select) return;
    let data = schoolData[currentTerm][currentClassId];
    if (data) {
        select.innerHTML = `<option value="">Select Student</option>${data.students.map(s => `<option value="${s.name}">${s.name}</option>`).join("")}`;
    }
}

function updateClock() {
    const dateTimeEl = document.getElementById("liveDateTime");
    if (dateTimeEl) {
        dateTimeEl.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleString()}`;
    }
}

function updateOnline() {
    let badge = document.getElementById("onlineBadge");
    if (badge) {
        badge.innerHTML = navigator.onLine ? '<i class="fas fa-wifi"></i> Online' : '<i class="fas fa-plug"></i> Offline';
    }
}

// ==================== AUTO-SAVE SCHEDULER ====================
let autoSyncInterval = null;

function startAutoCloudSync() {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => {
        if (isLoggedIn && isCloudConnected && navigator.onLine) {
            autoSyncToCloud();
        }
    }, 3 * 60 * 1000);
}

// ==================== LOGIN ====================
function handleLogin() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    
    if ((username === "admin" && password === "admin123") || (username === "teacher" && password === "teacher")) {
        currentUser = username;
        isLoggedIn = true;
        
        if (!loadData()) {
            initAllTerms();
        } else {
            ensureDataExists();
        }
        
        const loginPanel = document.getElementById("loginPanel");
        const mainApp = document.getElementById("mainApp");
        
        if (loginPanel) loginPanel.style.display = "none";
        if (mainApp) {
            mainApp.style.display = "block";
            mainApp.classList.add("visible");
        }
        
        initClassDropdown();
        updateReportStudentSelect();
        renderMarklist();
        renderAttendance();
        updateAnalytics();
        updateClock();
        setInterval(updateClock, 1000);
        updateOnline();
        
        if (username !== "admin") {
            const adminTab = document.querySelector('.tab-btn[data-tab="admin"]');
            if (adminTab) adminTab.style.display = "none";
        }
        
        const loginError = document.getElementById("loginError");
        if (loginError) loginError.innerHTML = "";
        
        // Add status styles
        addStatusStyles();
        
        // Initialize Supabase (will use defaults)
        initSupabase().then(() => {
            if (isCloudConnected) {
                loadFromSupabase().then(() => {
                    renderMarklist();
                    renderAttendance();
                    updateAnalytics();
                });
                startAutoCloudSync();
            }
        });
        
    } else {
        const loginError = document.getElementById("loginError");
        if (loginError) {
            loginError.innerHTML = '❌ Invalid credentials! Try again!';
        }
    }
}

function handleLogout() {
    isLoggedIn = false;
    currentUser = null;
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    
    const mainApp = document.getElementById("mainApp");
    const loginPanel = document.getElementById("loginPanel");
    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");
    const loginError = document.getElementById("loginError");
    
    if (mainApp) mainApp.style.display = "none";
    if (loginPanel) loginPanel.style.display = "flex";
    if (usernameInput) usernameInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (loginError) loginError.innerHTML = "";
}

// ==================== EVENT LISTENERS ====================
document.addEventListener("DOMContentLoaded", function() {
    const mainApp = document.getElementById("mainApp");
    const loginPanel = document.getElementById("loginPanel");
    
    if (mainApp) mainApp.style.display = "none";
    if (loginPanel) loginPanel.style.display = "flex";
    
    initTheme();
    initTabs();
    
    console.log("TIS LabMaster Ready!");
    console.log("☁️ Supabase cloud storage configured by default");
});

const loginBtn = document.getElementById("doLoginBtn");
if (loginBtn) {
    loginBtn.addEventListener("click", handleLogin);
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
}

const loginPassword = document.getElementById("loginPassword");
if (loginPassword) {
    loginPassword.addEventListener("keypress", (e) => { if (e.key === "Enter") handleLogin(); });
}

const loginUsername = document.getElementById("loginUsername");
if (loginUsername) {
    loginUsername.addEventListener("keypress", (e) => { if (e.key === "Enter") handleLogin(); });
}

const termSelector = document.getElementById("termSelector");
if (termSelector) {
    termSelector.addEventListener("change", (e) => {
        currentTerm = e.target.value;
        renderMarklist();
        renderAttendance();
        updateAnalytics();
        updateReportStudentSelect();
    });
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value;
        renderMarklist();
        renderAttendance();
    });
}

const refreshMarksBtn = document.getElementById("refreshMarksBtn");
if (refreshMarksBtn) {
    refreshMarksBtn.addEventListener("click", () => {
        renderMarklist();
        updateAnalytics();
    });
}

const addStudentBtn = document.getElementById("addStudentBtn");
if (addStudentBtn) addStudentBtn.addEventListener("click", addStudent);

const markAllPresentBtn = document.getElementById("markAllPresentBtn");
if (markAllPresentBtn) markAllPresentBtn.addEventListener("click", markAllPresent);

const markAllAbsentBtn = document.getElementById("markAllAbsentBtn");
if (markAllAbsentBtn) markAllAbsentBtn.addEventListener("click", markAllAbsent);

const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
if (saveAttendanceBtn) saveAttendanceBtn.addEventListener("click", () => {
    persistToLocal();
    autoSyncToCloud();
    alert("Attendance saved!");
});

const generateReportBtn = document.getElementById("generateReportBtn");
if (generateReportBtn) {
    generateReportBtn.addEventListener("click", () => {
        let name = document.getElementById("reportStudentSelect")?.value;
        if (name) generateReportCard(name);
    });
}

const exportCSVBtn = document.getElementById("exportCSVBtn");
if (exportCSVBtn) exportCSVBtn.addEventListener("click", exportAllCSV);

const downloadBackupBtn = document.getElementById("downloadBackupBtn");
if (downloadBackupBtn) downloadBackupBtn.addEventListener("click", downloadBackup);

const restoreBackupBtn = document.getElementById("restoreBackupBtn");
if (restoreBackupBtn) {
    restoreBackupBtn.addEventListener("click", () => {
        const restoreInput = document.getElementById("restoreFileInput");
        if (restoreInput) restoreInput.click();
    });
}

const restoreFileInput = document.getElementById("restoreFileInput");
if (restoreFileInput) {
    restoreFileInput.addEventListener("change", (e) => {
        if (e.target.files[0]) restoreBackup(e.target.files[0]);
        e.target.value = "";
    });
}

const resetTermBtn = document.getElementById("resetTermBtn");
if (resetTermBtn) resetTermBtn.addEventListener("click", resetCurrentTerm);

const resetAllBtn = document.getElementById("resetAllBtn");
if (resetAllBtn) resetAllBtn.addEventListener("click", resetAllData);

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
}

const configureCloudBtn = document.getElementById("configureCloudBtn");
if (configureCloudBtn) {
    configureCloudBtn.addEventListener("click", configureCloud);
}

const resetCloudBtn = document.getElementById("resetCloudBtn");
if (resetCloudBtn) {
    resetCloudBtn.addEventListener("click", resetToDefaultCloud);
}

const syncToCloudBtn = document.getElementById("syncToCloudBtn");
if (syncToCloudBtn) {
    syncToCloudBtn.addEventListener("click", manualCloudSync);
}

const loadFromCloudBtn = document.getElementById("loadFromCloudBtn");
if (loadFromCloudBtn) {
    loadFromCloudBtn.addEventListener("click", manualLoadFromCloud);
}

function initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    
    tabs.forEach(btn => {
        btn.addEventListener("click", function() {
            if (!isLoggedIn) return;
            const tabId = this.getAttribute("data-tab");
            
            tabs.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            
            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.remove("active");
            });
            
            const targetContent = document.getElementById(tabId + "Tab");
            if (targetContent) {
                targetContent.classList.add("active");
            }
            
            if (tabId === "analytics") updateAnalytics();
            if (tabId === "reports") updateReportStudentSelect();
            if (tabId === "attendance") renderAttendance();
        });
    });
}