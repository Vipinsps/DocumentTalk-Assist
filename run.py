from flask import Flask, request, jsonify, render_template
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import faiss
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from gtts import gTTS
import os
from sys import platform
import time
import threading

app = Flask(__name__)

api_key = "Your Key"

ALLOWED_EXTENSIONS = {'.txt', '.pdf'}

embeddings = OpenAIEmbeddings(api_key=api_key)
llm = ChatOpenAI(api_key=api_key)

@app.before_request
def before_request_func():
    if not os.path.exists('uploads'):
        os.makedirs('uploads')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    if file:
        file_path = os.path.join('uploads', file.filename)
        file_extension = os.path.splitext(file_path)[1].lower()

        if file_extension == '.txt' or file_extension == '.pdf':
            file.save(file_path)
            return jsonify({"filename": file.filename})
        else:
            print("Unsupported file type:", file_extension)
            return None

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    query = data['query']
    filename = data['filename']
    try:
        if filename is not None:
            file_path = os.path.join('uploads', filename)
            file_extension = os.path.splitext(file_path)[1].lower()

            if file_extension == '.pdf':
                loader = PyPDFLoader(file_path)
            else:
                loader = TextLoader(file_path, encoding='latin-1')

        else:
            return jsonify({'error': 'File not found!'}), 400
        raw_documents = loader.load()

        text_splitter = RecursiveCharacterTextSplitter()
        documents = text_splitter.split_documents(raw_documents)

        vector = faiss.FAISS.from_documents(documents, embeddings)
        print(vector)
    except UnicodeDecodeError:
        return "File encoding error", 500
    
    # Chat Prompt Template
    prompt = ChatPromptTemplate.from_template("""
    Answer the following question based only on the provided context:

    <context>
    {context}
    </context>

    Question: {input}""")

    # Retrieval Chain
    retriever = vector.as_retriever()
    document_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, document_chain)

    # Generate response with user query
    response = retrieval_chain.invoke({"input": query})
    print(response["answer"])

    threading.Thread(target=play_answer, args=(response["answer"], )).start()

    return jsonify({"answer": response["answer"]})

@app.route('/play_answer', methods=['POST'])
def play_answer(answer):
    time.sleep(1)
    
    # Convert text to speech using gTTS
    tts = gTTS(answer, lang='en')
    audio_path = 'response.mp3'
    tts.save(audio_path)

    if 'linux' in platform:
        os.system("mpg321 response.mp3") 
    elif 'win' in platform:
        os.system('response.mp3')
    else:
        print("Unsupported platform")

if __name__ == "__main__":
    app.run(debug=True)
