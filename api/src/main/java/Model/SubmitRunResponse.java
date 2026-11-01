package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SubmitRunResponse", description = "Submit run response payload")
public class SubmitRunResponse {

    @Schema(description = "Submission status", example = "Success")
    private String status;

    @Schema(description = "Response message", example = "Run submitted successfully")
    private String message;

    public SubmitRunResponse() {
    }

    public SubmitRunResponse(String status, String message) {
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