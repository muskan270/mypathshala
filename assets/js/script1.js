document.addEventListener('DOMContentLoaded', function () {
    const bookElement = document.getElementById('book');
    const pdfInput = document.getElementById('pdf-input');
    const pdfViewer = document.getElementById('pdf-viewer');
    const readButton = document.getElementById('read-pdf-button');
    const pauseButton = document.getElementById('pause-button');
    const resumeButton = document.getElementById('resume-button');
    const stopButton = document.getElementById('stop-button');
    const prevPageButton = document.getElementById('prev-page-button');
    const nextPageButton = document.getElementById('next-page-button');
    const goToPageButton = document.getElementById('go-to-page-button');
    const pageNumberInput = document.getElementById('page-number-input');
    const searchTopicButton = document.getElementById('search-topic-button');
    const topicSearchInput = document.getElementById('topic-search-input');
    const languageSelect = document.getElementById('language-select');
    const status = document.getElementById('status');
    let currentPage = 1;
    let pdfDoc = null;
    let isReading = false;
    let pdfText = '';
    let synthesis = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance();

    function renderPage(pageNum) {
        pdfDoc.getPage(pageNum).then(function(page) {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            page.render(renderContext).promise.then(function() {
                pdfViewer.innerHTML = '';
                pdfViewer.appendChild(canvas);
                pdfText = '';
                page.getTextContent().then(function(textContent) {
                    textContent.items.forEach(function(item) {
                        pdfText += item.str + ' ';
                    });
                });
            });
        });
    }

    // Handle file input
    pdfInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileReader = new FileReader();
            fileReader.onload = function() {
                const typedArray = new Uint8Array(this.result);
                pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                    pdfDoc = pdf;
                    document.getElementById('page-count').textContent = pdfDoc.numPages;
                    currentPage = 1;
                    renderPage(currentPage);
                    status.textContent = `PDF loaded: ${pdfDoc.numPages} pages`;
                }).catch(error => {
                    console.error('Error loading PDF:', error);
                    alert('Failed to load PDF.');
                    status.textContent = 'Error loading PDF.';
                });
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            alert('Please select a valid PDF file.');
        }
    });

    // Handle PDF/Book selection from dropdown
    const pdfItems = document.querySelectorAll('.pdf-item');
    pdfItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const filePath = this.getAttribute('href');
            loadPDF(filePath);
        });
    });

    // Function to load the PDF
    function loadPDF(filePath) {
        const loadingTask = pdfjsLib.getDocument(filePath);
        loadingTask.promise.then(function(pdf) {
            pdfDoc = pdf;
            document.getElementById('page-count').textContent = pdfDoc.numPages;
            currentPage = 1;
            renderPage(currentPage);
            status.textContent = `PDF loaded: ${pdfDoc.numPages} pages`;
        }, function (reason) {
            console.error('PDF loading error:', reason);
            status.textContent = 'Error loading PDF.';
        });
    }

    // Text-to-Speech functionality
    readButton.addEventListener('click', function() {
        if (!isReading && pdfText) {
            utterance.text = pdfText;
            utterance.lang = languageSelect.value;
            synthesis.speak(utterance);
            isReading = true;
        }
    });

    pauseButton.addEventListener('click', function() {
        if (isReading) {
            synthesis.pause();
        }
    });

    resumeButton.addEventListener('click', function() {
        if (isReading) {
            synthesis.resume();
        }
    });

    stopButton.addEventListener('click', function() {
        if (isReading) {
            synthesis.cancel();
            isReading = false;
        }
    });

    prevPageButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    });

    nextPageButton.addEventListener('click', function() {
        if (currentPage < pdfDoc.numPages) {
            currentPage++;
            renderPage(currentPage);
        }
    });

    goToPageButton.addEventListener('click', function() {
        const pageNumber = parseInt(pageNumberInput.value, 10);
        if (pageNumber >= 1 && pageNumber <= pdfDoc.numPages) {
            currentPage = pageNumber;
            renderPage(currentPage);
        }
    });

    searchTopicButton.addEventListener('click', function() {
        const searchTerm = topicSearchInput.value.toLowerCase();
        if (searchTerm && pdfText.toLowerCase().includes(searchTerm)) {
            const startIndex = pdfText.toLowerCase().indexOf(searchTerm);
            const surroundingText = pdfText.slice(startIndex, startIndex + 100);
            alert(`Found: ${surroundingText}`);
        } else {
            alert('Topic not found');
        }
    });

    utterance.addEventListener('end', function() {
        isReading = false;
    });

    // Merriam-Webster Dictionary integration
    pdfViewer.addEventListener('dblclick', function(event) {
        const selectedWord = window.getSelection().toString().trim();
        if (selectedWord) {
            fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${selectedWord}?key=your-api-key`)
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        const definitions = data[0].shortdef || [];
                        if (definitions.length > 0) {
                            const wordTitle = document.getElementById('word-title');
                            const wordMeanings = document.getElementById('word-meanings');
                            wordTitle.textContent = selectedWord;
                            wordMeanings.textContent = definitions.join(', ');
                            document.getElementById('dictionary-modal').style.display = 'block';
                        } else {
                            alert('No definition found for the selected word.');
                        }
                    } else {
                        alert('No results found for the selected word.');
                    }
                })
                .catch(error => {
                    console.error('Error fetching word definition:', error);
                    alert('An error occurred while fetching the word definition.');
                });
        }
    });

    // Close dictionary modal
    document.querySelector('.close-button').addEventListener('click', function() {
        document.getElementById('dictionary-modal').style.display = 'none';
    });

    // Hide the book animation after 15 seconds
    setTimeout(() => {
        bookElement.classList.add('hide-animation');
    }, 15000);
});
