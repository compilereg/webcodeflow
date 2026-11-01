package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SubmitClarificationResponse", description = "Submit clarification response payload")
public class SubmitClarificationResponse {

    @Schema(description = "Submission status", example = "Success")
    private String status;

    @Schema(description = "Response message", example = "Clarification submitted")
    private String message;

    public SubmitClarificationResponse() {
    }

    public SubmitClarificationResponse(String status, String message) {
        this.status = status;
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}