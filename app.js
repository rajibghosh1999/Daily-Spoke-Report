
/*

===========================================

 Telemedicine Multi-Report Dashboard Logic

 North 24 Parganas

===========================================

*/



// Global Application State Object

const state = {

    sskMasterData: [],

    phcMasterData: [],

    processedSSKData: [],

    processedPHCData: [],

    filteredSSKData: [],

    summary: { totalSpokes: 0, performed: 0, nonPerformed: 0, consultation: 0, performancePct: 0 },

    blockSummary: {},

    selectedReportDate: new Date() // Dynamic Date State

};



document.addEventListener('DOMContentLoaded', () => {

    initDashboard();

});



async function initDashboard() {

    setupDatePicker(); // Calendar Setup & Initializing Default Date

    setupEventListeners();

    await fetchAllMasterData();

}



/**

 * Calendar Picker Setup & Dynamic Listener Logic

 */

function setupDatePicker() {

    const dateInput = document.getElementById('customDatePicker');

    const today = new Date();



    // Default Current Date Formatting (YYYY-MM-DD for <input type="date">)

    const yyyy = today.getFullYear();

    const mm = String(today.getMonth() + 1).padStart(2, '0');

    const dd = String(today.getDate()).padStart(2, '0');

    const todayISO = `${yyyy}-${mm}-${dd}`;



    if (dateInput) {

        dateInput.value = todayISO;



        // Listener for Date Selection Changes

        dateInput.addEventListener('change', (e) => {

            const selectedVal = e.target.value;

            if (selectedVal) {

                // Prevent Timezone Offset Shift by Parsing Day, Month, Year

                const [year, month, day] = selectedVal.split('-').map(Number);

                state.selectedReportDate = new Date(year, month - 1, day);

                updateReportDateUI();

            }

        });

    }



    // Initialize initial Date UI Display

    updateReportDateUI();

}



/**

 * Dynamic Updates for Report Date Headers across all sections

 */

function updateReportDateUI() {

    const targetDate = state.selectedReportDate || new Date();

   

    // Date Format (e.g., 25 Jul 2026)

    const formattedDate = targetDate.toLocaleDateString('en-IN', {

        day: '2-digit',

        month: 'short',

        year: 'numeric'

    });



    // হেডার এবং অন্যান্য সেকশনের আইডিগুলো আপডেট করা হচ্ছে

    const reportDateHeader = document.getElementById('reportDateHeader');

    const reportDatePickerLabel = document.getElementById('reportDate'); // কন্ট্রোল প্যানেলের ডেট ডিসপ্লে

    const top10DateElem = document.getElementById('top10ReportDate');

    const phcDateElem = document.getElementById('phcReportDate');



    if (reportDateHeader) reportDateHeader.textContent = formattedDate;

    if (reportDatePickerLabel) reportDatePickerLabel.textContent = formattedDate;

    if (top10DateElem) top10DateElem.textContent = formattedDate;

    if (phcDateElem) phcDateElem.textContent = formattedDate;

}



/**

 * File Name Date Generator (Reflects Currently Selected Date)

 * Output Format: 25_Jul_2026

 */

function getFilenameDate() {

    const targetDate = state.selectedReportDate || new Date();

    return targetDate.toLocaleDateString('en-IN', {

        day: '2-digit',

        month: 'short',

        year: 'numeric'

    }).replace(/ /g, '_');

}



/**

 * Fetch Master Data for SSK and PHC separately

 */

async function fetchAllMasterData() {

    showLoading(true);

    const sskUrl = CONFIG.API_URL;

    const phcUrl = CONFIG.PHC_API_URL || CONFIG.API_URL;



    try {

        const [sskRes, phcRes] = await Promise.all([

            fetch(sskUrl, { method: 'GET', redirect: 'follow' }),

            fetch(phcUrl, { method: 'GET', redirect: 'follow' })

        ]);



        if (sskRes.ok) {

            const data = await sskRes.json();

            state.sskMasterData = parseSSKMasterArray(data);

        }



        if (phcRes.ok) {

            const data = await phcRes.json();

            state.phcMasterData = parsePHCMasterArray(data);

        }



    } catch (error) {

        console.error('Master Data Fetch Failed:', error);

        alert('Master Data লোড করতে সমস্যা হয়েছে। Google Apps Script URLs চেক করুন।');

    } finally {

        showLoading(false);

    }

}



/**

 * Parse AAM SKs Master Data

 */

function parseSSKMasterArray(rawList) {

    if (!Array.isArray(rawList)) return [];

    return rawList.map(item => {

        const keys = Object.keys(item);

        const spokeKey = keys.find(k => /aam|spoke|ssk|facility/i.test(k)) || keys[0];

        const blockKey = keys.find(k => /block/i.test(k)) || keys[1];

        const choKey   = keys.find(k => /cho|officer|provider/i.test(k)) || keys[2];



        const rawSpoke = String(item[spokeKey] || '').trim();

        const rawBlock = String(item[blockKey] || '').trim();

        const rawCho   = String(item[choKey] || '').trim();



        return {

            spokeName: normalizeName(rawSpoke),

            originalSpokeName: rawSpoke,

            blockName: rawBlock || 'Unassigned',

            choName: rawCho || 'N/A'

        };

    }).filter(item => item.originalSpokeName !== '');

}



/**

 * Parse AAM PHC Master Data

 */

function parsePHCMasterArray(rawList) {

    if (!Array.isArray(rawList)) return [];

    return rawList.map(item => {

        const keys = Object.keys(item);

        const blockKey    = keys.find(k => /^block$/i.test(k.trim())) || keys.find(k => /block/i.test(k)) || keys[0];

        const facilityKey = keys.find(k => /health facility|facility|phc|name/i.test(k)) || keys[1];



        const rawBlock    = String(item[blockKey] || '').trim();

        const rawFacility = String(item[facilityKey] || '').trim();



        return {

            facilityName: normalizeName(rawFacility),

            originalFacilityName: rawFacility,

            blockName: rawBlock || 'Unassigned'

        };

    }).filter(item => item.originalFacilityName !== '');

}



/**

 * Advanced Name Normalization Logic

 */

function normalizeName(str) {

    if (!str) return '';

    return str.toString()

        .toUpperCase()

        .replace(/\bAAM\b/g, '')

        .replace(/\bSC\b/g, '')

        .replace(/SUBCENTER|SUB-CENTER/g, '')

        .replace(/[^A-Z0-9]/g, '')

        .trim();

}



function setupEventListeners() {

    document.getElementById('generateReport')?.addEventListener('click', handleFileUpload);

    document.getElementById('searchBox')?.addEventListener('input', applyFilters);

    document.getElementById('blockFilter')?.addEventListener('change', applyFilters);

    document.getElementById('consultationFilter')?.addEventListener('change', applyFilters);

   

    // AAM SKs Actions

    document.getElementById('btnExportExcel')?.addEventListener('click', exportSSKExcel);

    document.getElementById('btnExportPDF')?.addEventListener('click', () => downloadSpecificCardAsPDF('sskSection'));

    document.getElementById('btnPrint')?.addEventListener('click', () => window.print());

    document.getElementById('btnShareWhatsApp')?.addEventListener('click', shareSSKViaWhatsApp);



    // Top 10 Actions

    document.getElementById('btnDownloadTop10JPG')?.addEventListener('click', downloadTop10JPG);



    // PHC Actions

    document.getElementById('btnDownloadPhcPDF')?.addEventListener('click', () => downloadSpecificCardAsPDF('phcSection'));

    document.getElementById('btnDownloadPhcJPG')?.addEventListener('click', downloadPhcJPG);

    document.getElementById('btnSharePhcWhatsApp')?.addEventListener('click', sharePhcViaWhatsApp);

}



function handleFileUpload() {

    const fileInput = document.getElementById('excelFile');

    const file = fileInput?.files[0];



    if (!file) {

        alert('অনুগ্রহ করে ফাইলটি নির্বাচন করুন।');

        return;

    }



    showLoading(true);



    const reader = new FileReader();

    reader.onload = function (e) {

        try {

            const data = new Uint8Array(e.target.result);

            const workbook = XLSX.read(data, { type: 'array' });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const uploadedRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });



            processAllReportsData(uploadedRows);

        } catch (err) {

            console.error(err);

            alert('Excel ফাইল প্রসেস করতে সমস্যা হয়েছে।');

        } finally {

            showLoading(false);

        }

    };



    reader.readAsArrayBuffer(file);

}



function processAllReportsData(uploadedRows) {

    const consultationMap = new Map();



    uploadedRows.forEach(row => {

        const keys = Object.keys(row);

        const spokeCol = keys.find(k => /aam|spoke|ssk|phc|facility|health/i.test(k));

        const countCol = keys.find(k => /completed|consultation|count|total/i.test(k));



        if (spokeCol) {

            const cleanKey = normalizeName(row[spokeCol]);

            let count = countCol ? (parseInt(row[countCol], 10) || 0) : 1;

            if (cleanKey) {

                consultationMap.set(cleanKey, (consultationMap.get(cleanKey) || 0) + count);

            }

        }

    });



    processSSKReports(consultationMap);

    processPHCReports(consultationMap);

}



function processSSKReports(consultationMap) {

    let totalSpokes = 0, performed = 0, nonPerformed = 0, totalConsultation = 0;

    const blockMap = {};



    let mergedList = state.sskMasterData.map(master => {

        const completedCount = consultationMap.get(master.spokeName) || 0;



        totalSpokes++;

        if (completedCount > 0) performed++;

        else nonPerformed++;

        totalConsultation += completedCount;



        const blk = master.blockName;

        if (!blockMap[blk]) blockMap[blk] = { totalSpokes: 0, performed: 0, consultation: 0 };

        blockMap[blk].totalSpokes += 1;

        if (completedCount > 0) blockMap[blk].performed += 1;

        blockMap[blk].consultation += completedCount;



        return {

            spokeName: master.originalSpokeName,

            blockName: master.blockName,

            choName: master.choName,

            completedConsultation: completedCount

        };

    });



    mergedList.sort((a, b) => {

        if (a.blockName.localeCompare(b.blockName) !== 0) {

            return a.blockName.localeCompare(b.blockName);

        }

        return a.completedConsultation - b.completedConsultation;

    });



    state.processedSSKData = mergedList.map((item, index) => ({ ...item, slNo: index + 1 }));



    state.summary = {

        totalSpokes,

        performed,

        nonPerformed,

        consultation: totalConsultation,

        performancePct: totalSpokes > 0 ? ((performed / totalSpokes) * 100).toFixed(2) : 0

    };



    state.blockSummary = blockMap;

    state.filteredSSKData = [...state.processedSSKData];



    populateBlockFilterOptions(Object.keys(blockMap));

    renderDashboardSummary();

    renderBlockSummary();

    renderSSKPerformanceTable();

    renderTop10Report();

}



function processPHCReports(consultationMap) {

    let phcList = state.phcMasterData.map(master => {

        const completedCount = consultationMap.get(master.facilityName) || 0;

        return {

            facilityName: master.originalFacilityName,

            blockName: master.blockName,

            completedConsultation: completedCount

        };

    });



    phcList.sort((a, b) => a.blockName.localeCompare(b.blockName));

    state.processedPHCData = phcList.map((item, index) => ({ ...item, slNo: index + 1 }));

    renderPHCTable();

}



function renderDashboardSummary() {

    document.getElementById('totalSpokes').textContent = state.summary.totalSpokes.toLocaleString();

    document.getElementById('performed').textContent = state.summary.performed.toLocaleString();

    document.getElementById('nonPerformed').textContent = state.summary.nonPerformed.toLocaleString();

    document.getElementById('consultation').textContent = state.summary.consultation.toLocaleString();

    document.getElementById('performance').textContent = `${state.summary.performancePct}%`;

}



function renderBlockSummary() {

    const tbody = document.getElementById('blockSummaryBody');

    if (!tbody) return;

    tbody.innerHTML = '';



    const blocks = Object.keys(state.blockSummary).sort();

    blocks.forEach((block, index) => {

        const info = state.blockSummary[block];

        const activePct = info.totalSpokes > 0 ? ((info.performed / info.totalSpokes) * 100) : 0;



        let rowColor = "";

        if (activePct >= 80) rowColor = "#d4edda";

        else if (activePct >= 60) rowColor = "#ffe8cc";

        else if (activePct >= 40) rowColor = "#f8d7da";

        else rowColor = "#dc3545";



        const tr = document.createElement('tr');

        // প্রতিটি সেলে সরাসরি স্টাইল প্রয়োগ করা সবচাইতে কার্যকর পদ্ধতি

        tr.innerHTML = `

            <td class="text-center border-dark" style="background-color: ${rowColor} !important;">${index + 1}</td>

            <td class="text-center border-dark" style="background-color: ${rowColor} !important;"><strong>${block}</strong></td>

            <td class="text-center border-dark" style="background-color: ${rowColor} !important;">${info.totalSpokes}</td>

            <td class="text-center border-dark" style="background-color: ${rowColor} !important;">${info.performed}</td>

            <td class="text-center fw-bold border-dark" style="background-color: ${rowColor} !important;">${info.consultation.toLocaleString()}</td>

            <td class="text-center fw-bold border-dark text-dark" style="background-color: ${rowColor} !important;">${activePct.toFixed(2)}%</td>

        `;

        tbody.appendChild(tr);

    });

}



function renderSSKPerformanceTable() {

    const tbody = document.getElementById('reportBody');

    if (!tbody) return;

    tbody.innerHTML = '';



    state.filteredSSKData.forEach((row, index) => {

        const tr = document.createElement('tr');

        const rowColor = getRowColorByPerformance(row.completedConsultation);



        tr.style.backgroundColor = rowColor;

        tr.innerHTML = `

            <td class="text-center border-dark" style="background-color: ${rowColor} !important;">${index + 1}</td>

            <td class="border-dark" style="background-color: ${rowColor} !important;">${row.spokeName}</td>

            <td class="border-dark" style="background-color: ${rowColor} !important;">${row.blockName}</td>

            <td class="border-dark" style="background-color: ${rowColor} !important;">${row.choName}</td>

            <td class="text-center fw-bold border-dark" style="background-color: ${rowColor} !important;">${row.completedConsultation}</td>

        `;

        tbody.appendChild(tr);

    });

}



function renderTop10Report() {

    const tbody = document.getElementById('top10ReportBody');

    if (!tbody) return;

    tbody.innerHTML = '';



    const sortedTop10 = [...state.processedSSKData]

        .sort((a, b) => b.completedConsultation - a.completedConsultation)

        .slice(0, 10);



    sortedTop10.forEach((item, index) => {

        const tr = document.createElement('tr');

        let badge = "";

        let rankClass = "";



        if (index === 0) { badge = "🥇 <b>Rank 1</b>"; rankClass = "rank-1"; }

        else if (index === 1) { badge = "🥈 <b>Rank 2</b>"; rankClass = "rank-2"; }

        else if (index === 2) { badge = "🥉 <b>Rank 3</b>"; rankClass = "rank-3"; }

        else { badge = `<b>Rank ${index + 1}</b>`; }



        if (rankClass) tr.className = rankClass;



        tr.innerHTML = `

            <td class="text-center border-dark fw-bold">${badge}</td>

            <td class="border-dark fw-bold text-dark">${item.spokeName}</td>

            <td class="border-dark fw-bold text-dark">${item.blockName}</td>

            <td class="border-dark fw-bold text-dark">${item.choName}</td>

            <td class="text-center fw-bold text-success border-dark h5 mb-0">${item.completedConsultation}</td>

        `;

        tbody.appendChild(tr);

    });

}



function renderPHCTable() {

    const tbody = document.getElementById('phcReportBody');

    if (!tbody) return;

    tbody.innerHTML = '';



    let totalPhcConsultation = 0;



    state.processedPHCData.forEach((row, index) => {

        totalPhcConsultation += row.completedConsultation;



        const tr = document.createElement('tr');

        const rowColor = getRowColorByPerformance(row.completedConsultation);



        tr.style.backgroundColor = rowColor;

        tr.innerHTML = `

            <td class="text-center border-dark" style="background-color: ${rowColor} !important;">${index + 1}</td>

            <td class="border-dark" style="background-color: ${rowColor} !important;"><strong>${row.blockName}</strong></td>

            <td class="border-dark" style="background-color: ${rowColor} !important;">${row.facilityName}</td>

            <td class="text-center fw-bold border-dark" style="background-color: ${rowColor} !important;">${row.completedConsultation}</td>

        `;

        tbody.appendChild(tr);

    });



    if (state.processedPHCData.length > 0) {

        const totalTr = document.createElement('tr');

        totalTr.style.backgroundColor = "#e2e8f0";

        totalTr.innerHTML = `

            <td colspan="3" class="text-center border-dark fw-bold h5 mb-0 py-2" style="background-color: #e2e8f0 !important; color: #000000 !important;">

                TOTAL CONSULTATION

            </td>

            <td class="text-center border-dark fw-bold h4 mb-0 py-2 text-primary" style="background-color: #e2e8f0 !important;">

                ${totalPhcConsultation.toLocaleString()}

            </td>

        `;

        tbody.appendChild(totalTr);

    }

}



function getRowColorByPerformance(count) {

    if (count <= 5) return "#f8d7da";

    else if (count <= 9) return "#ffe8cc";

    else return "#d4edda";

}



function populateBlockFilterOptions(blocks) {

    const select = document.getElementById('blockFilter');

    if (!select) return;

    select.innerHTML = '<option value="">All Blocks</option>';

    blocks.sort().forEach(block => {

        const opt = document.createElement('option');

        opt.value = block;

        opt.textContent = block;

        select.appendChild(opt);

    });

}



function applyFilters() {

    const searchVal = (document.getElementById('searchBox')?.value || '').toLowerCase().trim();

    const selectedBlock = document.getElementById('blockFilter')?.value || '';

    const selectedRange = document.getElementById('consultationFilter')?.value || '';



    state.filteredSSKData = state.processedSSKData.filter(item => {

        const matchesSearch = item.spokeName.toLowerCase().includes(searchVal) ||

                              item.choName.toLowerCase().includes(searchVal) ||

                              item.blockName.toLowerCase().includes(searchVal);

        const matchesBlock = selectedBlock === '' || item.blockName === selectedBlock;

       

        // কনসালটেশন রেঞ্জ লজিক

        let matchesRange = true;

        const count = item.completedConsultation;

        if (selectedRange === '0') matchesRange = (count === 0);

        else if (selectedRange === '1-5') matchesRange = (count >= 1 && count <= 5);

        else if (selectedRange === '6-9') matchesRange = (count >= 6 && count <= 9);

        else if (selectedRange === '10+') matchesRange = (count >= 10);

       

        return matchesSearch && matchesBlock && matchesRange;

    });



    renderSSKPerformanceTable();

}



/**

 * Top 10 JPG Download

 * Output Filename: <Date>_N24PGS_Top 10_AAM SKs.jpg

 */

function downloadTop10JPG() {

    const card = document.getElementById("top10Card");

    const filename = `${getFilenameDate()}_N24PGS_Top 10_AAM SKs.jpg`;

    downloadElementAsJPG(card, filename);

}



/**

 * PHC JPG Download

 * Output Filename: <Date>_N24PGS_Telemedicine_PHC_Performance.jpg

 */

function downloadPhcJPG() {

    const card = document.getElementById("phcCard");

    const filename = `${getFilenameDate()}_N24PGS_Telemedicine_PHC_Performance.jpg`;

    downloadElementAsJPG(card, filename);

}



/**

 * Generic JPG Download Function

 */

function downloadElementAsJPG(element, filename) {

    if (!element) return;

    showLoading(true);



    const footers = element.querySelectorAll('.card-footer, .no-print, button');

    footers.forEach(el => {

        el.dataset.origDisplay = el.style.display;

        el.style.setProperty('display', 'none', 'important');

    });



    html2canvas(element, {

        scale: 2,

        useCORS: true,

        logging: false

    }).then(canvas => {

        const link = document.createElement('a');

        link.download = filename;

        link.href = canvas.toDataURL('image/jpeg', 0.9);

        link.click();

    }).catch(err => {

        console.error("JPG Download Error:", err);

    }).finally(() => {

        footers.forEach(el => {

            el.style.display = el.dataset.origDisplay || '';

        });

        showLoading(false);

    });

}



/**

 * Ensures complete section PDF printing with Dynamic Title as PDF Filename

 */

function printSpecificCard(targetSection) {

    const sskCards = document.querySelectorAll('#sskSummaryCard, #sskBlockSummaryCard, #mainSskCard, #governmentHeader');

    const phcCard = document.getElementById('phcCard');

    const top10Card = document.getElementById('top10Card');



    const originalTitle = document.title;

    const dateStr = getFilenameDate();



    if (targetSection === 'sskSection') {

        if (phcCard) phcCard.classList.add('no-print-temp');

        if (top10Card) top10Card.classList.add('no-print-temp');

        sskCards.forEach(c => c?.classList.remove('no-print-temp'));

       

        document.title = `${dateStr}_N24PGS_Telemedicine_Spoke_Performance`;



    } else if (targetSection === 'phcSection') {

        sskCards.forEach(c => c?.classList.add('no-print-temp'));

        if (top10Card) top10Card.classList.add('no-print-temp');

        if (phcCard) phcCard.classList.remove('no-print-temp');

       

        document.title = `${dateStr}_N24PGS_Telemedicine_PHC_Performance`;

    }



    window.print();



    setTimeout(() => {

        document.querySelectorAll('.no-print-temp').forEach(el => el.classList.remove('no-print-temp'));

        document.title = originalTitle;

    }, 1000);

}



function shareSSKViaWhatsApp() {

    const reportDate = document.getElementById('reportDate')?.textContent || '';

    const message = `*AAM SKs Telemedicine Performance Report*%0A` +

                    `*District:* North 24 Parganas%0A` +

                    `*Date:* ${reportDate}%0A%0A` +

                    `• Total TM Enabled AAM SKs: ${state.summary.totalSpokes}%0A` +

                    `• Performed: ${state.summary.performed}%0A` +

                    `• Non Performed: ${state.summary.nonPerformed}%0A` +

                    `• Total Consultation: ${state.summary.consultation.toLocaleString()}%0A` +

                    `• Active Rate: ${state.summary.performancePct}%25`;

                   

    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');

}



function sharePhcViaWhatsApp() {

    const reportDate = document.getElementById('phcReportDate')?.textContent || '';

    const message = `*Telemedicine PHC Performance Report*%0A` +

                    `*District:* North 24 Parganas%0A` +

                    `*Date:* ${reportDate}%0A%0A` +

                    `_Generated from North 24 Parganas Dashboard._`;

    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');

}



function showLoading(isLoading) {

    const loadingElem = document.getElementById('loading');

    if (loadingElem) {

        if (isLoading) loadingElem.classList.remove('d-none');

        else loadingElem.classList.add('d-none');

    }

}



/**

 * Excel Download

 */

function exportSSKExcel() {

    if (!state.filteredSSKData || state.filteredSSKData.length === 0) return;

   

    const exportData = state.filteredSSKData.map((row, idx) => ({

        "Sl No": idx + 1,

        "AAM SKs Name": row.spokeName,

        "Block Name": row.blockName,

        "CHO Name": row.choName,

        "Completed Consultation": row.completedConsultation

    }));



    const fileName = `${getFilenameDate()}_N24PGS_Telemedicine_Spoke_Performance.xlsx`;



    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Spoke Performance");

    XLSX.writeFile(workbook, fileName);

}

// Report View Switcher Logic

document.getElementById('reportViewSwitcher')?.addEventListener('change', function() {

    const val = this.value;

    const filterSection = document.getElementById('filterSection');

   

    // ফিল্টার সেকশন শুধুমাত্র 'ssk' বা 'all' এ দেখাবে

    filterSection.style.display = (val === 'ssk' || val === 'all') ? 'block' : 'none';

   

    const allIds = ['sskSummaryCard', 'sskBlockSummaryCard', 'mainSskCard', 'top10Card', 'phcCard'];

   

    // প্রথমে সব হাইড করা

    allIds.forEach(id => {

        const element = document.getElementById(id);

        if (element) element.style.display = 'none';

    });



    // সিলেকশন অনুযায়ী দেখানো

    if (val === 'all') {

        allIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });

    } else if (val === 'ssk') {

        ['sskSummaryCard', 'sskBlockSummaryCard', 'mainSskCard'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });

    } else if (val === 'top10') {

        document.getElementById('top10Card').style.display = 'block';

    } else if (val === 'phc') {

        document.getElementById('phcCard').style.display = 'block';

    }

});





// Direct PDF Download Logic

function downloadSpecificCardAsPDF(targetSection) {

    if (typeof html2pdf === 'undefined') return;

    showLoading(true);



    const isSSK = (targetSection === 'sskSection');

    const fileName = isSSK ? `${getFilenameDate()}_N24PGS_Spoke_Perf.pdf` : `${getFilenameDate()}_N24PGS_PHC_Perf.pdf`;

    const idsToPrint = isSSK ? ['governmentHeader', 'sskSummaryCard', 'sskBlockSummaryCard', 'mainSskCard'] : ['governmentHeader', 'phcCard'];



    const printContainer = document.createElement('div');

    printContainer.style.width = "100%";

   

    idsToPrint.forEach((id) => {

        const el = document.getElementById(id);

        if (el) {

            const clone = el.cloneNode(true);

            clone.style.display = 'block';

           

            // টেবিল কলাম উইডথ ঠিক রাখা

            const table = clone.querySelector('table');

            if (table) {

                const headers = table.querySelectorAll('th');

                const classMap = ['col-sn', 'col-name', 'col-block', 'col-cho', 'col-val'];

                headers.forEach((th, index) => {

                    if (classMap[index]) th.classList.add(classMap[index]);

                });

            }

            printContainer.appendChild(clone);

        }

    });



    const opt = {

        margin: [5, 5, 5, 5],

        filename: fileName,

        image: { type: 'jpeg', quality: 1 }, // Quality 1 মানে সর্বোচ্চ পরিষ্কার

        html2canvas: {

            scale: 2,

            useCORS: true,

            logging: false,

            // এই লাইনটিই ম্যাজিকের মতো কাজ করবে: আপনার স্ক্রিনের উইডথ হুবহু কপি করবে

            windowWidth: document.documentElement.offsetWidth

        },

        pagebreak: { mode: ['css', 'legacy'] },

        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }

    };



    html2pdf().set(opt).from(printContainer).save()

    .then(() => showLoading(false))

    .catch((err) => {

        console.error("PDF Error:", err);

        showLoading(false);

    });

}