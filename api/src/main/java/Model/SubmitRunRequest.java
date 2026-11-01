package Model;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(name = "SubmitRunRequest", description = "Run submission payload")
public class SubmitRunRequest {

    @Schema(description = "Problem name", example = "A", requiredMode = Schema.RequiredMode.REQUIRED)
    private String problemName;

    @Schema(description = "Language name", example = "Java", requiredMode = Schema.RequiredMode.REQUIRED)
    private String languageName;

    @Schema(description = "Main submitted file", requiredMode = Schema.RequiredMode.REQUIRED)
    private SubmissionFileRequest mainFile;

    @ArraySchema(
        arraySchema = @Schema(description = "Optional additional files"),
        schema = @Schema(implementation = SubmissionFileRequest.class)
    )
    private List<SubmissionFileRequest> additionalFiles;

    public SubmitRunRequest() {
    }

    public String getProblemName() {
        return problemName;
    }

    public void setProblemName(String problemName) {
        this.problemName = problemName;
    }

    public String getLanguageName() {
        return languageName;
    }

    public void setLanguageName(String languageName) {
        this.languageName = languageName;
    }

    public SubmissionFileRequest getMainFile() {
        return mainFile;
    }

    public void setMainFile(SubmissionFileRequest mainFile) {
        this.mainFile = mainFile;
    }

    public List<SubmissionFileRequest> getAdditionalFiles() {
        return additionalFiles;
    }

    public void setAdditionalFiles(List<SubmissionFileRequest> additionalFiles) {
        this.additionalFiles = additionalFiles;
    }
}