VulnEye – Client-Side Script Security Inspector

VulnEye is a browser extension that scans webpages for common client-side security vulnerabilities and provides detailed, actionable reports. It is designed for developers, testers, and security professionals to quickly assess and improve the security posture of web applications.

Features

JavaScript Library Vulnerability Detection
Scans for known vulnerable versions of JavaScript libraries using jsrepository.json.

XSS Detection
Identifies inline event handlers, javascript: URIs, inline scripts, style-based JavaScript injections, and unsafe iframe srcdoc usage based on OWASP XSS prevention guidelines.

HTTP Security Header Analysis
Checks for missing or misconfigured headers such as HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and X-XSS-Protection.

CSRF Token Checks
Detects missing CSRF tokens in forms, cookies, and meta tags.

CSP Detection
Checks for the presence of Content Security Policy via meta tags or response headers.

Tracker Identification
Detects known tracking scripts and resources and suggests privacy-friendly alternatives.

Exportable Reports
Generates PDF scan reports styled for readability, with categorized vulnerabilities, severity ratings, and suggested fixes.

Scan History & Sharing
Stores scan results locally, allows quick sharing of summarized reports.

How It Works

Manual or Auto Scanning – Trigger scans manually or enable real-time scanning via the popup menu.

In-Page Content Scripts – The extension injects scanners for each category (JS libraries, XSS, headers, CSRF, CSP, trackers).

Data Processing – Results are aggregated, categorized, and displayed in the popup UI.

Reporting – Generate and export detailed HTML/PDF reports using the built-in reportBuilder.js.

Installation

Clone or download this repository.

Open your browser’s extensions page (chrome://extensions/ for Chrome).

Enable Developer Mode.

Click Load unpacked and select the project folder.

Usage

Click the extension icon to open the popup.

Use SCAN LATEST LINK for a manual scan.

Enable Auto Scan in the dropdown menu for real-time scanning.

View detailed vulnerability breakdowns or export the results to PDF.

Manage settings, whitelist URLs, and view scan history via the settings menu.

Tech Stack

JavaScript (Vanilla JS, Chrome Extension APIs)

HTML/CSS (Custom popup and modal styling)

Data Sources: JSON vulnerability definitions for libraries, headers, CSRF, XSS, and trackers.

Disclaimer

VulnEye is intended for educational and testing purposes only. Do not use it to scan websites without permission. The authors are not responsible for misuse.
