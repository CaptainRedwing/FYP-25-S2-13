let lastScanResult = null;

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("menuButton");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const setting = document.getElementById("setting");
  const dropdownMenu2 = document.getElementById("dropdownMenu2");
  const dropdownMenu3 = document.getElementById("dropdownMenu3");
  const appSetting = document.getElementById("appSetting");
  const onoffBtn = document.getElementById("onoff");
  const onoffBtn2 = document.getElementById("onoff2");
  const offExtension = document.getElementById("offExtension");
  const scanBtn = document.getElementById("scan-now");
  const switchToggle = document.querySelector(".switch-toggle");
  const switchToggle2 = document.querySelector(".switch-toggle2");
  const scanHistoryButton = document.getElementById("scanHistoryButton");
  const shareButton = document.getElementById("share-button");
  const shareModal = document.getElementById("shareModal");
  const shareTextEl = document.getElementById("shareText");
  const copyShareBtn = document.getElementById("copyShareBtn");
  const openLinkBtn = document.getElementById("openLinkBtn");
  const closeShareBtn = document.getElementById("closeShareBtn");

  // Menu toggle
  menuButton?.addEventListener("click", () => {
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  // Settings toggle
  setting?.addEventListener("click", () => {
    dropdownMenu2.style.display = dropdownMenu2.style.display === "block" ? "none" : "block";
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", (event) => {
    if (!menuButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.style.display = "none";
    }
    if (!setting.contains(event.target) && !dropdownMenu2.contains(event.target)) {
      dropdownMenu2.style.display = "none";
    }
    if (!onoffBtn.contains(event.target) && !dropdownMenu3.contains(event.target)) {
      dropdownMenu3.style.display = "none";
    }
  });

  // Load Main Settings page
  appSetting?.addEventListener("click", () => {
    dropdownMenu2.style.display = "none";

    fetch(chrome.runtime.getURL("setting/mainSetting.html"))
      .then(res => res.text())
      .then(html => {
        const body1 = document.querySelector(".body1");
        const container = document.querySelector(".body-container");

        if (body1) body1.style.display = "none";
        document.getElementById("settingsWrapper")?.remove();

        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "settingsWrapper";
        container.appendChild(settingsWrapper);
        settingsWrapper.innerHTML = html;

        setTimeout(() => {
          backButton();
          setting_1();
          whitelist_1();
        }, 0);
      });
  });

  // Switch toggles
  switchToggle?.addEventListener("click", () => {
    switchToggle.classList.toggle("off");
  });
  switchToggle2?.addEventListener("click", () => {
    switchToggle2.classList.toggle("off");
  });

  // Current Date and URL
  const currentDate = document.getElementById("current-date");
  const today = new Date();
  currentDate.innerText = dateFormat(today);

  const urlEl = document.getElementById("current-url");
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    urlEl.innerText = tabs[0]?.url || "Unknown URL";
  });

  // SHARE button
  shareButton?.addEventListener("click", () => {
    if (!lastScanResult) {
      alert("No scan data available.");
      return;
    }

    const url = document.getElementById("current-url")?.innerText || "Unknown URL";
    const score = calculateScore(lastScanResult);
    const [critical, high, medium, low] = getSeverityCounts(lastScanResult);
    const totalIssues = critical + high + medium + low;

    let severity = "Safe";
    if (critical > 0) severity = "Critical";
    else if (high > 0) severity = "High";
    else if (medium > 0) severity = "Moderate";
    else if (low > 0) severity = "Low";

    const previewText =
    `🔐 Scan Summary
    🌐 URL: ${url}
    🪲 Issues: ${totalIssues}
    📊 Score: ${score}/100
    ⚠️ Severity: ${severity}`;

    shareTextEl.innerHTML = previewText.replace(/\n/g, "<br>");
    openLinkBtn.setAttribute("data-url", url);
    shareModal.classList.remove("hidden");
  });

  copyShareBtn?.addEventListener("click", () => {
    const text = shareTextEl.textContent;
    navigator.clipboard.writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch(err => alert("Failed to copy."));
  });

  openLinkBtn?.addEventListener("click", () => {
    const url = openLinkBtn.getAttribute("data-url");
    if (url && url.startsWith("http")) {
      chrome.tabs.create({ url });
    }
  });

  closeShareBtn?.addEventListener("click", () => {
    shareModal.classList.add("hidden");
  });

  // On/Off toggle
  onoffBtn?.addEventListener("click", () => {
    chrome.storage.local.get("realtimeEnabled", ({ realtimeEnabled }) => {
      if (realtimeEnabled) {
        dropdownMenu3.style.display = dropdownMenu3.style.display === "block" ? "none" : "block";
      } else {
        chrome.storage.local.set({ realtimeEnabled: true }, () => {
          setOnOffUI(true);
          showLoadingAndScan(done => setTimeout(done, 0));
        });
      }
    });
  });
  onoffBtn2?.addEventListener("click", () => {
    chrome.storage.local.set({ realtimeEnabled: true }, () => {
      setOnOffUI(true);
      showLoadingAndScan(done => setTimeout(done, 0));
    });
  });
  offExtension?.addEventListener("click", () => {
    chrome.storage.local.set({ realtimeEnabled: false }, () => {
      setOnOffUI(false);
      dropdownMenu3.style.display = "none";
    });
  });

  // Scan button
  scanBtn?.addEventListener("click", () => {
    showLoadingAndScan(done => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "runScan" }, (response) => {
          const vuList = document.getElementById("vulnerability-items");
          if (!response) {
            vuList.innerText = "No response from content script.";
            done();
            return;
          }
          if (response.error) {
            const li = document.createElement("li");
            li.textContent = `Scan error: ${response.error}`;
            vuList.appendChild(li);
            done();
            return;
          }

          lastScanResult = response;
          chrome.storage.local.set({ lastScanResult: response }, () => {
            chrome.storage.local.get({ scanHistory: [] }, ({ scanHistory }) => {
              const score = calculateScore(response);
              const issues = Object.values(response)
                .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
              const url = document.getElementById("current-url").innerText;
              const date = new Date().toISOString();

              scanHistory.push({ date, url, score, issues, mode: "manual" });
              chrome.storage.local.set({ scanHistory });
            });
          });
          done();
        });
      });
    });
  });

  // Initialize toggle states
  chrome.storage.local.get({ realtimeEnabled: true }, ({ realtimeEnabled }) => {
    setOnOffUI(realtimeEnabled);

    const bodyContainer = document.querySelector(".body-container");
    const body2 = document.querySelector(".body2");
    const loadingScreen = document.getElementById("loading-screen");

    if (realtimeEnabled) {
      showLoadingAndScan(done => setTimeout(done, 0));
    } else {
      loadingScreen.style.display = "none";
      bodyContainer.classList.remove("visible");
      body2.style.display = "block";
    }
  });

  chrome.storage.local.get("lastScanResult", ({ lastScanResult: stored }) => {
    if (stored) lastScanResult = stored;
  });

  initConfigurationToggles();

  // Open Scan History page
  scanHistoryButton?.addEventListener("click", () => {
    fetch(chrome.runtime.getURL("setting/scanHistory/scanHistory.html"))
      .then(res => res.text())
      .then(html => {
        const body1 = document.querySelector(".body1");
        const container = document.querySelector(".body-container");

        if (body1) body1.style.display = "none";
        document.getElementById("settingsWrapper")?.remove();

        const wrapper = document.createElement("div");
        wrapper.id = "settingsWrapper";
        wrapper.innerHTML = html;
        container.appendChild(wrapper);

        setTimeout(() => {
          backButton();
          initScanHistoryUI();
        }, 0);
      });
  });
});

document.addEventListener("click", (event) => {
  const setting3 = document.getElementById("setting3");
  const dropdownMenuScan = document.getElementById("dropdownMenuScan");

  if (!setting3 || !dropdownMenuScan) return;

  if (setting3.contains(event.target)) {
    dropdownMenuScan.classList.toggle("hidden");
  } else if (!dropdownMenuScan.contains(event.target)) {
    dropdownMenuScan.classList.add("hidden");
  }
});

function backButton() {
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", () => {
      const wrapper = document.getElementById("settingsWrapper");
      if (wrapper) wrapper.remove();

      const body1 = document.querySelector(".body1");
      if (body1) body1.style.display = "block";

	  document.getElementById("add-whitelist").classList.remove("active");
	  document.getElementById("scan-now").classList.add("active");
    });
  }
}

function setting_1() {
	const extensionConfiguration = document.getElementById("extensionConfiguration");
	extensionConfiguration?.addEventListener("click", () => {
		fetch(chrome.runtime.getURL("setting/extensionConfiguration/configuration.html"))
			.then(res => res.text())
			.then(html => {
				const body1 = document.querySelector(".body1");
				const container = document.querySelector(".body-container");

				if (body1) body1.style.display = "none";
				document.getElementById("settingsWrapper")?.remove();

				const settingsWrapper = document.createElement("div");
				settingsWrapper.id = "settingsWrapper";
				container.appendChild(settingsWrapper);
				settingsWrapper.innerHTML = html;

				setTimeout(() => {
					backButton();
					initConfigurationToggles();
				}, 0);
			})
			.catch(err => {
				console.error("Failed to load configuration.html", err);
			});
	});
}

function whitelist_1() {
  const whitelistButton = document.getElementById("whitelistButton");
  whitelistButton?.addEventListener("click", () => {
    fetch(chrome.runtime.getURL("setting/whitelist/whitelist.html"))
      .then(res => res.text())
      .then(html => {
        const body1 = document.querySelector(".body1");
        const container = document.querySelector(".body-container");

        if (body1) body1.style.display = "none";
        document.getElementById("settingsWrapper")?.remove();

        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "settingsWrapper";
        container.appendChild(settingsWrapper);
        settingsWrapper.innerHTML = html;

        setTimeout(() => {
          backButton();
          initWhitelistUI();

          // Switch footer button
          document.getElementById("scan-now").classList.remove("active");
          document.getElementById("add-whitelist").classList.add("active");
        }, 0);
      })
      .catch(err => {
        console.error("Failed to load whitelist.html", err);
      });
  });
}

function switchToggle2() {
	const toggles = document.querySelectorAll(".switch-toggle2");
	toggles.forEach(toggle => {
		toggle.addEventListener("click", () => {
			toggle.classList.toggle("off");
		});
	});
}

function dateFormat(date) {
	const day = date.getDate();
	const month = date.toLocaleString('default', { month: 'long' });
	const year = date.getFullYear();
	const rules = new Intl.PluralRules("en", { type: "ordinal" });
	const suffixes = { one: "st", two: "nd", few: "rd", other: "th" };
	const suffix = suffixes[rules.select(day)];
	return `${day}${suffix} ${month} ${year}`;
}

function setOnOffUI(enabled) {
	const onoffBtn = document.getElementById("onoff");
	if (onoffBtn) {
		onoffBtn.classList.toggle("off", !enabled);
		onoffBtn.title = `Real-time scanning: ${enabled ? "ON" : "OFF"}`;
	}
	document.body.classList.toggle("mode-on", enabled);
	document.body.classList.toggle("mode-off", !enabled);
}

function showLoadingAndScan(scanFunction) {
	const loadingScreen = document.getElementById("loading-screen");
	const loadingBar = document.getElementById("loading-bar");
	const loadingText = document.getElementById("loading-text");
	const bodyContainer = document.querySelector(".body-container");

	loadingBar.style.width = "0%";
	bodyContainer.classList.remove("visible");
	loadingScreen.style.display = "flex";
	loadingText.textContent = "Starting...";

	let stages = [0, 25, 50, 75, 99];
	let index = 0;
	let loadingDone = false;
	let scanningDone = false;

	function nextStage() {
		if (index < stages.length) {
			loadingBar.style.width = stages[index] + "%";
			index++;
			setTimeout(nextStage, 500);
		} else {
			loadingDone = true;
			checkBothDone();
		}
	}

	scanFunction(() => {
		scanningDone = true;
		checkBothDone();
	});

	function checkBothDone() {
		if (loadingDone && scanningDone) {
			setTimeout(() => {
				loadingBar.style.width = "100%";
				setTimeout(() => {
					loadingScreen.style.display = "none";
					loadingBar.style.width = "0%";
					bodyContainer.classList.add("visible");

					Promise.all([
						loadScoreHtml(),
						loadSummaryReportHtml(),
						loadPassedCheckHtml(),
						loadVulnerabilitiesDetectedHtml(),
						loadSuggestionFixesHtml()
					]).then(() => {
						if (lastScanResult) {
              renderResults(lastScanResult);

              // Calculate Scores
              const score = calculateScore(lastScanResult);
              const el = document.querySelector("#score-value");

              
		  	  if (window.Odometer && el) {
				el.innerHTML = score;

				let scoreColor = "#689D76";
				if (score < 11) scoreColor = "#611C19";
				else if (score < 50) scoreColor = "#962E2A";
				else if (score < 90) scoreColor = "#e3867d";
				else if (score < 100) scoreColor = "#a1d6e2";

				el.style.color = scoreColor;

				// Grade text logic
				const gradeEl = document.querySelector(".grade");
				let gradeText = "";

				if (score >= 80) gradeText = "Excellent";
				else if (score >= 60) gradeText = "Good";
				else if (score >= 40) gradeText = "Moderate";
				else if (score >= 20) gradeText = "Weak";
				else gradeText = "Critical";

				if (gradeEl) {
					gradeEl.textContent = gradeText;
				}
				} else {
				console.error("Odometer or score element missing");
			  }
            }
          });
        }, 500);
      }, 500);
    }
  }

  nextStage();
}

function loadScoreHtml() {
  return fetch("maincontent/score.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("scoreFile").innerHTML = html;

      return new Promise(resolve => {
        const script = document.createElement("script");
        script.src = "odometer/odometer.js";
        script.onload = () => {
          const el = document.querySelector("#score-value");
          if (el) {
            new Odometer({ el });
          }
          resolve(); 
        };
        document.body.appendChild(script);
      });
    });
}

function loadSummaryReportHtml() {
	return fetch("maincontent/summaryreport.html")
		.then(res => res.text())
		.then(html => {
			document.getElementById("summaryReportFile").innerHTML = html;

			// Wait for the DOM to render injected HTML
			requestAnimationFrame(() => {
				// Extra check for Chart.js availability and canvas existence
				if (typeof window.renderVulnChart === "function") {
					window.renderVulnChart();
				} else {
					console.error("renderVulnChart is not defined or not loaded yet");
				}
			});
		});
}

function loadPassedCheckHtml() {
	return fetch("maincontent/passedcheck.html")
		.then(res => res.text())
		.then(html => {
			document.getElementById("passedChecks").innerHTML = html;
		});
}

function loadVulnerabilitiesDetectedHtml() {
	return fetch("maincontent/vulnerabilitiesdetected.html")
		.then(res => res.text())
		.then(html => {
			document.getElementById("vulnerability-list").innerHTML = html;
		});
}

function loadSuggestionFixesHtml() {
	return fetch("maincontent/suggestedfixes.html")
		.then(res => res.text())
		.then(html => {
			document.getElementById("suggestedFixes").innerHTML = html;
		});
}

function renderResults(response) {

	const passedList = document.querySelector('.passedList');
	if (passedList && response.csp?.length) {
		// remove old CSP entry
		const old = passedList.querySelector('.csp-item');
		if (old) old.remove();

		const { exists, method } = response.csp[0];
		const li = document.createElement('li');
		li.className = 'csp-item';

		if (exists) {
			li.innerHTML = `✓ CSP enforced via <strong>${method}</strong>`;
		} else {
			li.innerHTML = `✖ No CSP policy found`;
		}

		passedList.appendChild(li);
	}


	const vuList = document.getElementById("vulnerability-items");
	if (!vuList) {
		console.error("vulnerability-items not found");
		return;
	}

	vuList.innerHTML = "";
	let foundAny = false;

	if (response.libraries?.length) {
		const li = document.createElement("li");
		li.textContent = "JS Vulnerability detected ";
		const btn = document.createElement("button");
		btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
		btn.className = "detail-btn";
		btn.addEventListener("click", () => showDetails("libraries"));
		li.appendChild(btn);
		vuList.appendChild(li);
		foundAny = true;
	}

	if (response.xss?.length) {
		const li = document.createElement("li");
		li.textContent = "XSS patterns detected ";
		const btn = document.createElement("button");
		btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
		btn.className = "detail-btn";
		btn.addEventListener("click", () => showDetails("xss"));
		li.appendChild(btn);
		vuList.appendChild(li);
		foundAny = true;
	}

	if (response.header?.length) {
		const li = document.createElement("li");
		li.textContent = "HTTP Header issues detected ";
		const btn = document.createElement("button");
		btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
		btn.className = "detail-btn";
		btn.addEventListener("click", () => showDetails("header"));
		li.appendChild(btn);
		vuList.appendChild(li);
		foundAny = true;
	}

	if (response.csrf?.length) {
		const li = document.createElement("li");
		li.textContent = "CSRF token issues detected ";
		const btn = document.createElement("button");
		btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
		btn.className = "detail-btn";
		btn.addEventListener("click", () => showDetails("csrf"));
		li.appendChild(btn);
		vuList.appendChild(li);
		foundAny = true;
	}

	if (response.trackers?.length) {
		const li = document.createElement("li");
		li.textContent = "Trackers detected ";
		const btn = document.createElement("button");
		btn.innerHTML = `<span class="detail-text">Details</span> <img src="icons/chevron.png" class="arrow9-icon" alt=">" />`;
		btn.className = "detail-btn";
		btn.addEventListener("click", () => showDetails("trackers"));
		li.appendChild(btn);
		vuList.appendChild(li);
		foundAny = true;
	}

	if (!foundAny) {
		const li = document.createElement("li");
		li.textContent = "No issues detected.";
		vuList.appendChild(li);
	}
}

function showDetails(type) {
	if (!lastScanResult) return;
	const items = lastScanResult[type] || [];

	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, {
			action: "showDetails",
			dataType: type,
			data: items
		});
	});
}

function calculateScore(results) {
	let score = 100;
	const severityPoints = { critical: 25, high: 10, medium: 5, low: 3 };
	const typeWeights = { xss: 1.0, libraries: 1.0, header: 1.0, csrf: 1.2, csp: 1.0, trackers: 1.0 };

	console.log("===== Vulnerability Score Breakdown =====");

	for (const type in results) {
		const issues = results[type];
		if (!Array.isArray(issues)) continue;

		issues.forEach(issue => {
			let severity = (issue.severity || 'low').toLowerCase();

			// Special handling as severity isn't directly included for CSP
			if (!issue.severity && type === 'csp' && issue.exists === false) severity = 'low';

			const points = severityPoints[severity] || 0;
			const weight = typeWeights[type] || 1.0;
			const deduction = points * weight;
			score -= deduction;

			console.log(`[${type.toUpperCase()}] ${severity.toUpperCase()} → -${deduction} points`);
		});
	}

	const finalScore = Math.max(0, Math.round(score));
	console.log(`Final Security Score: ${finalScore}`);
	console.log("=========================================");

	return finalScore;
}

function initConfigurationToggles() {

	console.log("[Config] initConfigurationToggles() called");

	const defaultSettings = {
		js: true,
		xss: true,
		header: true,
		csrf: true,
		csp: true,
		trackers: true
	};

	const toggleIds = {
		js: "toggle-js",
		xss: "toggle-xss",
		header: "toggle-header",
		csrf: "toggle-csrf",
		csp: "toggle-csp",
		trackers: "toggle-trackers"
	};

	chrome.storage.local.get({ scannersEnabled: defaultSettings }, ({ scannersEnabled }) => {
		for (const [key, id] of Object.entries(toggleIds)) {
			const el = document.getElementById(id);
			if (!el) continue;

			if (scannersEnabled[key]) {
				el.classList.remove("off");
			} else {
				el.classList.add("off");
			}

			// Toggle on click
			el.onclick = () => el.classList.toggle("off");
		}
	});

	const saveBtn = document.getElementById("save-btn");
	if (saveBtn) {
		saveBtn.onclick = () => {
			const newSettings = {};
			for (const [key, id] of Object.entries(toggleIds)) {
				const el = document.getElementById(id);
				newSettings[key] = !el?.classList.contains("off");
			}

			chrome.storage.local.set({ scannersEnabled: newSettings }, () => {
				alert("Settings saved!");
			});
		};
	}
}

function getSeverityCounts(results) {
	const counts = { critical: 0, high: 0, medium: 0, low: 0 };

	for (const type in results) {
		const issues = results[type];
		if (!Array.isArray(issues)) continue;

		issues.forEach(issue => {
			let severity = (issue.severity || 'low').toLowerCase();
			// Special handling for CSP
			if (!issue.severity && type === 'csp' && issue.exists === false) severity = 'low';
			if (counts.hasOwnProperty(severity)) {
				counts[severity]++;
			}
		});
	}

	return [counts.critical, counts.high, counts.medium, counts.low];
}

function initWhitelistUI() {
  document.getElementById("scan-now").classList.remove("active");
  document.getElementById("add-whitelist").classList.add("active");
  const listEl = document.getElementById("whitelist-urls");
  const addBtn = document.getElementById("add-whitelist");

  chrome.storage.local.get({ whitelist: [] }, ({ whitelist }) => {
    listEl.innerHTML = ""; // Clear previous entries

    whitelist.forEach(host => {
      const row = document.createElement("div");
      row.className = "whitelist-row";

      row.innerHTML = `
        <div class="domain-wrapper">
          <img src="${chrome.runtime.getURL('icons/scanhistory.png')}" class="domain-icon" alt="domain icon" />
          <span class="domain-text">${host}</span>
        </div>
        <button class="delete-btn">
          <img src="${chrome.runtime.getURL('icons/delete.png')}" class="delete-icon" alt="delete icon" />
          Delete
        </button>
      `;

	  row.querySelector(".delete-btn").addEventListener("click", () => {
	    const modal2 = document.getElementById("confirmModal2");
	    const yesBtn2 = document.getElementById("confirmYes2");
	    const noBtn2 = document.getElementById("confirmNo2");

	    if (!modal2) {
		  console.error("Confirm modal not found");
		  return;
	    }

	    modal2.classList.remove("hidden");

		yesBtn2.onclick = null;
		noBtn2.onclick = null;

		yesBtn2.onclick = () => {
		const updated = whitelist.filter(h => h !== host);

		// Hide modal first to prevent stuck state
		modal2.classList.add("hidden");

		chrome.storage.local.set({ whitelist: updated }, () => {
			initWhitelistUI();
		});
		};

		noBtn2.onclick = () => {
		modal2.classList.add("hidden");
		};


	    noBtn2.onclick = () => {
		  modal2.classList.add("hidden");
	    };
	  });


      listEl.appendChild(row);
    });
  });

  // Add current URL handler
  addBtn.addEventListener("click", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const host = new URL(tabs[0].url).hostname;
		chrome.storage.local.get({ whitelist: [] }, ({ whitelist }) => {
		if (!whitelist.includes(host)) {
			whitelist.push(host);
			chrome.storage.local.set({ whitelist }, initWhitelistUI);
		}
		});
	});
  });
}

function bindScanHistoryDropdown() {
  const setting3 = document.getElementById("setting3");
  const dropdownMenuScan = document.getElementById("dropdownMenuScan");

  if (!setting3 || !dropdownMenuScan) return;

  // Remove previous click listeners to prevent duplicates
  setting3.onclick = null;

  setting3.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenuScan.classList.toggle("hidden");
  });

  // Close dropdown if clicking outside
  document.addEventListener("click", (event) => {
    if (!setting3.contains(event.target) && !dropdownMenuScan.contains(event.target)) {
      dropdownMenuScan.classList.add("hidden");
    }
  });
}

function initScanHistoryUI() {
  const deleteAll = document.getElementById("deleteAll");

  // DELETE ALL HANDLER
  if (deleteAll) {
    deleteAll.addEventListener("click", () => {
      const modal = document.getElementById("confirmModal");
      const yesBtn = document.getElementById("confirmYes");
      const noBtn = document.getElementById("confirmNo");

      if (!modal) {
        console.error("Confirm modal not found");
        return;
      }

      modal.classList.remove("hidden");

      yesBtn.onclick = () => {
        chrome.storage.local.set({ scanHistory: [] }, () => {
          initScanHistoryUI();
          modal.classList.add("hidden");
          document.getElementById("dropdownMenuScan")?.classList.add("hidden");
        });
      };

      noBtn.onclick = () => {
        modal.classList.add("hidden");
      };
    });
  }

  // SEARCH BY DATE HANDLER
  const searchBtn = document.getElementById("searchByDate");
  const dateWrapper = document.getElementById("datePickerWrapper");
  const centeredDatePicker = document.getElementById("centeredDatePicker");

  if (searchBtn && dateWrapper && centeredDatePicker) {
    // Show centered date picker modal
    searchBtn.addEventListener("click", () => {
      dateWrapper.classList.remove("hidden");
      centeredDatePicker.value = ""; // reset previous selection
      centeredDatePicker.focus();    // focus to show native picker
    });

    // Handle date selection
    centeredDatePicker.addEventListener("change", () => {
      const selectedDate = centeredDatePicker.value;
      dateWrapper.classList.add("hidden");

      if (!selectedDate) return;

      chrome.storage.local.get({ scanHistory: [] }, ({ scanHistory }) => {
        const filtered = scanHistory.filter(item =>
          new Date(item.date).toISOString().split("T")[0] === selectedDate
        );
        renderScanHistory(filtered);
      });
    });

    // Close modal if clicking outside
    dateWrapper.addEventListener("click", (e) => {
      if (e.target === dateWrapper) {
        dateWrapper.classList.add("hidden");
      }
    });
  }

  // INITIAL RENDER (no filter)
  chrome.storage.local.get({ scanHistory: [] }, ({ scanHistory }) => {
    renderScanHistory(scanHistory);
  });
}


// Helper: Render grouped scan history
function renderScanHistory(scanHistory) {
  const tbody = document.querySelector("#scan-history-table tbody");

  // Sort newest first
  scanHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by date
  const grouped = {};
  scanHistory.forEach(({ date, url, score, mode }) => {
    const d = new Date(date);
    const day = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    if (!grouped[day]) grouped[day] = [];
    grouped[day].push({ date: d, url, score, mode });
  });

  // Clear and render
  tbody.innerHTML = "";
  Object.keys(grouped).forEach(dateStr => {
    const cardWrapper = document.createElement("tr");
    cardWrapper.innerHTML = `
      <td colspan="4" class="date-card">
        <div class="date-block">
          <div class="date-header">
            <img src="${chrome.runtime.getURL('icons/date.png')}" class="date-icon" alt="scan icon" />
            ${dateStr}
          </div>
          <div class="scan-list"></div>
        </div>
      </td>
    `;
    tbody.appendChild(cardWrapper);

    const scanListDiv = cardWrapper.querySelector(".scan-list");

    grouped[dateStr].forEach(({ date, url, score, mode }) => {
      const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      let scoreColor = "#689D76";
      if (score < 11) scoreColor = "#611C19";
      else if (score < 50) scoreColor = "#962E2A";
      else if (score < 90) scoreColor = "#e3867d";
      else if (score < 100) scoreColor = "#a1d6e2";

      const itemDiv = document.createElement("div");
      itemDiv.className = "scan-item";
      itemDiv.innerHTML = `
        <div class="scan-url">
          <img src="${chrome.runtime.getURL('icons/scanhistory.png')}" class="url-icon" alt="scan icon" />
          ${url}
        </div>
        <div class="scan-details">
          <span class="scan-time">${time}</span>
          <span class="scan-mode">[${mode === "auto" ? "Auto" : "Manual"}]</span>
          <span class="scan-score">
            <span class="score-circle" style="background-color: ${scoreColor};"></span> ${score}/100
          </span>
          <button class="deleteScanBtn" title="Delete">
            <img src="${chrome.runtime.getURL('icons/delete.png')}" class="url-icon" alt="delete icon" />
          </button>
        </div>
      `;
      scanListDiv.appendChild(itemDiv);

      // DELETE INDIVIDUAL SCAN
      const deleteBtn = itemDiv.querySelector(".deleteScanBtn");
      deleteBtn.addEventListener("click", () => {
        const modal = document.getElementById("confirmModal");
        const yesBtn = document.getElementById("confirmYes");
        const noBtn = document.getElementById("confirmNo");

        modal.classList.remove("hidden");

        yesBtn.onclick = () => {
          chrome.storage.local.get({ scanHistory: [] }, ({ scanHistory }) => {
            const updatedHistory = scanHistory.filter(
              item => !(item.date === date.toISOString() && item.url === url)
            );
            chrome.storage.local.set({ scanHistory: updatedHistory }, () => {
              initScanHistoryUI(); // Refresh
              modal.classList.add("hidden");
            });
          });
        };
        noBtn.onclick = () => modal.classList.add("hidden");
      });
    });
  });
}
