const recognition = new window.webkitSpeechRecognition();
const startButton = document.querySelector("#start");
// const stopButton = document.querySelector("#stop");
const uploadButton = document.querySelector("#upload");
const askButton = document.querySelector("#ask");
const ansSection = document.querySelector(".answer-section");
var finalTranscript = ''; // Variable to store the final transcript
recognition.continuous = true; // Continue listening even after pauses
recognition.interimResults = true; // Provide interim results
var isSpeaking = false;

startButton.disabled = true;
askButton.disabled = true;

async function uploadFile() {
  uploadButton.disabled = true;
  uploadButton.classList.add("loading");
  let formData = new FormData(document.getElementById('upload-form'));
  try {
    let response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    let result = await response.json();
    document.getElementById('file-input').setAttribute('data-filename', result.filename);
    showToast("Upload successful!", true);
    startButton.disabled = false;
    askButton.disabled = false;
  } catch (error) {
    showToast("Upload failed!", false);
  }
  uploadButton.disabled = false;
  uploadButton.classList.remove("loading");
}

async function askQuestion() {
  startButton.disabled = true;
  askButton.disabled = true;
  if(isSpeaking != true){
    askButton.classList.add("loading");
  }

  let query = document.getElementById('query').value;
  if (query == ""){
    showToast("Please type your query OR hit speak button for audio", false);
    startButton.disabled = false;
    askButton.disabled = false;
    askButton.classList.remove("loading");
    isSpeaking = false;
    return false;
  }
  ansSection.classList.remove("hide");
  ansSection.classList.add("loading");
  let filename = document.getElementById('file-input').getAttribute('data-filename');
  let response = await fetch('/ask', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: query, filename: filename })
  });
  let result = await response.json();
  if (!response.ok) {
    console.error('Error:', result.error);
    showToast(result.error, false);
    ansSection.classList.remove("loading");
  }
  else if(result.answer != ""){
    ansSection.classList.remove("loading");
    document.getElementById('answer').innerHTML += `<p>User: ${query}</p><p>AI: ${result.answer}</p>`;
  }
  startButton.disabled = false;
  askButton.disabled = false;
  askButton.classList.remove("loading");
  isSpeaking = false;
}

startButton.addEventListener("click", (event) => {
  isSpeaking = true;
  startButton.disabled = true;
  askButton.disabled = true;
  startButton.classList.add("loading");
  // if (startButton.classList.contains("show")) {
    // startButton.classList.add("hide");
    // startButton.classList.remove("show");
    // stopButton.classList.remove("hide");
    // stopButton.classList.add("show");
    startRecording();
  // }
});

// stopButton.addEventListener("click", (event) => {
//   if (stopButton.classList.contains("show")) {
//     stopButton.classList.remove("show");
//     stopButton.classList.add("hide");
//     startButton.classList.add("show");
//     startButton.classList.remove("hide");
//     stopRecording();
//   }
// });

function startRecording() {
  finalTranscript = ''; // Clear the previous sentence
  recognition.start();
}

// function stopRecording() {
//   recognition.stop();
// }

recognition.onresult = function (event) {
  var interimTranscript = ''; // Temporary variable for interim results
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }
  console.log('Final Transcript:', finalTranscript);
  console.log('Interim Transcript:', interimTranscript);
  document.getElementById("query").value = finalTranscript;
  if(finalTranscript != ''){
    recognition.stop();
    askQuestion();
    startButton.classList.remove("loading");
  }
};

// recognition.onend = function (event) {
//   // stopButton.classList.remove("show");
//   // stopButton.classList.add("hide");
//   // startButton.classList.add("show");
//   // startButton.classList.remove("hide");
// };

function showToast(message, success) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.style.backgroundColor = success ? "#28a745" : "#dc3545";
  toast.classList.add('show');
  toast.classList.remove('hide');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
  }, 4000);
}
