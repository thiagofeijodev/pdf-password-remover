#include <emscripten/bind.h>
#include <string>
#include <vector>
#include "pdf-handler.cpp"

using namespace emscripten;

// Convert JavaScript Uint8Array to std::vector<uint8_t>
std::vector<uint8_t> jsArrayToVector(const val& jsArray) {
    const size_t length = jsArray["length"].as<size_t>();
    std::vector<uint8_t> result(length);
    for (size_t i = 0; i < length; ++i) {
        result[i] = jsArray[i].as<uint8_t>();
    }
    return result;
}

// Convert std::vector<uint8_t> to JavaScript Uint8Array
val vectorToJsArray(const std::vector<uint8_t>& vec) {
    val jsArray = val::global("Uint8Array").new_(vec.size());
    for (size_t i = 0; i < vec.size(); ++i) {
        jsArray.set(i, vec[i]);
    }
    return jsArray;
}

// Wrapper for JavaScript binding
class PDFRemoverWrapper {
private:
    PDFPasswordRemover remover;
    std::vector<uint8_t> lastOutput;
    std::string lastLog;

public:
    /**
     * Process PDF file and remove password encryption
     * @param inputData Uint8Array containing the PDF binary data
     * @param password String containing the password
     * @return Boolean indicating success
     */
    bool processPDF(const val& inputData, const std::string& password) {
        try {
            // Validate inputs
            if (!inputData.isNull() && inputData["length"].as<size_t>() == 0) {
                return false;
            }
            
            if (password.empty()) {
                return false;
            }

            // Convert JS Uint8Array to std::string for the input
            const size_t length = inputData["length"].as<size_t>();
            std::string inputStr;
            inputStr.resize(length);

            for (size_t i = 0; i < length; ++i) {
                inputStr[i] = inputData[i].as<uint8_t>();
            }

            // Process the PDF
            std::string outputStr;
            bool success = remover.removePDFPassword(inputStr, password, outputStr);

            if (success) {
                // Store output for later retrieval
                lastOutput.resize(outputStr.size());
                std::memcpy(lastOutput.data(), outputStr.data(), outputStr.size());
            }
            
            // Store last log message
            lastLog = remover.getLastLog();

            return success;
        } catch (const std::exception& e) {
            lastLog = std::string("Exception in processPDF: ") + e.what();
            return false;
        }
    }

    /**
     * Get the processed PDF as a Uint8Array
     * @return Uint8Array containing the output PDF
     */
    val getOutput() const {
        return vectorToJsArray(lastOutput);
    }

    /**
     * Get the size of the last output
     * @return Size in bytes
     */
    int getOutputSize() const {
        return lastOutput.size();
    }

    /**
     * Get the last log message
     * @return String containing debug information
     */
    std::string getLog() const {
        return lastLog;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(pdf_remover_module) {
    class_<PDFRemoverWrapper>("PDFRemover")
        .constructor<>()
        .function("processPDF", &PDFRemoverWrapper::processPDF)
        .function("getOutput", &PDFRemoverWrapper::getOutput)
        .function("getOutputSize", &PDFRemoverWrapper::getOutputSize)
        .function("getLog", &PDFRemoverWrapper::getLog);
}
