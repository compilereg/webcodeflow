package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SubmitClarificationRequest", description = "Clarification submission payload")
public class SubmitClarificationRequest {

    @Schema(description = "Problem name related to the clarification", example = "A", requiredMode = Schema.RequiredMode.REQUIRED)
    public String ProblemName;

    @Schema(description = "Clarification question submitted by the team", example = "What is the maximum value of N?", requiredMode = Schema.RequiredMode.REQUIRED)
    public String Question;

    public SubmitClarificationRequest() {
    }

    public SubmitClarificationRequest(String problemName, String question) {
        this.ProblemName = problemName;
        this.Question = question;
    }
}