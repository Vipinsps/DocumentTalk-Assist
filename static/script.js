async function uploadFile() {
  let formData = new FormData(document.getElementById('upload-form'));
  let response = await fetch('/upload', {
      method: 'POST',
      body: formData
  });
  let result = await response.json();
  document.getElementById('file-input').setAttribute('data-filename', result.filename);
}

async function askQuestion() {
  let query = document.getElementById('query').value;
  let filename = document.getElementById('file-input').getAttribute('data-filename');
  let response = await fetch('/ask', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: query, filename: filename })
  });
  let result = await response.json();
  document.getElementById('answer').innerHTML += `<p>User: ${query}</p><p>AI: ${result.answer}</p>`;
  document.querySelector(".answer-section").classList.remove("hide");
}

const recognition = new window.webkitSpeechRecognition();
const startButton = document.querySelector("#start");
const stopButton = document.querySelector("#stop");

startButton.addEventListener("click", (event) => {
  if (startButton.classList.contains("show")) {
    startButton.classList.add("hide");
    startButton.classList.remove("show");
    stopButton.classList.remove("hide");
    stopButton.classList.add("show");
    startRecording();
  }
});

stopButton.addEventListener("click", (event) => {
  if (stopButton.classList.contains("show")) {
    stopButton.classList.remove("show");
    stopButton.classList.add("hide");
    startButton.classList.add("show");
    startButton.classList.remove("hide");
    stopRecording();
  }
});

function startRecording() {
  recognition.start();
}

function stopRecording() {
  recognition.stop();
}

recognition.onresult = function (event) {
  let saidText = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i].isFinal) {
      saidText = event.results[i][0].transcript;
    } else {
      saidText += event.results[i][0].transcript;
    }
  }
  document.getElementById("query").value = saidText;
};

recognition.onend = function (event) {
  stopButton.classList.remove("show");
  stopButton.classList.add("hide");
  startButton.classList.add("show");
  startButton.classList.remove("hide");
};
