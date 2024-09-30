document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const errorMessage = document.getElementById('errorMessage');
    const dataContainer = document.getElementById('dataContainer');
    const paginationContainer = document.getElementById('paginationContainer');
    const pieChartContainer = document.getElementById('pieChartContainer');
    const switchToJson = document.getElementById('switchToJson');
    const jsonInput = document.getElementById('jsonInput');
    const submitJson = document.getElementById('submitJson');
    const jsonErrorMessage = document.getElementById('jsonErrorMessage');
    const uploadSection = document.getElementById('uploadSection');
    const jsonSection = document.getElementById('jsonSection');
    const fileMessage = document.getElementById('fileMessage');

    const requiredHeaders = [
        "Parent Component", "Shape Type", "Is Compliant ?", "Current Name", "Naming Structure"
    ];

    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            fileMessage.textContent = `Selected file: ${file.name}`;
            fileMessage.classList.add('show');
        } else {
            fileMessage.textContent = 'No file selected';
            fileMessage.classList.remove('show');
        }
    });

    function generateTableAndChart(rows, headers, overallCommentIndex, reasonIndex) {
        console.log("Generating table and chart");

        if (!dataContainer || !pieChartContainer) {
            console.error("dataContainer or pieChartContainer is missing.");
            return;
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        let currentPage = 1;
        const rowsPerPage = 10;
        let numberOfPages = Math.ceil(rows.length / rowsPerPage);

        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        function renderTablePage(page) {
            console.log("Rendering table page:", page);
            tbody.innerHTML = '';
            const startRow = (page - 1) * rowsPerPage;
            const endRow = Math.min(startRow + rowsPerPage, rows.length);

            rows.slice(startRow, endRow).forEach(row => {
                const tr = document.createElement('tr');
                if (row[overallCommentIndex] && row[overallCommentIndex].trim() === 'N') {
                    tr.classList.add('failed');
                } else {
                    tr.classList.add('passed');
                }

                row.forEach((cell, index) => {
                    const td = document.createElement('td');
                    if (index === reasonIndex) {
                        const reasons = cell.split(';]').map(reason => reason.trim()).filter(reason => reason);
                        reasons.forEach(reason => {
                            const span = document.createElement('span');
                            if(reason==='null')
                            {
                                span.textContent = 'Display name is not provided';
                            }
                            else
                            {
                                span.textContent = reason;
                            }
                            span.classList.add('reason');
                            td.appendChild(span);
                        });
                    } else {
                        if (cell === 'Y') {
                            td.textContent = 'Yes';
                        } else if (cell === 'N') {
                            td.textContent = 'No';
                        } else {
                            td.textContent = cell;
                        }
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }

        function createPaginationControls() {
            paginationContainer.innerHTML = '';

            const totalPagesInfo = document.createElement('p');
            totalPagesInfo.classList.add('paginationText');
            totalPagesInfo.textContent = `Page ${currentPage} of ${numberOfPages}`;
            paginationContainer.appendChild(totalPagesInfo);
            
            if (numberOfPages <= 1) return;  // No pagination if only one page or less
        
            if (currentPage > 1) {
                const prevButton = document.createElement('button');
                prevButton.textContent = 'Previous';
                prevButton.classList.add('button-19-1');
                prevButton.addEventListener('click', () => {
                    currentPage -= 1;
                    renderTablePage(currentPage);
                    createPaginationControls();  // Recreate controls after page change
                });
                paginationContainer.appendChild(prevButton);
            }
        
            if (currentPage === 1) {
                const firstPageButton = document.createElement('button');
                firstPageButton.textContent = '1';
                firstPageButton.classList.add('button-19-1', 'active');
                paginationContainer.appendChild(firstPageButton);
            }
        
            if (currentPage < numberOfPages) {
                const nextButton = document.createElement('button');
                nextButton.textContent = 'Next';
                nextButton.classList.add('button-19-1');
                nextButton.addEventListener('click', () => {
                    currentPage += 1;
                    renderTablePage(currentPage);
                    createPaginationControls();  // Recreate controls after page change
                });
                paginationContainer.appendChild(nextButton);
            }
        }
        
        

        table.appendChild(thead);
        table.appendChild(tbody);
        dataContainer.innerHTML = '';
        dataContainer.appendChild(table);

        if (numberOfPages > 1) {
            createPaginationControls();
        }

        renderTablePage(currentPage);

        if (typeof Chart === 'undefined') {
            console.error("Chart.js library is not loaded.");
            return;
        }

        const pieChart = document.createElement('canvas');
        pieChartContainer.innerHTML = '';
        pieChartContainer.appendChild(pieChart);
        const pieChartCtx = pieChart.getContext('2d');
        const totalRows = rows.length;
        const passedRows = rows.filter(row => row[overallCommentIndex] && row[overallCommentIndex].trim() !== 'N').length;
        const failedRows = totalRows - passedRows;
        const accuracy = ((passedRows / totalRows) * 100).toFixed(2);

        new Chart(pieChartCtx, {
            type: 'pie',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [passedRows, failedRows],
                    backgroundColor: ['rgba(14, 133, 68, 0.658)', 'rgba(184, 26, 26, 0.658)'],
                    borderColor: ['rgba(14, 133, 68, 0.9)', 'rgba(184, 26, 26, 0.9)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (context.parsed !== null) {
                                    label += `: ${context.parsed}`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        const accuracyMessage = document.createElement('p');
        accuracyMessage.classList.add('accuracyMessage');
        accuracyMessage.innerHTML = `Total Entries: ${totalRows} <br> Passed: ${passedRows} <br> Failed: ${failedRows} <br> Accuracy: ${accuracy}%`;
        pieChartContainer.appendChild(accuracyMessage);
    }

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            // quoteChar: '"',
            complete: function (results) {
                console.log("CSV parsing complete", results);
                const rows = results.data;
                const headers = results.meta.fields;
                const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
                if (missingHeaders.length > 0) {
                    if (errorMessage) {
                        errorMessage.textContent = `CSV file is missing the following headers: ${missingHeaders.join(', ')}`;
                        errorMessage.classList.remove('hidden');
                    }
                    return;
                } else {
                    dataContainer.classList.remove('hidden');
                    if (errorMessage) {
                        errorMessage.classList.add('hidden');
                    }
                }

                const overallCommentIndex = headers.indexOf('Is Compliant ?');
                const reasonIndex = headers.indexOf('Current Name');

                if (dataContainer) {
                    generateTableAndChart(rows.map(row => headers.map(header => row[header] || '')), headers, overallCommentIndex, reasonIndex);
                }
            },
            error: function (error) {
                if (errorMessage) {
                    errorMessage.classList.remove('hidden');
                    errorMessage.textContent = 'Error parsing CSV file.';
                }
                console.error(error);
            }
        });
    });

    switchToJson.addEventListener('click', () => {
        uploadSection.classList.add('hidden');
        jsonSection.classList.remove('hidden');
    });

    function validateJsonSchema(json) {
        console.log("Validating JSON Schema");
        const requiredTopLevelKeys = ["Total Entries", "Nomenclature"];
        const requiredInsightKeys = [
            "Parent Component", "Shape Type", "Is Compliant ?", "Current Name", "Naming Structure"
        ];

        for (const key of requiredTopLevelKeys) {
            if (!(key in json)) {
                throw new Error(`Missing top-level key: ${key}`);
            }
        }

        if (!Array.isArray(json.Nomenclature)) {
            throw new Error('Nomenclature should be an array.');
        }

        json.Nomenclature.forEach((item, index) => {
            if (typeof item !== 'object') {
                throw new Error(`Each entry in Insights should be an object at index ${index}`);
            }
            for (const key of requiredInsightKeys) {
                if (!(key in item)) {
                    throw new Error(`Missing key "${key}" in Insights array at index ${index}`);
                }
            }
            for (const key in item) {
                if (!requiredInsightKeys.includes(key)) {
                    throw new Error(`Unnecessary key "${key}" in Insights array at index ${index}`);
                }
            }
        });

        const totalEntries = Number(json['Total Entries']);
        if (isNaN(totalEntries)) {
            throw new Error('Total Entries should be a number.');
        }
        if (totalEntries !== json.Nomenclature.length) {
            throw new Error(`Total Entries (${totalEntries}) does not match the number of insights (${json.Nomenclature.length}).`);
        }

        console.log('JSON Schema Validation Passed');
    }

    submitJson.addEventListener('click', () => {
        const jsonString = jsonInput.value;
        let json;

        try {
            json = JSON.parse(jsonString);
        } catch (error) {
            jsonErrorMessage.textContent = 'Invalid JSON format.';
            jsonErrorMessage.classList.remove('hidden');
            return;
        }

        jsonErrorMessage.classList.add('hidden');

        try {
            validateJsonSchema(json);
            dataContainer.classList.remove('hidden');
            if (errorMessage) {
                errorMessage.classList.add('hidden');
            }
            const rows = json.Nomenclature.map(item => requiredHeaders.map(header => item[header] || ''));
            const headers = requiredHeaders;
            const overallCommentIndex = headers.indexOf('Is Compliant ?');
            const reasonIndex = headers.indexOf('Current Name');

            if (dataContainer) {
                generateTableAndChart(rows, headers, overallCommentIndex, reasonIndex);
            }
        } catch (error) {
            jsonErrorMessage.textContent = error.message;
            jsonErrorMessage.classList.remove('hidden');
        }
    });
});