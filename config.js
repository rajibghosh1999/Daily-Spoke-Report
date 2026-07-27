/*
===========================================
 Telemedicine Spoke Performance Dashboard
 Government of West Bengal
 North 24 Parganas
===========================================
*/

const CONFIG = {
    // 1. AAM SKs Master GSHEET Apps Script Exec URL
    API_URL: "https://script.google.com/macros/s/AKfycbyYJ88WTK1IoS3w2MU1S96AnipUPmlem926W07VNqYUdWRoTG64KM_zoo3Ark2PgFkk/exec",

    // 2. AAM PHC Master GSHEET Apps Script Exec URL (Updated)
    PHC_API_URL: "https://script.google.com/macros/s/AKfycbynHAn3cWpWvSHPbRW-8uxem4f6etJv_F0cwtgNl_dZs7LPQqHnget1Cwu-TT2pNTcF1w/exec",

    // Metadata
    GOVERNMENT: "Government of West Bengal",
    DEPARTMENT: "Health & Family Welfare Department",
    DISTRICT: "North 24 Parganas",
    REPORT_TITLE: "Telemedicine Performance Report of North 24 Parganas",
    FILE_NAME: "Telemedicine_Performance_Report",

    // Performance Table Row Color Thresholds
    ROW_COLOR: {
        LOW: "#f8d7da",    // 0-4 Consultations (Light Red)
        MEDIUM: "#ffe8cc", // 5-9 Consultations (Light Orange)
        HIGH: "#d4edda"    // 10+ Consultations (Light Green)
    }
};