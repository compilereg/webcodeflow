package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SubmissionFileRequest", description = "Single submitted source or additional file")
public class SubmissionFileRequest {

    @Schema(description = "Original file name", example = "main.py", requiredMode = Schema.RequiredMode.REQUIRED)
    private String fileName;

    @Schema(
        description = "Source file content encoded as Base64",
        example = "cHJpbnQoImhlbGxvIikK",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String fileContentBase64;

    public SubmissionFileRequest() {
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileContentBase64() {
        return fileContentBase64;
    }

    public void setFileContentBase64(String fileContentBase64) {
        this.fileContentBase64 = fileContentBase64;
    }
}