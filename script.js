// ==================== SUPABASE CLOUD STORAGE CONFIGURATION ====================
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

// ==================== CLASSES & COMPONENTS ====================
const CLASSES = [
    { 
        id: "grade8A", display: "Grade Eight A", 
        components: ["Practical 1", "Exam", "Exercise Book", "Participation", "Assign 1", "Assign 2", "Practical 2"]
    },
    { 
        id: "grade8B", display: "Grade Eight B", 
        components: ["Practical 1", "Exam", "Exercise Book", "Participation", "Assign 1", "Assign 2", "Practical 2"]
    },
    { 
        id: "grade9A", display: "Grade Nine A", 
        components: ["Project 1", "Project", "Quiz", "Exercise Book", "Participation", "Practical 2"]
    },
    { 
        id: "grade9B", display: "Grade Nine B", 
        components: ["Project 1", "Project", "Quiz", "Exercise Book", "Participation", "Practice 2"]
    },
    { 
        id: "grade10A", display: "Grade Ten A", 
        components: ["Practical 1", "Project", "Quiz", "Exercise Book", "Participation", "Assignment", "Practical 2"]
    },
    { 
        id: "grade11A", display: "Grade Eleven A", 
        components: ["Practical 1", "Mid-Exam", "Assignment", "Exercise Book", "Participation", "Practical 2"]
    },
    { 
        id: "grade12A", display: "Grade Twelve A", 
        components: ["Practical 1", "Mid-Exam", "Exercise Book", "Assignment", "Practical 2"]
    }
];

// Component max values (input ranges)
const COMPONENT_MAX = {
    "Practical 1": 30,
    "Exam": 20,
    "Exercise Book": 5,
    "Participation": 5,
    "Assign 1": 5,
    "Assign 2": 5,
    "Practical 2": 40
};

const FINAL_EXAM_MAX = 30;

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

let currentAttendanceDate = new Date().toISOString().split('T')[0];

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getStatusFromTotal(finalTotal) {
    if (finalTotal >= 90) return { text: "🏆 Excellent", class: "status-excellent" };
    if (finalTotal >= 80) return { text: "✅ Very Good", class: "status-very-good" };
    if (finalTotal >= 70) return { text: "📘 Good", class: "status-good" };
    if (finalTotal >= 60) return { text: "📗 Satisfactory", class: "status-satisfactory" };
    if (finalTotal >= 50) return { text: "⚠️ Pass", class: "status-pass" };
    if (finalTotal >= 40) return { text: "📌 Below Average", class: "status-below" };
    return { text: "❌ Needs Improvement", class: "status-fail" };
}

// Calculate Practical 2 = Exam + Exercise Book + Participation + Assign 1 + Assign 2
function calculatePractical2(componentScores) {
    let examScore = parseFloat(componentScores["Exam"]) || 0;
    let exerciseBookScore = parseFloat(componentScores["Exercise Book"]) || 0;
    let participationScore = parseFloat(componentScores["Participation"]) || 0;
    let assign1Score = parseFloat(componentScores["Assign 1"]) || 0;
    let assign2Score = parseFloat(componentScores["Assign 2"]) || 0;
    
    let practical2 = examScore + exerciseBookScore + participationScore + assign1Score + assign2Score;
    return Math.min(COMPONENT_MAX["Practical 2"], Math.max(0, practical2));
}

// Compute final total: Practical 1 + Practical 2 + Final Exam (out of 100)
function computeFinalTotal(componentScores, finalExamScore) {
    let practical1 = parseFloat(componentScores["Practical 1"]) || 0;
    practical1 = Math.min(COMPONENT_MAX["Practical 1"], Math.max(0, practical1));
    
    let practical2 = calculatePractical2(componentScores);
    
    let finalExam = parseFloat(finalExamScore) || 0;
    finalExam = Math.min(FINAL_EXAM_MAX, Math.max(0, finalExam));
    
    let finalTotal = practical1 + practical2 + finalExam;
    return Math.min(100, Math.max(0, finalTotal));
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
        cls.components.forEach(comp => { componentScores[comp] = ""; });
        return { name, gender, componentScores, finalExamScore: "", finalTotal: 0 };
    });
    let attendance = {};
    schoolData[term][classId] = { students, attendance };
}

function initAllTerms() {
    ["term1", "term2", "term3"].forEach(t => {
        schoolData[t] = {};
        CLASSES.forEach(cls => initTermData(t, cls.id));
    });
    persistToLocal();
}

function migrateAttendance(term, classId) {
    let classData = schoolData[term][classId];
    if (!classData) return;
    let oldAtt = classData.attendance;
    if (oldAtt && !Array.isArray(oldAtt) && typeof oldAtt === 'object') {
        let isDateBased = Object.keys(oldAtt).some(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
        if (!isDateBased && Object.keys(oldAtt).length > 0) {
            let today = getTodayDate();
            classData.attendance = {};
            classData.attendance[today] = oldAtt;
            persistToLocal();
        }
    }
}

function ensureDataExists() {
    ["term1", "term2", "term3"].forEach(t => {
        if (!schoolData[t]) schoolData[t] = {};
        CLASSES.forEach(cls => {
            if (!schoolData[t][cls.id]) {
                initTermData(t, cls.id);
            } else {
                migrateAttendance(t, cls.id);
            }
        });
    });
}

// ==================== EXCEL UPLOAD - DISABLED ====================
function uploadExcel() {
    alert("Excel upload feature is currently disabled.\n\nPlease use the manual entry system.");
    return;
}

// ==================== SUPABASE FUNCTIONS ====================
async function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn("Supabase SDK not loaded");
        updateCloudStatusMessage("⚠️ Supabase SDK not loaded", "error");
        return false;
    }
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
            updateCloudStatusMessage("✅ Supabase connected!", "success");
            return true;
        }
        throw error;
    } catch (error) {
        console.error("Supabase connection error:", error);
        updateCloudStatusMessage("❌ Connection failed", "error");
        updateCloudUI(false);
        return false;
    }
}

function configureCloud() {
    const url = prompt("Enter Supabase Project URL:", SUPABASE_CONFIG.url);
    if (!url) return;
    const key = prompt("Enter Supabase Anon Key:", SUPABASE_CONFIG.anonKey);
    if (!key) return;
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.anonKey = key;
    localStorage.setItem("supabase_url", url);
    localStorage.setItem("supabase_anon_key", key);
    updateCloudStatusMessage("🔌 Testing connection...", "info");
    initSupabase().then(() => {
        alert(isCloudConnected ? "✅ Configured successfully!" : "❌ Connection failed.");
    });
}

function resetToDefaultCloud() {
    if (confirm("Reset cloud to default configuration?")) {
        localStorage.removeItem("supabase_url");
        localStorage.removeItem("supabase_anon_key");
        SUPABASE_CONFIG.url = DEFAULT_SUPABASE_URL;
        SUPABASE_CONFIG.anonKey = DEFAULT_SUPABASE_ANON_KEY;
        initSupabase();
        alert("Reset to default cloud.");
    }
}

async function autoSyncToCloud() {
    if (!isCloudConnected || !supabaseClient || !isLoggedIn) return false;
    showSyncIndicator(true);
    try {
        const syncData = { schoolData, currentTerm, currentClassId, teacher: currentUser, timestamp: new Date().toISOString(), version: "2.0" };
        const { error } = await supabaseClient.from(SUPABASE_CONFIG.table).upsert({ id: `teacher_${currentUser}`, data: syncData, updated_at: new Date().toISOString() });
        if (error) throw error;
        showSyncIndicator(false);
        return true;
    } catch (error) { console.error("Auto-sync error:", error); showSyncIndicator(false); return false; }
}

async function syncToSupabase() {
    if (!isCloudConnected || !supabaseClient) { await initSupabase(); if (!isCloudConnected) return false; }
    updateCloudStatusMessage("☁️ Syncing...", "info");
    try {
        ensureDataExists();
        const syncData = { schoolData, currentTerm, currentClassId, teacher: currentUser, timestamp: new Date().toISOString(), version: "2.0" };
        const { error } = await supabaseClient.from(SUPABASE_CONFIG.table).upsert({ id: `teacher_${currentUser}`, data: syncData, updated_at: new Date().toISOString() });
        if (error) throw error;
        updateCloudStatusMessage("✅ Synced!", "success");
        return true;
    } catch (error) { updateCloudStatusMessage("⚠️ Sync failed", "error"); return false; }
}

async function loadFromSupabase() {
    if (!isCloudConnected || !supabaseClient) return false;
    updateCloudStatusMessage("☁️ Loading...", "info");
    try {
        const { data, error } = await supabaseClient.from(SUPABASE_CONFIG.table).select('data').eq('id', `teacher_${currentUser}`).single();
        if (error) throw error;
        if (data && data.data && data.data.schoolData) {
            schoolData = data.data.schoolData;
            currentTerm = data.data.currentTerm || "term2";
            currentClassId = data.data.currentClassId || "grade8A";
            persistToLocal();
            updateCloudStatusMessage("✅ Loaded from cloud!", "success");
            return true;
        }
        return false;
    } catch (error) { updateCloudStatusMessage("📀 Using local", "info"); return false; }
}

function updateCloudUI(connected) {
    const cloudStatus = document.getElementById("cloudStatus");
    const cloudStorageStatus = document.getElementById("cloudStorageStatus");
    const cloudStatusMsg = document.getElementById("cloudStatusMsg");
    if (connected) {
        if (cloudStatus) { cloudStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Cloud: Connected'; cloudStatus.classList.add("connected"); }
        if (cloudStorageStatus) cloudStorageStatus.innerHTML = '✅ Connected - Auto-save active';
        if (cloudStatusMsg) cloudStatusMsg.innerHTML = "☁️ Supabase cloud connected • Auto-saves on every change";
    } else {
        if (cloudStatus) { cloudStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Cloud: Offline'; cloudStatus.classList.remove("connected"); }
        if (cloudStorageStatus) cloudStorageStatus.innerHTML = '⚠️ Connection issue';
        if (cloudStatusMsg) cloudStatusMsg.innerHTML = '⚠️ Cloud connection issue • Data saved locally';
    }
}

function updateCloudStatusMessage(message, type) {
    const cloudStatusMsg = document.getElementById("cloudStatusMsg");
    if (cloudStatusMsg) {
        cloudStatusMsg.innerHTML = message;
        if (type !== "error") setTimeout(() => {
            if (cloudStatusMsg && isCloudConnected) cloudStatusMsg.innerHTML = "☁️ Supabase cloud connected • Auto-saves on every change";
            else if (cloudStatusMsg && !isCloudConnected) cloudStatusMsg.innerHTML = '⚠️ Cloud connection issue • Data saved locally';
        }, 3000);
    }
}

function showSyncIndicator(syncing) {
    const indicator = document.getElementById("syncIndicator");
    if (!indicator) return;
    if (syncing) { indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...'; indicator.style.color = "#ff9800"; }
    else { indicator.innerHTML = '<i class="fas fa-check"></i> Synced'; indicator.style.color = "#4caf50"; setTimeout(() => { if (indicator) indicator.innerHTML = ""; }, 2000); }
}

async function manualCloudSync() { await syncToSupabase(); alert(isCloudConnected ? "✅ Synced!" : "❌ Sync failed."); }
async function manualLoadFromCloud() { const ok = await loadFromSupabase(); if (ok) { renderMarklist(); renderAttendance(); updateAnalytics(); updateReportStudentSelect(); alert("✅ Loaded from cloud!"); } else alert("❌ No cloud data."); }

// ==================== THEME ====================
function initTheme() { const saved = localStorage.getItem("tis_theme"); if (saved === "light") document.body.classList.add("light-mode"); else document.body.classList.remove("light-mode"); }
function toggleTheme() { document.body.classList.toggle("light-mode"); localStorage.setItem("tis_theme", document.body.classList.contains("light-mode") ? "light" : "dark"); }

// ==================== UI RENDER ====================
function renderMarklistHeader() {
    let cls = CLASSES.find(c => c.id === currentClassId);
    if (!cls) return;
    
    document.getElementById("gradeNameDisplay").innerHTML = cls.display;
    let weightsContainer = document.getElementById("weightsContainer");
    weightsContainer.innerHTML = "";
    
    cls.components.forEach(comp => {
        let span = document.createElement("span");
        span.className = "weight-badge";
        if (comp === "Practical 1") {
            span.innerHTML = `${comp} (30%)`;
            span.style.background = "#2196f3";
            span.style.color = "white";
        } else if (comp === "Practical 2") {
            span.innerHTML = `${comp} (40%) - Auto-calculated`;
            span.style.background = "#4caf50";
            span.style.color = "white";
        } else if (comp === "Exam") {
            span.innerHTML = `${comp} (20%)`;
        } else if (comp === "Exercise Book" || comp === "Participation" || comp === "Assign 1" || comp === "Assign 2") {
            span.innerHTML = `${comp} (5%)`;
        } else {
            span.innerHTML = `${comp}`;
        }
        weightsContainer.appendChild(span);
    });
    
    let examSpan = document.createElement("span");
    examSpan.className = "weight-badge";
    examSpan.style.background = "#ff9800";
    examSpan.style.color = "white";
    examSpan.innerHTML = `Final Exam (30%)`;
    weightsContainer.appendChild(examSpan);
    
    let totalSpan = document.createElement("span");
    totalSpan.className = "weight-badge";
    totalSpan.style.background = "#9c27b0";
    totalSpan.style.color = "white";
    totalSpan.innerHTML = `Final Total = Practical 1 + Practical 2 + Final Exam = 100%`;
    weightsContainer.appendChild(totalSpan);
    
    let thead = document.getElementById("marksTableHead");
    thead.innerHTML = "";
    let headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>#</th><th onclick="sortByColumn('name')">Student Name ⬍</th><th>Gender</th>`;
    cls.components.forEach(comp => { 
        if (comp === "Practical 2") {
            headerRow.innerHTML += `<th>${comp}<br><small>Auto (0-40)</small></th>`;
        } else if (comp === "Practical 1") {
            headerRow.innerHTML += `<th>${comp}<br><small>0-30</small></th>`;
        } else if (comp === "Exam") {
            headerRow.innerHTML += `<th>${comp}<br><small>0-20</small></th>`;
        } else if (comp === "Exercise Book" || comp === "Participation" || comp === "Assign 1" || comp === "Assign 2") {
            headerRow.innerHTML += `<th>${comp}<br><small>0-5</small></th>`;
        } else {
            headerRow.innerHTML += `<th>${comp}</th>`;
        }
    });
    headerRow.innerHTML += `<th>Final Exam<br><small>0-30</small></th><th onclick="sortByColumn('finalTotal')">Final Total<br><small>0-100</small> ⬍</th><th>Status</th>`;
    thead.appendChild(headerRow);
}

function sortByColumn(column) {
    if (currentSort.column === column) currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    else { currentSort.column = column; currentSort.direction = "asc"; }
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
    let sortedStudents = [...filteredStudents].sort((a,b) => {
        let valA = currentSort.column === "name" ? a.name : a.finalTotal;
        let valB = currentSort.column === "name" ? b.name : b.finalTotal;
        if (typeof valA === "string") return currentSort.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return currentSort.direction === "asc" ? valA - valB : valB - valA;
    });
    let tbody = document.getElementById("marksTbody");
    tbody.innerHTML = "";
    
    sortedStudents.forEach((student, idx) => {
        let row = tbody.insertRow();
        row.insertCell(0).innerHTML = idx+1;
        row.insertCell(1).innerHTML = student.name;
        row.insertCell(2).innerHTML = student.gender;
        
        cls.components.forEach(comp => {
            let cell = row.insertCell();
            
            if (comp === "Practical 2") {
                let displaySpan = document.createElement("span");
                let practical2Value = calculatePractical2(student.componentScores);
                displaySpan.innerHTML = practical2Value.toFixed(1);
                displaySpan.style.fontWeight = "bold";
                displaySpan.style.color = "#4caf50";
                displaySpan.style.background = "rgba(76, 175, 80, 0.1)";
                displaySpan.style.padding = "5px 10px";
                displaySpan.style.borderRadius = "20px";
                displaySpan.style.display = "inline-block";
                cell.appendChild(displaySpan);
            } else {
                let maxValue = COMPONENT_MAX[comp] || 100;
                let inp = document.createElement("input");
                inp.type = "number";
                inp.value = student.componentScores[comp] || "";
                inp.placeholder = maxValue.toString();
                inp.min = 0;
                inp.max = maxValue;
                inp.classList.add("score-input");
                inp.onchange = async (e) => {
                    let val = e.target.value === "" ? "" : Math.min(maxValue, Math.max(0, parseFloat(e.target.value)||0));
                    student.componentScores[comp] = val;
                    student.finalTotal = computeFinalTotal(student.componentScores, student.finalExamScore);
                    persistToLocal();
                    renderMarklist();
                    updateAnalytics();
                    await autoSyncToCloud();
                };
                cell.appendChild(inp);
            }
        });
        
        let examCell = row.insertCell();
        let examInput = document.createElement("input");
        examInput.type = "number";
        examInput.placeholder = FINAL_EXAM_MAX.toString();
        examInput.max = FINAL_EXAM_MAX;
        examInput.min = 0;
        examInput.classList.add("score-input");
        examInput.value = student.finalExamScore || "";
        examInput.onchange = async (e) => {
            let examVal = e.target.value === "" ? "" : Math.min(FINAL_EXAM_MAX, Math.max(0, parseFloat(e.target.value)||0));
            student.finalExamScore = examVal;
            student.finalTotal = computeFinalTotal(student.componentScores, student.finalExamScore);
            persistToLocal();
            renderMarklist();
            updateAnalytics();
            await autoSyncToCloud();
        };
        examCell.appendChild(examInput);
        
        let totalCell = row.insertCell();
        totalCell.innerHTML = student.finalTotal.toFixed(1);
        
        let status = getStatusFromTotal(student.finalTotal);
        let statusCell = row.insertCell();
        statusCell.innerHTML = status.text;
        statusCell.className = status.class;
    });
}

// ==================== ATTENDANCE FUNCTIONS ====================
function renderAttendance() {
    if (!isLoggedIn) return;
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    
    if (!data.attendance) {
        data.attendance = {};
    }
    
    if (!data.attendance[currentAttendanceDate]) {
        data.attendance[currentAttendanceDate] = {};
        data.students.forEach(s => {
            data.attendance[currentAttendanceDate][s.name] = { 
                status: "absent", 
                lastUpdated: new Date().toISOString() 
            };
        });
        persistToLocal();
    }
    
    let dayAtt = data.attendance[currentAttendanceDate];
    let tbody = document.getElementById("attendanceTbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    let filtered = data.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    filtered.forEach((s, idx) => {
        let att = dayAtt[s.name] || { status: "absent", lastUpdated: new Date().toISOString() };
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
            data.attendance[currentAttendanceDate][s.name] = { 
                status: newStatus, 
                lastUpdated: new Date().toISOString() 
            };
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
    
    let dayAtt = data.attendance ? data.attendance[currentAttendanceDate] : {};
    let total = data.students ? data.students.length : 0;
    let present = 0;
    
    if (dayAtt) {
        present = Object.values(dayAtt).filter(a => a && a.status === "present").length;
    }
    
    let percentage = total ? ((present / total) * 100).toFixed(1) : 0;
    
    const totalStudentsEl = document.getElementById("totalStudents");
    const presentCountEl = document.getElementById("presentCount");
    const absentCountEl = document.getElementById("absentCount");
    const attendancePercentageEl = document.getElementById("attendancePercentage");
    
    if (totalStudentsEl) totalStudentsEl.innerText = total;
    if (presentCountEl) presentCountEl.innerText = present;
    if (absentCountEl) absentCountEl.innerText = total - present;
    if (attendancePercentageEl) attendancePercentageEl.innerText = percentage;
}

function markAllPresent() {
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    if (!data.attendance[currentAttendanceDate]) data.attendance[currentAttendanceDate] = {};
    data.students.forEach(s => {
        data.attendance[currentAttendanceDate][s.name] = { status: "present", lastUpdated: new Date().toISOString() };
    });
    persistToLocal();
    renderAttendance();
    updateAnalytics();
    autoSyncToCloud();
    alert(`All marked PRESENT for ${currentAttendanceDate}`);
}

function markAllAbsent() {
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    if (!data.attendance[currentAttendanceDate]) data.attendance[currentAttendanceDate] = {};
    data.students.forEach(s => {
        data.attendance[currentAttendanceDate][s.name] = { status: "absent", lastUpdated: new Date().toISOString() };
    });
    persistToLocal();
    renderAttendance();
    updateAnalytics();
    autoSyncToCloud();
    alert(`All marked ABSENT for ${currentAttendanceDate}`);
}

// ==================== ANALYTICS ====================
function updateAnalytics() {
    if (!isLoggedIn) return;
    let data = schoolData[currentTerm][currentClassId];
    if (!data) return;
    
    let totals = data.students.map(s => s.finalTotal).filter(v => !isNaN(v) && v > 0);
    let avg = totals.length ? (totals.reduce((a,b)=>a+b,0)/totals.length).toFixed(1) : 0;
    let sorted = [...totals].sort((a,b)=>a-b);
    let median = sorted.length ? sorted[Math.floor(sorted.length/2)].toFixed(1) : 0;
    let highest = totals.length ? Math.max(...totals).toFixed(1) : 0;
    let lowest = totals.length ? Math.min(...totals).toFixed(1) : 0;
    let passCount = totals.filter(s=>s>=60).length;
    let passRate = totals.length ? ((passCount/totals.length)*100).toFixed(1) : 0;
    let excellentCount = totals.filter(s=>s>=80).length;
    let presentCount = data.attendance && data.attendance[currentAttendanceDate] ? Object.values(data.attendance[currentAttendanceDate]).filter(a=>a.status==="present").length : 0;
    let attendanceRate = data.students.length ? ((presentCount/data.students.length)*100).toFixed(1) : 0;
    let distribution = `${totals.filter(s=>s>=80).length} A, ${totals.filter(s=>s>=60&&s<80).length} B, ${totals.filter(s=>s>=50&&s<60).length} C, ${totals.filter(s=>s<50).length} D`;
    
    document.getElementById("avgScore").innerHTML = avg;
    document.getElementById("medianScore").innerHTML = median;
    document.getElementById("highestScore").innerHTML = highest;
    document.getElementById("lowestScore").innerHTML = lowest;
    document.getElementById("passRate").innerHTML = passRate+"%";
    document.getElementById("excellentCount").innerHTML = excellentCount;
    document.getElementById("attendanceRate").innerHTML = attendanceRate+"%";
    document.getElementById("gradeDistribution").innerHTML = distribution;
}

// ==================== OTHER FUNCTIONS ====================
function addStudent() {
    let name = prompt("Enter student name:"); if(!name) return;
    let gender = prompt("Gender (M/F):","M");
    let data = schoolData[currentTerm][currentClassId];
    let cls = CLASSES.find(c=>c.id===currentClassId);
    let componentScores = {};
    cls.components.forEach(c => componentScores[c] = "");
    data.students.push({name,gender,componentScores,finalExamScore:"",finalTotal:0});
    data.attendance[currentAttendanceDate] = data.attendance[currentAttendanceDate] || {};
    data.attendance[currentAttendanceDate][name] = { status: "absent", lastUpdated: new Date().toISOString() };
    persistToLocal(); renderMarklist(); renderAttendance(); updateAnalytics(); updateAttendanceStats(); autoSyncToCloud();
}

function generateReportCard(studentName) {
    let modal = document.getElementById("reportModal");
    let content = document.getElementById("reportContent");
    let termsHtml = "";
    for (let term of ["term1","term2","term3"]) {
        let termName = term==="term1"?"First Term":term==="term2"?"Second Term":"Third Term";
        let data = schoolData[term][currentClassId];
        let student = data?.students.find(s=>s.name===studentName);
        if(student){
            let status = getStatusFromTotal(student.finalTotal);
            termsHtml += `<tr>
                <td>${termName}</td>
                <td>${student.finalTotal.toFixed(1)} / 100</td>
                <td>${student.finalExamScore || "--"} / ${FINAL_EXAM_MAX}</td>
                <td class="${status.class}">${status.text}</td>
            </tr>`;
        }
    }
    content.innerHTML = `<div class="report-card-print"><div class="header"><h2>TIS LabMaster</h2><h3>Student Report Card</h3><p>${studentName}</p><p>${new Date().toLocaleString()}</p></div><table border="1"><thead><tr style="background:#667eea;color:white"><th>Term</th><th>Final Total</th><th>Final Exam</th><th>Status</th></tr></thead><tbody>${termsHtml}</tbody></table><button class="print-btn" onclick="window.print()">🖨️ Print</button><button class="close-modal" onclick="document.getElementById('reportModal').style.display='none'">Close</button></div>`;
    modal.style.display = "flex";
}

function exportAllCSV() {
    let rows = [["Term","Class","Student Name","Gender","Practical 1","Exam","Exercise Book","Participation","Assign 1","Assign 2","Practical 2","Final Exam","Final Total","Status"]];
    for (let term of ["term1","term2","term3"]) {
        for (let cls of CLASSES) {
            let data = schoolData[term][cls.id];
            if (data && data.students) {
                data.students.forEach(s => {
                    let practical2Value = calculatePractical2(s.componentScores);
                    let status = getStatusFromTotal(s.finalTotal);
                    rows.push([
                        term, cls.display, s.name, s.gender,
                        s.componentScores["Practical 1"] || "",
                        s.componentScores["Exam"] || "",
                        s.componentScores["Exercise Book"] || "",
                        s.componentScores["Participation"] || "",
                        s.componentScores["Assign 1"] || "",
                        s.componentScores["Assign 2"] || "",
                        practical2Value.toFixed(1),
                        s.finalExamScore || "",
                        s.finalTotal.toFixed(1),
                        status.text
                    ]);
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
    const backup = { schoolData, timestamp: new Date().toISOString(), version: "2.0", teacher: currentUser };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tis_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Backup downloaded!");
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
            } else alert("Invalid backup file");
        } catch (err) { alert("Error reading backup file"); }
    };
    reader.readAsText(file);
}

function resetCurrentTerm() {
    if (confirm("Reset current term?")) {
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
    if (confirm("RESET ALL DATA?") && prompt("Type 'CONFIRM'") === "CONFIRM") {
        initAllTerms();
        renderMarklist();
        renderAttendance();
        updateAnalytics();
        autoSyncToCloud();
        alert("All data reset.");
    }
}

function addStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `.status-excellent{color:#4caf50;font-weight:bold}.status-very-good{color:#8bc34a;font-weight:bold}.status-good{color:#2196f3;font-weight:bold}.status-satisfactory{color:#00bcd4;font-weight:bold}.status-pass{color:#ff9800;font-weight:bold}.status-below{color:#ff5722;font-weight:bold}.status-fail{color:#f44336;font-weight:bold}`;
    document.head.appendChild(style);
}

function resetGrade8AToDefault() {
    const defaultGrade8A = [
        "Amen Addisu", "Arsemawit Mhireteab", "Arsonia Tadesse", "Aymen Abdulaziz",
        "Biruk Abiy", "Bisrat Aydefer", "Christian Yohannes", "Diamond G|Egziahber",
        "Eldaah Zacharias", "Eldana Tewodros", "Eman Yusuf", "Emanda Girma",
        "Eyobed Wossen", "Eyosias Yirga", "Inam Miraj", "Makbel Tekle",
        "Maraki Anteneh", "Marken Mesay", "Mathias Yohannes", "Nahom Abiy",
        "Naomi Tekle", "Naomi Daniel", "Noah Mohammed", "Nobel Addisalem",
        "Rajan Dirriba", "Rani Mayur", "Rediet Getu", "Reyan Abduljelil",
        "Soliyana Alemayehu", "Tsinat Abiy", "Yafet Alexander", "Yohannes Tefera"
    ];
    
    if (!confirm(`⚠️ This will reset Grade 8A in ALL terms to default ${defaultGrade8A.length} students.\n\nClick OK to continue.`)) return;
    
    const terms = ["term1", "term2", "term3"];
    for (let term of terms) {
        if (schoolData[term] && schoolData[term].grade8A) {
            const currentStudents = schoolData[term].grade8A.students;
            const originalStudents = currentStudents.filter(s => defaultGrade8A.includes(s.name));
            schoolData[term].grade8A.students = originalStudents;
            
            const attendance = schoolData[term].grade8A.attendance;
            for (let date in attendance) {
                const newDayAtt = {};
                defaultGrade8A.forEach(name => {
                    if (attendance[date] && attendance[date][name]) {
                        newDayAtt[name] = attendance[date][name];
                    } else {
                        newDayAtt[name] = { status: "absent", lastUpdated: new Date().toISOString() };
                    }
                });
                attendance[date] = newDayAtt;
            }
        }
    }
    
    persistToLocal();
    if (currentClassId === "grade8A") {
        renderMarklist();
        renderAttendance();
        updateAnalytics();
        updateReportStudentSelect();
    }
    autoSyncToCloud();
    alert(`✅ Grade 8A reset complete! Now has ${defaultGrade8A.length} students in all terms.`);
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
    const el = document.getElementById("liveDateTime");
    if (el) el.innerHTML = `<i class="far fa-calendar-alt"></i> ${new Date().toLocaleString()}`;
}

function updateOnline() {
    const badge = document.getElementById("onlineBadge");
    if (badge) badge.innerHTML = navigator.onLine ? '<i class="fas fa-wifi"></i> Online' : '<i class="fas fa-plug"></i> Offline';
}

let autoSyncInterval = null;
function startAutoCloudSync() {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => {
        if (isLoggedIn && isCloudConnected && navigator.onLine) autoSyncToCloud();
    }, 3 * 60 * 1000);
}

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
        document.getElementById("loginPanel").style.display = "none";
        const mainApp = document.getElementById("mainApp");
        mainApp.style.display = "block";
        mainApp.classList.add("visible");
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
        document.getElementById("loginError").innerHTML = "";
        addStatusStyles();
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
        document.getElementById("loginError").innerHTML = "Invalid credentials! Try again!";
    }
}

function handleLogout() {
    isLoggedIn = false;
    currentUser = null;
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    document.getElementById("mainApp").style.display = "none";
    document.getElementById("loginPanel").style.display = "flex";
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginError").innerHTML = "";
}

function initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(btn => {
        btn.addEventListener("click", function() {
            if (!isLoggedIn) return;
            const tabId = this.getAttribute("data-tab");
            tabs.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
            const target = document.getElementById(tabId + "Tab");
            if (target) target.classList.add("active");
            if (tabId === "analytics") updateAnalytics();
            if (tabId === "reports") updateReportStudentSelect();
            if (tabId === "attendance") renderAttendance();
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("mainApp").style.display = "none";
    document.getElementById("loginPanel").style.display = "flex";
    initTheme();
    initTabs();
    console.log("TIS LabMaster Ready - Day-by-day attendance enabled");
});

// Event Listeners
document.getElementById("doLoginBtn")?.addEventListener("click", handleLogin);
document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
document.getElementById("loginPassword")?.addEventListener("keypress", e => { if(e.key==="Enter") handleLogin(); });
document.getElementById("loginUsername")?.addEventListener("keypress", e => { if(e.key==="Enter") handleLogin(); });
document.getElementById("termSelector")?.addEventListener("change", e => { currentTerm = e.target.value; renderMarklist(); renderAttendance(); updateAnalytics(); updateReportStudentSelect(); });
document.getElementById("searchInput")?.addEventListener("input", e => { searchTerm = e.target.value; renderMarklist(); renderAttendance(); });
document.getElementById("refreshMarksBtn")?.addEventListener("click", () => { renderMarklist(); updateAnalytics(); });
document.getElementById("addStudentBtn")?.addEventListener("click", addStudent);
document.getElementById("markAllPresentBtn")?.addEventListener("click", markAllPresent);
document.getElementById("markAllAbsentBtn")?.addEventListener("click", markAllAbsent);
document.getElementById("saveAttendanceBtn")?.addEventListener("click", () => { persistToLocal(); autoSyncToCloud(); alert("Attendance saved!"); });
document.getElementById("generateReportBtn")?.addEventListener("click", () => { let name = document.getElementById("reportStudentSelect")?.value; if(name) generateReportCard(name); });
document.getElementById("exportCSVBtn")?.addEventListener("click", exportAllCSV);
document.getElementById("downloadBackupBtn")?.addEventListener("click", downloadBackup);
document.getElementById("restoreBackupBtn")?.addEventListener("click", () => document.getElementById("restoreFileInput").click());
document.getElementById("restoreFileInput")?.addEventListener("change", e => { if(e.target.files[0]) restoreBackup(e.target.files[0]); e.target.value=""; });
document.getElementById("resetTermBtn")?.addEventListener("click", resetCurrentTerm);
document.getElementById("resetAllBtn")?.addEventListener("click", resetAllData);
document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
document.getElementById("configureCloudBtn")?.addEventListener("click", configureCloud);
document.getElementById("resetCloudBtn")?.addEventListener("click", resetToDefaultCloud);
document.getElementById("syncToCloudBtn")?.addEventListener("click", manualCloudSync);
document.getElementById("loadFromCloudBtn")?.addEventListener("click", manualLoadFromCloud);
document.getElementById("uploadExcelBtn")?.addEventListener("click", uploadExcel);
document.getElementById("resetGrade8ABtn")?.addEventListener("click", resetGrade8AToDefault);

// Attendance date picker events
const attendanceDateInput = document.getElementById("attendanceDate");
const loadAttendanceDateBtn = document.getElementById("loadAttendanceDateBtn");
if (attendanceDateInput && loadAttendanceDateBtn) {
    attendanceDateInput.value = getTodayDate();
    currentAttendanceDate = getTodayDate();
    loadAttendanceDateBtn.addEventListener("click", () => {
        currentAttendanceDate = attendanceDateInput.value;
        renderAttendance();
        updateAnalytics();
    });
    attendanceDateInput.addEventListener("change", () => {
        currentAttendanceDate = attendanceDateInput.value;
        renderAttendance();
        updateAnalytics();
    });
}